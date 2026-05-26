import { useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { BsChatDotsFill } from "react-icons/bs";
import { HiQuestionMarkCircle } from "react-icons/hi2";
import { HiMicrophone } from "react-icons/hi2";
import { HiDotsVertical } from "react-icons/hi";
import "./ChatPanel.css";

export default function ChatPanel({
  role,
  messages = [],
  participants = [],
  qaMessages = [],
  onSendMessage,
  onSendQA,
}) {
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const containerRef = useRef(null);

  /* ── Auto-scroll ── */
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (isNearBottom) el.scrollTop = el.scrollHeight;
  }, [messages, qaMessages, activeTab]);

  /* ── Send ── */
  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    const handler = activeTab === "qa" ? onSendQA : onSendMessage;
    if (handler) {
      try { await handler(text); }
      catch (e) { console.error("send failed", e); }
    }
  };

  /* ── Time format ── */
  const fmt = (ts) =>
    ts
      ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

  const currentMessages = activeTab === "qa" ? qaMessages : messages;
  const isChatView = activeTab === "chat" || activeTab === "qa";

  return (
    <div className="cp-outer">

      {/* ─── TOP CARD: tabs + messages ─── */}
      <div className="cp-wrap">

        {/* TABS */}
        <div className="cp-tabs">
          <button
            className={`cp-tab ${activeTab === "chat" ? "cp-tab--active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            <BsChatDotsFill size={15} />
            Chat
          </button>
          <button
            className={`cp-tab ${activeTab === "qa" ? "cp-tab--active" : ""}`}
            onClick={() => setActiveTab("qa")}
          >
            <HiQuestionMarkCircle size={16} />
            Q &amp; A
          </button>
        </div>

        {/* CHAT / Q&A MESSAGES */}
        {isChatView && (
          <div className="cp-chat-body">
            <div className="cp-messages" ref={containerRef}>
              {currentMessages.length === 0 && (
                <p className="cp-empty">
                  {activeTab === "qa" ? "No questions yet." : "No messages yet."}
                </p>
              )}

              {currentMessages.map((msg, i) => {
                const isMe = !!msg.isMe;

                return (
                  <div
                    key={msg.id || i}
                    className={`cp-row ${isMe ? "cp-row--me" : "cp-row--other"}`}
                  >
                    {/* Meta row */}
                    <div className={`cp-meta ${isMe ? "cp-meta--me" : "cp-meta--other"}`}>
                      {isMe ? (
                        <>
                          <span className="cp-time">{fmt(msg.time)}</span>
                          <span className="cp-name">You</span>
                        </>
                      ) : (
                        <>
                          <span className="cp-name">{msg.sender}</span>
                          <span className="cp-time">{fmt(msg.time)}</span>
                        </>
                      )}
                    </div>

                    {/* Bubble */}
                    <div className={`cp-bubble ${isMe ? "cp-bubble--me" : "cp-bubble--other"}`}>
                      <span className="cp-text">{msg.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PARTICIPANTS VIEW */}
        {activeTab === "participants" && (
          <div className="cp-participants">
            {participants.map((user, idx) => (
              <div className="cp-p-card" key={idx}>
                <div className="cp-p-avatar">
                  {user.avatarUrl
                    ? <img src={user.avatarUrl} alt={user.name} />
                    : user.name?.charAt(0)?.toUpperCase()
                  }
                </div>
                <div className="cp-p-info">
                  <div className="cp-p-name">{user.name}</div>
                  <div className="cp-p-role">{user.role}</div>
                </div>
                <div className="cp-p-actions">
                  <button className="cp-p-btn"><HiMicrophone size={15} /></button>
                  <button className="cp-p-btn"><HiDotsVertical size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ─── BOTTOM CARD: input (SIBLING of cp-wrap, creates the gap) ─── */}
      {isChatView && (
        <div className="cp-input-area">
          <input
            className="cp-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              activeTab === "qa" ? "Ask a question..." : "Your message here"
            }
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />

          <button className="cp-send-btn" onClick={sendMessage} aria-label="Send">
            <IoSend size={20} />
          </button>
        </div>
      )}

    </div>
  );
}
