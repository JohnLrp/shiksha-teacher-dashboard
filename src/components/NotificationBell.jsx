import { useRef, useState, useEffect } from "react";
import { IoNotificationsOutline, IoNotificationsSharp } from "react-icons/io5";
import useNotificationSocket from "../hooks/useNotificationSocket";

const TYPE_ICONS = {
  assignment: "📝",
  quiz: "📊",
  live_session: "🎥",
  material: "📚",
  forum: "💬",
};

const TYPE_COLORS = {
  assignment: "#f59e0b",
  quiz: "#8b5cf6",
  live_session: "#ef4444",
  material: "#10b981",
  forum: "#3b82f6",
};

function timeAgo(isoString) {
  if (!isoString) return "";
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { notifications, unreadCount, markAllRead, clearNotifications } =
    useNotificationSocket();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open) markAllRead();
  };

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button className="notif-bell-btn" onClick={handleOpen}>
        {unreadCount > 0 ? (
          <IoNotificationsSharp size={22} color="#f59e0b" />
        ) : (
          <IoNotificationsOutline size={22} />
        )}
        {unreadCount > 0 && (
          <span className="notif-bell-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-bell-dropdown">
          <div className="notif-bell-header">
            <span>Notifications</span>
            {notifications.length > 0 && (
              <button className="notif-clear-btn" onClick={clearNotifications}>
                Clear all
              </button>
            )}
          </div>

          <div className="notif-bell-list">
            {notifications.length === 0 ? (
              <div className="notif-bell-empty">No new notifications</div>
            ) : (
              notifications.map((notif, i) => (
                <div
                  key={i}
                  className="notif-bell-item"
                  style={{
                    borderLeft: `3px solid ${TYPE_COLORS[notif?.data?.type] || "#6b7280"}`,
                  }}
                >
                  <span className="notif-bell-icon">
                    {TYPE_ICONS[notif?.data?.type] || "🔔"}
                  </span>
                  <div className="notif-bell-content">
                    <p className="notif-bell-title">
                      {notif?.data?.title || notif?.data?.message || "New notification"}
                    </p>
                    {notif?.data?.time && (
                      <p className="notif-bell-time">{timeAgo(notif.data.time)}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
