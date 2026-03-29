import { useParticipants, useRoomContext } from "@livekit/components-react";
import { useEffect, useState } from "react";
import { IoPeople } from "react-icons/io5";

export default function ParticipantsPanel() {
  const participants = useParticipants();
  const room = useRoomContext();

  const [open, setOpen] = useState(true);
  const [raisedHands, setRaisedHands] = useState({});

  useEffect(() => {
    const handleData = (payload, participant) => {
      try {
        const text = new TextDecoder().decode(payload);
        const msg = JSON.parse(text);

        if (msg.type === "raise-hand") {
          setRaisedHands((prev) => ({
            ...prev,
            [participant.identity]: true,
          }));

          setTimeout(() => {
            setRaisedHands((prev) => {
              const updated = { ...prev };
              delete updated[participant.identity];
              return updated;
            });
          }, 15000);
        }
      } catch {}
    };

    room.on("dataReceived", handleData);
    return () => room.off("dataReceived", handleData);
  }, [room]);

  // teacher first
  const sortedParticipants = [...participants].sort((a, b) => {
    const aIsTeacher = a.permissions?.canPublish ? 1 : 0;
    const bIsTeacher = b.permissions?.canPublish ? 1 : 0;
    return bIsTeacher - aIsTeacher;
  });

  return (
    <div className="participants-wrapper">

      {/* HEADER */}
      <div
        className="participants-header"
        onClick={() => setOpen(!open)}
      >
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
            const isTeacher = p.permissions?.canPublish;
            const handRaised = raisedHands[p.identity];

            return (
              <div
                key={p.identity}
                className={`participant-card${handRaised ? " hand-raised" : ""}`}
              >
                <div className="participant-avatar">
                  {p.identity.charAt(0).toUpperCase()}
                </div>

                <div className="participant-name">
                  {p.identity}
                  {isTeacher && (
                    <span style={{ fontSize: 10, fontWeight: 600, marginLeft: 6, color: "var(--brand)", opacity: 0.8 }}>
                      TEACHER
                    </span>
                  )}
                  {handRaised && (
                    <span className="raised-hand-icon">✋</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
