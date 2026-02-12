import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import { IoMdAdd } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import "../styles/create-quiz.css";

const createEmptyQuestion = () => ({
  question: "",
  options: ["", "", "", ""],
  answer: "",
});

const optionLabels = ["a", "b", "c", "d"];

export default function CreateQuiz() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const isEditing = !!state?.id;

  const [questions, setQuestions] = useState(
    state?.questions?.length ? state.questions : [createEmptyQuestion()]
  );

  const updateQuestion = (qIndex, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (qIndex, optIndex, value) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, j) => (j === optIndex ? value : o)) }
          : q
      )
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const removeQuestion = (qIndex) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== qIndex));
  };

  const handleCreate = () => {
    const existing = JSON.parse(localStorage.getItem("quizzes") || "[]");

    if (isEditing) {
      const updatedQuiz = { ...state, questions };
      const updated = existing.map((q) =>
        q.id === state.id ? updatedQuiz : q
      );
      localStorage.setItem("quizzes", JSON.stringify(updated));
      navigate("/teacher/classes/quizzes/view", { state: updatedQuiz });
    } else {
      const quiz = {
        id: Date.now(),
        title: "Mathematics Quiz",
        subject: "Mathematics",
        questions,
        dateCreated: new Date().toLocaleDateString(),
      };
      localStorage.setItem("quizzes", JSON.stringify([...existing, quiz]));
      navigate("/teacher/classes/quizzes/view", { state: quiz });
    }
  };

  return (
    <div className="create-quiz-page">
      <button className="cq-back-btn" onClick={() => navigate(-1)}>
        <IoChevronBack /> Back
      </button>

      <div className="cq-title-container">
        <h2 className="cq-title">Mathematics</h2>
        <div className="cq-search">
          <input type="text" placeholder="Search" />
          <FiSearch className="cq-search-icon" />
        </div>
      </div>

      <div className="cq-form-container">
        <div className="cq-questions-list">
          {questions.map((q, qIndex) => (
            <div className="cq-question-block" key={qIndex}>
              <div className="cq-question-header">
                <span className="cq-question-label">Q{qIndex + 1}.</span>
                <input
                  type="text"
                  className="cq-question-input"
                  placeholder="Enter question"
                  value={q.question}
                  onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                />
                {questions.length > 1 && (
                  <button
                    className="cq-remove-btn"
                    onClick={() => removeQuestion(qIndex)}
                    title="Remove question"
                  >
                    <MdDelete />
                  </button>
                )}
              </div>

              <div className="cq-options-grid">
                {q.options.map((opt, optIndex) => (
                  <div className="cq-option-row" key={optIndex}>
                    <span className="cq-option-label">{optionLabels[optIndex]})</span>
                    <input
                      type="text"
                      className="cq-option-input"
                      placeholder={`Option ${optionLabels[optIndex]}`}
                      value={opt}
                      onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="cq-answer-row">
                <span className="cq-answer-label">Answer:</span>
                <input
                  type="text"
                  className="cq-answer-input"
                  placeholder="a"
                  value={q.answer}
                  onChange={(e) => updateQuestion(qIndex, "answer", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <button className="cq-add-question-btn" onClick={addQuestion}>
          <IoMdAdd /> Add Question
        </button>

        <div className="cq-actions">
          <button className="cq-create-btn" onClick={handleCreate}>
            {isEditing ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
