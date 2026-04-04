import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { useEffect, useState, useRef } from "react";
import { IoSend } from "react-icons/io5";

export default function ChatPanel({ role, messages = [], onSendMessage }) {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const isPresenter = role === "PRESENTER";

  /* =====================================
     🔥 AUTO SCROLL
  ===================================== */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* =====================================
     🔥 RECEIVE MESSAGES (REAL-TIME)
     NOTE: No local state mutation here
  ===================================== */
  useEffect(() => {
    if (!room) return;

    const handleData = (payload, participant) => {
      const text = new TextDecoder().decode(payload);

      try {
        const msg = JSON.parse(text);
        if (msg.type === "raise-hand") return;
      } catch {}

      // ⚠️ IMPORTANT:
      // Do NOT call setMessages here anymore
      // Let backend / parent handle persistence + state

      console.log("📩 Incoming message:", text);
    };

    room.on("dataReceived", handleData);
    return () => room.off("dataReceived", handleData);
  }, [room]);

  /* =====================================
     🔥 SEND MESSAGE (PERSISTENT)
  ===================================== */
  const sendMessage = async () => {
    if (!input.trim()) return;

    try {
      // ✅ Send to backend (persistent)
      await onSendMessage(input);

      // ✅ Also broadcast via LiveKit (real-time)
      const encoder = new TextEncoder();
      await localParticipant.publishData(
        encoder.encode(input),
        { reliable: true }
      );

      setInput("");
    } catch (e) {
      console.error("❌ sendMessage failed", e);
    }
  };

  /* =====================================
     🔥 RAISE HAND (VIEWERS ONLY)
  ===================================== */
  const raiseHand = async () => {
    const message = { type: "raise-hand" };
    const encoder = new TextEncoder();

    await localParticipant.publishData(
      encoder.encode(JSON.stringify(message)),
      { reliable: true }
    );
  };

  /* =====================================
     🔥 FORMAT TIME
  ===================================== */
  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="chat-panel">

      {/* MESSAGES */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="chat-empty">No messages yet. Say hello!</p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-row ${msg.isMe ? "me" : "other"}`}
          >
            <div
              className={`chat-bubble 
                ${msg.isMe ? "me-bubble" : ""} 
                ${msg.isTeacher ? "teacher-bubble" : ""}
              `}
            >
              <span className="chat-name">
                {msg.isMe ? "You" : msg.sender}

                {msg.isTeacher && !msg.isMe && (
                  <span className="teacher-tag"> • Presenter</span>
                )}
              </span>

              <div className="chat-text">{msg.text}</div>
              {msg.time && <div className="chat-time">{formatTime(msg.time)}</div>}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="chat-input-area">

        {!isPresenter && (
          <button
            onClick={raiseHand}
            className="raise-hand-btn"
            title="Raise hand"
          >
            ✋
          </button>
        )}

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button onClick={sendMessage} title="Send">
          <IoSend size={16} />
        </button>
      </div>
    </div>
  );
}