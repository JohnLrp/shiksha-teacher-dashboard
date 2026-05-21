import {
  useRoomContext,
  useLocalParticipant,
} from "@livekit/components-react";
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/apiClient";

export default function ControlBar({ onLeave, role, activePanel, onTogglePanel }) {
  const isPresenter = role === "PRESENTER";
  const isStudent = !isPresenter;

  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const { id: sessionId } = useParams();

  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [canUnmute, setCanUnmute] = useState(false);
  const [canVideo, setCanVideo] = useState(false);

  const [paused, setPaused] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);

  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  /* ── student joins with mic + camera off ── */
  useEffect(() => {
    if (!isStudent || !localParticipant) return;
    localParticipant.setMicrophoneEnabled(false);
    localParticipant.setCameraEnabled(false);
    setMicOn(false);
    setVideoOn(false);
  }, [isStudent, localParticipant]);

  /* ── teacher: sync real state from LiveKit ── */
  useEffect(() => {
    if (!isPresenter || !localParticipant) return;
    setMicOn(localParticipant.isMicrophoneEnabled);
    setVideoOn(localParticipant.isCameraEnabled);
    setScreenOn(localParticipant.isScreenShareEnabled);
  }, [isPresenter, localParticipant]);

  /* ── timer ── */
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  /* ── mic ── */
  const toggleMic = async () => {
    if (isStudent && !canUnmute && !micOn) return;
    const next = !micOn;
    await localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
  };

  /* ── video ── */
  const toggleVideo = async () => {
    if (isStudent && !canVideo && !videoOn) return;
    const next = !videoOn;
    await localParticipant.setCameraEnabled(next);
    setVideoOn(next);
  };

  /* ── screen share ── */
  const toggleScreen = async () => {
    const next = !screenOn;
    try {
      await localParticipant.setScreenShareEnabled(next);
      setScreenOn(next);
    } catch (e) {
      console.error("screen share failed", e);
    }
  };

  /* ── pause / resume (teacher only) ── */
  const handlePauseResume = async () => {
    if (!sessionId) return;
    setPauseLoading(true);
    try {
      const res = await api.post(`/livestream/sessions/${sessionId}/pause/`);
      setPaused(res.data.status === "PAUSED");
    } catch (err) {
      console.error("Pause error:", err);
      alert(err?.response?.data?.detail || "Failed to pause session.");
    } finally {
      setPauseLoading(false);
    }
  };

  /* ── teacher commands (student listens) ── */
  useEffect(() => {
    if (!isStudent) return;

    const handleData = (payload) => {
      try {
        const text = new TextDecoder().decode(payload);
        const msg = JSON.parse(text);

        if (msg.type === "force-mute") {
          localParticipant.setMicrophoneEnabled(false);
          setMicOn(false);
          setCanUnmute(false);
        }
        if (msg.type === "force-unmute" || msg.type === "allow-mic") {
          setCanUnmute(true);
          if (msg.type === "force-unmute") {
            localParticipant.setMicrophoneEnabled(true);
            setMicOn(true);
          }
        }
        if (msg.type === "revoke-mic") {
          setCanUnmute(false);
          localParticipant.setMicrophoneEnabled(false);
          setMicOn(false);
        }
        if (msg.type === "force-camera-off") {
          localParticipant.setCameraEnabled(false);
          setVideoOn(false);
          setCanVideo(false);
        }
        if (msg.type === "force-camera-on" || msg.type === "allow-camera") {
          setCanVideo(true);
          if (msg.type === "force-camera-on") {
            localParticipant.setCameraEnabled(true);
            setVideoOn(true);
          }
        }
        if (msg.type === "revoke-camera") {
          setCanVideo(false);
          localParticipant.setCameraEnabled(false);
          setVideoOn(false);
        }
        if (msg.type === "kick") {
          // Teacher kicked us
          alert("You have been removed from the session by the teacher.");
          room.disconnect();
          if (onLeave) onLeave();
        }
      } catch {}
    };
    room.on("dataReceived", handleData);
    return () => room.off("dataReceived", handleData);
  }, [room, localParticipant, isStudent, onLeave]);

  const leaveRoom = async () => {
    await room.disconnect();
    if (onLeave) onLeave();
  };

  return (
    <div className="control-bar">

      {/* LEFT — TIMER */}
      <div className="cb-timer">{formatTime(elapsed)}</div>

      {/* CENTER — MAIN ACTIONS */}
      <div className="cb-center">

        {/* Mute */}
        <button
          className="cb-btn"
          onClick={toggleMic}
          title={micOn ? "Mute" : "Unmute"}
        >
          <div className="cb-icon">
            {micOn ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </div>
          <span className="cb-label">{micOn ? "Mute" : "Unmute"}</span>
        </button>

        {/* Video */}
        <button
          className="cb-btn"
          onClick={toggleVideo}
          title={videoOn ? "Turn off camera" : "Turn on camera"}
        >
          <div className="cb-icon">
            {videoOn ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            )}
          </div>
          <span className="cb-label">Video</span>
        </button>

        {/* Screen Share */}
        <button className="cb-btn" onClick={toggleScreen} title="Share screen">
          <div className={`cb-icon ${screenOn ? "cb-icon--active" : ""}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <polyline points="8 21 12 17 16 21"/>
              <line x1="12" y1="17" x2="12" y2="11"/>
              <polyline points="9 14 12 11 15 14"/>
            </svg>
          </div>
          <span className="cb-label">Screen</span>
        </button>

        {/* Pause/Resume — teacher only — replaces "Other" */}
        {isPresenter ? (
          <button
            className="cb-btn"
            onClick={handlePauseResume}
            disabled={pauseLoading}
            title={paused ? "Resume session" : "Pause session"}
          >
            <div className={`cb-icon ${paused ? "cb-icon--active" : ""}`}>
              {paused ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6 4 20 12 6 20 6 4"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
              )}
            </div>
            <span className="cb-label">
              {pauseLoading ? "..." : paused ? "Resume" : "Pause"}
            </span>
          </button>
        ) : (
          <button className="cb-btn" title="More options">
            <div className="cb-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
            </div>
            <span className="cb-label">Other</span>
          </button>
        )}

        {/* Leave */}
        <button className="cb-btn" onClick={leaveRoom} title="Leave class">
          <div className="cb-icon cb-icon--leave">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" transform="rotate(135 12 12)"/>
            </svg>
          </div>
          <span className="cb-label">Leave</span>
        </button>

      </div>

      {/* RIGHT — Info / People / Chat */}
      <div className="cb-right">
        <button
          className={`cb-side-btn ${activePanel === "info" ? "cb-side-btn--active" : ""}`}
          onClick={() => onTogglePanel("info")}
          title="Session info"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>Info</span>
        </button>

        <button
          className={`cb-side-btn ${activePanel === "people" ? "cb-side-btn--active" : ""}`}
          onClick={() => onTogglePanel("people")}
          title="Participants"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>People</span>
        </button>

        <button
          className={`cb-side-btn ${activePanel === "chat" ? "cb-side-btn--active" : ""}`}
          onClick={() => onTogglePanel("chat")}
          title="Chat"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Chat</span>
        </button>
      </div>

    </div>
  );
}
