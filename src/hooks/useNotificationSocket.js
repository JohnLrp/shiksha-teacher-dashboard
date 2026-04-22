// ============================================================
// SHARED — src/hooks/useNotificationSocket.js
// Used by BOTH student and teacher apps (FULL REPLACEMENT)
// ============================================================

import { useEffect, useRef, useState, useCallback } from "react";
import api from "../api/apiClient";

const WS_HOST = import.meta.env.VITE_WS_HOST || "api.shikshacom.com";
const MAX_NOTIFICATIONS = 50;
const MAX_RECONNECT_DELAY = 30000; // 30s cap

export default function useNotificationSocket() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectDelay = useRef(3000);
  const unmounted = useRef(false);

  // ----------------------------------------------------------
  // 1. Fetch persisted feed on mount — fixes empty bell on reload
  // ----------------------------------------------------------
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await api.get("/activity/feed/?limit=20");
        const items = res.data?.results ?? res.data ?? [];
        setNotifications(items);
        setUnreadCount(items.filter((n) => !n.is_read).length);
      } catch {
        // silently fail — WS will still work
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
    return () => { unmounted.current = true; };
  }, []);

  // ----------------------------------------------------------
  // 2. WebSocket connection with exponential backoff
  //    Auth token passed as query param for Django Channels
  // ----------------------------------------------------------
  const connect = useCallback(() => {
    if (unmounted.current) return;

    // Get JWT from wherever your app stores it
    const token =
      localStorage.getItem("access") ||
      sessionStorage.getItem("access") ||
      "";

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${WS_HOST}/ws/notifications/${token ? `?token=${token}` : ""}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (unmounted.current) return;
      reconnectDelay.current = 3000; // reset backoff on successful connect
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    ws.onmessage = (e) => {
      if (unmounted.current) return;
      try {
        const data = JSON.parse(e.data);
        setNotifications((prev) => [data, ...prev].slice(0, MAX_NOTIFICATIONS));
        setUnreadCount((prev) => prev + 1);
      } catch {}
    };

    ws.onclose = () => {
      if (unmounted.current) return;
      // Exponential backoff: 3s → 6s → 12s → … → 30s max
      reconnectTimer.current = setTimeout(() => {
        reconnectDelay.current = Math.min(
          reconnectDelay.current * 2,
          MAX_RECONNECT_DELAY
        );
        connect();
      }, reconnectDelay.current);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      unmounted.current = true;
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  // ----------------------------------------------------------
  // 3. markAllRead — persists to backend
  // ----------------------------------------------------------
  const markAllRead = useCallback(async () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await api.post("/activity/feed/read-all/");
    } catch {}
  }, []);

  // ----------------------------------------------------------
  // 4. markOneRead — for single item clicks
  // ----------------------------------------------------------
  const markOneRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await api.patch(`/activity/feed/${id}/read/`);
    } catch {}
  }, []);

  // ----------------------------------------------------------
  // 5. clearNotifications — UI-only, does not delete from backend
  // ----------------------------------------------------------
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAllRead,
    markOneRead,
    clearNotifications,
  };
}
