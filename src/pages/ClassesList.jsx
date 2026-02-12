import { useNavigate } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import SearchBar from "../components/SearchBar";
import "../styles/classes-list.css";

const teacherClasses = [
  { id: 1, name: "Math (Class 8) BY23", students: 32, subject: "Mathematics" },
  { id: 2, name: "Math (Class 8) BY26", students: 28, subject: "Mathematics" },
  { id: 3, name: "Science (Class 9) BY23", students: 35, subject: "Science" },
  { id: 4, name: "English (Class 7) BY24", students: 30, subject: "English" },
];

export default function ClassesList() {
  const navigate = useNavigate();

  return (
    <div className="cl-wrapper">
      <button className="cl-back-btn" onClick={() => navigate("/teacher/dashboard")}>
        <IoChevronBack /> Back
      </button>
      <div className="cl-container">
        <div className="cl-top">
          <h2>My Classes</h2>
          <SearchBar />
        </div>

        <div className="cl-grid">
          {teacherClasses.map((cls) => (
            <div
              className="cl-card"
              key={cls.id}
              onClick={() =>
                navigate("/teacher/classes/view", {
                  state: { className: cls.name, subject: cls.subject },
                })
              }
            >
              <p className="cl-card-name">{cls.name}</p>
              <div className="cl-card-right">
                <span className="cl-card-count">{cls.students}</span>
                <span className="cl-card-label">Students</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
