import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdExpandMore, MdExpandLess } from "react-icons/md";

export default function QuizItem({
  id,
  title,
  subject,
  dueDate,
  submissionRate,
  avgScore,
  highest,
  lowest,
  subjectId,
  defaultExpanded = false,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const navigate = useNavigate();

  return (
    <div className="acc-item">
      <div className="acc-header" onClick={() => setExpanded(!expanded)}>
        <span className="acc-id">{title}</span>
        {expanded ? (
          <MdExpandLess className="acc-arrow" />
        ) : (
          <MdExpandMore className="acc-arrow" />
        )}
      </div>

      {expanded && (
        <div className="acc-body">

          <p className="acc-line">
            <strong>Subject:</strong> {subject}
          </p>

          <p className="acc-line">
            <strong>Due Date:</strong>{" "}
            {new Date(dueDate).toLocaleString()}
          </p>

          <p className="acc-line">
            <strong>Submission Rate:</strong> {submissionRate}%
          </p>

          <p className="acc-line">
            <strong>Average Score:</strong>{" "}
            {avgScore ?? "N/A"}
          </p>

          <p className="acc-line">
            <strong>Highest:</strong> {highest ?? "-"} &nbsp;
            <strong>Lowest:</strong> {lowest ?? "-"}
          </p>

          <button
            className="btn-view-sub"
            onClick={() =>
              navigate(
                `/teacher/classes/${subjectId}/quizzes/${id}/submissions`
              )
            }
          >
            View Submissions
          </button>

        </div>
      )}
    </div>
  );
}