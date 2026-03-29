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

  const fetchSessions = useCallback(async () => {
    try {
      setError(null);

      const res = await api.get(
        `/livestream/teacher/sessions/?subject_id=${subjectId}`
      );

      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load sessions.");
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    if (!subjectId) return;

    fetchSessions();

    const interval = setInterval(fetchSessions, 30000); // 🔁 refresh every 30s
    return () => clearInterval(interval);
  }, [subjectId, fetchSessions]);

  const handleJoin = (session) => {
    if (!session.can_join) return;
    navigate(`/teacher/live/${session.id}`);
  };

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
          <input type="text" placeholder="Search" />
          <FiSearch className="live-sessions-search-icon" />
        </div>
      </div>

      <div className="live-sessions-content">
        <div className="live-sessions-actions">
          <button
            className="live-sessions-schedule-btn"
            onClick={() =>
              navigate(
                `/teacher/classes/${subjectId}/live-sessions/create`
              )
            }
          >
            Schedule Live Session
          </button>
        </div>

        <div className="live-sessions-grid">

          {loading && (
            <p className="live-sessions-empty">Loading sessions…</p>
          )}
          {error && (
            <p className="live-sessions-empty" style={{ color: "#b91c1c" }}>
              ⚠ {error}
            </p>
          )}

          {!loading && !error && sessions.length === 0 && (
            <div className="live-sessions-empty">
              <p style={{ fontSize: 32, margin: "0 0 8px" }}>📅</p>
              <p style={{ margin: 0, fontWeight: 600 }}>No sessions scheduled yet.</p>
              <p style={{ margin: "4px 0 0", fontSize: 12 }}>Click "Schedule Live Session" to create one.</p>
            </div>
          )}

          {!loading &&
            !error &&
            sessions.map((session) => {
              const startDate = new Date(session.start_time);

              return (
                <div
                  key={session.id}
                  className={`session-card ${!session.can_join ? "disabled" : ""}`}
                  onClick={() => handleJoin(session)}
                >
                  <div className="session-card-top">
                    <h4>{session.title}</h4>

                    <span className={`status ${session.computed_status}`}>
                      {session.computed_status}
                    </span>

                    {session.computed_status === "LIVE" && (
                      <span className="live-badge">🔴 LIVE</span>
                    )}
                  </div>

                  <p className="session-card-teacher">
                    {session.teacher}
                  </p>

                  <div className="session-card-bottom">
                    <span>
                      {startDate.toLocaleDateString()}
                    </span>
                    <span>
                      {startDate.toLocaleTimeString()}
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