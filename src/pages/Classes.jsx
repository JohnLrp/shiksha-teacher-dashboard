import { useState } from "react";
import SubjectCard from "../components/SubjectCard";
import SearchBar from "../components/SearchBar";
import "../styles/classes.css";

export default function Classes() {
  const [hoveredTitle, setHoveredTitle] = useState("Assignments");

  return (
    <div className="classes-wrapper">
      <div className="classes-container">

        <div className="classes-top">
          <h2>Subjects ({hoveredTitle})</h2>
          <SearchBar />
        </div>

        <div className="classes-grid">
          <SubjectCard title="Assignment" count="4" label="Tasks" path="/teacher/classes/assignments" onHover={() => setHoveredTitle("Assignments")} />
          <SubjectCard title="Quiz" count="6" label="Tests" path="/teacher/classes/quizzes" onHover={() => setHoveredTitle("Quiz")} />
          <SubjectCard title="Study Materials" count="11" label="Resources" path="/teacher/classes/study-materials" onHover={() => setHoveredTitle("Study Materials")} />
          <SubjectCard title="Session Recordings" count="8" label="Recordings" path="/teacher/classes/session-recordings" onHover={() => setHoveredTitle("Session Recordings")} />
          <SubjectCard title="Live Sessions" count="5" label="Upcoming Sessions" path="/teacher/classes/live-sessions" onHover={() => setHoveredTitle("Live Sessions")} />

        </div>

      </div>
    </div>
  );
}
