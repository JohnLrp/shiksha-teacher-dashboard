import { useLocation, useNavigate } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import "../styles/quiz-view.css";

const optionLabels = ["a", "b", "c", "d"];

export default function QuizView() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const quiz = state || {};
  const questions = quiz.questions || [];

  const getAnswerText = (q) => {
    const answerIndex = optionLabels.indexOf(q.answer?.toLowerCase());
    if (answerIndex >= 0 && q.options[answerIndex]) {
      return q.options[answerIndex];
    }
    return q.answer || "";
  };

  return (
    <div className="quiz-view-page">
      <button className="qv-back-btn" onClick={() => navigate("/teacher/classes/quizzes")}>
        <IoChevronBack /> Back
      </button>

      <div className="qv-header">
        <h2 className="qv-title">Subject Name</h2>
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
            Quiz ({quiz.id || "ID or number"})
          </h3>
          <p className="qv-teacher-info">
            Miss Ruatfeli - {quiz.dateCreated || "21 Jan 2026"}
          </p>
          <div className="qv-dates-row">
            <span className="qv-date-text">
              Due Date: {quiz.dueDate || "24 Jan 2026"}
            </span>
            <span className="qv-date-text">
              Submitted: {quiz.submittedDate || "22 Jan 2026 (7:00 PM)"}
            </span>
          </div>

          <div className="qv-questions-list">
            {questions.map((q, qIndex) => (
              <div className="qv-question-block" key={qIndex}>
                <div className="qv-question-row">
                  <span className="qv-question-text">
                    {qIndex + 1}. {q.question || "What is . . ."}
                  </span>
                  <span className="qv-answer-tag">
                    Ans: {getAnswerText(q)}
                  </span>
                </div>
                <div className="qv-options-row">
                  {q.options.map((opt, optIndex) => (
                    <label className="qv-option" key={optIndex}>
                      <input type="radio" disabled />
                      <span>{opt || `answer ${optIndex + 1}`}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="qv-actions">
            <button
              className="qv-view-submission-btn"
              onClick={() =>
                navigate("/teacher/classes/quizzes/view/submissions", {
                  state: { title: `Mathematics Assignment - ID` },
                })
              }
            >
              View Submission
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
