import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { IoChevronBack } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import api from "../api/apiClient";
import "../styles/live-sessions.css";

export default function LiveSessions() {
  const navigate = useNavigate();
  const { subjectId } = useParams();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const fetchSessions = useCallback(async () => {
    try {
      setError(null);

      const url = subjectId
        ? `/livestream/teacher/sessions/?subject_id=${subjectId}`
        : `/livestream/teacher/sessions/`;

      const res = await api.get(url);
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load sessions.");
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    fetchSessions();

    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const handleJoin = (session) => {
    if (!session.can_join) return;
    navigate(`/teacher/live/${session.id}`);
  };

  const filtered = sessions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.title?.toLowerCase().includes(q) ||
      s.subject_name?.toLowerCase().includes(q) ||
      s.course_name?.toLowerCase().includes(q) ||
      s.teacher?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="live-sessions-page">
      <button
        className="live-sessions-back-btn"
        onClick={() => navigate(-1)}
      >
        <IoChevronBack /> Back
      </button>

      <div className="live-sessions-header">
        <h2 className="live-sessions-title">
          Schedule for Interactive Sessions
        </h2>

        <div className="live-sessions-search">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FiSearch className="live-sessions-search-icon" />
        </div>
      </div>

      <div className="live-sessions-content">
        {subjectId && (
          <div className="live-sessions-actions">
            <button
              className="live-sessions-schedule-btn"
              onClick={() =>
                navigate(`/teacher/classes/${subjectId}/live-sessions/create`)
              }
            >
              Schedule Live Session
            </button>
          </div>
        )}

        <div className="live-sessions-grid">
          {loading && (
            <p className="live-sessions-empty">Loading sessions…</p>
          )}
          {error && (
            <p className="live-sessions-empty" style={{ color: "#b91c1c" }}>
              {error}
            </p>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="live-sessions-empty">
              <p style={{ fontSize: 32, margin: "0 0 8px" }}>📅</p>
              <p style={{ margin: 0, fontWeight: 600 }}>
                {search ? "No sessions match your search." : "No sessions scheduled yet."}
              </p>
              {!search && subjectId && (
                <p style={{ margin: "4px 0 0", fontSize: 12 }}>
                  Click "Schedule Live Session" to create one.
                </p>
              )}
            </div>
          )}

          {!loading &&
            !error &&
            filtered.map((session) => {
              const startDate = new Date(session.start_time);

              return (
                <div
                  key={session.id}
                  className={`session-card ${!session.can_join ? "disabled" : ""}`}
                  onClick={() => handleJoin(session)}
                >
                  <div className="session-card-info">
                    <h4 className="session-card-subject">{session.subject_name}</h4>
                    <p className="session-card-course">{session.course_name}</p>
                    <p className="session-card-topic">{session.title}</p>
                  </div>

                  <div className="session-card-meta">
                    <span className={`status ${session.computed_status}`}>
                      {session.computed_status}
                    </span>

                    {session.computed_status === "LIVE" && (
                      <span className="live-badge">🔴 LIVE</span>
                    )}
                  </div>

                  <div className="session-card-bottom">
                    <span>
                      {startDate.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span>
                      {startDate.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
