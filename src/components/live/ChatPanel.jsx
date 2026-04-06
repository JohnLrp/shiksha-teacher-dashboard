import { useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";

/**
 * ChatPanel — now receives messages and send handler from parent.
 *
 * Props:
 *   role        — "teacher" | "student"
 *   messages    — array of { id?, sender, text, isMe, isTeacher?, time }
 *   onSendMessage — async (text) => void  (parent persists + broadcasts)
 */
export default function ChatPanel({ role, messages = [], onSendMessage }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const isTeacherRole = role === "teacher" || role === "PRESENTER";

  /* ── Auto scroll on new messages ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Send ── */
  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    if (onSendMessage) {
      try {
        await onSendMessage(text);
      } catch (e) {
        console.error("sendMessage failed", e);
      }
    }
  };

  /* ── Format time ── */
  const formatTime = (ts) => {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">CHAT</div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="chat-empty">No messages yet. Say hello!</p>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`chat-row ${msg.isMe ? "me" : "other"}`}>
            <div
              className={`chat-bubble ${msg.isMe ? "me-bubble" : ""} ${
                !msg.isMe && msg.isTeacher ? "teacher-bubble" : ""
              }`}
            >
              <span className="chat-name">{msg.isMe ? "YOU" : msg.sender}</span>
              <div className="chat-text">{msg.text}</div>
              <div className="chat-time">{formatTime(msg.time)}</div>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="chat-send-btn" onClick={sendMessage} title="Send">
          <IoSend size={16} />
        </button>
      </div>
    </div>
  );
}
