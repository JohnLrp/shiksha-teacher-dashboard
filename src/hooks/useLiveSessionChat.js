import { useEffect, useRef, useState, useCallback } from "react";

const WS_HOST = import.meta.env.VITE_WS_HOST || "api.shikshacom.com";

export default function useLiveSessionChat(sessionId) {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const userIdRef = useRef(null);

  // Get current user id from localStorage or cookie
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      userIdRef.current = user?.id || null;
    } catch {}
  }, []);

  const connect = useCallback(() => {
    if (!sessionId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${WS_HOST}/ws/live-session/${sessionId}/`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "chat_message") {
          const msg = data.data;
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              sender: msg.sender,
              text: msg.text,
              isMe: msg.sender_id === userIdRef.current,
              isTeacher: msg.isTeacher,
              time: msg.time,
            },
          ]);
        }
      } catch {}
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, [sessionId]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  const sendMessage = useCallback(async (text) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: "chat_message",
      text,
    }));
  }, []);

  return { messages, connected, sendMessage };
}
