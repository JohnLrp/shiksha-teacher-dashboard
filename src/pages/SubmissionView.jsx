import { useNavigate, useParams } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import { useEffect, useState } from "react";
import api from "../api/apiClient";
import "../styles/submission-view.css";

export default function SubmissionView() {
  const navigate = useNavigate();
  const { subjectId, assignmentId } = useParams();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | submitted | pending

  const backPath = `/teacher/classes/${subjectId}/assignments`;

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const res = await api.get(
          `/assignments/teacher/${assignmentId}/submissions/`
        );
        const formatted = res.data.map((s) => ({
          id: s.id,
          name: s.student_name,
          submittedOn: s.submitted_at,
          status: s.submitted_file ? "Submitted" : "Pending",
          file: s.submitted_file,
        }));
        setStudents(formatted);
      } catch (err) {
        console.error("Failed to load submissions", err);
      } finally {
        setLoading(false);
      }
    }

    if (assignmentId) fetchSubmissions();
  }, [assignmentId]);

  const total = students.length;
  const submittedCount = students.filter((s) => s.status === "Submitted").length;
  const pendingCount = total - submittedCount;

  const filteredStudents = students
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    .filter((s) => {
      if (filter === "submitted") return s.status === "Submitted";
      if (filter === "pending") return s.status === "Pending";
      return true;
    })
    // submitted always first
    .sort((a, b) =>
      a.status === b.status ? 0 : a.status === "Submitted" ? -1 : 1
    );

  if (loading) return <div className="sv-loading">Loading submissions...</div>;

  return (
    <div className="sv-page">

      <button className="sv-back-btn" onClick={() => navigate(backPath)}>
        <IoChevronBack /> Back
      </button>

      <div className="sv-header">
        <h2 className="sv-title">Assignment Submissions</h2>
        <div className="sv-search">
          <input
            type="text"
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FiSearch className="sv-search-icon" />
        </div>
      </div>

      <div className="sv-content-card">

        {/* Summary */}
        <div className="sv-summary">
          <div
            className={`sv-stat-chip submitted ${filter === "submitted" ? "active" : ""}`}
            onClick={() => setFilter(filter === "submitted" ? "all" : "submitted")}
            title="Click to filter submitted"
          >
            <span className="sv-stat-number">{submittedCount}</span>
            <span className="sv-stat-slash">/</span>
            <span className="sv-stat-total">{total}</span>
            <span className="sv-stat-label">Submitted</span>
          </div>

          <div
            className={`sv-stat-chip pending ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter(filter === "pending" ? "all" : "pending")}
            title="Click to filter pending"
          >
            <span className="sv-stat-number">{pendingCount}</span>
            <span className="sv-stat-slash">/</span>
            <span className="sv-stat-total">{total}</span>
            <span className="sv-stat-label">Pending</span>
          </div>

          {filter !== "all" && (
            <button className="sv-clear-filter" onClick={() => setFilter("all")}>
              Reset
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="sv-progress-bar-track">
          <div
            className="sv-progress-bar-fill"
            style={{ width: total ? `${(submittedCount / total) * 100}%` : "0%" }}
          />
        </div>
        <p className="sv-progress-label">
          {total ? Math.round((submittedCount / total) * 100) : 0}% submitted
        </p>

        {/* Table */}
        <table className="sv-table">
          <thead>
            <tr>
              <th>Sl No.</th>
              <th>Name</th>
              <th>Submitted On</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="5" className="sv-empty">
                  No matching results
                </td>
              </tr>
            ) : (
              filteredStudents.map((student, index) => (
                <tr key={student.id} className="sv-table-row">
                  <td>{index + 1}</td>
                  <td className="sv-name-cell">{student.name}</td>
                  <td>{formatDate(student.submittedOn)}</td>
                  <td>
                    <span
                      className={`sv-status-badge ${
                        student.status === "Submitted" ? "submitted" : "pending"
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td>
                    {student.file ? (
                      <a
                        href={student.file}
                        target="_blank"
                        rel="noreferrer"
                        className="sv-review-btn"
                      >
                        Review
                      </a>
                    ) : (
                      <span className="sv-no-file">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

      </div>
    </div>
  );
}