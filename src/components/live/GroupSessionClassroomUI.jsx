/**
 * GroupSessionClassroomUI.jsx
 * 
 * Exact copy of ClassroomUI.jsx — three differences only:
 *  1. Chat uses group-session REST + WS (chatConfig) instead of useLiveSessionChat
 *  2. No TeacherControls overlay (peer room)
 *  3. groupSessionRemainingMs countdown shown in the rh-toasts area (no topbar)
 */

import { useTracks, VideoTrack, useRoomContext } from "@livekit/components-react";
import { Track } from "livekit-client";
import ChatPanel from "./ChatPanel";
import ControlBar from "./ControlBar";
import React, { useState, useRef, useEffect } from "react";
import "../../styles/live.css";
import api from "../../api/apiClient";
import { useAuth } from "../../contexts/AuthContext";
import soundManager from "../../utils/soundManager";
import { MdFullscreen, MdFullscreenExit } from "react-icons/md";
import { HiDotsVertical } from "react-icons/hi";

export default function GroupSessionClassroomUI({
  role,
  session,
  chatConfig,
  onLeave,
  groupSession = false,
  groupSessionRemainingMs = null,
  isHost = false,
  onEndSession = null,
}) {
  const isPresenter = role === "PRESENTER" || role === "teacher";

  const [raisedHands, setRaisedHands] = useState({});
  const [raiseHandToasts, setRaiseHandToasts] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [, setTick] = useState(0);
  const bump = () => setTick((t) => t + 1);

  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const room = useRoomContext();
  const { user } = useAuth();
  const myUserId = user?.id ? String(user.id) : null;

  /* ── panel toggle ── */
  const togglePanel = (panel) => {
    setActivePanel((current) => (current === panel ? null : panel));
    setOpenMenuId(null);
  };

  /* ── close menu on outside click ── */
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    if (openMenuId) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openMenuId]);

  /* ── fullscreen ── */
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const el = containerRef.current;
        if (el?.requestFullscreen) await el.requestFullscreen();
        else if (el?.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        else if (el?.msRequestFullscreen) await el.msRequestFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
        else if (document.msExitFullscreen) await document.msExitFullscreen();
      }
    } catch {}
  };

  useEffect(() => {
    const fn = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", fn);
    document.addEventListener("webkitfullscreenchange", fn);
    return () => {
      document.removeEventListener("fullscreenchange", fn);
      document.removeEventListener("webkitfullscreenchange", fn);
    };
  }, []);

  /* ── re-render on track changes ── */
  useEffect(() => {
    if (!room) return;
    const events = [
      "trackMuted","trackUnmuted","trackPublished","trackUnpublished",
      "trackSubscribed","trackUnsubscribed","participantConnected",
      "participantDisconnected","localTrackPublished","localTrackUnpublished",
    ];
    events.forEach((evt) => room.on(evt, bump));
    return () => events.forEach((evt) => room.off(evt, bump));
  }, [room]);

  /* ── raise hand ── */
  useEffect(() => {
    const handleData = (payload, participant) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        if (msg.type === "raise-hand" || msg.type === "RAISE_HAND") {
          const identity = participant.identity;
          const displayName = participant.name || identity;
          setRaisedHands((prev) => ({ ...prev, [identity]: true }));
          const toastId = Date.now() + Math.random();
          setRaiseHandToasts((prev) => [...prev, { id: toastId, identity, displayName }]);
          setTimeout(() => setRaiseHandToasts((prev) => prev.filter((t) => t.id !== toastId)), 5000);
        }
        if (msg.type === "lower-hand" || msg.type === "LOWER_HAND") {
          const identity = participant.identity;
          setRaisedHands((prev) => { const u = { ...prev }; delete u[identity]; return u; });
        }
      } catch {}
    };
    room.on("dataReceived", handleData);
    return () => room.off("dataReceived", handleData);
  }, [room]);

  /* ── load chat history ── */
  useEffect(() => {
    if (!chatConfig || !session?.id) return;
    api.get(chatConfig.restGetPath).then((res) => {
      setChatMessages((res.data || []).map((m) => ({
        id: m.id, sender: m.sender_name, text: m.message,
        isTeacher: m.sender_role === "teacher",
        isMe: myUserId && String(m.sender_id) === myUserId,
        time: new Date(m.created_at),
      })));
    }).catch(() => {});
  }, [session?.id, myUserId, chatConfig?.restGetPath]);

  /* ── WebSocket chat ── */
  useEffect(() => {
    if (!chatConfig || !session?.id) return;
    let ws, reconnectTimer, unmounted = false;
    const connect = () => {
      if (unmounted) return;
      const isLocal = ["localhost","127.0.0.1"].includes(window.location.hostname);
      const wsHost = import.meta.env.VITE_WS_HOST || (isLocal ? window.location.host : "api.shikshacom.com");
      const proto  = isLocal && window.location.protocol !== "https:" ? "ws:" : "wss:";
      const token  = localStorage.getItem("access") || sessionStorage.getItem("access") || "";
      try {
        ws = new WebSocket(`${proto}//${wsHost}${chatConfig.wsPath}${token ? `?token=${token}` : ""}`);
        ws.onmessage = (ev) => {
          try {
            const { data } = JSON.parse(ev.data);
            if (!data) return;
            setChatMessages((prev) => {
              if (prev.some((m) => m.id === data.id)) return prev;
              const isMe = myUserId && String(data.sender_id) === myUserId;
              if (!isMe) soundManager.messageReceive?.();
              return [...prev, {
                id: data.id, sender: data.sender_name, text: data.message,
                isTeacher: data.sender_role === "teacher", isMe,
                time: new Date(data.created_at),
              }];
            });
          } catch {}
        };
        ws.onclose = () => { if (!unmounted) reconnectTimer = setTimeout(connect, 3000); };
        ws.onerror = () => ws.close();
      } catch {}
    };
    connect();
    return () => { unmounted = true; clearTimeout(reconnectTimer); ws?.close(); };
  }, [session?.id, myUserId, chatConfig?.wsPath]);

  /* ── send chat ── */
  const sendMessage = async (text) => {
    soundManager.messageSend?.();
    if (!chatConfig) return;
    try {
      const res = await api.post(chatConfig.restPostPath, { message: text });
      const msg = res.data;
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, {
          id: msg.id, sender: "You", text: msg.message,
          isMe: true, isTeacher: isPresenter,
          time: new Date(msg.created_at),
        }];
      });
    } catch {
      setChatMessages((prev) => [...prev, { sender: "You", text, isMe: true, time: new Date() }]);
    }
  };

  /* ── tracks ── */
  const tracks = useTracks([
    { source: Track.Source.Camera,      withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);
  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera);
  const mainTrack   = screenTrack || cameraTrack;
  const pipTrack    = screenTrack ? cameraTrack : null;

  /* ── waiting ── */
  if (!mainTrack) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <div className="waiting-pulse" />
          <h2>Enable your camera to start the session</h2>
        </div>
      </div>
    );
  }

  /* ── participants list ── */
  const remoteParticipants = room.remoteParticipants
    ? Array.from(room.remoteParticipants.values()).map((p) => ({
        identity: p.identity,
        name: p.name || p.identity,
        role: "Student",
        micOn: p.isMicrophoneEnabled,
        camOn: p.isCameraEnabled,
        handRaised: !!raisedHands[p.identity],
        isTeacher: false,
        isMe: false,
      }))
    : [];

  const localId   = room.localParticipant?.identity;
  const localName = room.localParticipant?.name || localId || "You";

  const peopleList = [
    {
      identity: localId, name: localName, role: "Teacher",
      micOn: room.localParticipant?.isMicrophoneEnabled,
      camOn: room.localParticipant?.isCameraEnabled,
      handRaised: false, isTeacher: true, isMe: true,
    },
    ...remoteParticipants,
  ];

  /* ════════════════════════════════════════════
     RENDER — identical to ClassroomUI
  ════════════════════════════════════════════ */
  return (
    <div
      className={
        "classroom-layout" +
        (isFullscreen ? " fs-mode" : "") +
        (!activePanel ? " panel-closed" : "")
      }
      ref={containerRef}
    >
      {/* TOASTS */}
      {raiseHandToasts.length > 0 && (
        <div className="rh-toasts">
          {raiseHandToasts.map((t) => (
            <div key={t.id} className="rh-toast">
              <span>✋ <strong>{t.displayName || t.identity}</strong> raised their hand</span>
            </div>
          ))}
        </div>
      )}

      {/* LEFT COLUMN */}
      <div className="classroom-main">

        {/* VIDEO STAGE */}
        <div className="main-stage">
          <VideoTrack trackRef={mainTrack} />
          {pipTrack && (
            <div className="pip-camera">
              <VideoTrack trackRef={pipTrack} />
            </div>
          )}
          <button
            className="video-fs-btn"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <MdFullscreenExit size={22} /> : <MdFullscreen size={22} />}
          </button>
        </div>

        {/* CONTROL BAR + host-only End Session */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <ControlBar
            onLeave={onLeave}
            role={role}
            activePanel={activePanel}
            onTogglePanel={togglePanel}
          />
          {isHost && onEndSession && (
            <button
              onClick={onEndSession}
              title="End the session for everyone"
              style={{
                background: "#d93025",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                padding: "10px 18px",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                whiteSpace: "nowrap",
              }}
            >
              End Session
            </button>
          )}
        </div>

        {/* Unique session code chip */}
        {(session?.shortCode || session?.id) && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              background: "rgba(15, 23, 42, 0.55)",
              color: "#e2e8f0",
              padding: "5px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontFamily: "monospace",
              letterSpacing: "0.4px",
              pointerEvents: "none",
              zIndex: 5,
            }}
          >
            Session: {session?.shortCode || String(session?.id).slice(0, 8)}
            {session?.sessionType === "instant" && (
              <span style={{ marginLeft: 8, opacity: 0.75 }}>· Instant</span>
            )}
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR — identical to ClassroomUI */}
      {activePanel && (
        <div className="right-sidebar">

          {activePanel === "chat" && (
            <ChatPanel
              role={role}
              messages={chatMessages}
              onSendMessage={sendMessage}
              participants={peopleList}
            />
          )}

          {activePanel === "people" && (
            <div className="ppl-panel">
              <div className="ppl-header">
                Participants ({peopleList.length})
              </div>
              <div className="ppl-list">
                {peopleList.length === 0 ? (
                  <p className="ppl-empty">No participants yet.</p>
                ) : (
                  peopleList.map((p, i) => (
                    <div
                      key={p.identity || i}
                      className={"ppl-card" + (p.isTeacher ? " ppl-card--teacher" : "")}
                    >
                      <div className="ppl-avatar">
                        {p.avatarUrl
                          ? <img src={p.avatarUrl} alt={p.name} />
                          : p.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="ppl-info">
                        <div className="ppl-name">{p.isMe ? "You" : p.name}</div>
                        <div className="ppl-role">{p.role}</div>
                      </div>
                      <div className="ppl-actions">
                        <div className={`ppl-mic ${p.micOn ? "ppl-mic--on" : "ppl-mic--off"}`}>
                          {p.micOn ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                              <line x1="12" y1="19" x2="12" y2="23"/>
                              <line x1="8" y1="23" x2="16" y2="23"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="1" y1="1" x2="23" y2="23"/>
                              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
                              <line x1="12" y1="19" x2="12" y2="23"/>
                              <line x1="8" y1="23" x2="16" y2="23"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activePanel === "info" && (
            <div className="side-panel">
              <div className="side-panel__header">
                <h3>Session Info</h3>
                <button className="side-panel__close" onClick={() => setActivePanel(null)}>✕</button>
              </div>
              <div className="side-panel__body">
                <div className="side-panel__field">
                  <div className="side-panel__field-label">Subject</div>
                  <div className="side-panel__field-value">{session?.subject || "—"}</div>
                </div>
                <div className="side-panel__field">
                  <div className="side-panel__field-label">Your role</div>
                  <div className="side-panel__field-value">Teacher</div>
                </div>
                <div className="side-panel__field">
                  <div className="side-panel__field-label">Participants</div>
                  <div className="side-panel__field-value">{peopleList.length}</div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
