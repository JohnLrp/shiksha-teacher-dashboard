import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import "../styles/quizzes.css";
import api from "../api/apiClient"; 

export default function Quizzes() {
  const navigate = useNavigate();
  const { subjectId } = useParams();

  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        const res = await api.get(
          `/teacher/subjects/${subjectId}/quizzes/`
        );

        setQuizzes(res.data.results || res.data);
      } catch (err) {
        console.error("Failed to load quizzes", err);
      }
    }

    fetchQuizzes();
  }, [subjectId]);

  const handlePublish = async (quizId) => {
  try {
    await api.patch(`/teacher/quizzes/${quizId}/publish/`);

    alert("Quiz published successfully");

    // refresh list
    const res = await api.get(`/teacher/subjects/${subjectId}/quizzes/`);
    setQuizzes(res.data.results || res.data);

  } catch (err) {
    console.error(err);
    alert("Failed to publish quiz");
  }
};

  return (
    <div className="quizzes-page">

      <button
        className="quizzes-back-btn"
        onClick={() => navigate(`/teacher/classes/${subjectId}`)}
      >
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
          <button
            className="quizzes-create-btn"
            onClick={() =>
              navigate(
                `/teacher/classes/${subjectId}/quizzes/create`
              )
            }
          >
            + Create New Quiz
          </button>
        </div>

        <div className="quizzes-list">
          {quizzes.length === 0 && (
            <p className="quizzes-empty">
              No quizzes created yet. Click "Create New Quiz" to get started.
            </p>
          )}

          {quizzes.map((quiz, index) => (
            <div className="quiz-row" key={quiz.id || index}>
              <div className="quiz-info">

                {/* FIX 1 — show title instead of UUID */}
                <span className="quiz-id">{quiz.title}</span>

                {/* Optional: show short ID */}
                <span className="quiz-name">ID: {quiz.id.slice(0,8)}</span>

              </div>

              <div className="quiz-detail">
                <span className="quiz-label">Created:</span>

                {/* FIX 2 — use created_at */}
                <span className="quiz-value">
                  {quiz.created_at
                    ? new Date(quiz.created_at).toLocaleString()
                    : "-"}
                </span>
              </div>

              <div className="quiz-detail">
                <span className="quiz-label">Questions:</span>

                {/* FIX 3 — use questions_count */}
                <span className="quiz-value bold">
                  {quiz.questions_count ?? 0}
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
            <button
               className="quiz-view-btn"
               onClick={() =>
                navigate(
                   `/teacher/classes/${subjectId}/quizzes/${quiz.id}`
                )
               }
            >
            View
            </button>

             {!quiz.is_published && (
             <button
                className="quiz-publish-btn"
                onClick={() => handlePublish(quiz.id)}
             >
              Publish
             </button>
             )}

            {quiz.is_published && (
              <span style={{ color: "green", fontWeight: "600" }}>
              Published
            </span>
            )}
            </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}