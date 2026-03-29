import { useTracks, VideoTrack } from "@livekit/components-react";
import { Track } from "livekit-client";
import ParticipantsPanel from "./ParticipantsPanel";
import ChatPanel from "./ChatPanel";
import TeacherControls from "./TeacherControls";
import { useState } from "react";
import "../../styles/live.css";

export default function ClassroomUI({ role }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  const teacherTrack = tracks.find(
    (t) => t.participant.permissions?.canPublish
  );

  if (!teacherTrack) {
    return (
      <div className="waiting-screen">
        <h2>
          {role === "teacher"
            ? "Enable your camera to start the session"
            : "Waiting for teacher to start video…"}
        </h2>
      </div>
    );
  }

  return (
    <div className="classroom-layout">

      {/* MAIN VIDEO STAGE */}
      <div className={`main-stage${!sidebarOpen ? " full-width" : ""}`}>

        <VideoTrack trackRef={teacherTrack} />

        {role === "teacher" && <TeacherControls />}

        <button
          className="toggle-sidebar-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? "Hide Panel" : "Show Panel"}
        </button>
      </div>

      {/* RIGHT SIDEBAR */}
      {sidebarOpen && (
        <div className="right-sidebar">
          <ParticipantsPanel />
          <ChatPanel role={role} />
        </div>
      )}
    </div>
  );
}
