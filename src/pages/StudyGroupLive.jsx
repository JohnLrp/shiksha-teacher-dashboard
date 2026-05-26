/**
 * FILE: TEACHER_UI/src/pages/StudyGroupLive.jsx
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import studyGroupService, { extractApiError } from "../api/studyGroupService";
import StudyGroupClassroomUI from "../components/live/StudyGroupClassroomUI";

/* ── These styles are IDENTICAL to the student StudyGroupLive.jsx ── */
const fullscreenWrap = {
  width: "100vw",
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  background: "#c9dde1",
  boxSizing: "border-box",
  padding: "14px",
};

const liveKitWrap = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const centerMsg = {
  width: "100vw",
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  gap: 16,
  background: "#c9dde1",
};

export default function StudyGroupLive() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sessionData, setSessionData]   = useState(null);
  const [livekitData, setLivekitData]   = useState(null);
  const [error, setError]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [remainingMs, setRemainingMs]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const detail   = await studyGroupService.getDetail(id);
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
    if (remainingMs == null || remainingMs <= 0) return;
    const startedAt  = Date.now();
    const startValue = remainingMs;
    const interval   = setInterval(() => {
      const next = Math.max(0, startValue - (Date.now() - startedAt));
      setRemainingMs(next);
      if (next <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [livekitData]);

  useEffect(() => {
    if (remainingMs != null && remainingMs <= 0 && livekitData) {
      const t = setTimeout(() => navigate("/teacher/study-groups"), 600);
      return () => clearTimeout(t);
    }
  }, [remainingMs, livekitData, navigate]);

  if (loading) {
    return (
      <div style={centerMsg}>
        <p style={{ fontSize: 16, color: "#102a2a", margin: 0 }}>Joining study group…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={centerMsg}>
        <h2 style={{ margin: 0, color: "#102a2a" }}>Unable to join study group</h2>
        <p style={{ color: "#475569", margin: 0 }}>{error}</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => navigate("/teacher/study-groups")}
            style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#015865", color: "#fff", fontWeight: 600, cursor: "pointer" }}
          >Back to Study Groups</button>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "10px 24px", borderRadius: 8, border: "2px solid #94a3b8", background: "transparent", color: "#475569", fontWeight: 600, cursor: "pointer" }}
          >Retry</button>
        </div>
      </div>
    );
  }

  if (!livekitData) {
    return (
      <div style={centerMsg}>
        <h2 style={{ margin: 0, color: "#102a2a" }}>Study group not open yet</h2>
        <p style={{ color: "#475569", margin: 0 }}>Waiting for the host. Please try again.</p>
        <button
          onClick={() => navigate("/teacher/study-groups")}
          style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#015865", color: "#fff", fontWeight: 600, cursor: "pointer" }}
        >Back to Study Groups</button>
      </div>
    );
  }

  return (
    <div style={fullscreenWrap}>
      <LiveKitRoom
        serverUrl={livekitData.livekit_url}
        token={livekitData.token}
        connect={true}
        video={true}
        audio={true}
        style={liveKitWrap}
        onDisconnected={() => navigate("/teacher/study-groups")}
      >
        <StudyGroupClassroomUI
          role="PRESENTER"
          session={{
            ...sessionData,
            id,
            subject: sessionData?.subjectName,
            topic:   sessionData?.topic,
          }}
          chatConfig={{
            restGetPath:  `/sessions/study-groups/${id}/chat/`,
            restPostPath: `/sessions/study-groups/${id}/chat/send/`,
            wsPath:       `/ws/study-group/${id}/chat/`,
          }}
          studyGroup={true}
          studyGroupRemainingMs={remainingMs}
          onLeave={() => navigate("/teacher/study-groups")}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
