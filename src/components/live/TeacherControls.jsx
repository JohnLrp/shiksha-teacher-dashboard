import { useLocalParticipant, useRoomContext } from "@livekit/components-react";

export default function TeacherControls() {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  const toggleMic = async () => {
    await localParticipant.setMicrophoneEnabled(
      !localParticipant.isMicrophoneEnabled
    );
  };

  const toggleCamera = async () => {
    await localParticipant.setCameraEnabled(
      !localParticipant.isCameraEnabled
    );
  };

  const shareScreen = async () => {
    await localParticipant.setScreenShareEnabled(true);
  };

  return (
    <div className="control-bar">
      <button onClick={toggleMic}>Mic</button>
      <button onClick={toggleCamera}>Camera</button>
      <button onClick={shareScreen}>Share Screen</button>
      <button onClick={() => room.disconnect()}>Leave</button>
    </div>
  );
}