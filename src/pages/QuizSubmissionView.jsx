import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import api from "../api/apiClient";
import "../styles/quiz-submission-view.css";



export default function QuizSubmissionView() {
  const navigate = useNavigate();
  const { quizId, subjectId } = useParams();

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const res = await api.get(`/teacher/quizzes/${quizId}/attempts/`);
        setStudents(res.data);
      } catch (err) {
        console.error("Failed to load submissions", err);
      }
    }

    fetchSubmissions();
  }, [quizId]);

  const filteredStudents = students.filter((s) =>
    (s.student_name || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };



  return (
    <div className="qsv-page">

      <button
        className="qsv-back-btn"
        onClick={() =>
          navigate(`/teacher/classes/${subjectId}/quizzes/${quizId}`)
        }
      >
        <IoChevronBack /> Back
      </button>

      <div className="qsv-content-card">

        <div className="qsv-title-row">
          <h2 className="qsv-title">Quiz Submissions</h2>
          <span className="qsv-count qsv-count-green">
            {students.length}
          </span>
        </div>

        <div className="qsv-search">
          <input
            type="text"
            placeholder="Search student"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FiSearch className="qsv-search-icon" />
        </div>

        <table className="qsv-table">
          <thead>
            <tr>
              <th>Sl No.</th>
              <th>Name</th>
              <th>Latest Attempt</th>
              <th>Best Score</th>
              <th>Attempts</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.map((student, index) => (
              <tr key={student.id || index}>
                <td>{index + 1}</td>

                <td>{student.student_name}</td>

                <td>{formatDate(student.latest_submitted_at)}</td>

                <td>
                    {student.best_score} / {student.total_marks}
                </td>

                <td>{student.attempts_count}</td>

                <td>
                  <button
                    className="qsv-review-btn"
                    onClick={() =>
                       navigate(
                        `/teacher/classes/${subjectId}/quizzes/${quizId}/student/${student.student_id}`
                      )
                    }
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {students.length === 0 && (
          <p style={{ padding: "30px" }}>
            No submissions yet.
          </p>
        )}

      </div>
    </div>
  );
}
