import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { useState } from "react";
import {
  BsMicFill,
  BsMicMuteFill,
  BsCameraVideoFill,
  BsCameraVideoOffFill,
} from "react-icons/bs";
import { MdScreenShare, MdStopScreenShare, MdCallEnd } from "react-icons/md";

export default function TeacherControls() {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [sharing, setSharing] = useState(false);

  const toggleMic = async () => {
    const next = !micOn;
    await localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
  };

  const toggleCamera = async () => {
    const next = !cameraOn;
    await localParticipant.setCameraEnabled(next);
    setCameraOn(next);
  };

  const toggleScreen = async () => {
    const next = !sharing;
    await localParticipant.setScreenShareEnabled(next);
    setSharing(next);
  };

  return (
    <div className="teacher-controls">
      <button
        className={`control-btn${micOn ? "" : " off"}`}
        onClick={toggleMic}
        title={micOn ? "Mute mic" : "Unmute mic"}
      >
        {micOn ? <BsMicFill size={16} /> : <BsMicMuteFill size={16} />}
        {micOn ? "Mute" : "Unmuted"}
      </button>

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

      <button
        className="control-btn end-call-btn"
        onClick={() => room.disconnect()}
        title="End session"
      >
        <MdCallEnd size={18} />
        End
      </button>
    </div>
  );
}
