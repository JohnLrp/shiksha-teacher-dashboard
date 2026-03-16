import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/apiClient";
import { IoChevronBack } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import "../styles/quiz-view.css";

const optionLabels = ["a", "b", "c", "d"];

export default function QuizView() {
  const navigate = useNavigate();
  const { quizId } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const res = await api.get(`/quizzes/${quizId}/`);
        setQuiz(res.data);
        setQuestions(res.data.questions || []);
      } catch (err) {
        console.error("Failed to load quiz", err);
      }
    }

    fetchQuiz();
  }, [quizId]);

  const getAnswerText = (q) => {
    const answerIndex = optionLabels.indexOf(q.answer?.toLowerCase());
    if (answerIndex >= 0 && q.options?.[answerIndex]) {
      return q.options[answerIndex];
    }
    return q.answer || "";
  };

  if (!quiz) {
    return <div style={{ padding: "40px" }}>Loading quiz...</div>;
  }

  return (
    <div className="quiz-view-page">
      <button
        className="qv-back-btn"
        onClick={() => navigate(-1)}
      >
        <IoChevronBack /> Back
      </button>

      <div className="qv-header">
        <h2 className="qv-title">{quiz.subject_name || "Subject"}</h2>
        <div className="qv-search">
          <input type="text" placeholder="Search" />
          <FiSearch className="qv-search-icon" />
        </div>
      </div>

      <div className="qv-content-card">
        <div className="qv-edit-row">
          <button
            className="qv-edit-btn"
            onClick={() =>
              navigate("/teacher/classes/quizzes/create", {
                state: quiz,
              })
            }
          >
            Edit
          </button>
        </div>

        <div className="qv-details">
          <h3 className="qv-quiz-title">
            Quiz ({quiz.title || "ID"})
          </h3>

          <p className="qv-teacher-info">
            {quiz.teacher_name || quiz.created_by_email} -{" "}
            {quiz.created_at
             ? new Date(quiz.created_at).toLocaleDateString()
             : "-"}
          </p>

          <div className="qv-dates-row">
            <span className="qv-date-text">
              Due Date:{" "}
              {quiz.due_date
                ? new Date(quiz.due_date).toLocaleDateString()
                : "-"}
            </span>
          </div>

          <div className="qv-questions-list">
            {questions.length === 0 && (
              <p style={{ padding: "20px" }}>No questions added yet.</p>
            )}

            {questions.map((q, qIndex) => (
              <div className="qv-question-block" key={qIndex}>
                <div className="qv-question-row">
                  <span className="qv-question-text">
                    {qIndex + 1}. {q.text || "Question"}
                  </span>

                  <span className="qv-answer-tag">
                    Ans: {getAnswerText(q)}
                  </span>
                </div>

                <div className="qv-options-row">
                  {(q.options || q.choices || []).map((opt, optIndex) => (
                    <label className="qv-option" key={optIndex}>
                      <input type="radio" disabled />
                      <span>{opt.text || opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="qv-actions">
            <button
              className="qv-view-submission-btn"
              onClick={() => {
                navigate(`/teacher/classes/quizzes/${quizId}/submissions`);
              }}
            >
              View Submission
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
