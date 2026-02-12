import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import "../styles/quiz-submission-view.css";

const dummyStudents = [
  { name: "Lalthanfelaloa", submittedOn: "2026-01-28", status: "Submitted", score: "8/12" },
  { name: "Lalhruaitluanga chakma", submittedOn: "2026-01-28", status: "Submitted", score: "8/12" },
  { name: "Baraba Lalhruiazela", submittedOn: "2026-01-28", status: "Submitted", score: "2/12" },
  { name: "John Lalruavaklopuia", submittedOn: "2026-01-29", status: "Submitted", score: "8/12" },
  { name: "Simon kovel", submittedOn: "2026-01-30", status: "Submitted", score: "1/12" },
  
  { name: "John Lilpuia", submittedOn: null, status: "Pending", score: null },
  { name: "John Puia", submittedOn: null, status: "Pending", score: null },
];

export default function QuizSubmissionView() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [activeTab, setActiveTab] = useState("Submitted");
  const [search, setSearch] = useState("");

  const title = state?.title || "Mathematics Assignment - ID";
  const students = state?.students || dummyStudents;

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const total = students.length;
  const submittedStudents = students.filter((s) => s.status === "Submitted");
  const pendingStudents = students.filter((s) => s.status === "Pending");

  const filtered = activeTab === "Submitted" ? submittedStudents : pendingStudents;
  const displayStudents = filtered.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const countDisplay =
    activeTab === "Submitted"
      ? `${submittedStudents.length}/${total}`
      : `${pendingStudents.length}/${total}`;

  return (
    <div className="qsv-page">
      <button className="qsv-back-btn" onClick={() => navigate("/teacher/classes/quizzes")}>
        <IoChevronBack /> Back
      </button>

      <div className="qsv-content-card">                             
        <div className="qsv-title-row">                              
          <h2 className="qsv-title">{title}</h2>
          <span
            className={
              activeTab === "Submitted"
                ? "qsv-count qsv-count-green"
                : "qsv-count qsv-count-red"
            }
          >
            {countDisplay}
          </span>
        </div>

        <div className="qsv-tabs-search-row">
          <div className="qsv-tabs">
            <button
              className={`qsv-tab ${activeTab === "Pending" ? "qsv-tab-active-pending" : ""}`}
              onClick={() => setActiveTab("Pending")}
            >
              Pending
            </button>
            <button
              className={`qsv-tab ${activeTab === "Submitted" ? "qsv-tab-active-submitted" : ""}`}
              onClick={() => setActiveTab("Submitted")}
            >
              Submitted
            </button>
          </div>
          <div className="qsv-search">
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FiSearch className="qsv-search-icon" />
          </div>
        </div>

        <table className="qsv-table">
          <thead>
            <tr>
              <th>Sl No.</th>
              <th>Name</th>
              <th>Submitted On:</th>
              <th>Status</th>
              <th>Score</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {displayStudents.map((student, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{student.name}</td>
                <td>{formatDate(student.submittedOn)}</td>
                <td>
                  <span
                    className={
                      student.status === "Submitted"
                        ? "qsv-status-submitted"
                        : "qsv-status-pending"
                    }
                  >
                    {student.status}
                  </span>
                </td>
                <td>{student.score || "-"}</td>
                <td>
                  <button
                    className="qsv-review-btn"
                    onClick={() =>
                      navigate("/teacher/classes/quizzes/view/submissions/review", {
                        state: {
                          studentName: student.name,
                          submittedDate: formatDate(student.submittedOn),
                          score: student.score,
                        },
                      })
                    }
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
