/**
 * FILE: TEACHER_UI/src/components/live/TeacherPrivateClassroomUI.jsx
 *
 * Full teacher room UI for private sessions.
 * Same dark theme as student PrivateClassroomUI, plus:
 *   - Mute individual students (via LiveKit remote mute)
 *   - Mute All Students button (no unmute — students unmute themselves)
 *   - Remove participant
 *   - End for All button
 *   - Screen share (Zoom/Discord style — full screen or window)
 *   - Pin/unpin, speaking detection, raise hand, chat, toasts
 */

import {
  useTracks,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
  VideoTrack,
} from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import { useState, useEffect, useCallback } from "react";

import "./privateClassroom.css";
import ChatPanel from "./ChatPanel";
import api from "../../api/apiClient";

/* ═══════════════════════════════════════════════════════════
   HOOKS
═══════════════════════════════════════════════════════════ */

function useTimer() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setS((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((text, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, text, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 2800);
  }, []);
  return { toasts, show };
}

function useSpeakingDetect(participant) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  useEffect(() => {
    if (!participant) return;
    const onSpeaking = (speaking) => setIsSpeaking(speaking);
    participant.on("isSpeakingChanged", onSpeaking);
    return () => participant.off("isSpeakingChanged", onSpeaking);
  }, [participant]);
  return isSpeaking;
}

function SpeakingTile({ track, children }) {
  const isSpeaking = useSpeakingDetect(track.participant);
  return children(isSpeaking);
}

/* ═══════════════════════════════════════════════════════════
   VIDEO TILE
═══════════════════════════════════════════════════════════ */

function Tile({ track, localId, pinned, onPin, raisedHands, large, onMute, onRemove, isScreenShare }) {
  const p = track.participant;
  const name = p.name || p.identity || "?";
  const isLocal = p.identity === localId;
  let metadata = {};
  try { metadata = JSON.parse(p.metadata || "{}"); } catch {}
  const isTeacher = metadata.role === "teacher";
  const isMuted = !p.isMicrophoneEnabled;
  const isCamOff = !p.isCameraEnabled;
  const hasHand = raisedHands[p.identity];

  // Screen share tiles always show the video track
  if (isScreenShare) {
    return (
      <div className={`pvt-tile pvt-tile-screenshare ${pinned ? "pvt-tile-pinned" : ""}`}>
        <VideoTrack trackRef={track} />
        <div className="pvt-tile-label">
          🖥️ {isLocal ? `${name} (You)` : name}'s Screen
        </div>
        <button
          className={`pvt-pin-btn ${pinned ? "pvt-pin-active" : ""}`}
          onClick={(e) => { e.stopPropagation(); onPin(p.identity); }}
          title={pinned ? "Unpin" : "Pin"}
        >
          {pinned ? "📌" : "📍"}
        </button>
      </div>
    );
  }

  return (
    <SpeakingTile track={track}>
      {(isSpeaking) => (
        <div className={`pvt-tile ${isSpeaking ? "pvt-tile-speaking" : ""} ${pinned ? "pvt-tile-pinned" : ""}`}>
          {!isCamOff && (track.publication?.isSubscribed || isLocal) ? (
            <VideoTrack trackRef={track} />
          ) : (
            <ParticipantPlaceholder name={name} large={large} />
          )}

          {isMuted && <div className="pvt-muted-bar">🔇 Muted</div>}
          {hasHand && <div className="pvt-hand-indicator">🖐</div>}

          <div className="pvt-tile-label">
            {isTeacher && <span className="pvt-host-badge">HOST</span>}
            {isLocal ? `${name} (You)` : name}
            {isSpeaking && <span className="pvt-speaking-dot">●</span>}
          </div>

          <button
            className={`pvt-pin-btn ${pinned ? "pvt-pin-active" : ""}`}
            onClick={(e) => { e.stopPropagation(); onPin(p.identity); }}
            title={pinned ? "Unpin" : "Pin"}
          >
            {pinned ? "📌" : "📍"}
          </button>

          {/* Teacher host controls on student tiles */}
          {!isLocal && !isTeacher && (
            <div className="pvt-tile-host-actions">
              {!isMuted && (
                <button
                  className="pvt-tile-action-btn"
                  onClick={(e) => { e.stopPropagation(); onMute(p); }}
                  title="Mute student"
                >
                  🔇
                </button>
              )}
              <button
                className="pvt-tile-action-btn pvt-tile-action-remove"
                onClick={(e) => { e.stopPropagation(); onRemove(p); }}
                title="Remove from session"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}
    </SpeakingTile>
  );
}

function ParticipantPlaceholder({ name, large }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  const size = large ? 80 : 56;
  return (
    <div className="pvt-placeholder">
      <div className="pvt-placeholder-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>{initial}</div>
      <div className="pvt-placeholder-name">{name}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PARTICIPANTS LIST (sidebar) — with mute/remove controls
═══════════════════════════════════════════════════════════ */

function ParticipantsList({ participants, localId, raisedHands, onMute, onRemove }) {
  return (
    <div className="pvt-participants-list">
      {participants.map((p) => {
        const name = p.name || p.identity;
        const isLocal = p.identity === localId;
        let metadata = {};
        try { metadata = JSON.parse(p.metadata || "{}"); } catch {}
        const isTeacher = metadata.role === "teacher";

        return (
          <div key={p.identity} className="pvt-participant-item">
            <div className="pvt-participant-avatar">{name.charAt(0).toUpperCase()}</div>
            <div className="pvt-participant-info">
              <div className="pvt-participant-name">{name} {isLocal && "(You)"}</div>
              <div className="pvt-participant-role">{isTeacher ? "👑 Host" : "Student"}</div>
            </div>
            <div className="pvt-participant-icons">
              <span>{p.isMicrophoneEnabled ? "🎤" : "🔇"}</span>
              <span>{p.isCameraEnabled ? "📹" : "📷"}</span>
              {raisedHands[p.identity] && <span>🖐</span>}
            </div>
            {!isLocal && !isTeacher && (
              <div className="pvt-participant-host-actions">
                {p.isMicrophoneEnabled && (
                  <button className="pvt-participant-action-btn" onClick={() => onMute(p)} title="Mute">🔇</button>
                )}
                <button className="pvt-participant-action-btn pvt-participant-action-remove" onClick={() => onRemove(p)} title="Remove">✕</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REMOVE MODAL
═══════════════════════════════════════════════════════════ */

function RemoveModal({ participant, onClose, onConfirm }) {
  const name = participant?.name || participant?.identity || "Student";
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="pvt-remove-overlay" onClick={onClose}>
      <div className="pvt-remove-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pvt-remove-avatar">{initial}</div>
        <div className="pvt-remove-title">Remove Participant?</div>
        <div className="pvt-remove-name">{name}</div>
        <div className="pvt-remove-sub">This participant will be disconnected from the session.</div>
        <div className="pvt-remove-actions">
          <button className="pvt-remove-cancel" onClick={onClose}>Cancel</button>
          <button className="pvt-remove-confirm" onClick={() => onConfirm(participant)}>Remove</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */

export default function TeacherPrivateClassroomUI({ session, onEndSession }) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const timer = useTimer();
  const { toasts, show } = useToast();

  const [sidebarTab, setSidebarTab] = useState("chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [raisedHands, setRaisedHands] = useState({});
  const [pinnedIds, setPinnedIds] = useState(new Set());
  const [removeTarget, setRemoveTarget] = useState(null);
  const [recording, setRecording] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  // ── Load persisted chat messages on mount ──
  useEffect(() => {
    if (!session?.id) return;
    api.get(`/sessions/${session.id}/chat/`).then((res) => {
      const msgs = (res.data || []).map((m) => ({
        id: m.id,
        sender: m.sender_name,
        text: m.message,
        isTeacher: m.sender_role === "teacher",
        isMe: false, // Will be set properly when comparing sender
        time: new Date(m.created_at),
      }));
      setChatMessages(msgs);
    }).catch(() => {});
  }, [session?.id]);

  // ── WebSocket for real-time chat updates ──
  useEffect(() => {
    if (!session?.id) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//api.shikshacom.com/ws/private-session/${session.id}/chat/`;
    let ws;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const { data } = JSON.parse(event.data);
          if (data) {
            setChatMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === data.id)) return prev;
              return [...prev, {
                id: data.id,
                sender: data.sender_name,
                text: data.message,
                isTeacher: data.sender_role === "teacher",
                isMe: false,
                time: new Date(data.created_at),
              }];
            });
          }
        } catch {}
      };
    } catch {}
    return () => { if (ws) ws.close(); };
  }, [session?.id]);

  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  const screenTracks = tracks.filter((t) => t.source === Track.Source.ScreenShare);
  const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);

  // Listen for raise/lower hand + chat messages
  useEffect(() => {
    const decoder = new TextDecoder();
    const CONTROL_TYPES = ["raise-hand", "RAISE_HAND", "LOWER_HAND", "FORCE_MUTE", "FORCE_DISCONNECT"];

    const handleData = (payload, participant) => {
      const text = decoder.decode(payload);
      let isControl = false;

      try {
        const msg = JSON.parse(text);
        const id = participant?.identity || msg.sender;

        if (CONTROL_TYPES.includes(msg.type)) isControl = true;

        if (!id) return;
        if (msg.type === "RAISE_HAND") {
          setRaisedHands((prev) => ({ ...prev, [id]: true }));
          show(`${participant?.name || id} raised their hand 🖐`, "info");
        }
        if (msg.type === "LOWER_HAND") {
          setRaisedHands((prev) => { const u = { ...prev }; delete u[id]; return u; });
        }
      } catch {}

      // Chat message — not a control message, store it
      if (!isControl) {
        const displayName = participant?.name || participant?.identity || "Unknown";
        let meta = {};
        try { meta = JSON.parse(participant?.metadata || "{}"); } catch {}
        const isTeacher = meta.role === "teacher" || participant?.permissions?.canPublish;
        setChatMessages((prev) => [...prev, { sender: displayName, text, isTeacher, time: new Date() }]);
      }
    };
    room.on("dataReceived", handleData);
    return () => room.off("dataReceived", handleData);
  }, [room, show]);

  // ── Chat send — persists to backend + broadcasts via LiveKit data channel ──
  const sendChatMessage = async (text) => {
    // Persist to backend
    try {
      const res = await api.post(`/sessions/${session.id}/chat/send/`, { message: text });
      const msg = res.data;
      setChatMessages((prev) => [...prev, {
        id: msg.id,
        sender: "You",
        text: msg.message,
        isMe: true,
        isTeacher: true,
        time: new Date(msg.created_at),
      }]);
    } catch (e) {
      console.error("Failed to send message:", e);
      // Fallback: still show locally
      setChatMessages((prev) => [...prev, { sender: "You", text, isMe: true, isTeacher: true, time: new Date() }]);
    }
    // Also broadcast via LiveKit for instant delivery
    try {
      const encoder = new TextEncoder();
      await localParticipant.publishData(encoder.encode(text), { reliable: true });
    } catch {}
  };

  // ── Controls ──

  const toggleMic = async () => {
    const next = !micOn;
    await localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
    show(next ? "Mic on" : "Mic muted", "info");
  };

  const toggleCam = async () => {
    const next = !camOn;
    await localParticipant.setCameraEnabled(next);
    setCamOn(next);
    show(next ? "Camera on" : "Camera off", "info");
  };

  const toggleScreen = async () => {
    const next = !screenSharing;
    await localParticipant.setScreenShareEnabled(next);
    setScreenSharing(next);
    show(next ? "Screen sharing started" : "Screen share stopped", "info");
  };

  // ── Mute individual student ──
  const muteStudent = async (participant) => {
    try {
      // Send a data message telling the student to mute
      const encoder = new TextEncoder();
      await localParticipant.publishData(
        encoder.encode(JSON.stringify({
          type: "FORCE_MUTE",
          target: participant.identity,
        })),
        { reliable: true, destinationIdentities: [participant.identity] }
      );
      show(`${participant.name || participant.identity} muted`, "info");
    } catch (e) {
      console.error("Mute failed:", e);
      show("Failed to mute student", "warn");
    }
  };

  // ── Mute ALL students ──
  const muteAllStudents = async () => {
    const students = participants.filter((p) => {
      if (p.identity === localParticipant.identity) return false;
      let meta = {};
      try { meta = JSON.parse(p.metadata || "{}"); } catch {}
      return meta.role !== "teacher";
    });

    const encoder = new TextEncoder();
    for (const student of students) {
      if (student.isMicrophoneEnabled) {
        try {
          await localParticipant.publishData(
            encoder.encode(JSON.stringify({
              type: "FORCE_MUTE",
              target: student.identity,
            })),
            { reliable: true, destinationIdentities: [student.identity] }
          );
        } catch {}
      }
    }
    show(`All students muted (${students.length})`, "info");
  };

  // ── Remove participant ──
  const confirmRemove = async (participant) => {
    try {
      const encoder = new TextEncoder();
      await localParticipant.publishData(
        encoder.encode(JSON.stringify({
          type: "FORCE_DISCONNECT",
          target: participant.identity,
        })),
        { reliable: true, destinationIdentities: [participant.identity] }
      );
      show(`${participant.name || participant.identity} removed`, "warn");
    } catch (e) {
      console.error("Remove failed:", e);
      show("Failed to remove participant", "warn");
    }
    setRemoveTarget(null);
  };

  // ── End session ──
  const handleEnd = async () => {
    if (window.confirm("End session for all participants?")) {
      show("Session ended", "info");
      setTimeout(async () => {
        await room.disconnect();
        if (onEndSession) onEndSession();
      }, 600);
    }
  };

  // ── Pin logic ──
  const togglePin = (identity) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(identity)) next.delete(identity);
      else if (next.size < 4) next.add(identity);
      return next;
    });
  };

  // ── Grid layout — Google Meet style ──
  // Merge screen shares + camera tracks into a unified tile list
  const allTracks = [...screenTracks, ...cameraTracks];
  const totalTiles = allTracks.length;

  // Compute grid class based on total tile count
  const gridClass =
    totalTiles <= 1 ? "pvt-grid-1" :
    totalTiles === 2 ? "pvt-grid-2" :
    totalTiles <= 4 ? "pvt-grid-4" :
    totalTiles <= 6 ? "pvt-grid-6" :
    totalTiles <= 9 ? "pvt-grid-9" : "pvt-grid-many";

  // Pinned tracks go first; within each group, screen shares precede cameras
  const sortedAllTracks = [...allTracks].sort((a, b) => {
    const aPin = pinnedIds.has(a.participant.identity) ? 0 : 1;
    const bPin = pinnedIds.has(b.participant.identity) ? 0 : 1;
    if (aPin !== bPin) return aPin - bPin;
    const aScreen = a.source === Track.Source.ScreenShare ? 0 : 1;
    const bScreen = b.source === Track.Source.ScreenShare ? 0 : 1;
    return aScreen - bScreen;
  });

  // Check if there's exactly one pinned track — if so, show spotlight layout
  const pinnedTracks = sortedAllTracks.filter(t => pinnedIds.has(t.participant.identity));
  const unpinnedTracks = sortedAllTracks.filter(t => !pinnedIds.has(t.participant.identity));
  const showSpotlight = pinnedTracks.length === 1 && totalTiles > 1;

  const studentCount = participants.filter((p) => {
    let meta = {};
    try { meta = JSON.parse(p.metadata || "{}"); } catch {}
    return meta.role !== "teacher" && p.identity !== localParticipant.identity;
  }).length;

  return (
    <div className="pvt-room">
      {/* ── Top Bar ── */}
      <div className="pvt-topbar">
        <div className="pvt-topbar-left">
          <div className="pvt-session-name">{session?.subject || "Private Session"}</div>
          <div className="pvt-session-sub">{session?.topic || session?.subject || "Private Session"}</div>
        </div>
        <div className="pvt-topbar-right">
          {recording && <div className="pvt-rec-badge"><div className="pvt-rec-dot" />REC</div>}
          <span className="pvt-timer">⏱ {timer}</span>
          <span className="pvt-count">👥 {participants.length}</span>
        </div>
      </div>

      {/* ── Raised hand banner ── */}
      {Object.keys(raisedHands).length > 0 && (
        <div className="pvt-hand-banner">
          🖐 {Object.keys(raisedHands).length} student{Object.keys(raisedHands).length !== 1 ? "s" : ""} raised hand
        </div>
      )}

      {/* ── Main Area ── */}
      <div className="pvt-main">
        <div className="pvt-video-area">
          {showSpotlight ? (
            /* ── Spotlight layout: 1 pinned large + rest in strip ── */
            <div className="pvt-screen-layout">
              <div className="pvt-screen-main">
                {pinnedTracks[0].source === Track.Source.ScreenShare ? (
                  <VideoTrack trackRef={pinnedTracks[0]} />
                ) : (
                  <Tile
                    key={pinnedTracks[0].participant.identity + "-pin"}
                    track={pinnedTracks[0]} localId={localParticipant.identity}
                    pinned={true} onPin={togglePin} raisedHands={raisedHands}
                    large={true} onMute={muteStudent} onRemove={setRemoveTarget}
                  />
                )}
              </div>
              <div className="pvt-screen-strip">
                {unpinnedTracks.map((track) => (
                  <Tile
                    key={track.participant.identity + "-" + track.source}
                    track={track} localId={localParticipant.identity}
                    pinned={false} onPin={togglePin} raisedHands={raisedHands}
                    large={false} onMute={muteStudent} onRemove={setRemoveTarget}
                    isScreenShare={track.source === Track.Source.ScreenShare}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* ── Grid layout: all tiles in even Google Meet grid ── */
            <div className={`pvt-video-grid ${gridClass}`}>
              {sortedAllTracks.map((track) => (
                <Tile
                  key={track.participant.identity + "-" + track.source}
                  track={track} localId={localParticipant.identity}
                  pinned={pinnedIds.has(track.participant.identity)}
                  onPin={togglePin} raisedHands={raisedHands}
                  large={totalTiles <= 2} onMute={muteStudent} onRemove={setRemoveTarget}
                  isScreenShare={track.source === Track.Source.ScreenShare}
                />
              ))}
            </div>
          )}

          {/* ── Control Bar ── */}
          <div className="pvt-controls">
            <div className="pvt-ctrl-left">
              <button className={`pvt-ctrl-btn ${recording ? "pvt-ctrl-off" : ""}`}
                onClick={() => { setRecording(!recording); show(recording ? "Recording stopped" : "Recording started 🔴", recording ? "info" : "warn"); }}
                title={recording ? "Stop Recording" : "Record"}>🔴</button>
              {studentCount > 0 && (
                <button className="pvt-mute-all-btn" onClick={muteAllStudents} title="Mute All Students">
                  🔇 Mute All
                </button>
              )}
            </div>
            <div className="pvt-ctrl-center">
              <button className={`pvt-ctrl-btn ${micOn ? "" : "pvt-ctrl-off"}`} onClick={toggleMic} title={micOn ? "Mute" : "Unmute"}>
                {micOn ? "🎤" : "🔇"}
              </button>
              <button className={`pvt-ctrl-btn ${camOn ? "" : "pvt-ctrl-off"}`} onClick={toggleCam} title={camOn ? "Stop Camera" : "Start Camera"}>
                {camOn ? "📹" : "📷"}
              </button>
              <button className={`pvt-ctrl-btn ${screenSharing ? "pvt-ctrl-active" : ""}`} onClick={toggleScreen} title={screenSharing ? "Stop Share" : "Share Screen"}>
                🖥️
              </button>
              <button className={`pvt-ctrl-btn ${sidebarTab === "participants" && sidebarOpen ? "pvt-ctrl-active" : ""}`}
                onClick={() => { setSidebarTab("participants"); setSidebarOpen((o) => sidebarTab === "participants" ? !o : true); }}
                title="Participants">👥</button>
              <button className={`pvt-ctrl-btn ${sidebarTab === "chat" && sidebarOpen ? "pvt-ctrl-active" : ""}`}
                onClick={() => { setSidebarTab("chat"); setSidebarOpen((o) => sidebarTab === "chat" ? !o : true); }}
                title="Chat">💬</button>
            </div>
            <div className="pvt-ctrl-right">
              <button className="pvt-leave-btn pvt-end-btn" onClick={handleEnd}>⛔ End for All</button>
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        {sidebarOpen && (
          <div className="pvt-sidebar">
            <div className="pvt-sidebar-tabs">
              <button className={`pvt-sidebar-tab ${sidebarTab === "participants" ? "active" : ""}`} onClick={() => setSidebarTab("participants")}>
                Participants ({participants.length})
              </button>
              <button className={`pvt-sidebar-tab ${sidebarTab === "chat" ? "active" : ""}`} onClick={() => setSidebarTab("chat")}>
                Chat
              </button>
            </div>
            <div className="pvt-sidebar-body">
              {sidebarTab === "participants" ? (
                <ParticipantsList
                  participants={participants}
                  localId={localParticipant.identity}
                  raisedHands={raisedHands}
                  onMute={muteStudent}
                  onRemove={setRemoveTarget}
                />
              ) : (
                <ChatPanel role="teacher" messages={chatMessages} onSendMessage={sendChatMessage} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Toasts ── */}
      <div className="pvt-toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`pvt-toast pvt-toast-${t.type}`}>{t.text}</div>
        ))}
      </div>

      {/* ── Remove Modal ── */}
      {removeTarget && (
        <RemoveModal
          participant={removeTarget}
          onClose={() => setRemoveTarget(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}