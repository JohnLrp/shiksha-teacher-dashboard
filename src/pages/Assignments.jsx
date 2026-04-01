import { useNavigate, useParams } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import { useEffect, useState } from "react";
import api from "../api/apiClient";
import "../styles/assignments.css";

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function Assignments() {
  const navigate = useNavigate();
  const { subjectId } = useParams();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const backPath = `/teacher/classes/${subjectId}`;

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const res = await api.get(`/assignments/teacher/subject/${subjectId}/`);
        setAssignments(res.data);
      } catch (err) {
        console.error("Failed to load assignments", err);
      } finally {
        setLoading(false);
      }
    }
    if (subjectId) fetchAssignments();
  }, [subjectId]);

  const filtered = assignments.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.chapter_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="assignments-loading">Loading assignments...</div>;

  return (
    <div className="assignments-page">

      <button className="assignments-back-btn" onClick={() => navigate(backPath)}>
        <IoChevronBack /> Back
      </button>

      <div className="assignments-title-container">
        <div className="assignments-title-left">
          <h2 className="assignments-title">Assignments</h2>
          <span className="assignments-count-badge">{assignments.length}</span>
        </div>

        <div className="assignments-search">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FiSearch className="assignments-search-icon" />
        </div>
      </div>

      <div className="assignments-list-container">

        <div className="assignments-actions">
          <button
            className="assignments-create-btn"
            onClick={() => navigate(`/teacher/classes/${subjectId}/assignments/create`)}
          >
            + Create New Assignment
          </button>
        </div>

        <div className="assignments-list">
          {filtered.length === 0 && (
            <div className="assignments-empty">
              {search ? "No assignments match your search." : "No assignments created yet."}
            </div>
          )}

          {filtered.map((assignment) => (
            <div className="assignment-row" key={assignment.id}>

              <div className="assignment-info">
                <span className="assignment-id">{assignment.id?.slice(0, 8)}</span>
                <span className="assignment-name">{assignment.title}</span>
              </div>

              <div className="assignment-detail">
                <span className="assignment-label">Chapter:</span>
                <span className="assignment-value">{assignment.chapter_name}</span>
              </div>

              <div className="assignment-detail">
                <span className="assignment-label">Due on:</span>
                <span className="assignment-value">{formatDate(assignment.due_date)}</span>
              </div>

              <div className="assignment-detail">
                <span className="assignment-label">Submissions:</span>
                <span className={`assignment-value bold ${assignment.total_submissions > 0 ? "has-submissions" : "no-submissions"}`}>
                  {assignment.total_submissions}
                </span>
              </div>

              <button
                className="assignment-view-btn"
                onClick={() =>
                  navigate(`/teacher/classes/${subjectId}/assignments/${assignment.id}/submissions`)
                }
              >
                View
              </button>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}