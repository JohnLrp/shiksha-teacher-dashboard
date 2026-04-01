import { useEffect, useState } from "react";
import { FiUsers, FiHome} from "react-icons/fi";
import { MdDashboard } from "react-icons/md";
import { FaChalkboardTeacher } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { RiLockLine, RiLiveLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import logo from "../assets/Shiksha.svg";
import "../styles/sidebar.css";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await api.get("/courses/teacher/my-classes/");
        setClasses(res.data);
      } catch (err) {
        console.error("Failed to load teacher classes", err);
      }
    }

    fetchClasses();
  }, []);

  return (
    <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-top">
        <div className="sidebar-logo">
          <img src={logo} alt="ShikshaCom" />
          <div>
            <h3>ShikshaCom</h3>
            <p>Empowerment Through Education</p>
          </div>
        </div>

        <button
          className="sidebar-close"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <IoClose />
        </button>
      </div>

      <nav>
        <div
          className="menu-item"
          onClick={() => {
            navigate("/teacher/dashboard");
            setSidebarOpen(false);
          }}
        >
          <MdDashboard />
          <span>Dashboard</span>
        </div>

        {/* Student List — navigates to /teacher/students */}
        <div
          className="menu-item"
          onClick={() => {
            navigate("/teacher/students");
            setSidebarOpen(false);
          }}
        >
          <FiUsers />
          <span>Student List</span>
        </div>

        <div className="menu-item menu-label">
          <FaChalkboardTeacher />
          <span>Classes</span>
        </div>

        <div className="submenu">
          {classes.length === 0 && (
            <p style={{ opacity: 0.6 }}>No classes</p>
          )}

          {classes.map((cls) => (
            <p
              key={cls.subject_id}
              onClick={() => {
                navigate(`/teacher/classes/${cls.subject_id}`);
                setSidebarOpen(false);
              }}
            >
              {cls.subject_name} ({cls.course_title})
            </p>
          ))}
        </div>

        <div
          className="menu-item"
          onClick={() => {
            navigate("/teacher/live-sessions");
            setSidebarOpen(false);
          }}
        >
          <RiLiveLine />
          <span>Live Sessions</span>
        </div>

        <div
          className="menu-item"
          onClick={() => {
            navigate("/teacher/private-sessions");
            setSidebarOpen(false);
          }}
        >
          <RiLockLine />
          <span>Private Sessions</span>
        </div>
            </nav>
      <div className="sidebar__bottom">
        <a
          href="https://shikshacom.com"
          className="sidebar__homeBtn"
        >
          <FiHome />
          Return to Homepage
        </a>
      </div>
    </aside>
  );
}