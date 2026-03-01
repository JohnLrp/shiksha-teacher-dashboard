import { useTracks, VideoTrack } from "@livekit/components-react";
import { Track } from "livekit-client";
import ParticipantsPanel from "./ParticipantsPanel";
import ChatPanel from "./ChatPanel";
import { useState } from "react";

export default function ClassroomUI({ role }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  // 🔐 PRODUCTION SAFE: Detect teacher by publish permission
  const teacherTrack = tracks.find(
    (t) => t.participant.permissions?.canPublish
  );

  if (!teacherTrack) {
    return (
      <div className="waiting-screen">
        <h2>Waiting for teacher to start video or share screen…</h2>
      </div>
    );
  }

  return (
    <div className="classroom-layout">
      <div className={`main-stage ${sidebarOpen ? "" : "full-width"}`}>
        <button
          className="toggle-sidebar-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? "Hide Chat" : "Show Chat"}
        </button>

        <VideoTrack trackRef={teacherTrack} />
      </div>

      {sidebarOpen && (
        <div className="right-sidebar">
          <ParticipantsPanel />
          <ChatPanel role={role} />
        </div>
      )}
    </div>
  );
}