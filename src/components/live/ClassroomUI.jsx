import { useTracks, VideoTrack, useRoomContext } from "@livekit/components-react";
import { Track } from "livekit-client";
import ParticipantsPanel from "./ParticipantsPanel";
import ChatPanel from "./ChatPanel";
import TeacherControls from "./TeacherControls";
import { useState, useRef, useEffect } from "react";
import "../../styles/live.css";
import useLiveSessionChat from "../../hooks/useLiveSessionChat";
import { MdFullscreen, MdFullscreenExit } from "react-icons/md";
import { IoChatbubblesOutline } from "react-icons/io5";

export default function ClassroomUI({ role, sessionId: sessionIdProp, onLeave }) {
  const isPresenter = role === "PRESENTER";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [raiseHandToasts, setRaiseHandToasts] = useState([]);
  const [raisedHands, setRaisedHands] = useState({});
  const containerRef = useRef(null);
  const room = useRoomContext();

  const sessionId = sessionIdProp || window.location.pathname.split("/").filter(Boolean).pop();
  const { messages: chatMessages, sendMessage } = useLiveSessionChat(sessionId);

  /* =====================================
     🔥 RAISE / LOWER HAND LISTENER
  ===================================== */
  useEffect(() => {
    if (!isPresenter) return;

    const handleData = (payload, participant) => {
      try {
        const text = new TextDecoder().decode(payload);
        const msg = JSON.parse(text);

        const identity = participant.identity;

        // ✅ FIX: lowercase to match RaiseHandButton
        if (msg.type === "raise-hand") {
          setRaisedHands((prev) => ({ ...prev, [identity]: true }));

          const toastId = Date.now() + Math.random();
          setRaiseHandToasts((prev) => [...prev, { id: toastId, identity }]);
          setTimeout(
            () =>
              setRaiseHandToasts((prev) =>
                prev.filter((t) => t.id !== toastId)
              ),
            5000
          );
        }

        // ✅ FIX: clear hand when student lowers it — no auto-timeout
        if (msg.type === "lower-hand") {
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

  /* =====================================
     🔥 FULLSCREEN
  ===================================== */
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, []);

  /* =====================================
     🔥 LOWER HAND (teacher forces lower)
  ===================================== */
  const handleLowerHand = async (identity) => {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify({ type: "lower-hand" }));
      await room.localParticipant.publishData(data, {
        reliable: true,
        destinationIdentities: [identity],
      });
      setRaisedHands((prev) => {
        const updated = { ...prev };
        delete updated[identity];
        return updated;
      });
    } catch (err) {
      console.error("Lower hand error:", err);
    }
  };

  /* =====================================
     🔥 TRACKS
  ===================================== */
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera);

  const mainTrack = screenTrack || cameraTrack;
  const pipTrack = screenTrack ? cameraTrack : null;

  /* =====================================
     🔥 WAIT SCREEN
  ===================================== */
  if (!mainTrack) {
    return (
      <div className="waiting-screen">
        <h2>
          {isPresenter
            ? "Enable your camera to start the session"
            : "Waiting for presenter to start video…"}
        </h2>
      </div>
    );
  }

  /* =====================================
     🔥 UI
  ===================================== */
  return (
    <div
      className={`classroom-layout${isFullscreen ? " fs-mode" : ""}`}
      ref={containerRef}
    >
      {/* Raise-hand toasts */}
      {raiseHandToasts.length > 0 && (
        <div className="rh-toasts">
          {raiseHandToasts.map((t) => (
            <div key={t.id} className="rh-toast">
              ✋ <strong>{t.identity}</strong> raised their hand
            </div>
          ))}
        </div>
      )}

      {/* MAIN STAGE */}
      <div className={`main-stage${!sidebarOpen ? " full-width" : ""}`}>
        <VideoTrack trackRef={mainTrack} />

        {pipTrack && (
          <div className="pip-camera">
            <VideoTrack trackRef={pipTrack} />
          </div>
        )}

        {isPresenter && <TeacherControls onLeave={onLeave} />}

        <div className="video-overlay-actions">
          <button
            className="ov-btn"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <IoChatbubblesOutline size={17} />
          </button>

          <button className="ov-btn" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <MdFullscreenExit size={19} />
            ) : (
              <MdFullscreen size={19} />
            )}
          </button>
        </div>
      </div>

      {/* SIDEBAR */}
      {sidebarOpen && (
        <div className="right-sidebar">
          <ParticipantsPanel raisedHands={raisedHands} onLowerHand={handleLowerHand} />
          <ChatPanel role={role} messages={chatMessages} onSendMessage={sendMessage} />
        </div>
      )}
    </div>
  );
}
