import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/create-quiz.css";

const createEmptyQuestion = () => ({
  question: "",
  options: ["", "", "", ""],
  answerIndex: null,
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
      setLoading(true);

      // 1️⃣ Create Quiz
      const quizRes = await api.post("/teacher/quizzes/", {
        subject: subjectId,
        title,
        description: "",
        due_date: new Date(Date.now() + 86400000).toISOString(),
        time_limit_minutes: 30,
      });

      const quizId = quizRes.data.id;

      // 2️⃣ Add Questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];

        await api.post(`teacher/quizzes/${quizId}/questions/`, {
          text: q.question,
          order: i + 1,
          marks: 1,
          choices: q.options.map((opt, index) => ({
            text: opt,
            is_correct: index === q.answerIndex,
          })),
        });
      }

      alert("Quiz created successfully");

      navigate(`/teacher/classes/${subjectId}/quizzes`);

    } catch (err) {
      alert(
        err.response?.data?.detail || "Quiz creation failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="createQuizPage">
      <h2>Create Quiz</h2>

      <input
        placeholder="Quiz Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {questions.map((q, qIndex) => (
        <div key={qIndex} className="questionBlock">
          <input
            placeholder={`Question ${qIndex + 1}`}
            value={q.question}
            onChange={(e) => updateQuestion(qIndex, e.target.value)}
          />

          {q.options.map((opt, optIndex) => (
            <div key={optIndex}>
              <input
                placeholder={`Option ${optIndex + 1}`}
                value={opt}
                onChange={(e) =>
                  updateOption(qIndex, optIndex, e.target.value)
                }
              />

              <input
                type="radio"
                checked={q.answerIndex === optIndex}
                onChange={() =>
                  setCorrectAnswer(qIndex, optIndex)
                }
              />
              Correct
            </div>
          ))}
        </div>
      ))}

      <button onClick={addQuestion}>
        Add Question
      </button>

      <button onClick={handleCreate} disabled={loading}>
        {loading ? "Creating..." : "Create Quiz"}
      </button>
    </div>
  );
}