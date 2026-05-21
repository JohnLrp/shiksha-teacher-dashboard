import { useTracks, VideoTrack, useRoomContext } from "@livekit/components-react";
import { Track } from "livekit-client";
import ChatPanel from "./ChatPanel";
import TeacherControls from "./TeacherControls";
import ControlBar from "./ControlBar";
import React, { useState, useRef, useEffect } from "react";
import "../../styles/live.css";
import useLiveSessionChat from "../../hooks/useLiveSessionChat";
import { MdFullscreen, MdFullscreenExit } from "react-icons/md";
import { HiMicrophone, HiVideoCamera } from "react-icons/hi2";
import { HiOutlineHand } from "react-icons/hi";
import { MdPersonRemove } from "react-icons/md";

export default function ClassroomUI({
  role,
  sessionId: sessionIdProp,
  onLeave,
}) {
  const isPresenter = role === "PRESENTER";

  const [raisedHands, setRaisedHands] = useState({});
  const [raiseHandToasts, setRaiseHandToasts] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [activePanel, setActivePanel] = useState(null);

  // Track which students have mic/camera allowed (teacher-side cache)
  const [allowedMics, setAllowedMics] = useState({});
  const [allowedCams, setAllowedCams] = useState({});

  const containerRef = useRef(null);
  const room = useRoomContext();

  const sessionId =
    sessionIdProp ||
    window.location.pathname.split("/").filter(Boolean).pop();

  const { messages: chatMessages, sendMessage } = useLiveSessionChat(sessionId);

  /* ───── PANEL TOGGLE ───── */
  const togglePanel = (panel) => {
    setActivePanel((current) => (current === panel ? null : panel));
  };

  /* ───── FULLSCREEN ───── */
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
    } catch (e) {
      console.error("Fullscreen failed:", e);
    }
  };

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFSChange);
    document.addEventListener("webkitfullscreenchange", onFSChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFSChange);
      document.removeEventListener("webkitfullscreenchange", onFSChange);
    };
  }, []);

  /* ───── REMOTE RAISE HAND ───── */
  useEffect(() => {
    const handleData = (payload, participant) => {
      try {
        const text = new TextDecoder().decode(payload);
        const msg = JSON.parse(text);

        if (msg.type === "raise-hand") {
          const identity = participant.identity;
          const displayName = participant.name || identity;
          setRaisedHands((prev) => ({ ...prev, [identity]: true }));

          if (isPresenter) {
            const toastId = Date.now() + Math.random();
            setRaiseHandToasts((prev) => [...prev, { id: toastId, identity, displayName }]);
            setTimeout(() => {
              setRaiseHandToasts((prev) =>
                prev.filter((t) => t.id !== toastId)
              );
            }, 5000);
          }
        }

        if (msg.type === "lower-hand") {
          const identity = participant.identity;
          setRaisedHands((prev) => {
            const updated = { ...prev };
            delete updated[identity];
            return updated;
          });
        }
      } catch {}
    };

    room.on("dataReceived", handleData);
    return () => room.off("dataReceived", handleData);
  }, [room, isPresenter]);

  /* ───── TEACHER ACTIONS: send commands to a student ───── */
  const sendToStudent = async (identity, msgObj) => {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(msgObj));
      await room.localParticipant.publishData(data, {
        reliable: true,
        destinationIdentities: [identity],
      });
    } catch (err) {
      console.error("sendToStudent error:", err);
    }
  };

  /* ── Toggle student MIC ── */
  const toggleStudentMic = async (identity, isMicOn) => {
    if (isMicOn) {
      // Currently on → force mute
      await sendToStudent(identity, { type: "force-mute" });
      setAllowedMics((prev) => ({ ...prev, [identity]: false }));
    } else {
      // Currently off → force unmute
      await sendToStudent(identity, { type: "force-unmute" });
      setAllowedMics((prev) => ({ ...prev, [identity]: true }));
    }
  };

  /* ── Toggle student CAMERA ── */
  const toggleStudentCamera = async (identity, isCamOn) => {
    if (isCamOn) {
      await sendToStudent(identity, { type: "force-camera-off" });
      setAllowedCams((prev) => ({ ...prev, [identity]: false }));
    } else {
      await sendToStudent(identity, { type: "force-camera-on" });
      setAllowedCams((prev) => ({ ...prev, [identity]: true }));
    }
  };

  /* ── Lower a student's hand ── */
  const lowerStudentHand = async (identity) => {
    await sendToStudent(identity, { type: "lower-hand" });
    setRaisedHands((prev) => {
      const updated = { ...prev };
      delete updated[identity];
      return updated;
    });
  };

  /* ── Kick a student ── */
  const kickStudent = async (identity) => {
    if (!window.confirm(`Remove ${identity} from the session?`)) return;
    try {
      // Send a "kick" message - student side should handle disconnect
      await sendToStudent(identity, { type: "kick" });

      // Also use LiveKit server API if available (you may need backend support)
      // For now we just disconnect them via data message
      console.log(`Kicked ${identity}`);
    } catch (err) {
      console.error("Kick error:", err);
    }
  };

  /* ───── TRACKS ───── */
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera);
  const mainTrack = screenTrack || cameraTrack;
  const pipTrack = screenTrack ? cameraTrack : null;

  /* ───── WAITING ───── */
  if (!mainTrack) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <div className="waiting-pulse" />
          <h2>
            {isPresenter
              ? "Enable your camera to start the session"
              : "Waiting for teacher to start..."}
          </h2>
          {!isPresenter && (
            <p>You will be connected as soon as the session begins</p>
          )}
        </div>
      </div>
    );
  }

  /* ── Build participants list with live mic/cam state ── */
  const participantsList = room.remoteParticipants
    ? Array.from(room.remoteParticipants.values()).map((p) => ({
        identity: p.identity,
        name: p.name || p.identity,
        role: "Student",
        micOn: p.isMicrophoneEnabled,
        camOn: p.isCameraEnabled,
        handRaised: !!raisedHands[p.identity],
      }))
    : [];

  /* ───── MAIN UI ───── */
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
      {isPresenter && raiseHandToasts.length > 0 && (
        <div className="rh-toasts">
          {raiseHandToasts.map((t) => (
            <div key={t.id} className="rh-toast">
              <span>✋ <strong>{t.displayName || t.identity}</strong> raised their hand</span>
              <button
                className="rh-toast-btn"
                onClick={() => lowerStudentHand(t.identity)}
              >
                Lower
              </button>
            </div>
          ))}
        </div>
      )}

      {/* LEFT COLUMN: video + control bar */}
      <div className="classroom-main">

        {/* VIDEO */}
        <div className="main-stage">
          <VideoTrack trackRef={mainTrack} />

          {pipTrack && (
            <div className="pip-camera">
              <VideoTrack trackRef={pipTrack} />
            </div>
          )}

          {isPresenter && (
            <TeacherControls sessionId={sessionId} onLeave={onLeave} />
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

        {/* CONTROL BAR */}
        <ControlBar
          onLeave={onLeave}
          role={role}
          activePanel={activePanel}
          onTogglePanel={togglePanel}
        />
      </div>

      {activePanel && (
        <div className="right-sidebar">

          {activePanel === "chat" && (
            <ChatPanel
              role={role}
              messages={chatMessages}
              onSendMessage={sendMessage}
              participants={participantsList}
            />
          )}

          {activePanel === "people" && (
            <div className="side-panel">
              <div className="side-panel__header">
                <h3>People ({participantsList.length})</h3>
                <button
                  className="side-panel__close"
                  onClick={() => setActivePanel(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="side-panel__body">
                {participantsList.length === 0 ? (
                  <p className="side-panel__empty">No participants yet.</p>
                ) : (
                  participantsList.map((p, i) => (
                    <div
                      className={`side-panel__row ${p.handRaised ? "side-panel__row--raised" : ""}`}
                      key={p.identity || i}
                    >
                      <div className="side-panel__avatar">
                        {p.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="side-panel__info">
                        <div className="side-panel__name">
                          {p.name}
                          {p.handRaised && <span className="raised-hand-icon"> ✋</span>}
                        </div>
                        <div className="side-panel__role">{p.role}</div>
                      </div>

                      {/* TEACHER-ONLY ACTIONS */}
                      {isPresenter && (
                        <div className="side-panel__actions">
                          {p.handRaised && (
                            <button
                              className="sp-action sp-action--warn"
                              title="Lower hand"
                              onClick={() => lowerStudentHand(p.identity)}
                            >
                              <HiOutlineHand size={14} />
                            </button>
                          )}
                          <button
                            className={`sp-action ${p.micOn ? "sp-action--on" : "sp-action--off"}`}
                            title={p.micOn ? "Mute student" : "Unmute student"}
                            onClick={() => toggleStudentMic(p.identity, p.micOn)}
                          >
                            <HiMicrophone size={14} />
                          </button>
                          <button
                            className={`sp-action ${p.camOn ? "sp-action--on" : "sp-action--off"}`}
                            title={p.camOn ? "Turn off camera" : "Turn on camera"}
                            onClick={() => toggleStudentCamera(p.identity, p.camOn)}
                          >
                            <HiVideoCamera size={14} />
                          </button>
                          <button
                            className="sp-action sp-action--kick"
                            title="Remove student"
                            onClick={() => kickStudent(p.identity)}
                          >
                            <MdPersonRemove size={14} />
                          </button>
                        </div>
                      )}
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
                <button
                  className="side-panel__close"
                  onClick={() => setActivePanel(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="side-panel__body">
                <div className="side-panel__field">
                  <div className="side-panel__field-label">Session ID</div>
                  <div className="side-panel__field-value">{sessionId}</div>
                </div>
                <div className="side-panel__field">
                  <div className="side-panel__field-label">Your role</div>
                  <div className="side-panel__field-value">
                    {isPresenter ? "Teacher" : "Student"}
                  </div>
                </div>
                <div className="side-panel__field">
                  <div className="side-panel__field-label">Participants</div>
                  <div className="side-panel__field-value">
                    {participantsList.length + 1}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
