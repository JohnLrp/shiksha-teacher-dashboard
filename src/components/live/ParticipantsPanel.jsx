import { useParticipants, useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { useState, useEffect, useCallback } from "react";
import { IoPeople } from "react-icons/io5";
import { BsMicFill, BsMicMuteFill } from "react-icons/bs";

export default function ParticipantsPanel({ raisedHands = {}, onLowerHand }) {
  const participants = useParticipants();
  const room = useRoomContext();
  const [open, setOpen] = useState(true);
  const [mutedMap, setMutedMap] = useState({});

  /* =====================================
     🔥 TRACK MUTE STATUS
  ===================================== */
  const updateMuteStatus = useCallback(() => {
    const map = {};

    for (const p of participants) {
      let isMuted = true;

      for (const pub of p.audioTrackPublications?.values?.() || []) {
        if (pub.source === "microphone") {
          isMuted = pub.isMuted || !pub.isSubscribed;
        }
      }

      map[p.identity] = isMuted;
    }

    setMutedMap(map);
  }, [participants]);

  useEffect(() => {
    updateMuteStatus();

    room.on(RoomEvent.TrackMuted, updateMuteStatus);
    room.on(RoomEvent.TrackUnmuted, updateMuteStatus);
    room.on(RoomEvent.TrackPublished, updateMuteStatus);
    room.on(RoomEvent.TrackUnpublished, updateMuteStatus);

    return () => {
      room.off(RoomEvent.TrackMuted, updateMuteStatus);
      room.off(RoomEvent.TrackUnmuted, updateMuteStatus);
      room.off(RoomEvent.TrackPublished, updateMuteStatus);
      room.off(RoomEvent.TrackUnpublished, updateMuteStatus);
    };
  }, [room, updateMuteStatus]);

  /* =====================================
     🔥 FORCE MUTE
  ===================================== */
  const handleMuteStudent = async (participant) => {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify({ type: "force-mute" }));

      await room.localParticipant.publishData(data, {
        reliable: true,
        destinationIdentities: [participant.identity],
      });
    } catch (err) {
      console.error("Failed to mute participant:", err);
    }
  };

  /* =====================================
     🔥 SORT USING METADATA ONLY (FIXED)
  ===================================== */
  const sortedParticipants = [...participants].sort((a, b) => {
    const metaA = a.metadata ? JSON.parse(a.metadata) : null;
    const metaB = b.metadata ? JSON.parse(b.metadata) : null;

    const aPresenter = metaA?.role === "presenter" ? 1 : 0;
    const bPresenter = metaB?.role === "presenter" ? 1 : 0;

    return bPresenter - aPresenter;
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

            // 🔥 ROLE FIX
            const isPresenter = meta?.role === "presenter";
            const isTeacher = meta?.user_type === "teacher";

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

                  {/* 🔥 LABELS */}
                  {isPresenter && (
                    <span style={{
                      fontSize: 10,
                      marginLeft: 6,
                      color: "var(--brand)"
                    }}>
                      • PRESENTER
                    </span>
                  )}

                  {isTeacher && !isPresenter && (
                    <span style={{
                      fontSize: 10,
                      marginLeft: 6,
                      color: "#555"
                    }}>
                      • TEACHER
                    </span>
                  )}

                  {!isTeacher && !isPresenter && (
                    <span style={{
                      fontSize: 10,
                      marginLeft: 6,
                      color: "#888"
                    }}>
                      • STUDENT
                    </span>
                  )}

                  {handRaised && (
                    <span
                      className="raised-hand-icon"
                      title="Click to lower hand"
                      style={{ cursor: "pointer" }}
                      onClick={() => onLowerHand && onLowerHand(p.identity)}
                    >✋</span>
                  )}
                </div>

                {/* 🔥 ONLY VIEWERS CAN BE MUTED */}
                {!isPresenter && (
                  <button
                    className="participant-mute-btn"
                    onClick={() => handleMuteStudent(p)}
                  >
                    {mutedMap[p.identity] ? (
                      <BsMicMuteFill size={13} color="#b91c1c" />
                    ) : (
                      <BsMicFill size={13} color="#15803d" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}