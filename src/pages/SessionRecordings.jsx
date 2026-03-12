import { useNavigate, useParams } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import "../styles/session-recordings.css";

const defaultRecordings = [
  { subject: "Subject Name", topic: "Title/Topic", teacher: "Teacher's Name", date: "Date", duration: "Duration" },
  { subject: "Subject Name", topic: "Title/Topic", teacher: "Teacher's Name", date: "Date", duration: "Duration" },
  { subject: "Subject Name", topic: "Title/Topic", teacher: "Teacher's Name", date: "Date", duration: "Duration" },
  { subject: "Subject Name", topic: "Title/Topic", teacher: "Teacher's Name", date: "Date", duration: "Duration" },
  { subject: "Subject Name", topic: "Title/Topic", teacher: "Teacher's Name", date: "Date", duration: "Duration" },
  { subject: "Subject Name", topic: "Title/Topic", teacher: "Teacher's Name", date: "Date", duration: "Duration" },
];

export default function SessionRecordings() {

  const navigate = useNavigate();
  const { subjectId } = useParams();   // 👈 important

  return (
    <div className="sr-page">

      <button
        className="sr-back-btn"
        onClick={() => navigate(-1)}
      >
        <IoChevronBack /> Back
      </button>

      <div className="sr-content">

        <div className="sr-header">

          <h2 className="sr-title">Mathematics</h2>

          <div className="sr-search">
            <input type="text" placeholder="Search" />
            <FiSearch className="sr-search-icon" />
          </div>

        </div>

        <div className="sr-actions">

          <button
            className="sr-add-btn"
            onClick={() =>
              navigate(`/teacher/classes/${subjectId}/session-recordings/upload`)
            }
          >
            + Add Session Recording
          </button>

        </div>

        <div className="sr-grid">

          {defaultRecordings.map((rec, index) => (

            <div className="sr-card" key={index}>

              <h4 className="sr-card-subject">{rec.subject}</h4>

              <p className="sr-card-topic">{rec.topic}</p>

              <p className="sr-card-teacher">{rec.teacher}</p>

              <div className="sr-card-bottom">

                <span className="sr-card-date">{rec.date}</span>

                <span className="sr-card-duration">{rec.duration}</span>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}