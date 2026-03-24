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

export default function CreateQuiz() {
  const navigate = useNavigate();
  const { subjectId } = useParams();

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([createEmptyQuestion()]);
  const [loading, setLoading] = useState(false);

  const updateQuestion = (index, value) => {
    const copy = [...questions];
    copy[index].question = value;
    setQuestions(copy);
  };

  const updateOption = (qIndex, optIndex, value) => {
    const copy = [...questions];
    copy[qIndex].options[optIndex] = value;
    setQuestions(copy);
  };

  const updateExplanation = (index, value) => {
    const copy = [...questions];
    copy[index].explanation = value;
    setQuestions(copy);
   };

  const setCorrectAnswer = (qIndex, optIndex) => {
    const copy = [...questions];
    copy[qIndex].answerIndex = optIndex;
    setQuestions(copy);
  };

  const addQuestion = () => {
    setQuestions([...questions, createEmptyQuestion()]);
  };

  const handleCreate = async () => {
    try {

      for (let q of questions) {
        if (!q.explanation.trim()) {
         alert("Explanation is required for all questions");
         return;
        }
      }
      setLoading(true);

      const quizRes = await api.post("/teacher/quizzes/", {
        subject: subjectId,
        title,
        description: "",
        due_date: new Date(Date.now() + 86400000).toISOString(),
        time_limit_minutes: 30,
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
      <button
        type="button"
        className="cq-back-btn"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <div className="cq-shell">
        <div className="cq-title-container">
          <h1 style={{ color: "red" }}>EXPLANATION TEST</h1>

  <input
    className="cq-title-input"
    type="text"
    placeholder="Quiz Title"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
  />

</div>

        <div className="cq-form-container">
          <div className="cq-questions-list">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="cq-question-block">
                <div className="cq-question-top">
                  <span className="cq-qno">Q{qIndex + 1}.</span>
                  <input
                    className="cq-question-input"
                    placeholder="Enter Question"
                    value={q.question}
                    onChange={(e) => updateQuestion(qIndex, e.target.value)}
                  />
                </div>

                <div className="cq-options-grid">
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex} className="cq-option-row">
                      <span className="cq-option-letter">
                        {String.fromCharCode(97 + optIndex)})
                      </span>

                      <input
                        className="cq-option-input"
                        placeholder={`Option ${optIndex + 1}`}
                        value={opt}
                        onChange={(e) =>
                          updateOption(qIndex, optIndex, e.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="cq-answer-row">
                  <span className="cq-answer-label">Answer:</span>

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
                </div>

                <div className="cq-explanation-row">
                  <span className="cq-answer-label">Explanation:</span>
                    <textarea
                      className="cq-explanation-input"
                      placeholder="Explain why this is the correct answer..."
                      value={q.explanation}
                       onChange={(e) => updateExplanation(qIndex, e.target.value)}
                    />
                </div>

              </div>
            ))}
          </div>

          <div className="cq-bottom-row">

  <button
    type="button"
    className="cq-add-question-btn"
    onClick={addQuestion}
  >
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
    </div>
  );
}