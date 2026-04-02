import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import "../styles/dashboard.css";

import LiveSessionCard from "../components/LiveSessionCard";
import CalendarWidget from "../components/CalendarWidget";
import AssignmentItem from "../components/AssignmentItem";
import ActivityItem from "../components/ActivityItem";

import api from "../api/apiClient";

const NOTIFICATION_COLORS = {
  assignment: "green",
  "live-session": "yellow",
  quiz: "purple",
};

function toDateKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function TeacherDashboard() {
  const outletContext = useOutletContext();
  const active = outletContext?.active || "sessions";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [assignFilter, setAssignFilter] = useState(null);
  const [activityFilter, setActivityFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(null);
  const [scheduleTypeFilter, setScheduleTypeFilter] = useState("all");

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/dashboard/");
      console.log("Dashboard data:", res.data);
      setData(res.data);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sessions = data?.sessions ?? [];
  const assignments = data?.assignments ?? [];
  const quizzes = data?.quizzes ?? [];
  const notifications = data?.notifications ?? [];

  // --- Calendar events map (from real API data) ---
  const calendarEvents = useMemo(() => {
    const map = {};
    const addEvent = (dateStr, type) => {
      if (!dateStr) return;
      const key = toDateKey(dateStr);
      if (!map[key]) map[key] = [];
      if (!map[key].includes(type)) map[key].push(type);
    };
    sessions.forEach((s) => addEvent(s.dateTime, "live-session"));
    assignments.forEach((a) => addEvent(a.due, "assignment"));
    quizzes.forEach((q) => addEvent(q.due, "quiz"));
    return map;
  }, [sessions, assignments, quizzes]);

  // --- Combined schedule items (sessions + assignments + quizzes) ---
  const scheduleItems = useMemo(() => {
    const items = [];
    sessions.forEach((s) =>
      items.push({
        id: `session-${s.id}`,
        type: "live-session",
        title: `${s.subject} - ${s.topic}`,
        date: s.dateTime,
        labelColor: "yellow",
      })
    );
    assignments.forEach((a) =>
      items.push({
        id: `assignment-${a.id}`,
        type: "assignment",
        title: a.title,
        date: a.due,
        labelColor: "green",
      })
    );
    quizzes.forEach((q) =>
      items.push({
        id: `quiz-${q.id}`,
        type: "quiz",
        title: q.title,
        date: q.due,
        labelColor: "purple",
      })
    );
    items.sort((a, b) => new Date(a.date) - new Date(b.date));
    return items;
  }, [sessions, assignments, quizzes]);

  // All hooks are above this point — safe to do early returns now

  if (loading) return <div className="dashboard">Loading...</div>;

  const isAllEmpty =
    sessions.length === 0 &&
    assignments.length === 0 &&
    quizzes.length === 0 &&
    notifications.length === 0;

  const toggleFilter = (current, value, setter) => {
    setter(current === value ? null : value);
  };

  const filteredAssignments = assignFilter
    ? assignments.filter((a) =>
        assignFilter === "overdue"
          ? new Date(a.due) < new Date()
          : new Date(a.due) >= new Date()
      )
    : assignments;

  const filteredActivities = notifications.filter(
    (item) => activityFilter === "all" || item.type === activityFilter
  );

  const filteredSchedule = scheduleItems.filter((item) => {
    if (selectedDate && !isSameDay(new Date(item.date), selectedDate)) return false;
    if (scheduleTypeFilter !== "all" && item.type !== scheduleTypeFilter) return false;
    return true;
  });

  const handleDateSelect = (date) => {
    if (selectedDate && isSameDay(selectedDate, date)) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  };

  if (isAllEmpty) {
    return (
      <div className="dashboard">
        <div className="dash-empty">No data available yet.</div>
      </div>
    );
  }

  // ---------------- MOBILE ----------------
  if (isMobile) {
    return (
      <div className="dashboard">
        {active === "sessions" && (
          <div className="dash-card">
            <h4>Upcoming Live Sessions</h4>
            {sessions.length === 0 && <p>No sessions</p>}
            {sessions.map((s) => (
              <LiveSessionCard
                key={s.id}
                subject={s.subject}
                topic={s.topic}
                timing={new Date(s.dateTime).toLocaleString()}
              />
            ))}
          </div>
        )}

        {active === "assignments" && (
          <div className="dash-card">
            <h4>Assignments</h4>
            {filteredAssignments.length === 0 && <p>No assignments</p>}
            {filteredAssignments.map((a) => (
              <AssignmentItem
                key={a.id}
                id={a.id}
                title={a.title}
                subject={a.subject_name || a.teacher}
                dueDate={new Date(a.due).toLocaleDateString("en-GB")}
                subjectId={a.subject_id}
              />
            ))}
          </div>
        )}

        {active === "notifications" && (
          <div className="dash-card">
            <h4>Notifications</h4>
            {filteredActivities.length === 0 && <p>No notifications</p>}
            {filteredActivities.map((item) => (
              <ActivityItem
                key={item.id}
                date={new Date(item.created_at).toLocaleDateString("en-GB")}
                label={item.type}
                labelColor={NOTIFICATION_COLORS[item.type] || "green"}
                lines={[item.title]}
              />
            ))}
          </div>
        )}

        {active === "calendar" && (
          <CalendarWidget
            events={calendarEvents}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
        )}
      </div>
    );
  }

  // ---------------- DESKTOP ----------------
  return (
    <div className="dashboard">
      <div className="dash-top">
        <div className="dash-live-section">
          <div className="dash-live-header">
            <h3 className="dash-section-title">Upcoming Live Sessions</h3>
            <div className="dash-remaining">
              {sessions.length} Classes (Remaining classes)
            </div>
          </div>
          <div className="dash-live-row">
            {sessions.length === 0 && <p>No sessions</p>}
            {sessions.map((s) => (
              <LiveSessionCard
                key={s.id}
                subject={s.subject}
                topic={s.topic}
                startsIn={s.startsIn}
                timing={s.timing || new Date(s.dateTime).toLocaleString()}
              />
            ))}
          </div>
        </div>

        <CalendarWidget
          events={calendarEvents}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />
      </div>

      <div className="dash-bottom">
        {/* --- Assignments --- */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h4>Assignments</h4>
            <div className="dash-pills">
              <button
                type="button"
                className={`dash-pill pill-due ${assignFilter === "due" ? "pill-active" : ""}`}
                onClick={() => toggleFilter(assignFilter, "due", setAssignFilter)}
              >
                Due
              </button>
              <button
                type="button"
                className={`dash-pill pill-overdue ${assignFilter === "overdue" ? "pill-active" : ""}`}
                onClick={() => toggleFilter(assignFilter, "overdue", setAssignFilter)}
              >
                Over Due
              </button>
            </div>
          </div>
          <div className="dash-card-body">
            {filteredAssignments.length === 0 && <p>No assignments</p>}
            {filteredAssignments.map((a) => (
              <AssignmentItem
                key={a.id}
                id={a.id}
                title={a.title}
                subject={a.subject_name || a.teacher}
                dueDate={new Date(a.due).toLocaleDateString("en-GB")}
                subjectId={a.subject_id}
              />
            ))}
          </div>
        </div>

        {/* --- Notifications --- */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h4>Notification</h4>
            <select
              className="dash-filter"
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="assignment">Assignment</option>
              <option value="live-session">Live Session</option>
              <option value="quiz">Quiz</option>
            </select>
          </div>
          <div className="dash-card-body">
            {filteredActivities.length === 0 && <p>No notifications</p>}
            {filteredActivities.map((item) => (
              <ActivityItem
                key={item.id}
                date={new Date(item.created_at).toLocaleDateString("en-GB")}
                label={item.type}
                labelColor={NOTIFICATION_COLORS[item.type] || "green"}
                lines={[item.title]}
              />
            ))}
          </div>
        </div>

        {/* --- Schedule (filtered by calendar date) --- */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h4>
              Schedule
              {selectedDate && (
                <span style={{ fontWeight: 400, fontSize: "0.8rem", marginLeft: 8 }}>
                  — {selectedDate.toLocaleDateString("en-GB")}
                </span>
              )}
            </h4>
            <select
              className="dash-filter"
              value={scheduleTypeFilter}
              onChange={(e) => setScheduleTypeFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="assignment">Assignment</option>
              <option value="live-session">Live Session</option>
              <option value="quiz">Quiz</option>
            </select>
          </div>
          <div className="dash-card-body">
            {filteredSchedule.length === 0 && <p>No schedule</p>}
            {filteredSchedule.map((item) => (
              <ActivityItem
                key={item.id}
                date={new Date(item.date).toLocaleDateString("en-GB")}
                label={item.type}
                labelColor={item.labelColor}
                lines={[item.title]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
