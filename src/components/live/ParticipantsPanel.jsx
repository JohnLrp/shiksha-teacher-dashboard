import { useParticipants } from "@livekit/components-react";
import { useState } from "react";
import { IoPeople } from "react-icons/io5";

export default function ParticipantsPanel({ raisedHands = {} }) {
  const participants = useParticipants();
  const [open, setOpen] = useState(true);

  const sortedParticipants = [...participants].sort((a, b) => {
    const aT = a.permissions?.canPublish ? 1 : 0;
    const bT = b.permissions?.canPublish ? 1 : 0;
    return bT - aT;
  });

  return (
    <div className="participants-wrapper">

      {/* HEADER */}
      <div className="participants-header" onClick={() => setOpen((o) => !o)}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <IoPeople size={16} />
          Participants ({participants.length})
        </span>
        <span style={{ fontSize: 12 }}>{open ? "▾" : "▸"}</span>
      </div>

      {/* LIST */}
      {open && (
        <div className="participants-row">
          {sortedParticipants.map((p) => {
            const meta = p.metadata ? JSON.parse(p.metadata) : null;
            const isTeacher = meta?.role === "teacher" || p.permissions?.canPublish;

            const handRaised = raisedHands[p.identity];
            const displayName = p.name || p.identity;

            return (
              <div
                key={p.identity}
                className={`participant-card${handRaised ? " hand-raised" : ""}`}
              >
                <div className="participant-avatar">
                  {displayName.charAt(0).toUpperCase()}
                </div>

                <div className="participant-name">
                  {displayName}
                  {isTeacher && (
                    <span style={{ fontSize: 10, fontWeight: 600, marginLeft: 6, color: "var(--brand)", opacity: 0.8 }}>
                      TEACHER
                    </span>
                  )}
                  {handRaised && <span className="raised-hand-icon">✋</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
