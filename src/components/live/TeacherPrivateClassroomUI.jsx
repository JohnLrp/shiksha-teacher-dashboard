import {
  useTracks,
  VideoTrack,
  useRoomContext,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import ChatPanel from "./ChatPanel";
import TeacherControls from "./TeacherControls";
import ControlBar from "./ControlBar";
import React, { useState, useRef, useEffect } from "react";
import "../../styles/privateClassroom.css";
import useLiveSessionChat from "../../hooks/useLiveSessionChat";
import { MdFullscreen, MdFullscreenExit } from "react-icons/md";
import { HiDotsVertical } from "react-icons/hi";

export default function TeacherPrivateSessionUI({
  role = "PRESENTER",
  sessionId: sessionIdProp,
  onLeave,
}) {
  const isPresenter = true;

  const [raisedHands, setRaisedHands] = useState({});
  const [raiseHandToasts, setRaiseHandToasts] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [activePanel, setActivePanel] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const menuRef = useRef(null);

  const [, setTick] = useState(0);
  const bump = () => setTick((t) => t + 1);

  const containerRef = useRef(null);
  const room = useRoomContext();

  const sessionId =
    sessionIdProp ||
    window.location.pathname.split("/").filter(Boolean).pop();

  const { messages: chatMessages, sendMessage } =
    useLiveSessionChat(sessionId);

  /* ───────────────────────────────────────────── */
  /* PANEL TOGGLE */
  /* ───────────────────────────────────────────── */

  const togglePanel = (panel) => {
    setActivePanel((current) =>
      current === panel ? null : panel
    );
    setOpenMenuId(null);
  };

  /* ───────────────────────────────────────────── */
  /* OUTSIDE CLICK */
  /* ───────────────────────────────────────────── */

  useEffect(() => {
    const onClick = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener("mousedown", onClick);
    }

    return () =>
      document.removeEventListener("mousedown", onClick);
  }, [openMenuId]);

  /* ───────────────────────────────────────────── */
  /* FULLSCREEN */
  /* ───────────────────────────────────────────── */

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const el = containerRef.current;

        if (el?.requestFullscreen)
          await el.requestFullscreen();
      } else {
        if (document.exitFullscreen)
          await document.exitFullscreen();
      }
    } catch (e) {
      console.error("Fullscreen failed:", e);
    }
  };

  useEffect(() => {
    const onFSChange = () =>
      setIsFullscreen(!!document.fullscreenElement);

    document.addEventListener(
      "fullscreenchange",
      onFSChange
    );

    return () =>
      document.removeEventListener(
        "fullscreenchange",
        onFSChange
      );
  }, []);

  /* ───────────────────────────────────────────── */
  /* FORCE RE-RENDER ON TRACK CHANGES */
  /* ───────────────────────────────────────────── */

  useEffect(() => {
    if (!room) return;

    const events = [
      "trackMuted",
      "trackUnmuted",
      "trackPublished",
      "trackUnpublished",
      "trackSubscribed",
      "trackUnsubscribed",
      "participantConnected",
      "participantDisconnected",
      "localTrackPublished",
      "localTrackUnpublished",
    ];

    events.forEach((evt) => room.on(evt, bump));

    return () => {
      events.forEach((evt) => room.off(evt, bump));
    };
  }, [room]);

  /* ───────────────────────────────────────────── */
  /* RAISE HAND */
  /* ───────────────────────────────────────────── */

  useEffect(() => {
    const handleData = (payload, participant) => {
      try {
        const text = new TextDecoder().decode(payload);
        const msg = JSON.parse(text);

        if (msg.type === "raise-hand") {
          const identity = participant.identity;
          const displayName =
            participant.name || identity;

          setRaisedHands((prev) => ({
            ...prev,
            [identity]: true,
          }));

          const toastId = Date.now() + Math.random();

          setRaiseHandToasts((prev) => [
            ...prev,
            {
              id: toastId,
              identity,
              displayName,
            },
          ]);

          setTimeout(() => {
            setRaiseHandToasts((prev) =>
              prev.filter((t) => t.id !== toastId)
            );
          }, 5000);
        }

        if (msg.type === "lower-hand") {
          const identity = participant.identity;

          setRaisedHands((prev) => {
            const updated = { ...prev };
            delete updated[identity];
            return updated;
          });
        }
      } catch {}
    };

    room.on("dataReceived", handleData);

    return () =>
      room.off("dataReceived", handleData);
  }, [room]);

  /* ───────────────────────────────────────────── */
  /* SEND TO STUDENT */
  /* ───────────────────────────────────────────── */

  const sendToStudent = async (
    identity,
    msgObj
  ) => {
    try {
      const encoder = new TextEncoder();

      const data = encoder.encode(
        JSON.stringify(msgObj)
      );

      await room.localParticipant.publishData(
        data,
        {
          reliable: true,
          destinationIdentities: [identity],
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  /* ───────────────────────────────────────────── */
  /* TEACHER ACTIONS */
  /* ───────────────────────────────────────────── */

  const lowerStudentHand = async (identity) => {
    await sendToStudent(identity, {
      type: "lower-hand",
    });

    setRaisedHands((prev) => {
      const updated = { ...prev };
      delete updated[identity];
      return updated;
    });

    setOpenMenuId(null);
  };

  const toggleStudentMic = async (
    identity,
    isMicOn
  ) => {
    if (isMicOn) {
      await sendToStudent(identity, {
        type: "force-mute",
      });
    } else {
      await sendToStudent(identity, {
        type: "force-unmute",
      });
    }

    setOpenMenuId(null);
  };

  const kickStudent = async (
    identity,
    name
  ) => {
    if (
      !window.confirm(
        `Remove ${name || identity} from session?`
      )
    )
      return;

    await sendToStudent(identity, {
      type: "kick",
    });

    setOpenMenuId(null);
  };

  const muteAllStudents = async () => {
    const participants = Array.from(
      room.remoteParticipants.values()
    );

    for (const p of participants) {
      await sendToStudent(p.identity, {
        type: "force-mute",
      });
    }
  };

  const endSessionForAll = async () => {
    if (
      !window.confirm(
        "End session for everyone?"
      )
    )
      return;

    const participants = Array.from(
      room.remoteParticipants.values()
    );

    for (const p of participants) {
      await sendToStudent(p.identity, {
        type: "kick",
      });
    }

    onLeave?.();
  };

  /* ───────────────────────────────────────────── */
  /* TRACKS */
  /* ───────────────────────────────────────────── */

  const tracks = useTracks([
    {
      source: Track.Source.Camera,
      withPlaceholder: false,
    },
    {
      source: Track.Source.ScreenShare,
      withPlaceholder: false,
    },
  ]);

  const screenTrack = tracks.find(
    (t) => t.source === Track.Source.ScreenShare
  );

  const cameraTrack = tracks.find(
    (t) => t.source === Track.Source.Camera
  );

  const mainTrack = screenTrack || cameraTrack;

  const pipTrack = screenTrack
    ? cameraTrack
    : null;

  /* ───────────────────────────────────────────── */
  /* WAITING */
  /* ───────────────────────────────────────────── */

  if (!mainTrack) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <div className="waiting-pulse" />

          <h2>
            Enable your camera to start
          </h2>
        </div>
      </div>
    );
  }

  /* ───────────────────────────────────────────── */
  /* PARTICIPANTS */
  /* ───────────────────────────────────────────── */

  const remoteParticipants =
    room.remoteParticipants
      ? Array.from(
          room.remoteParticipants.values()
        ).map((p) => ({
          identity: p.identity,
          name: p.name || p.identity,
          role: "Student",
          micOn: p.isMicrophoneEnabled,
          camOn: p.isCameraEnabled,
          handRaised: !!raisedHands[p.identity],
          isTeacher: false,
          isMe: false,
        }))
      : [];

  const localId =
    room.localParticipant?.identity;

  const localName =
    room.localParticipant?.name ||
    localId ||
    "Teacher";

  let peopleList = [
    {
      identity: localId,
      name: localName,
      role: "Teacher",
      micOn:
        room.localParticipant
          ?.isMicrophoneEnabled,
      camOn:
        room.localParticipant
          ?.isCameraEnabled,
      handRaised: false,
      isTeacher: true,
      isMe: true,
    },
    ...remoteParticipants,
  ];

  /* ───────────────────────────────────────────── */
  /* MAIN UI */
  /* ───────────────────────────────────────────── */

  return (
    <div
      className={
        "classroom-layout" +
        (isFullscreen
          ? " fs-mode"
          : "") +
        (!activePanel
          ? " panel-closed"
          : "")
      }
      ref={containerRef}
    >
      {/* RAISE HAND TOASTS */}

      {raiseHandToasts.length > 0 && (
        <div className="rh-toasts">
          {raiseHandToasts.map((t) => (
            <div
              key={t.id}
              className="rh-toast"
            >
              <span>
                ✋{" "}
                <strong>
                  {t.displayName}
                </strong>{" "}
                raised hand
              </span>

              <button
                className="rh-toast-btn"
                onClick={() =>
                  lowerStudentHand(
                    t.identity
                  )
                }
              >
                Lower
              </button>
            </div>
          ))}
        </div>
      )}

      {/* LEFT */}

      <div className="classroom-main">
        {/* VIDEO */}

        <div className="main-stage">
          <VideoTrack trackRef={mainTrack} />

          {pipTrack && (
            <div className="pip-camera">
              <VideoTrack
                trackRef={pipTrack}
              />
            </div>
          )}

          <TeacherControls
            sessionId={sessionId}
            onLeave={onLeave}
          />

          <button
            className="video-fs-btn"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <MdFullscreenExit
                size={22}
              />
            ) : (
              <MdFullscreen size={22} />
            )}
          </button>
        </div>


        {/* CONTROL BAR */}

        <ControlBar
          onLeave={onLeave}
          role={role}
          activePanel={activePanel}
          onTogglePanel={togglePanel}
        />
      </div>

      {/* SIDEBAR */}

      {activePanel && (
        <div className="right-sidebar">
          {activePanel === "chat" && (
            <ChatPanel
              role={role}
              messages={chatMessages}
              onSendMessage={sendMessage}
              participants={peopleList}
            />
          )}

          {activePanel === "people" && (
            <div className="ppl-panel">
              <div className="ppl-header">
                Participants (
                {peopleList.length})
              </div>

              <div className="ppl-list">
                {peopleList.map((p) => (
                  <div
                    key={p.identity}
                    className={
                      "ppl-card" +
                      (p.isTeacher
                        ? " ppl-card--teacher"
                        : "")
                    }
                  >
                    <div className="ppl-avatar">
                      {p.name
                        ?.charAt(0)
                        ?.toUpperCase()}
                    </div>

                    <div className="ppl-info">
                      <div className="ppl-name">
                        {p.isMe
                          ? "You"
                          : p.name}
                      </div>

                      <div className="ppl-role">
                        {p.role}
                      </div>
                    </div>

                    <div className="ppl-actions">
                      <div
                        className={`ppl-mic ${
                          p.micOn
                            ? "ppl-mic--on"
                            : "ppl-mic--off"
                        }`}
                      >
                        {p.micOn
                          ? "🎤"
                          : "🔇"}
                      </div>

                      {!p.isTeacher &&
                        !p.isMe && (
                          <div
                            className="ppl-menu-wrap"
                            ref={
                              openMenuId ===
                              p.identity
                                ? menuRef
                                : null
                            }
                          >
                            <button
                              className="ppl-menu-btn"
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId ===
                                    p.identity
                                    ? null
                                    : p.identity
                                )
                              }
                            >
                              <HiDotsVertical
                                size={16}
                              />
                            </button>

                            {openMenuId ===
                              p.identity && (
                              <div className="ppl-menu">
                                <button
                                  className="ppl-menu-item"
                                  onClick={() =>
                                    toggleStudentMic(
                                      p.identity,
                                      p.micOn
                                    )
                                  }
                                >
                                  {p.micOn
                                    ? "Mute Student"
                                    : "Unmute Student"}
                                </button>

                                {p.handRaised && (
                                  <button
                                    className="ppl-menu-item"
                                    onClick={() =>
                                      lowerStudentHand(
                                        p.identity
                                      )
                                    }
                                  >
                                    Lower Hand
                                  </button>
                                )}

                                <button
                                  className="ppl-menu-item ppl-menu-item--danger"
                                  onClick={() =>
                                    kickStudent(
                                      p.identity,
                                      p.name
                                    )
                                  }
                                >
                                  Kick from Session
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}