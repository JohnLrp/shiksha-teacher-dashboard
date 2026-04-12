import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/apiClient";
import {
  BsMicFill,
  BsMicMuteFill,
  BsCameraVideoFill,
  BsCameraVideoOffFill,
} from "react-icons/bs";
import { MdScreenShare, MdStopScreenShare, MdCallEnd } from "react-icons/md";

export default function TeacherControls({ onLeave }) {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const { id: sessionId } = useParams();

  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);

  /* ── Sync real state from LiveKit ── */
  useEffect(() => {
    if (!localParticipant) return;
    setMicOn(localParticipant.isMicrophoneEnabled);
    setCameraOn(localParticipant.isCameraEnabled);
    setSharing(localParticipant.isScreenShareEnabled);
  }, [localParticipant]);

  const toggleMic = async () => {
    try {
      const next = !micOn;
      await localParticipant.setMicrophoneEnabled(next);
      setMicOn(next);
    } catch (err) { console.error("Mic error:", err); }
  };

  const toggleCamera = async () => {
    try {
      const next = !cameraOn;
      await localParticipant.setCameraEnabled(next);
      setCameraOn(next);
    } catch (err) { console.error("Camera error:", err); }
  };

  const toggleScreen = async () => {
    try {
      const next = !sharing;
      await localParticipant.setScreenShareEnabled(next);
      setSharing(next);
    } catch (err) { console.error("Screen share error:", err); }
  };

  /* ── Pause / Resume ── */
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

  /* ── Leave — calls onLeave to clear sessionStorage cache ── */
  const handleLeave = async () => {
    await room.disconnect();
    if (onLeave) onLeave();
  };

  return (
    <div className="teacher-controls">

      {/* MIC */}
      <button
        className={`control-btn${micOn ? "" : " off"}`}
        onClick={toggleMic}
        title={micOn ? "Mute mic" : "Unmute mic"}
      >
        {micOn ? <BsMicFill size={16} /> : <BsMicMuteFill size={16} />}
        {micOn ? "Mute" : "Unmuted"}
      </button>

      {/* CAMERA */}
      <button
        className={`control-btn${cameraOn ? "" : " off"}`}
        onClick={toggleCamera}
        title={cameraOn ? "Turn off camera" : "Turn on camera"}
      >
        {cameraOn
          ? <BsCameraVideoFill size={16} />
          : <BsCameraVideoOffFill size={16} />}
        {cameraOn ? "Camera" : "No Cam"}
      </button>

      {/* SCREEN SHARE */}
      <button
        className={`control-btn${sharing ? " off" : ""}`}
        onClick={toggleScreen}
        title={sharing ? "Stop sharing" : "Share screen"}
      >
        {sharing
          ? <MdStopScreenShare size={18} />
          : <MdScreenShare size={18} />}
        {sharing ? "Stop Share" : "Share"}
      </button>

      {/* PAUSE / RESUME */}
      <button
        className={`control-btn${paused ? " off" : ""}`}
        onClick={handlePauseResume}
        disabled={pauseLoading}
        title={paused ? "Resume session" : "Pause session"}
        style={{ opacity: pauseLoading ? 0.6 : 1 }}
      >
        <span style={{ fontSize: 16 }}>{paused ? "▶" : "⏸"}</span>
        {pauseLoading ? "..." : paused ? "Resume" : "Pause"}
      </button>

      {/* LEAVE */}
      <button
        className="control-btn end-call-btn"
        onClick={handleLeave}
        title="Leave session"
      >
        <MdCallEnd size={18} />
        Leave
      </button>

    </div>
  );
}
