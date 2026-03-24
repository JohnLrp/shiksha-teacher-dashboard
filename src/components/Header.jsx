import { useAuth } from "../contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineMenuAlt3 } from "react-icons/hi";
import api from "../api/apiClient";
import "../styles/header.css";

export default function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [avatar, setAvatar] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    const storedAvatar = localStorage.getItem("avatar");
    if (storedAvatar) {
      setAvatar(storedAvatar);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/accounts/logout/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("avatar");
      localStorage.removeItem("user");
      localStorage.removeItem("teacher");
      sessionStorage.clear();

      setOpen(false);
      window.location.href = "https://www.shikshacom.com/login";
    }
  };

  const handleReturnToHomepage = () => {
    setOpen(false);
    window.location.href = "https://www.shikshacom.com/";
  };

  return (
    <header className="header">
      <button
        className="hamburgerBtn"
        onClick={onMenuClick}
        type="button"
        aria-label="Open sidebar"
      >
        <HiOutlineMenuAlt3 />
      </button>

      <div className="profile-menu" ref={menuRef}>
        <img
          src={avatar || "https://i.pravatar.cc/40?img=3"}
          alt="profile"
          className="profile-img"
          onClick={() => setOpen(!open)}
        />

        {open && (
          <div className="dropdown">
            <div className="dropdown-header">
              <span className="dropdown-username">
  {user?.name || user?.username || "User"}
</span>

              <img
                src={avatar || "https://i.pravatar.cc/40?img=3"}
                alt="profile"
                className="dropdown-avatar"
              />
            </div>

            <hr className="dropdown-divider" />

            <button
              onClick={() => {
                navigate("/teacher/profile");
                setOpen(false);
              }}
            >
              Profile <span className="arrow">›</span>
            </button>

            <button
              onClick={() => {
                navigate("/teacher/change-password");
                setOpen(false);
              }}
            >
              Change Password <span className="arrow">›</span>
            </button>

            <button onClick={handleReturnToHomepage}>
              Return to Homepage <span className="arrow">›</span>
            </button>

            <button onClick={handleLogout}>
              Logout <span className="arrow">▷</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}