import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import api from "../api/apiClient";
import "../styles/live-session-create.css";

export default function TeacherCreateLiveSession() {
  const { subjectId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const toLocalISOString = (dateStr) => {
    const date = new Date(dateStr);
    return new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    ).toISOString();
  };

  const handleSubmit = async () => {
    setError(null);

    if (!form.title || !form.start_time || !form.end_time) {
      setError("Please fill all required fields.");
      return;
    }

    if (new Date(form.start_time) >= new Date(form.end_time)) {
      setError("End time must be after start time.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/livestream/sessions/", {
        title: form.title,
        description: form.description,
        subject_id: subjectId,
        start_time: toLocalISOString(form.start_time),
        end_time: toLocalISOString(form.end_time),
      });

      navigate(-1);
    } catch (err) {
      console.error(err);
      setError("Failed to create session.");
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const minDateTime = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 16);

  return (
    <div className="lsc-page">

      <button className="lsc-back-btn" onClick={() => navigate(-1)}>
        <IoChevronBack /> Back
      </button>

      <div className="lsc-card">
        <h2 className="lsc-title">Schedule Live Session</h2>
        <p className="lsc-subtitle">Fill in the details to create a new live class for your students.</p>

        {error && <div className="lsc-error">⚠ {error}</div>}

        <div className="lsc-form">

          <div className="lsc-field">
            <label className="lsc-label">Session Title *</label>
            <input
              className="lsc-input"
              placeholder="e.g. Chapter 5 — Introduction to Algebra"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="lsc-field">
            <label className="lsc-label">Description</label>
            <textarea
              className="lsc-textarea"
              placeholder="What will you cover in this session? (optional)"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <hr className="lsc-divider" />

          <div className="lsc-row">
            <div className="lsc-field">
              <label className="lsc-label">Start Time *</label>
              <input
                type="datetime-local"
                className="lsc-input"
                value={form.start_time}
                min={minDateTime}
                onChange={(e) =>
                  setForm({ ...form, start_time: e.target.value })
                }
              />
            </div>

            <div className="lsc-field">
              <label className="lsc-label">End Time *</label>
              <input
                type="datetime-local"
                className="lsc-input"
                value={form.end_time}
                min={form.start_time || minDateTime}
                onChange={(e) =>
                  setForm({ ...form, end_time: e.target.value })
                }
              />
            </div>
          </div>

          <button
            className="lsc-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Creating Session…" : "Create Live Session"}
          </button>

        </div>
      </div>
    </div>
  );
}
