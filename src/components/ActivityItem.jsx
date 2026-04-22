// ============================================================
// TEACHER — src/components/ActivityItem.jsx  (FULL REPLACEMENT)
// ============================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ActivityItem({
  // Display props (used by schedule items)
  date,
  label,
  labelColor,
  lines,
  dayBadge,
  onClick,
  // Notification expansion props (used by notification panel)
  notification,   // full activity object when used as a notification
  onRead,
}) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  // If a full notification object is passed, use it for rich display
  const n = notification;

  const handleClick = () => {
    if (n) {
      if (!n.is_read && n.id && onRead) onRead(n.id);
      setExpanded((prev) => !prev);
    } else if (onClick) {
      onClick();
    }
  };

  const handleNavigate = (e) => {
    e.stopPropagation();
    if (!n) return;
    if (!n.is_read && n.id && onRead) onRead(n.id);

    // Private session — always go to private sessions page
    if (n.is_private_session || n.type === "PRIVATE_SESSION") {
      navigate("/teacher/private-sessions");
      return;
    }

    if (n.subject_id) {
      if (n.type === "ASSIGNMENT" || n.type === "SUBMISSION")
        navigate(`/teacher/classes/${n.subject_id}/assignments`);
      else if (n.type === "QUIZ")
        navigate(`/teacher/classes/${n.subject_id}/quizzes`);
      else if (n.type === "SESSION")
        navigate(`/teacher/live-sessions`);
      else
        navigate(`/teacher/classes/${n.subject_id}`);
    } else {
      navigate("/teacher/classes");
    }
  };

  const formattedDue = n?.due_date
    ? new Date(n.due_date).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : null;

  const formattedCreated = n?.created_at
    ? new Date(n.created_at).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : date;

  // ── Notification mode (rich, expandable) ──
  if (n) {
    const LABEL_MAP = {
      ASSIGNMENT:      "Assignment",
      SESSION:         "Live Session",
      QUIZ:            "Quiz",
      SUBMISSION:      "Submission",
      PRIVATE_SESSION: "Private Session",
    };
    const COLOR_MAP = {
      ASSIGNMENT:      "green",
      SESSION:         "yellow",
      QUIZ:            "purple",
      SUBMISSION:      "blue",
      PRIVATE_SESSION: "teal",
    };
    // Backend sends SESSION type with is_private_session flag
    const displayType = n.is_private_session ? "PRIVATE_SESSION" : n.type;

    return (
      <div
        className={`act-item act-item--notification ${!n.is_read ? "act-item--unread" : ""}`}
        onClick={handleClick}
        style={{ cursor: "pointer" }}
      >
        <span className={`act-bar ${COLOR_MAP[displayType] || "green"}`} />
        {!n.is_read && <span className="act-unread-dot" />}

        <div className="act-content">
          <div className="act-header-row">
            <p className="act-date">{formattedCreated}</p>
            <span className={`act-label ${COLOR_MAP[displayType] || "green"}`}>
              {LABEL_MAP[displayType] || displayType}
            </span>
            <span className="act-chevron">{expanded ? "▴" : "▾"}</span>
          </div>

          <p className="act-title">{n.title}</p>
          {n.subject_name && <p className="act-line">{n.subject_name}</p>}

          {expanded && (
            <div className="act-expand">
              {formattedDue && (
                <p className="act-expand-row">
                  <span className="act-expand-label">Due</span>
                  <span>{formattedDue}</span>
                </p>
              )}
              {n.subject_name && (
                <p className="act-expand-row">
                  <span className="act-expand-label">Subject</span>
                  <span>{n.subject_name}</span>
                </p>
              )}
              <button className="act-view-btn" onClick={handleNavigate}>
                View →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Schedule / plain mode (original behaviour) ──
  return (
    <div
      className="act-item"
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : {}}
    >
      <span className={`act-bar ${labelColor}`} />
      <div className="act-content">
        {dayBadge && <span className="act-day-badge">{dayBadge}</span>}
        <p className="act-date">{date}</p>
        <p className={`act-label ${labelColor}`}>{label}</p>
        {lines && lines.map((line, i) => (
          <p key={i} className="act-line">{line}</p>
        ))}
      </div>
    </div>
  );
}
