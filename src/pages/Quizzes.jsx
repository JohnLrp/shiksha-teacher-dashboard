import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import "../styles/quizzes.css";

export default function Quizzes() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("quizzes") || "[]");
    setQuizzes(stored);
  }, []);

  return (
    <div className="quizzes-page">

      <button className="quizzes-back-btn" onClick={() => navigate("/teacher/classes")}>
        <IoChevronBack /> Back
      </button>

      <div className="quizzes-title-container">
        <h2 className="quizzes-title">Mathematics</h2>
        <div className="quizzes-search">
          <input type="text" placeholder="Search" />
          <FiSearch className="quizzes-search-icon" />
        </div>
      </div>

      <div className="quizzes-list-container">
        <div className="quizzes-actions">
          <button className="quizzes-create-btn" onClick={() => navigate("/teacher/classes/quizzes/create")}>+ Create New Quiz</button>
        </div>

        <div className="quizzes-list">
          {quizzes.length === 0 && (
            <p className="quizzes-empty">No quizzes created yet. Click "Create New Quiz" to get started.</p>
          )}
          {quizzes.map((quiz, index) => (
            <div className="quiz-row" key={quiz.id || index}>
              <div className="quiz-info">
                <span className="quiz-id">Quiz - {quiz.id}</span>
                <span className="quiz-name">{quiz.title}</span>
              </div>
              <div className="quiz-detail">
                <span className="quiz-label">Created:</span>
                <span className="quiz-value">{quiz.dateCreated}</span>
              </div>
              <div className="quiz-detail">
                <span className="quiz-label">Questions:</span>
                <span className="quiz-value bold">{quiz.questions?.length || 0}</span>
              </div>
              <button
                className="quiz-view-btn"
                onClick={() =>
                  navigate("/teacher/classes/quizzes/view", {
                    state: quiz,
                  })
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
