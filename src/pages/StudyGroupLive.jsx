/**
 * FILE: TEACHER_UI/src/pages/StudyGroupLive.jsx
 *
 * Teacher enters a student-hosted study group's LiveKit room.
 * Uses StudyGroupClassroomUI — a peer-only UI with no host/teacher
 * power controls (no mute-individual, no mute-all, no remove, no
 * end-for-all). Per product rule: in a Study Group, NO ONE — not
 * even the host — has in-room authority. Overlays a countdown
 * banner showing remaining duration of the group.
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import studyGroupService, { extractApiError } from "../api/studyGroupService";
import StudyGroupClassroomUI from "../components/live/StudyGroupClassroomUI";
import "../styles/privateSessions.css";
import "../styles/teacherStudyGroups.css";

function formatCountdown(ms) {
  if (ms == null || ms < 0) return "--:--";
  const total = Math.floor(ms / 1000);
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function StudyGroupLive() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sessionData, setSessionData] = useState(null);
  const [livekitData, setLivekitData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remainingMs, setRemainingMs] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const detail = await studyGroupService.getDetail(id);
        if (cancelled) return;
        setSessionData(detail);
        const joinData = await studyGroupService.joinRoom(id);
        if (cancelled) return;
        setLivekitData(joinData);
        setRemainingMs(joinData.remaining_ms ?? null);
      } catch (err) {
        if (cancelled) return;
        setError(extractApiError(err, "Unable to join study group. It may not be open yet."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (remainingMs == null) return;
    if (remainingMs <= 0) return;
    const startedAt = Date.now();
    const startValue = remainingMs;
    const interval = setInterval(() => {
      const next = Math.max(0, startValue - (Date.now() - startedAt));
      setRemainingMs(next);
      if (next <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livekitData]);

  useEffect(() => {
    if (remainingMs != null && remainingMs <= 0 && livekitData) {
      const t = setTimeout(() => navigate("/teacher/study-groups"), 600);
      return () => clearTimeout(t);
    }
  }, [remainingMs, livekitData, navigate]);

  if (loading) {
    return (
      <div className="tps__live-loading">
        <div className="tps__live-spinner" />
        <p>Joining study group…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tps__live-error">
        <h2>Unable to join study group</h2>
        <p>{error}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={() => navigate("/teacher/study-groups")}
            style={{
              padding: "10px 24px", borderRadius: 8, border: "none",
              background: "#3b5c7c", color: "#fff", fontWeight: 600, cursor: "pointer",
            }}
          >
            Back to Study Groups
          </button>
          <button
            onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
            style={{
              padding: "10px 24px", borderRadius: 8,
              border: "2px solid #94a3b8", background: "transparent",
              color: "#475569", fontWeight: 600, cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!livekitData) {
    return (
      <div className="tps__live-error">
        <h2>Study group not open yet</h2>
        <p>Waiting for the host or invitees. Please try again in a moment.</p>
        <button
          onClick={() => navigate("/teacher/study-groups")}
          style={{
            padding: "10px 24px", borderRadius: 8, border: "none",
            background: "#3b5c7c", color: "#fff", fontWeight: 600, cursor: "pointer",
          }}
        >
          Back to Study Groups
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={livekitData.livekit_url}
      token={livekitData.token}
      connect={true}
      video={true}
      audio={true}
      onDisconnected={() => navigate("/teacher/study-groups")}
    >
      <div className="tsgLive__banner">
        <span className="tsgLive__bannerBadge">STUDY GROUP</span>
        <span className="tsgLive__bannerSubject">
          {sessionData?.subjectName || "Study Group"}
        </span>
        <span className="tsgLive__bannerCountdown">
          ⏳ {formatCountdown(remainingMs)} left
        </span>
      </div>

      <StudyGroupClassroomUI
        role={(livekitData.role || "teacher").toLowerCase()}
        session={{
          ...sessionData,
          subject: sessionData?.subjectName,
          topic: sessionData?.topic,
        }}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
