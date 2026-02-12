import { useLocation, useNavigate } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import "../styles/quiz-review-view.css";

const dummyQuestions = [
  {
    question: "What is . . .",
    options: ["answer 1", "answer 2", "answer 3", "answer 4"],
    correctAnswer: 0,
    selectedAnswer: 0,
  },
  {
    question: "What is . . .",
    options: ["answer 1", "answer 2", "answer 3", "answer 4"],
    correctAnswer: 2,
    selectedAnswer: 2,
  },
  {
    question: "What is . . .",
    options: ["answer 1", "answer 2", "answer 3", "answer 4"],
    correctAnswer: 3,
    selectedAnswer: 1,
  },
  {
    question: "What is . . .",
    options: ["answer 1", "answer 2", "answer 3", "answer 4"],
    correctAnswer: 1,
    selectedAnswer: 1,
  },
  {
    question: "What is . . .",
    options: ["answer 1", "answer 2", "answer 3", "answer 4"],
    correctAnswer: 3,
    selectedAnswer: 3,
  },
];

export default function QuizReviewView() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const studentName = state?.studentName || "[Student Name]";
  const dueDate = state?.dueDate || "24 Jan 2026";
  const submittedDate = state?.submittedDate || "22 Jan 2026 (7:00 PM)";
  const questions = state?.questions || dummyQuestions;

  const correctCount = questions.filter(
    (q) => q.selectedAnswer === q.correctAnswer
  ).length;

  return (
    <div className="qrv-page">
      <button className="qrv-back-btn" onClick={() => navigate(-1)}>
        <IoChevronBack /> Back
      </button>

      <div className="qrv-card">
        <div className="qrv-header">
          <h2 className="qrv-title">Subject Name - Quiz ID</h2>
          <div className="qrv-search">
            <input type="text" placeholder="Search" />
            <FiSearch className="qrv-search-icon" />
          </div>
        </div>

        <div className="qrv-content">
          <h3 className="qrv-student-name">{studentName}</h3>

          <div className="qrv-dates-row">
            <span className="qrv-date-text">
              Due Date: {dueDate}
            </span>
            <span className="qrv-date-text">
              Submitted: {submittedDate}
            </span>
          </div>

          <div className="qrv-questions-list">
            {questions.map((q, qIndex) => (
              <div className="qrv-question-block" key={qIndex}>
                <div className="qrv-question-text">
                  {qIndex + 1}. {q.question}
                </div>
                <div className="qrv-options-answer-row">
                  <div className="qrv-options-row">
                    {q.options.map((opt, optIndex) => (
                      <label className="qrv-option" key={optIndex}>
                        <input
                          type="radio"
                          checked={q.selectedAnswer === optIndex}
                          disabled
                          readOnly
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                  <span className="qrv-answer-tag">
                    Ans: {q.options[q.correctAnswer]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="qrv-score">
            Score: {correctCount}/{questions.length}
          </div>
        </div>
      </div>
    </div>
  );
}
