import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/quiz-student-attempts-view.css";

export default function QuizStudentAttemptsView() {
  const { quizId, subjectId, studentId } = useParams();
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    async function fetchAttempts() {
      try {
        const res = await api.get(
          `/teacher/quizzes/${quizId}/attempts/${studentId}/`
        );
        setAttempts(res.data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchAttempts();
  }, [quizId, studentId]);

  return (
    <div className="qsav-page">

      <button className="qsav-back-btn" onClick={() => navigate(`/teacher/classes/${subjectId}/quizzes/${quizId}/submissions`)}>
  ← Back
</button>

      {/* ✅ ADDED WRAPPER */}
      <div className="qsav-content-card">

        <div className="qsav-title-row">
          <h2 className="qsav-title">Student Attempts</h2>
          <span className="qsav-count qsav-count-green">
            {attempts.length}
          </span>
        </div>

        <table className="qsav-table">
          <thead>
            <tr>
              <th>Attempt No.</th>
              <th>Name</th>
              <th>Submitted</th>
              <th>Score</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {attempts.map((a) => (
              <tr key={a.id}>
                <td>{a.attempt_number}</td>
                <td>{a.student_name}</td>
                <td>
                  {a.submitted_at
                    ? new Date(a.submitted_at).toLocaleString()
                    : "-"}
                </td>
                <td>
  {(() => {
    const pct = a.total_marks ? (a.score / a.total_marks) * 100 : 0;
    const cls = pct >= 70 ? "qsav-score-high" : pct >= 40 ? "qsav-score-mid" : "qsav-score-low";
    return (
      <span className={`qsav-score-pill ${cls}`}>
        {a.score} / {a.total_marks}
      </span>
    );
  })()}
</td>
                <td>
                  <button
                    className="qsav-review-btn"
                    onClick={() =>
                      navigate(
                        `/teacher/classes/${subjectId}/quizzes/${quizId}/review/${a.id}`
                      )
                    }
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {attempts.length === 0 && (
          <p style={{ padding: "30px" }}>
            No attempts found.
          </p>
        )}

      </div>

    </div>
  );
}