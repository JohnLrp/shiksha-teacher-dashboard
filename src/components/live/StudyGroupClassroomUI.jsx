/**
 * FILE: TEACHER_DASHBOARD/src/components/live/StudyGroupClassroomUI.jsx
 *
 * Peer-only classroom UI for a teacher who has joined a student-hosted
 * Study Group room. Mirrors the student PrivateClassroomUI's layout
 * and feel — same dark theme via privateClassroom.css — but deliberately
 * has NO power controls (no mute-individual, no mute-all, no remove,
 * no end-for-all). Per product rule: in a Study Group nobody — not
 * even the host — gets in-room authority.
 *
 * Differences vs the teacher's TeacherPrivateClassroomUI:
 *   * No teacher-only sidebar/menu actions
 *   * No "End for All" button (clicking Leave just disconnects the
 *     local participant — peers stay in the room)
 *   * No FORCE_MUTE / FORCE_DISCONNECT senders. We still LISTEN for
 *     those events as victim handlers (safety net for any future
 *     moderator role) but never send them.
 *
 * Chat: ENABLED via the study-group chat endpoints
 * (/sessions/study-groups/<id>/chat/[/send] + WS /ws/study-group/<id>/chat/).
 * Messages persist in DB only while the room is live — backend
 * _end_study_group_internal bulk-deletes them on session end.
 *
 * Props:
 *   role        — "host" | "teacher" | "student"
 *   session     — { id, subject, topic, ... }
 *   chatConfig  — { restGetPath, restPostPath, wsPath } — required for
 *                 chat to work. Passed in by StudyGroupLive.jsx.
 *   onLeave     — optional cb fired after disconnect.
 */

import {
  useTracks,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
  VideoTrack,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useState, useEffect, useCallback } from "react";

import "./privateClassroom.css";
import ChatPanel from "./ChatPanel";
import api from "../../api/apiClient";
import { useAuth } from "../../contexts/AuthContext";
import soundManager from "../../utils/soundManager";

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

function Tile({ track, localId, pinned, onPin, raisedHands, large, isScreenShare }) {
  const p = track.participant;
  const name = p.name || p.identity || "?";
  const isLocal = p.identity === localId;
  let metadata = {};
  try { metadata = JSON.parse(p.metadata || "{}"); } catch {}
  const remoteRole = metadata.role; // "host" | "teacher" | "student"
  const isMuted = !p.isMicrophoneEnabled;
  const isCamOff = !p.isCameraEnabled;
  const hasHand = raisedHands[p.identity];

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
            {remoteRole === "host" && <span className="pvt-host-badge">HOST</span>}
            {remoteRole === "teacher" && <span className="pvt-host-badge">TEACHER</span>}
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
        </div>
      )}
    </SpeakingTile>
  );
}

/* ═══════════════════════════════════════════════════════════
   PLACEHOLDER (cam off)
═══════════════════════════════════════════════════════════ */

function ParticipantPlaceholder({ name, large }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  const size = large ? 80 : 56;
  return (
    <div className="pvt-placeholder">
      <div className="pvt-placeholder-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
        {initial}
      </div>
      <div className="pvt-placeholder-name">{name}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PARTICIPANTS LIST — read-only, no controls
═══════════════════════════════════════════════════════════ */

function ParticipantsList({ participants, localId, raisedHands }) {
  return (
    <div className="pvt-participants-list">
      {participants.map((p) => {
        const name = p.name || p.identity;
        const isLocal = p.identity === localId;
        let metadata = {};
        try { metadata = JSON.parse(p.metadata || "{}"); } catch {}
        const remoteRole = metadata.role; // "host" | "teacher" | "student"

        let roleLabel = "Student";
        if (remoteRole === "host") roleLabel = "👑 Host";
        else if (remoteRole === "teacher") roleLabel = "🎓 Teacher";

        return (
          <div key={p.identity} className="pvt-participant-item">
            <div className="pvt-participant-avatar">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="pvt-participant-info">
              <div className="pvt-participant-name">
                {name} {isLocal && "(You)"}
              </div>
              <div className="pvt-participant-role">{roleLabel}</div>
            </div>
            <div className="pvt-participant-icons">
              <span>{p.isMicrophoneEnabled ? "🎤" : "🔇"}</span>
              <span>{p.isCameraEnabled ? "📹" : "📷"}</span>
              {raisedHands[p.identity] && <span>🖐</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */

export default function StudyGroupClassroomUI({
  role,
  session,
  chatConfig,
  onLeave,
}) {
  const room = useRoomContext();
  const { user } = useAuth();
  const myUserId = user?.id ? String(user.id) : null;
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const timer = useTimer();
  const { toasts, show } = useToast();

  // chatConfig is required for chat. Without it the sidebar still works
  // (participants only) — gates below check `chatConfig` before opening
  // the REST/WS connections.
  const noChat = !chatConfig;

  const [sidebarTab, setSidebarTab] = useState(noChat ? "participants" : "chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState({});
  const [pinnedIds, setPinnedIds] = useState(new Set());
  const [chatMessages, setChatMessages] = useState([]);
  const [soundMuted, setSoundMuted] = useState(soundManager.isMuted());
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const prevParticipantCountRef = useState({ current: null })[0];

  // ── Load persisted chat messages on mount ──
  useEffect(() => {
    if (noChat || !session?.id) return;
    api.get(chatConfig.restGetPath).then((res) => {
      const msgs = (res.data || []).map((m) => {
        const isMe = myUserId && String(m.sender_id) === myUserId;
        return {
          id: m.id,
          sender: m.sender_name,
          text: m.message,
          isTeacher: m.sender_role === "teacher",
          isMe,
          time: new Date(m.created_at),
        };
      });
      setChatMessages(msgs);
    }).catch(() => {});
  }, [session?.id, myUserId, noChat, chatConfig?.restGetPath]);

  // ── WebSocket for real-time chat (auto-reconnect + token auth) ──
  useEffect(() => {
    if (noChat || !session?.id) return;
    let ws = null;
    let reconnectTimer = null;
    let unmounted = false;

    const connect = () => {
      if (unmounted) return;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsHost = import.meta.env.VITE_WS_HOST || window.location.host;
      const token = localStorage.getItem("access") || sessionStorage.getItem("access") || "";
      const wsUrl = `${protocol}//${wsHost}${chatConfig.wsPath}${token ? `?token=${token}` : ""}`;
      try {
        ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
          try {
            const { data } = JSON.parse(event.data);
            if (data) {
              setChatMessages((prev) => {
                if (prev.some((m) => m.id === data.id)) return prev;
                const isMe = myUserId && String(data.sender_id) === myUserId;
                if (!isMe) soundManager.messageReceive();
                return [...prev, {
                  id: data.id,
                  sender: data.sender_name,
                  text: data.message,
                  isTeacher: data.sender_role === "teacher",
                  isMe,
                  time: new Date(data.created_at),
                }];
              });
            }
          } catch {}
        };
        ws.onclose = () => {
          if (!unmounted) reconnectTimer = setTimeout(connect, 3000);
        };
        ws.onerror = () => ws.close();
      } catch {}
    };

    connect();
    return () => {
      unmounted = true;
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [session?.id, myUserId, noChat, chatConfig?.wsPath]);

  // ── Send a chat message ──
  const sendChatMessage = async (text) => {
    soundManager.messageSend();
    if (noChat) return;
    try {
      const res = await api.post(chatConfig.restPostPath, { message: text });
      const msg = res.data;
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, {
          id: msg.id,
          sender: "You",
          text: msg.message,
          isMe: true,
          isTeacher: role === "teacher",
          time: new Date(msg.created_at),
        }];
      });
    } catch (e) {
      console.error("Failed to send message:", e);
      setChatMessages((prev) => [...prev, { sender: "You", text, isMe: true, time: new Date() }]);
    }
  };

  // ── Participant join/leave sound detection ──
  useEffect(() => {
    const count = participants.length;
    if (prevParticipantCountRef.current === null) {
      prevParticipantCountRef.current = count;
      return;
    }
    if (count > prevParticipantCountRef.current) {
      soundManager.participantJoin();
    } else if (count < prevParticipantCountRef.current) {
      soundManager.participantLeave();
    }
    prevParticipantCountRef.current = count;
  }, [participants.length]);

  // Get all tracks
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  const screenTracks = tracks.filter((t) => t.source === Track.Source.ScreenShare);
  const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);

  // ── Screen share detection sound (when others share) ──
  const prevScreenCountRef = useState({ current: 0 })[0];
  useEffect(() => {
    const count = screenTracks.length;
    if (count > prevScreenCountRef.current) soundManager.screenShareStart();
    else if (count < prevScreenCountRef.current && prevScreenCountRef.current > 0) soundManager.screenShareStop();
    prevScreenCountRef.current = count;
  }, [screenTracks.length]);

  // ── Listen for raise/lower-hand data messages ──
  // (We deliberately do NOT send FORCE_MUTE / FORCE_DISCONNECT from this
  //  component. We DO listen for them as victim handlers — harmless if
  //  no one ever sends them, future-proof if a moderator role is added.)
  useEffect(() => {
    const decoder = new TextDecoder();
    const handleData = (payload, participant) => {
      const text = decoder.decode(payload);
      try {
        const msg = JSON.parse(text);
        const id = participant?.identity || msg.sender;

        if (msg.type === "RAISE_HAND" && id) {
          setRaisedHands((prev) => ({ ...prev, [id]: true }));
          show(`${participant?.name || id} raised their hand 🖐`, "info");
        }
        if (msg.type === "LOWER_HAND" && id) {
          setRaisedHands((prev) => { const u = { ...prev }; delete u[id]; return u; });
        }
        if (msg.type === "FORCE_MUTE" && msg.target === localParticipant.identity) {
          localParticipant.setMicrophoneEnabled(false);
          setMicOn(false);
          show("You were muted", "warn");
        }
        if (msg.type === "FORCE_DISCONNECT" && msg.target === localParticipant.identity) {
          show("You were removed from the room", "warn");
          setTimeout(() => room.disconnect(), 1000);
        }
      } catch {}
    };

    room.on("dataReceived", handleData);
    return () => room.off("dataReceived", handleData);
  }, [room, show, localParticipant]);

  // ── Controls ──

  const toggleMic = async () => {
    soundManager.buttonClick();
    const next = !micOn;
    await localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
    show(next ? "Mic on" : "Mic muted", "info");
  };

  const toggleCam = async () => {
    soundManager.buttonClick();
    const next = !camOn;
    await localParticipant.setCameraEnabled(next);
    setCamOn(next);
    show(next ? "Camera on" : "Camera off", "info");
  };

  const toggleScreen = async () => {
    soundManager.buttonClick();
    const next = !screenSharing;
    await localParticipant.setScreenShareEnabled(next);
    setScreenSharing(next);
    if (next) soundManager.screenShareStart();
    else soundManager.screenShareStop();
    show(next ? "Screen sharing started" : "Screen share stopped", "info");
  };

  const toggleHand = async () => {
    soundManager.buttonClick();
    const next = !handRaised;
    const type = next ? "RAISE_HAND" : "LOWER_HAND";
    const encoder = new TextEncoder();
    await localParticipant.publishData(
      encoder.encode(JSON.stringify({ type })),
      { reliable: true }
    );
    setHandRaised(next);
    show(next ? "Hand raised 🖐" : "Hand lowered", "info");
  };

  // Leave button opens an in-room confirmation modal (peer action — does
  // NOT end the room for anyone else). Modal markup is appended near the
  // root return below.
  const leaveRoom = () => {
    soundManager.buttonClick();
    setShowLeaveConfirm(true);
  };

  const confirmLeave = async () => {
    setShowLeaveConfirm(false);
    show("You left", "info");
    setTimeout(async () => {
      await room.disconnect();
      if (typeof onLeave === "function") onLeave();
    }, 400);
  };

  const cancelLeave = () => setShowLeaveConfirm(false);

  // ── Pin logic ──
  const togglePin = (identity) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(identity)) next.delete(identity);
      else if (next.size < 4) next.add(identity);
      return next;
    });
  };

  // ── Grid layout ──
  const allTracks = [...screenTracks, ...cameraTracks];
  const totalTiles = allTracks.length;

  const gridClass =
    totalTiles <= 1 ? "pvt-grid-1" :
    totalTiles === 2 ? "pvt-grid-2" :
    totalTiles <= 4 ? "pvt-grid-4" :
    totalTiles <= 6 ? "pvt-grid-6" :
    totalTiles <= 9 ? "pvt-grid-9" : "pvt-grid-many";

  const sortedAllTracks = [...allTracks].sort((a, b) => {
    const aPin = pinnedIds.has(a.participant.identity) ? 0 : 1;
    const bPin = pinnedIds.has(b.participant.identity) ? 0 : 1;
    if (aPin !== bPin) return aPin - bPin;
    const aScreen = a.source === Track.Source.ScreenShare ? 0 : 1;
    const bScreen = b.source === Track.Source.ScreenShare ? 0 : 1;
    return aScreen - bScreen;
  });

  const pinnedTracks = sortedAllTracks.filter(t => pinnedIds.has(t.participant.identity));
  const unpinnedTracks = sortedAllTracks.filter(t => !pinnedIds.has(t.participant.identity));
  const showSpotlight = pinnedTracks.length === 1 && totalTiles > 1;

  return (
    <div className="pvt-room">
      {/* ── Top Bar ── */}
      <div className="pvt-topbar">
        <div className="pvt-topbar-left">
          <div className="pvt-session-name">{session?.subject || "Study Group"}</div>
          <div className="pvt-session-sub">{session?.topic || session?.subject || "Study Group"}</div>
        </div>
        <div className="pvt-topbar-right">
          <span className="pvt-timer">⏱ {timer}</span>
          <span className="pvt-count">👥 {participants.length}</span>
        </div>
      </div>

      {/* ── Raised hand banner (visible to all) ── */}
      {Object.keys(raisedHands).length > 0 && (
        <div className="pvt-hand-banner">
          🖐 {Object.keys(raisedHands).length} participant{Object.keys(raisedHands).length !== 1 ? "s" : ""} raised hand
        </div>
      )}

      {/* ── Main Area ── */}
      <div className="pvt-main">
        <div className="pvt-video-area">
          {showSpotlight ? (
            <div className="pvt-screen-layout">
              <div className="pvt-screen-main">
                {pinnedTracks[0].source === Track.Source.ScreenShare ? (
                  <VideoTrack trackRef={pinnedTracks[0]} />
                ) : (
                  <Tile
                    key={pinnedTracks[0].participant.identity + "-pin"}
                    track={pinnedTracks[0]}
                    localId={localParticipant.identity}
                    pinned={true} onPin={togglePin}
                    raisedHands={raisedHands} large={true}
                    isScreenShare={false}
                  />
                )}
              </div>
              <div className="pvt-screen-strip">
                {unpinnedTracks.map((track) => (
                  <Tile
                    key={track.participant.identity + "-" + track.source}
                    track={track}
                    localId={localParticipant.identity}
                    pinned={false} onPin={togglePin}
                    raisedHands={raisedHands} large={false}
                    isScreenShare={track.source === Track.Source.ScreenShare}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className={`pvt-video-grid ${gridClass}`}>
              {sortedAllTracks.map((track) => (
                <Tile
                  key={track.participant.identity + "-" + track.source}
                  track={track}
                  localId={localParticipant.identity}
                  pinned={pinnedIds.has(track.participant.identity)}
                  onPin={togglePin}
                  raisedHands={raisedHands}
                  large={totalTiles <= 2}
                  isScreenShare={track.source === Track.Source.ScreenShare}
                />
              ))}
            </div>
          )}

          {/* ── Control Bar — peer controls only ── */}
          <div className="pvt-controls">
            <div className="pvt-ctrl-left">
              <button
                className={`pvt-ctrl-btn ${handRaised ? "pvt-ctrl-active" : ""}`}
                onClick={toggleHand}
                title={handRaised ? "Lower Hand" : "Raise Hand"}
              >
                🖐
              </button>
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
              <button
                className={`pvt-ctrl-btn ${sidebarOpen && sidebarTab === "participants" ? "pvt-ctrl-active" : ""}`}
                onClick={() => {
                  if (sidebarOpen && sidebarTab === "participants") {
                    setSidebarOpen(false);
                  } else {
                    setSidebarTab("participants");
                    setSidebarOpen(true);
                  }
                }}
                title="Participants"
              >
                👥
              </button>
              {!noChat && (
                <button
                  className={`pvt-ctrl-btn ${sidebarTab === "chat" && sidebarOpen ? "pvt-ctrl-active" : ""}`}
                  onClick={() => {
                    if (sidebarTab === "chat" && sidebarOpen) {
                      setSidebarOpen(false);
                    } else {
                      setSidebarTab("chat");
                      setSidebarOpen(true);
                    }
                  }}
                  title="Chat"
                >
                  💬
                </button>
              )}
            </div>
            <div className="pvt-ctrl-right">
              <button
                className={`pvt-ctrl-btn ${soundMuted ? "pvt-ctrl-off" : ""}`}
                onClick={() => { const m = soundManager.toggleMute(); setSoundMuted(m); }}
                title={soundMuted ? "Unmute Sounds" : "Mute Sounds"}
              >{soundMuted ? "🔇" : "🔊"}</button>
              <button className="pvt-leave-btn" onClick={leaveRoom}>
                ← Leave
              </button>
            </div>
          </div>
        </div>

        {/* ── Sidebar — participants + chat tabs ── */}
        {sidebarOpen && (
          <div className="pvt-sidebar">
            <div className="pvt-sidebar-tabs">
              <button
                className={`pvt-sidebar-tab ${sidebarTab === "participants" ? "active" : ""}`}
                onClick={() => setSidebarTab("participants")}
              >
                Participants ({participants.length})
              </button>
              {!noChat && (
                <button
                  className={`pvt-sidebar-tab ${sidebarTab === "chat" ? "active" : ""}`}
                  onClick={() => setSidebarTab("chat")}
                >
                  Chat
                </button>
              )}
            </div>
            <div className="pvt-sidebar-body">
              {sidebarTab === "participants" || noChat ? (
                <ParticipantsList
                  participants={participants}
                  localId={localParticipant.identity}
                  raisedHands={raisedHands}
                />
              ) : (
                <ChatPanel
                  role={role}
                  messages={chatMessages}
                  onSendMessage={sendChatMessage}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Leave-confirmation modal ── */}
      {showLeaveConfirm && (
        <div
          className="pvt-leave-modal-overlay"
          onClick={cancelLeave}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pvt-leave-title"
        >
          <div
            className="pvt-leave-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="pvt-leave-title" className="pvt-leave-title">
              Leave this room?
            </h3>
            <p className="pvt-leave-body">
              You can rejoin while the session is still live.
            </p>
            <div className="pvt-leave-actions">
              <button
                type="button"
                className="pvt-leave-btn-cancel"
                onClick={cancelLeave}
                autoFocus
              >
                Stay
              </button>
              <button
                type="button"
                className="pvt-leave-btn-confirm"
                onClick={confirmLeave}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toasts ── */}
      <div className="pvt-toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`pvt-toast pvt-toast-${t.type}`}>{t.text}</div>
        ))}
      </div>
    </div>
  );
}
