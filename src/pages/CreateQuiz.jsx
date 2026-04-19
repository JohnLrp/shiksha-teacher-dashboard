import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/create-quiz.css";

const createEmptyQuestion = () => ({
  question: "",
  options: ["", "", "", ""],
  answerIndex: null,
  explanation: "",
});

const createEmptyError = () => ({
  question: "",
  options: ["", "", "", ""],
  answer: "",
  explanation: "",
});

const TIME_PRESETS = [5, 10, 15, 30];

/* ── tiny inline popup ── */
function FieldError({ msg, onDismiss }) {
  const [visible, setVisible] = useState(true);
  if (!msg || !visible) return null;
  const dismiss = () => { setVisible(false); onDismiss?.(); };
  return (
    <div className="cq-field-error" role="alert">
      <span className="cq-field-error-icon">!</span>
      {msg}
      <button className="cq-field-error-close" type="button" onClick={dismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}

export default function CreateQuiz() {
  const navigate = useNavigate();
  const { subjectId } = useParams();

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([createEmptyQuestion()]);
  const [loading, setLoading] = useState(false);
  const [timeLimit, setTimeLimit] = useState(10);
  const [customTime, setCustomTime] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  /* ── validation errors ── */
  const [titleError, setTitleError] = useState("");
  const [qErrors, setQErrors] = useState([createEmptyError()]);

  const effectiveTimeLimit = useCustom ? parseInt(customTime) || 5 : timeLimit;

  /* ── helpers to clear a specific error on user interaction ── */
  const clearTitleError = () => setTitleError("");

  const clearQError = (qIdx, field, optIdx = null) => {
    setQErrors((prev) => {
      const copy = prev.map((e) => ({ ...e, options: [...e.options] }));
      if (field === "option" && optIdx !== null) {
        copy[qIdx].options[optIdx] = "";
      } else {
        copy[qIdx][field] = "";
      }
      return copy;
    });
  };

  /* ── question state updaters ── */
  const updateQuestion = (index, value) => {
    const copy = [...questions];
    copy[index].question = value;
    setQuestions(copy);
    clearQError(index, "question");
  };

  const updateOption = (qIndex, optIndex, value) => {
    const copy = [...questions];
    copy[qIndex].options[optIndex] = value;
    setQuestions(copy);
    clearQError(qIndex, "option", optIndex);
  };

  const updateExplanation = (index, value) => {
    const copy = [...questions];
    copy[index].explanation = value;
    setQuestions(copy);
    clearQError(index, "explanation");
  };

  const setCorrectAnswer = (qIndex, optIndex) => {
    const copy = [...questions];
    copy[qIndex].answerIndex = optIndex;
    setQuestions(copy);
    clearQError(qIndex, "answer");
  };

  const addQuestion = () => {
    setQuestions([...questions, createEmptyQuestion()]);
    setQErrors((prev) => [...prev, createEmptyError()]);
  };

  /* ── delete a specific question ── */
  const deleteQuestion = (index) => {
    if (questions.length === 1) return; // keep at least one
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    setQErrors((prev) => prev.filter((_, i) => i !== index));
  };

  /* ── cancel handlers ── */
  const handleCancel = () => {
    const hasContent =
      title.trim() ||
      questions.some(
        (q) =>
          q.question.trim() ||
          q.options.some((o) => o.trim()) ||
          q.explanation.trim()
      );
    if (hasContent) {
      setShowCancelModal(true);
    } else {
      navigate(`/teacher/classes/${subjectId}/quizzes`);
    }
  };

  /* ── validate and return true if all fields are valid ── */
  const validate = () => {
    let valid = true;

    let newTitleError = "";
    if (!title.trim()) {
      newTitleError = "Quiz title is required.";
      valid = false;
    }
    setTitleError(newTitleError);

    const newQErrors = questions.map((q) => {
      const err = createEmptyError();

      if (!q.question.trim()) {
        err.question = "Question text is required.";
        valid = false;
      }

      q.options.forEach((opt, i) => {
        if (!opt.trim()) {
          err.options[i] = `Option ${String.fromCharCode(97 + i).toUpperCase()} is required.`;
          valid = false;
        }
      });

      if (q.answerIndex === null) {
        err.answer = "Please select the correct answer.";
        valid = false;
      }

      if (!q.explanation.trim()) {
        err.explanation = "Explanation is required.";
        valid = false;
      }

      return err;
    });

    setQErrors(newQErrors);
    return valid;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const quizRes = await api.post("/teacher/quizzes/", {
        subject: subjectId,
        title,
        description: "",
        // due_date removed — quizzes no longer expire
        time_limit_minutes: effectiveTimeLimit,
      });

      const quizId = quizRes.data.id;

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await api.post(`/teacher/quizzes/${quizId}/questions/`, {
          text: q.question,
          order: i + 1,
          marks: 1,
          explanation: q.explanation,
          choices: q.options.map((opt, index) => ({
            text: opt,
            is_correct: index === q.answerIndex,
          })),
        });
      }

      alert("Quiz created successfully");
      navigate(`/teacher/classes/${subjectId}/quizzes`);
    } catch (err) {
      alert(err.response?.data?.detail || "Quiz creation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-quiz-page">
      <button type="button" className="cq-back-btn" onClick={handleCancel}>
        ← Back
      </button>

      <div className="cq-shell">
        <div className="cq-title-container">
          {/* Quiz title */}
          <div className="cq-title-field">
            <input
              className={`cq-title-input ${titleError ? "cq-input-error" : ""}`}
              type="text"
              placeholder="Quiz Title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); clearTitleError(); }}
            />
            <FieldError msg={titleError} />
          </div>

          {/* Timer picker */}
          <div className="cq-timer-picker">
            <span className="cq-timer-label">⏱ Time limit</span>
            <div className="cq-timer-presets">
              {TIME_PRESETS.map((min) => (
                <button
                  key={min}
                  type="button"
                  className={`cq-timer-btn ${!useCustom && timeLimit === min ? "active" : ""}`}
                  onClick={() => { setTimeLimit(min); setUseCustom(false); }}
                >
                  {min} min
                </button>
              ))}
              <button
                type="button"
                className={`cq-timer-btn ${useCustom ? "active" : ""}`}
                onClick={() => setUseCustom(true)}
              >
                Custom
              </button>
            </div>

            {useCustom && (
              <input
                className="cq-timer-custom-input"
                type="number"
                min="1"
                placeholder="Enter minutes"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                autoFocus
              />
            )}

            <span className="cq-timer-display">{effectiveTimeLimit} min selected</span>
          </div>
        </div>

        <div className="cq-form-container">
          <div className="cq-questions-list">
            {questions.map((q, qIndex) => {
              const err = qErrors[qIndex] || createEmptyError();
              return (
                <div key={qIndex} className="cq-question-block">

                  {/* Question header with delete button */}
                  <div className="cq-question-top">
                    <span className="cq-qno">Q{qIndex + 1}.</span>
                    <div style={{ flex: 1 }}>
                      <input
                        className={`cq-question-input ${err.question ? "cq-input-error" : ""}`}
                        placeholder="Enter Question"
                        value={q.question}
                        onChange={(e) => updateQuestion(qIndex, e.target.value)}
                      />
                      <FieldError msg={err.question} />
                    </div>
                    {/* Only show delete if more than one question */}
                    {questions.length > 1 && (
                      <button
                        type="button"
                        className="cq-delete-question-btn"
                        onClick={() => deleteQuestion(qIndex)}
                        title="Remove this question"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Options */}
                  <div className="cq-options-grid">
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="cq-option-row">
                        <span className="cq-option-letter">
                          {String.fromCharCode(97 + optIndex)})
                        </span>
                        <div style={{ flex: 1 }}>
                          <input
                            className={`cq-option-input ${err.options[optIndex] ? "cq-input-error" : ""}`}
                            placeholder={`Option ${optIndex + 1}`}
                            value={opt}
                            onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                          />
                          <FieldError msg={err.options[optIndex]} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Answer picker */}
                  <div className="cq-answer-row">
                    <span className="cq-answer-label">Answer:</span>
                    <div>
                      <div className="cq-answer-choices">
                        {q.options.map((_, optIndex) => (
                          <label key={optIndex} className="cq-answer-choice">
                            <input
                              type="radio"
                              name={`correct-answer-${qIndex}`}
                              checked={q.answerIndex === optIndex}
                              onChange={() => setCorrectAnswer(qIndex, optIndex)}
                            />
                            <span>{String.fromCharCode(97 + optIndex)}</span>
                          </label>
                        ))}
                      </div>
                      <FieldError msg={err.answer} />
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="cq-explanation-row">
                    <span className="cq-answer-label">Explanation:</span>
                    <div style={{ flex: 1 }}>
                      <textarea
                        className={`cq-explanation-input ${err.explanation ? "cq-input-error" : ""}`}
                        placeholder="Explain why this is the correct answer..."
                        value={q.explanation}
                        onChange={(e) => updateExplanation(qIndex, e.target.value)}
                      />
                      <FieldError msg={err.explanation} />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          <div className="cq-bottom-row">
            <button
              type="button"
              className="cq-cancel-btn"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="button" className="cq-add-question-btn" onClick={addQuestion}>
              Add Question
            </button>
            <button
              type="button"
              className="cq-create-btn"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div className="quiz-modal-overlay">
          <div className="quiz-modal-box">
            <h3>Discard Quiz?</h3>
            <p>
              You have unsaved content.
              <br /><br />
              ⚠️ All your work will be lost if you leave.
            </p>
            <div className="quiz-modal-actions">
              <button
                className="quiz-btn-cancel"
                onClick={() => setShowCancelModal(false)}
              >
                Keep Editing
              </button>
              <button
                className="quiz-btn-exit"
                onClick={() => navigate(`/teacher/classes/${subjectId}/quizzes`)}
              >
                Discard & Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
