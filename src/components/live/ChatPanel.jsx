import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { useEffect, useState, useRef } from "react";
import { IoSend } from "react-icons/io5";

export default function ChatPanel({ role }) {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleData = (payload, participant) => {
      const text = new TextDecoder().decode(payload);

      try {
        const msg = JSON.parse(text);
        if (msg.type === "raise-hand") return;
      } catch {}

      const meta = participant.metadata ? JSON.parse(participant.metadata) : null;
      const isTeacher = meta?.role === "teacher" || participant.permissions?.canPublish;

      const displayName = participant.name || participant.identity;

      setMessages((prev) => [
        ...prev,
        {
          sender: displayName,
          text,
          isTeacher,
          time: new Date(),
        },
      ]);
    };

    room.on("dataReceived", handleData);
    return () => room.off("dataReceived", handleData);
  }, [room]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const encoder = new TextEncoder();
    await localParticipant.publishData(
      encoder.encode(input),
      { reliable: true }
    );

    setMessages((prev) => [
      ...prev,
      {
        sender: "You",
        text: input,
        isMe: true,
        time: new Date(),
      },
    ]);

    setInput("");
  };

  const raiseHand = async () => {
    const message = { type: "raise-hand" };
    const encoder = new TextEncoder();
    await localParticipant.publishData(
      encoder.encode(JSON.stringify(message)),
      { reliable: true }
    );
  };

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
              className={`chat-bubble ${msg.isMe ? "me-bubble" : ""} ${msg.isTeacher ? "teacher-bubble" : ""}`}
            >
              <span className="chat-name">
                {msg.isMe ? "You" : msg.sender}
                {msg.isTeacher && !msg.isMe && (
                  <span className="teacher-tag"> • Teacher</span>
                )}
              </span>
              <div className="chat-text">{msg.text}</div>
              <div className="chat-time">{formatTime(msg.time)}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="chat-input-area">
        {role === "student" && (
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
