import { useParticipants, useRoomContext } from "@livekit/components-react";
import { useEffect, useState } from "react";

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

  return (
    <div className="participants-wrapper">
      <div className="participants-header" onClick={() => setOpen(!open)}>
        <span>Participants</span>
        <span>{open ? "▾" : "▸"}</span>
      </div>

      {open && (
        <div className="participants-row">
          {participants.map((p) => (
            <div key={p.identity} className="participant-card">
              <div className="participant-avatar">
                {p.identity.charAt(0).toUpperCase()}
              </div>
              <div className="participant-name">
                {p.identity}
                {raisedHands[p.identity] && " ✋"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}