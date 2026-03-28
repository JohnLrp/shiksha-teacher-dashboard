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
  const [publishingId, setPublishingId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        const res = await api.get(`/teacher/subjects/${subjectId}/quizzes/`);
        setQuizzes(res.data.results || res.data);
      } catch (err) {
        console.error("Failed to load quizzes", err);
      }
    }
    fetchQuizzes();
  }, [subjectId]);

  const handlePublish = async (quizId) => {
    setPublishingId(quizId);
    try {
      await api.patch(`/teacher/quizzes/${quizId}/publish/`);
      const res = await api.get(`/teacher/subjects/${subjectId}/quizzes/`);
      setQuizzes(res.data.results || res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to publish quiz");
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    try {
      await api.delete(`/teacher/quizzes/${quizId}/`);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete quiz");
    }
  };

  return (
    <div className="quizzes-page">

      {/* ── Publish warning modal ── */}
      {showModal && (
        <div className="qz-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="qz-modal" onClick={(e) => e.stopPropagation()}>
            <div className="qz-modal-icon">⚠️</div>
            <h3 className="qz-modal-title">Quiz Not Published</h3>
            <p className="qz-modal-msg">
              This quiz must be published before it can be viewed.
            </p>
            <button className="qz-modal-btn" onClick={() => setShowModal(false)}>
              Got it
            </button>
          </div>
        </div>
      )}

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
            onClick={() => navigate(`/teacher/classes/${subjectId}/quizzes/create`)}
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
                <span className="quiz-id">{quiz.title}</span>
                <span className="quiz-name">ID: {quiz.id.slice(0, 8)}</span>
                <span className="quiz-creator">{quiz.teacher_name || quiz.created_by_email}</span>
              </div>

              <div className="quiz-detail">
                <span className="quiz-label">Created:</span>
                <span className="quiz-value">
                  {quiz.created_at ? new Date(quiz.created_at).toLocaleString() : "-"}
                </span>
              </div>

              <div className="quiz-detail">
                <span className="quiz-label">Questions:</span>
                <span className="quiz-value bold">{quiz.questions_count ?? 0}</span>
              </div>

              <div className="quiz-actions">
                <button
                  className="quiz-view-btn"
                  onClick={() => {
                    if (!quiz.is_published) {
                      setShowModal(true);
                      return;
                    }
                    navigate(`/teacher/classes/${subjectId}/quizzes/${quiz.id}`);
                  }}
                >
                  View
                </button>

                {quiz.is_published ? (
                  <span className="quiz-published-badge">✓ Published</span>
                ) : (
                  <button
                    className={`quiz-publish-btn ${publishingId === quiz.id ? "loading" : ""}`}
                    onClick={() => handlePublish(quiz.id)}
                    disabled={publishingId === quiz.id}
                  >
                    {publishingId === quiz.id ? "Publishing…" : "Publish"}
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}