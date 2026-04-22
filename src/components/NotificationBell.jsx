// ============================================================
// SHARED — src/components/NotificationBell.jsx
// Used by BOTH student and teacher apps.
// ============================================================

import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoNotificationsOutline, IoNotificationsSharp } from "react-icons/io5";
import useNotificationSocket from "../hooks/useNotificationSocket";

const TYPE_ICONS = {
  ASSIGNMENT:      "📝",
  QUIZ:            "📊",
  SESSION:         "🎥",
  SUBMISSION:      "📬",
  PRIVATE_SESSION: "🔒",
};

const TYPE_COLORS = {
  ASSIGNMENT:      "#f59e0b",
  QUIZ:            "#8b5cf6",
  SESSION:         "#ef4444",
  SUBMISSION:      "#2563eb",
  PRIVATE_SESSION: "#015865",
};

function timeAgo(isoString) {
  if (!isoString) return "";
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    loading,
    markAllRead,
    markOneRead,
    clearNotifications,
  } = useNotificationSocket();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open && unreadCount > 0) markAllRead();
  };

  const handleNotifClick = (notif) => {
    const { type, subject_id, id, is_private_session } = notif;
    if (id) markOneRead(id);

    // Private session notifications always go to /private-sessions
    // regardless of which side (student or teacher) — the page handles both.
    if (is_private_session || type === "PRIVATE_SESSION") {
      navigate("/private-sessions");
      setOpen(false);
      return;
    }

    if (subject_id) {
      if (type === "ASSIGNMENT") navigate(`/subjects/${subject_id}/assignments`);
      else if (type === "QUIZ")  navigate(`/subjects/quiz/${subject_id}`);
      else if (type === "SESSION") navigate(`/live-sessions`);
      else                       navigate(`/subjects/${subject_id}`);
    } else {
      const fallback = {
        ASSIGNMENT: "/assignments",
        QUIZ:       "/subjects/quiz",
        SESSION:    "/live-sessions",
      };
      if (fallback[type]) navigate(fallback[type]);
    }
    setOpen(false);
  };

  // Derive display type — backend sends SESSION with is_private_session flag
  const getDisplayType = (notif) =>
    notif.is_private_session ? "PRIVATE_SESSION" : notif.type;

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
                Clear
              </button>
            )}
          </div>

          <div className="notif-bell-list">
            {loading ? (
              <div className="notif-bell-empty">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notif-bell-empty">No notifications</div>
            ) : (
              notifications.map((notif, i) => {
                const displayType = getDisplayType(notif);
                return (
                  <div
                    key={notif.id || i}
                    className={`notif-bell-item ${!notif.is_read ? "notif-bell-item--unread" : ""}`}
                    onClick={() => handleNotifClick(notif)}
                    style={{
                      borderLeft: `3px solid ${TYPE_COLORS[displayType] || "#6b7280"}`,
                      cursor: "pointer",
                    }}
                  >
                    <span className="notif-bell-icon" style={{ fontSize: 16 }}>
                      {TYPE_ICONS[displayType] || "🔔"}
                    </span>
                    <div className="notif-bell-content">
                      <p className="notif-bell-title">{notif.title}</p>
                      {notif.subject_name && (
                        <p className="notif-bell-subject">{notif.subject_name}</p>
                      )}
                      <p className="notif-bell-time">
                        {timeAgo(notif.created_at)}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <span className="notif-bell-dot" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
