/**
 * HOW TO ADD CANCEL BUTTON TO YOUR EXISTING CreateQuiz.jsx
 * 
 * Since your CreateQuiz wasn't uploaded, add these changes manually:
 */

// ── 1. Add state for cancel confirmation modal ────────────────────────────
const [showCancelModal, setShowCancelModal] = useState(false);

// ── 2. Add this handler ───────────────────────────────────────────────────
const handleCancel = () => {
  // If any questions have been filled, warn before discarding
  const hasContent = questions.some(q => q.text || q.options?.some(o => o));
  if (hasContent) {
    setShowCancelModal(true);
  } else {
    navigate(`/teacher/classes/${subjectId}/quizzes`);
  }
};

const confirmCancel = async () => {
  // If quiz was already created on the backend (has an id), delete it first
  if (quizId) {
    try {
      await api.delete(`/teacher/quizzes/${quizId}/delete/`);
    } catch (err) {
      // ignore — quiz may not exist yet
    }
  }
  navigate(`/teacher/classes/${subjectId}/quizzes`);
};

// ── 3. Add Cancel button next to your existing "Add Question" / "Create" buttons ──
// Find the bottom bar in your JSX (where Add Question and Create buttons are)
// and add a Cancel button:

<div className="create-quiz-actions">
  <button
    type="button"
    className="quiz-cancel-btn"
    onClick={handleCancel}
  >
    Cancel
  </button>
  <button type="button" onClick={handleAddQuestion}>
    Add Question
  </button>
  <button type="button" className="quiz-create-btn" onClick={handleCreate}>
    Create
  </button>
</div>

// ── 4. Add the confirmation modal anywhere in your JSX return ─────────────
{showCancelModal && (
  <div className="quiz-modal-overlay">
    <div className="quiz-modal-box">
      <h3>Discard Quiz?</h3>
      <p>
        You have unsaved questions.
        <br /><br />
        ⚠️ All your work will be lost if you cancel.
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
          onClick={confirmCancel}
        >
          Discard & Leave
        </button>
      </div>
    </div>
  </div>
)}

// ── 5. Add CSS for cancel button (add to your quiz CSS file) ──────────────
/*
.quiz-cancel-btn {
  background: #f3f4f6;
  color: #6b7280;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
}
.quiz-cancel-btn:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}
*/
