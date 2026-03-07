import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/header.css";

export default function Header() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    const storedAvatar = localStorage.getItem("avatar");
    if (storedAvatar) {
      setAvatar(storedAvatar);
    }
  }, []);

  return (
    <header className="header">
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
              <span className="dropdown-username">james</span>

              <img
                src={avatar || "https://i.pravatar.cc/40?img=3"}
                alt="profile"
                className="dropdown-avatar"
              />
            </div>

            <hr className="dropdown-divider" />

            <button onClick={() => { navigate("/teacher/profile"); setOpen(false); }}>
              Profile <span className="arrow">›</span>
            </button>

            <button onClick={() => { navigate("/teacher/change-password"); setOpen(false); }}>
              Change Password <span className="arrow">›</span>
            </button>

            <button onClick={() => { navigate("/"); setOpen(false); }}>
              Logout <span className="arrow">▷</span>
            </button>

          </div>
        )}
      </div>
    </header>
  );
}