import { useNavigate, useParams } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import { useEffect, useState } from "react";
import api from "../api/apiClient";
import "../styles/session-recordings.css";

export default function SessionRecordings() {

  const navigate = useNavigate();
  const { subjectId } = useParams();

  const [recordings, setRecordings] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function fetchRecordings() {

      try {

        const res = await api.get(
          `/courses/subjects/${subjectId}/recordings/`
        );

        setRecordings(res.data || []);

      } catch (err) {

        console.error("Failed to load recordings", err);
        setRecordings([]);

      } finally {

        setLoading(false);

      }

    }

    if (subjectId) fetchRecordings();

  }, [subjectId]);

  const filtered = recordings.filter((rec) =>
    rec.title?.toLowerCase().includes(search.toLowerCase())
  );

  function formatDuration(seconds) {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  return (

    <div className="sr-page">

      <button
        className="sr-back-btn"
        onClick={() => navigate(-1)}
      >
        <IoChevronBack /> Back
      </button>

      <div className="sr-content">

        <div className="sr-header">

          <h2 className="sr-title">Session Recordings</h2>

          <div className="sr-search">

            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <FiSearch className="sr-search-icon" />

          </div>

        </div>

        <div className="sr-actions">

          <button
            className="sr-add-btn"
            onClick={() =>
              navigate(`/teacher/classes/${subjectId}/session-recordings/upload`)
            }
          >
            + Add Session Recording
          </button>

        </div>

        <div className="sr-grid">

          {loading && <p>Loading recordings...</p>}

          {!loading && filtered.length === 0 && (
            <p style={{ opacity: 0.6 }}>
              No recordings uploaded yet.
            </p>
          )}

          {filtered.map((rec) => (

            <div
              className="sr-card"
              key={rec.id}
              onClick={() =>
                navigate(
                  `/teacher/classes/${subjectId}/session-recordings/${rec.id}/${rec.bunny_video_id}`
                )
              }
            >

              <div className="sr-thumb">

                <img
                  src={
                    rec.thumbnail_url ||
                    `https://vz-${import.meta.env.VITE_BUNNY_LIBRARY_ID || "615730"}.b-cdn.net/${rec.bunny_video_id}/thumbnail.jpg`
                  }
                  alt={rec.title}
                />

                <div className="sr-play">▶</div>

                {rec.duration_seconds && (
                  <span className="sr-duration">
                    {formatDuration(rec.duration_seconds)}
                  </span>
                )}

              </div>

              <div className="sr-info">

                <h4>{rec.title}</h4>

                <p>{rec.session_date}</p>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}