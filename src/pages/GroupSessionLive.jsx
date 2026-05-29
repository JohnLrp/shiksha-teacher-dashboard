/**
 * FILE: TEACHER_UI/src/pages/GroupSessionLive.jsx
 *
 * Mirror of the student-dashboard GroupSessionLive — same UX, same
 * persistent bottom-left "Room info" chip, same teal palette as the
 * other live rooms. The Google-Meet dark theme has been removed.
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import groupSessionService, { extractApiError } from "../api/groupSessionService";
import GroupSessionClassroomUI from "../components/live/GroupSessionClassroomUI";
import { useAuth } from "../contexts/AuthContext";

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

// :id from the URL might be a UUID (the normal case) or a short_code pasted
// from a shared link. resolvedId is the real session UUID we hit on every
// backend call — short_codes get resolved through join-by-code first.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function GroupSessionLive() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resolvedId, setResolvedId] = useState(
    UUID_RE.test(String(id || "")) ? String(id) : null
  );
  const [sessionData, setSessionData]   = useState(null);
  const [livekitData, setLivekitData]   = useState(null);
  const [error, setError]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [remainingMs, setRemainingMs]   = useState(null);

  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [infoOpen, setInfoOpen] = useState(true);

  const isHost = !!(user?.id && sessionData?.hostId &&
                    String(user.id) === String(sessionData.hostId));

  const roomCode = sessionData?.shortCode || id;
  // Teacher dashboard mounts the live room under /teacher/... so the link
  // points there. Students on the student dashboard need to paste the same
  // code into "Enter Room ID" on their side (different origin / different
  // routes) — see the share-link copy hint below for the explanation.
  const inviteLink = `${window.location.origin}/teacher/group-session/live/${roomCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link:", inviteLink);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this room code:", roomCode);
    }
  };

  const handleEndSession = async () => {
    const ok = window.confirm(
      "End this session for everyone? Participants will be disconnected immediately."
    );
    if (!ok) return;
    try {
      await groupSessionService.endSession(resolvedId || id);
    } catch (e) {
      console.error("endSession failed", e);
    } finally {
      navigate("/teacher/group-sessions");
    }
  };

  // Resolve a short_code → UUID before touching detail/join. UUIDs short-
  // circuit and become resolvedId immediately so the pasted-link / typed-
  // code flow lands in the same place as the host-creates-instant flow.
  useEffect(() => {
    let cancelled = false;
    if (!id) return undefined;
    if (UUID_RE.test(String(id))) {
      setResolvedId(String(id));
      return undefined;
    }
    (async () => {
      try {
        const res = await groupSessionService.joinByCode(id);
        if (cancelled) return;
        if (res?.session_id) {
          setResolvedId(String(res.session_id));
        } else {
          setError("No room found for that code.");
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        setError(extractApiError(err, "No room found for that code."));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    if (!resolvedId) return undefined;
    const load = async () => {
      try {
        const detail   = await groupSessionService.getDetail(resolvedId);
        if (cancelled) return;
        setSessionData(detail);
        const joinData = await groupSessionService.joinRoom(resolvedId);
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
  }, [resolvedId]);

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
        <p style={{ fontSize: 16, color: "#0f172a", margin: 0 }}>Joining group session…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={centerMsg}>
        <h2 style={{ margin: 0, color: "#0f172a" }}>Unable to join group session</h2>
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
        <h2 style={{ margin: 0, color: "#0f172a" }}>Group session not open yet</h2>
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
            id: resolvedId || id,
            subject: sessionData?.subjectName,
            topic:   sessionData?.topic,
            shortCode: sessionData?.shortCode,
            sessionType: sessionData?.sessionType,
            admitMode: sessionData?.admitMode,
          }}
          chatConfig={{
            restGetPath:  `/sessions/group-sessions/${resolvedId || id}/chat/`,
            restPostPath: `/sessions/group-sessions/${resolvedId || id}/chat/send/`,
            wsPath:       `/ws/group-session/${resolvedId || id}/chat/`,
          }}
          groupSession={true}
          groupSessionRemainingMs={remainingMs}
          isHost={isHost}
          onLeave={() => navigate("/teacher/group-sessions")}
          onEndSession={isHost ? handleEndSession : null}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>

      {/* Bottom-left "Room info" — visible to everyone in the room. */}
      {infoOpen ? (
        <div
          style={{
            position: "fixed",
            bottom: 18,
            left: 18,
            zIndex: 9999,
            width: 320,
            background: "#ffffff",
            borderRadius: 12,
            padding: "14px 14px 12px",
            boxShadow: "0 6px 20px rgba(15,23,42,0.18)",
            border: "1px solid #cbd5e1",
            color: "#0f172a",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <strong style={{ fontSize: 14, color: "#015865" }}>Room info</strong>
            <button
              onClick={() => setInfoOpen(false)}
              aria-label="Hide room info"
              title="Hide"
              style={{
                border: "none", background: "transparent", cursor: "pointer",
                fontSize: 16, color: "#475569", lineHeight: 1, padding: 2,
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ marginTop: 8, fontSize: 12, color: "#475569" }}>Room code</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#f1f5f9",
              borderRadius: 6,
              padding: "6px 8px",
              fontFamily: "monospace",
              fontSize: 14,
              fontWeight: 700,
              color: "#0f172a",
              letterSpacing: "0.5px",
            }}
          >
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {roomCode}
            </span>
            <button
              onClick={handleCopyCode}
              aria-label="Copy room code"
              title="Copy code"
              style={{
                border: "none", background: "transparent", cursor: "pointer",
                color: copied ? "#15803d" : "#015865", padding: 2,
                fontSize: 12, fontWeight: 700,
              }}
            >
              {copied ? "✓" : "Copy"}
            </button>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: "#475569" }}>Share link</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#f1f5f9",
              borderRadius: 6,
              padding: "6px 8px",
              fontFamily: "monospace",
              fontSize: 11,
              color: "#0f172a",
            }}
          >
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {inviteLink}
            </span>
            <button
              onClick={handleCopyLink}
              aria-label="Copy link"
              title="Copy link"
              style={{
                border: "none", background: "transparent", cursor: "pointer",
                color: copied ? "#15803d" : "#015865", padding: 2,
                fontSize: 12, fontWeight: 700,
              }}
            >
              {copied ? "✓" : "Copy"}
            </button>
          </div>

          <p style={{ margin: "10px 0 0", fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>
            Only signed-in students and teachers on this site can join with the code or link.
          </p>
        </div>
      ) : (
        <button
          onClick={() => setInfoOpen(true)}
          title="Show room info"
          style={{
            position: "fixed",
            bottom: 18,
            left: 18,
            zIndex: 9999,
            background: "#015865",
            color: "#fff",
            border: "none",
            borderRadius: 999,
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(15,23,42,0.18)",
          }}
        >
          Room: {roomCode}
        </button>
      )}
    </div>
  );
}
