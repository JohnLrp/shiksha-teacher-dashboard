import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const EVENT_COLORS = {
  "assignment": "#57D982",
  "assignment-overdue": "#ef4444",
  "quiz": "#93A1E5",
  "quiz-overdue": "#ef4444",
  "private-session": "#FF8A65",
  "live-session": "#38bdf8",
};

function getDateStyle(types) {
  if (!types || types.length === 0) return {};

  // If any overdue — show red
  if (types.some((t) => t.includes("overdue"))) {
    return { background: "#ef4444", color: "#fff" };
  }

  const colors = types.map((t) => EVENT_COLORS[t]).filter(Boolean);
  if (colors.length === 0) return {};
  if (colors.length === 1) {
    return { background: colors[0], color: "#1f2d3d" };
  }
  return {
    background: `linear-gradient(135deg, ${colors.join(", ")})`,
    color: "#1f2d3d",
  };
}

const now = new Date();

export default function CalendarWidget({ events = {}, selectedDate = null, onDateSelect }) {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const changeMonth = (dir) => {
    let m = month + dir;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
  };

  const isSameDay = (d) =>
    selectedDate &&
    d === selectedDate.getDate() &&
    month === selectedDate.getMonth() &&
    year === selectedDate.getFullYear();

  return (
    <div className="calendar">
      <div className="calendar-header">
        <FaChevronLeft className="cal-arrow" onClick={() => changeMonth(-1)} />
        <select value={month} onChange={e => setMonth(+e.target.value)} className="cal-select">
          {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(+e.target.value)} className="cal-select">
          {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <FaChevronRight className="cal-arrow" onClick={() => changeMonth(1)} />
      </div>

      <div className="calendar-grid">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
          <span key={d} className="cal-day-name">{d}</span>
        ))}

        {[...Array((firstDay + 6) % 7)].map((_, i) => (
          <span key={`empty-${i}`} />
        ))}

        {[...Array(daysInMonth)].map((_, i) => {
          const day = i + 1;
          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
          const isSelected = isSameDay(day);
          const eventTypes = events[dateKey] || null;
          const eventStyle = (!isToday && eventTypes) ? getDateStyle(eventTypes) : {};

          return (
            <span
              key={day}
              className={`cal-date${isToday ? " cal-today" : ""}${isSelected ? " cal-selected" : ""}`}
              style={eventStyle}
              onClick={() => onDateSelect?.(new Date(year, month, day))}
            >
              {day}
            </span>
          );
        })}
      </div>

      {/* Legend */}
      <div className="cal-legend">
        <span className="cal-legend-item">
          <span className="cal-legend-dot" style={{ background: "#57D982" }} />
          Assignment
        </span>
        <span className="cal-legend-item">
          <span className="cal-legend-dot" style={{ background: "#93A1E5" }} />
          Quiz
        </span>
        <span className="cal-legend-item">
          <span className="cal-legend-dot" style={{ background: "#FF8A65" }} />
          Private Session
        </span>
        <span className="cal-legend-item">
          <span className="cal-legend-dot" style={{ background: "#ef4444" }} />
          Overdue
        </span>
      </div>
    </div>
  );
}
