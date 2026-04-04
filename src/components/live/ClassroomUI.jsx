import { useTracks, VideoTrack, useRoomContext } from "@livekit/components-react";
import { Track } from "livekit-client";
import ParticipantsPanel from "./ParticipantsPanel";
import ChatPanel from "./ChatPanel";
import TeacherControls from "./TeacherControls";
import { useState, useRef, useEffect } from "react";
import "../../styles/live.css";
import { MdFullscreen, MdFullscreenExit } from "react-icons/md";
import { IoChatbubblesOutline } from "react-icons/io5";

export default function ClassroomUI({ role }) {
  const isPresenter = role === "PRESENTER"; // 🔥 FIX

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [raiseHandToasts, setRaiseHandToasts] = useState([]);
  const [raisedHands, setRaisedHands] = useState({});
  const containerRef = useRef(null);
  const room = useRoomContext();

  /* =====================================
     🔥 RAISE HAND LISTENER (PRESENTER ONLY)
  ===================================== */
  useEffect(() => {
    if (!isPresenter) return;

    const handleData = (payload, participant) => {
      try {
        const text = new TextDecoder().decode(payload);
        const msg = JSON.parse(text);
        if (msg.type !== "raise-hand") return;

        const identity = participant.identity;
        const toastId = Date.now() + Math.random();

        setRaiseHandToasts((prev) => [...prev, { id: toastId, identity }]);

        setTimeout(
          () => setRaiseHandToasts((prev) => prev.filter((t) => t.id !== toastId)),
          5000
        );

        setRaisedHands((prev) => ({ ...prev, [identity]: true }));

        setTimeout(() => {
          setRaisedHands((prev) => {
            const updated = { ...prev };
            delete updated[identity];
            return updated;
          });
        }, 15000);
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

        {/* PiP */}
        {pipTrack && (
          <div className="pip-camera">
            <VideoTrack trackRef={pipTrack} />
          </div>
        )}

        {/* 🔥 FIX: SHOW CONTROLS ONLY FOR PRESENTER */}
        {isPresenter && <TeacherControls />}

        {/* Overlay buttons */}
        <div className="video-overlay-actions">
          <button
            className="ov-btn"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <IoChatbubblesOutline size={17} />
          </button>

          <button className="ov-btn" onClick={toggleFullscreen}>
            {isFullscreen ? <MdFullscreenExit size={19} /> : <MdFullscreen size={19} />}
          </button>
        </div>
      </div>

      {/* SIDEBAR */}
      {sidebarOpen && (
        <div className="right-sidebar">
          <ParticipantsPanel raisedHands={raisedHands} />
          <ChatPanel role={role} />
        </div>
      )}
    </div>
  );
}