import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/apiClient";

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
    <div style={{ padding: "20px" }}>
      <button onClick={() => navigate(-1)}>← Back</button>

      <h2>Student Attempts</h2>

      <table>
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
                {new Date(a.submitted_at).toLocaleString()}
              </td>
              <td>
                {a.score} / {a.total_marks}
              </td>
              <td>
                <button
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
    </div>
  );
}