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
  const [subjectName, setSubjectName] = useState("");
  const [publishingId, setPublishingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        const res = await api.get(`/teacher/subjects/${subjectId}/quizzes/`);
        const data = res.data.results || res.data;
        setQuizzes(data);
        if (data.length > 0 && data[0].subject_name) {
          setSubjectName(data[0].subject_name);
        }
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
      alert(err.response?.data?.detail || "Failed to publish quiz.");
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    setDeletingId(quizId);
    try {
      // Correct URL matches backend: /teacher/quizzes/<pk>/delete/
      await api.delete(`/teacher/quizzes/${quizId}/delete/`);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete quiz.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (quiz) => {
    if (quiz.is_published) {
      navigate(`/teacher/classes/${subjectId}/quizzes/${quiz.id}`);
    } else {
      navigate(`/teacher/classes/${subjectId}/quizzes/${quiz.id}/draft`);
    }
  };

  const filtered = quizzes.filter((q) =>
    q.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="quizzes-page">
      <button
        className="quizzes-back-btn"
        onClick={() => navigate(`/teacher/classes/${subjectId}`)}
      >
        <IoChevronBack /> Back
      </button>

      <div className="quizzes-title-container">
        <h2 className="quizzes-title">{subjectName || "Quizzes"}</h2>
        <div className="quizzes-search">
          <input
            type="text"
            placeholder="Search quizzes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
          {filtered.length === 0 && (
            <p className="quizzes-empty">
              {quizzes.length === 0
                ? 'No quizzes created yet. Click "Create New Quiz" to get started.'
                : "No quizzes match your search."}
            </p>
          )}

          {filtered.map((quiz, index) => (
            <div className="quiz-row" key={quiz.id || index}>

              <div className="quiz-info">
                <span className="quiz-id">{quiz.title}</span>
                <span className="quiz-name">ID: {quiz.id.toString().slice(0, 8)}</span>
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

              <div className="quiz-detail">
                <span className="quiz-label">Due:</span>
                <span className="quiz-value">
                  {quiz.due_date ? new Date(quiz.due_date).toLocaleDateString() : "-"}
                </span>
              </div>

              <div className="quiz-actions">
                <button
                  className="quiz-view-btn"
                  onClick={() => handleView(quiz)}
                >
                  {quiz.is_published ? "View" : "Preview"}
                </button>

                {quiz.is_published ? (
                  <span className="quiz-published-badge">✓ Published</span>
                ) : (
                  <>
                    <button
                      className={`quiz-publish-btn ${publishingId === quiz.id ? "loading" : ""}`}
                      onClick={() => handlePublish(quiz.id)}
                      disabled={publishingId === quiz.id || (quiz.questions_count ?? 0) === 0}
                      title={
                        (quiz.questions_count ?? 0) === 0
                          ? "Add at least one question before publishing"
                          : "Publish this quiz"
                      }
                    >
                      {publishingId === quiz.id ? "Publishing…" : "Publish"}
                    </button>
                    <button
                      className="quiz-delete-btn"
                      onClick={() => handleDelete(quiz.id)}
                      disabled={deletingId === quiz.id}
                    >
                      {deletingId === quiz.id ? "Deleting…" : "Delete"}
                    </button>
                  </>
                )}
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
