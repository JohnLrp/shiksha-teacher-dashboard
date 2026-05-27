/**
 * FILE: TEACHER_UI/src/pages/GroupSessionLive.jsx
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import groupSessionService, { extractApiError } from "../api/groupSessionService";
import GroupSessionClassroomUI from "../components/live/GroupSessionClassroomUI";
import { useAuth } from "../contexts/AuthContext";

/* ── These styles are IDENTICAL to the student GroupSessionLive.jsx ── */
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

export default function GroupSessionLive() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sessionData, setSessionData]   = useState(null);
  const [livekitData, setLivekitData]   = useState(null);
  const [error, setError]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [remainingMs, setRemainingMs]   = useState(null);

  const { user } = useAuth();
  const [showReadyPanel, setShowReadyPanel] = useState(false);
  const [copied, setCopied] = useState(false);

  // Host gate — only the session's host gets the End Session button.
  const isHost = !!(user?.id && sessionData?.hostId &&
                    String(user.id) === String(sessionData.hostId));

  // Shareable invite link from the meeting's short_code (UUID fallback).
  const inviteLink = (() => {
    const code = sessionData?.shortCode || id;
    return `${window.location.origin}/group-session/live/${code}`;
  })();

  // Show the Google-Meet-style "Your meeting's ready" panel for instant
  // meetings the moment the host arrives.
  useEffect(() => {
    if (sessionData?.sessionType === "instant" && isHost) {
      setShowReadyPanel(true);
    }
  }, [sessionData?.sessionType, isHost]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link:", inviteLink);
    }
  };

  const handleEndSession = async () => {
    const ok = window.confirm(
      "End this session for everyone? Participants will be disconnected immediately."
    );
    if (!ok) return;
    try {
      await groupSessionService.endSession(id);
    } catch (e) {
      console.error("endSession failed", e);
    } finally {
      navigate("/teacher/group-sessions");
    }
  };


  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const detail   = await groupSessionService.getDetail(id);
        if (cancelled) return;
        setSessionData(detail);
        const joinData = await groupSessionService.joinRoom(id);
        if (cancelled) return;
        setLivekitData(joinData);
        setRemainingMs(joinData.remaining_ms ?? null);
      } catch (err) {
        if (cancelled) return;
        setError(extractApiError(err, "Unable to join group session. It may not be open yet."));
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
      const t = setTimeout(() => navigate("/teacher/group-sessions"), 600);
      return () => clearTimeout(t);
    }
  }, [remainingMs, livekitData, navigate]);

  if (loading) {
    return (
      <div style={centerMsg}>
        <p style={{ fontSize: 16, color: "#102a2a", margin: 0 }}>Joining group session…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={centerMsg}>
        <h2 style={{ margin: 0, color: "#102a2a" }}>Unable to join group session</h2>
        <p style={{ color: "#475569", margin: 0 }}>{error}</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => navigate("/teacher/group-sessions")}
            style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#015865", color: "#fff", fontWeight: 600, cursor: "pointer" }}
          >Back to Group Sessions</button>
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
        <h2 style={{ margin: 0, color: "#102a2a" }}>Group session not open yet</h2>
        <p style={{ color: "#475569", margin: 0 }}>Waiting for the host. Please try again.</p>
        <button
          onClick={() => navigate("/teacher/group-sessions")}
          style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#015865", color: "#fff", fontWeight: 600, cursor: "pointer" }}
        >Back to Group Sessions</button>
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
        onDisconnected={() => navigate("/teacher/group-sessions")}
      >
        <GroupSessionClassroomUI
          role="PRESENTER"
          session={{
            ...sessionData,
            id,
            subject: sessionData?.subjectName,
            topic:   sessionData?.topic,
            shortCode: sessionData?.shortCode,
            sessionType: sessionData?.sessionType,
            admitMode: sessionData?.admitMode,
          }}
          chatConfig={{
            restGetPath:  `/sessions/group-sessions/${id}/chat/`,
            restPostPath: `/sessions/group-sessions/${id}/chat/send/`,
            wsPath:       `/ws/group-session/${id}/chat/`,
          }}
          groupSession={true}
          groupSessionRemainingMs={remainingMs}
          isHost={isHost}
          onLeave={() => navigate("/teacher/group-sessions")}
          onEndSession={isHost ? handleEndSession : null}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>

      {/* "Your meeting's ready" — Google-Meet-style host panel for instant meetings */}
      {showReadyPanel && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: 24,
            zIndex: 9999,
            width: 340,
            background: "#ffffff",
            borderRadius: 14,
            padding: "18px 18px 16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "#202124",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <strong style={{ fontSize: 16 }}>Your meeting's ready</strong>
            <button
              onClick={() => setShowReadyPanel(false)}
              aria-label="Close"
              style={{
                border: "none", background: "transparent", cursor: "pointer",
                fontSize: 20, color: "#5f6368", lineHeight: 1, padding: 4,
              }}
            >
              ✕
            </button>
          </div>

          <button
            disabled
            title="Invite flow coming soon"
            style={{
              marginTop: 14,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#1a73e8",
              color: "#fff",
              border: "none",
              padding: "10px 18px",
              borderRadius: 999,
              fontWeight: 600,
              fontSize: 14,
              cursor: "not-allowed",
              opacity: 0.85,
            }}
          >
            <span aria-hidden>👥+</span> Add others
          </button>

          <p style={{ margin: "14px 0 8px", fontSize: 13, color: "#5f6368" }}>
            Or share this meeting link with others that you want in the meeting
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#f1f3f4",
              borderRadius: 8,
              padding: "8px 10px",
              fontFamily: "monospace",
              fontSize: 13,
              color: "#202124",
            }}
          >
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {inviteLink}
            </span>
            <button
              onClick={handleCopyLink}
              aria-label="Copy link"
              style={{
                border: "none", background: "transparent", cursor: "pointer",
                color: copied ? "#137333" : "#5f6368", padding: 4,
                fontSize: 14, fontWeight: 600,
              }}
            >
              {copied ? "✓ Copied" : "📋"}
            </button>
          </div>

          <p style={{ margin: "12px 0 0", fontSize: 12, color: "#5f6368", lineHeight: 1.4 }}>
            <span aria-hidden>🛡️ </span>
            Only paid Teacher and Student dashboard users who open this link can join.
          </p>

          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#5f6368" }}>
            Joined as {user?.email || user?.username || "you"}
          </p>
        </div>
      )}
    </div>
  );
}
