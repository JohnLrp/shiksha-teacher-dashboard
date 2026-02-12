import { MdDashboard } from "react-icons/md";
import { FaChalkboardTeacher } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Shiksha.svg";
import "../styles/sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={logo} alt="ShikshaCom" />
        <div>
          <h3>ShikshaCom</h3>
          <p>Empowerment Through Education</p>
        </div>
      </div>

      <nav>
        <div className="menu-item" onClick={() => navigate("/teacher/dashboard")}>
          <MdDashboard />
          <span>Dashboard</span>
        </div>

        <div className="menu-item" onClick={() => navigate("/teacher/classes")}>
          <FaChalkboardTeacher />
          <span>Classes</span>
        </div>

        <div className="submenu">
          <p onClick={() => navigate("/teacher/classes")}>Math (Class 8) BY23</p>
          <p onClick={() => navigate("/teacher/classes")}>Math (Class 8) BY26</p>
        </div>
      </nav>
    </aside>
  );
}
