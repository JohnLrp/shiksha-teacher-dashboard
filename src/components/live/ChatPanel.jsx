import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { useEffect, useState } from "react";

export default function ChatPanel({ role }) {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const handleData = (payload, participant) => {
      const text = new TextDecoder().decode(payload);

      try {
        const msg = JSON.parse(text);
        if (msg.type === "raise-hand") return;
      } catch {}

      setMessages((prev) => [
        ...prev,
        { sender: participant.identity, text },
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
      { sender: "Me", text: input },
    ]);

    setInput("");
  };

  const raiseHand = async () => {
    const message = {
      type: "raise-hand",
    };

    const encoder = new TextEncoder();
    await localParticipant.publishData(
      encoder.encode(JSON.stringify(message)),
      { reliable: true }
    );
  };

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className="chat-bubble">
            <span className="chat-name">{msg.sender}</span>
            <span>{msg.text}</span>
          </div>
        ))}
      </div>

      <div className="chat-input-area">
        {role === "student" && (
          <button onClick={raiseHand} style={{ marginRight: "6px" }}>
            ✋
          </button>
        )}

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Your message here"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button onClick={sendMessage}>➤</button>
      </div>
    </div>
  );
}