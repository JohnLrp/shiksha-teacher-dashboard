import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import TeacherTopSliderTabs from "../components/TeacherTopSliderTabs";
import useSwipeBack from "../utils/useSwipeBack";
import "./layout.css";

export default function TeacherLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("sessions");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const location = useLocation();
  const swipeHandlers = useSwipeBack();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isClassesPage = location.pathname.startsWith("/teacher/classes");
  const hideTopSliderOnMobile = isMobile && isClassesPage;

  return (
    <div className="teacher-layout">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="teacher-main">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {!hideTopSliderOnMobile && (
          <TeacherTopSliderTabs
            active={active}
            setActive={setActive}
          />
        )}

        <main className="teacher-content" {...swipeHandlers}>
          <Outlet context={{ active, setActive }} />
        </main>
      </div>
    </div>
  );
}