import { Routes, Route, Navigate } from "react-router-dom";

import TeacherLayout from "../layout/TeacherLayout";
import TeacherDashboard from "../pages/TeacherDashboard";
import ClassesList from "../pages/ClassesList";
import Classes from "../pages/Classes";

import TeacherLiveSession from "../pages/TeacherLiveSession";

import Assignments from "../pages/Assignments";
import CreateAssignment from "../pages/CreateAssignment";
import AssignmentView from "../pages/AssignmentView";
import SubmissionView from "../pages/SubmissionView";

import Quizzes from "../pages/Quizzes";
import CreateQuiz from "../pages/CreateQuiz";
import QuizView from "../pages/QuizView";
import QuizSubmissionView from "../pages/QuizSubmissionView";
import QuizReviewView from "../pages/QuizReviewView";

import StudyMaterials from "../pages/StudyMaterials";
import UploadMaterial from "../pages/UploadMaterial";
import StudyMaterialView from "../pages/StudyMaterialView";

import SessionRecordings from "../pages/SessionRecordings";
import UploadRecording from "../pages/UploadRecording";
import RecordingPlayer from "../pages/RecordingPlayer";

import LiveSessions from "../pages/LiveSessions";
import TeacherCreateLiveSession from "../pages/TeacherCreateLiveSession";

import Profile from "../pages/Profile";

export default function TeacherRoutes() {
  return (
    <Routes>

      {/* DEFAULT REDIRECT */}
      <Route path="/" element={<Navigate to="/teacher/dashboard" />} />

      {/* TEACHER LAYOUT */}
      <Route path="/teacher" element={<TeacherLayout />}>

        {/* PROFILE */}
        <Route path="profile" element={<Profile />} />

        {/* DASHBOARD */}
        <Route path="dashboard" element={<TeacherDashboard />} />

        {/* SUBJECT LIST */}
        <Route path="classes" element={<ClassesList />} />

        {/* SUBJECT DASHBOARD */}
        <Route path="classes/:subjectId" element={<Classes />} />

        {/* ASSIGNMENTS */}
        <Route
          path="classes/:subjectId/assignments"
          element={<Assignments />}
        />

        <Route
          path="classes/:subjectId/assignments/create"
          element={<CreateAssignment />}
        />

        <Route
          path="classes/:subjectId/assignments/:assignmentId"
          element={<AssignmentView />}
        />

        <Route
          path="classes/:subjectId/assignments/:assignmentId/submissions"
          element={<SubmissionView />}
        />

        {/* QUIZZES */}
        <Route
          path="classes/:subjectId/quizzes"
          element={<Quizzes />}
        />

        <Route
          path="classes/:subjectId/quizzes/create"
          element={<CreateQuiz />}
        />

        <Route
          path="classes/:subjectId/quizzes/:quizId"
          element={<QuizView />}
        />

        <Route
          path="classes/:subjectId/quizzes/:quizId/submissions"
          element={<QuizSubmissionView />}
        />

        <Route
          path="classes/:subjectId/quizzes/:quizId/review/:attemptId"
          element={<QuizReviewView />}
        />

        {/* STUDY MATERIALS */}
        <Route
          path="classes/:subjectId/study-materials"
          element={<StudyMaterials />}
        />

        <Route
          path="classes/:subjectId/study-materials/upload"
          element={<UploadMaterial />}
        />

        <Route
          path="classes/:subjectId/study-materials/:materialId"
          element={<StudyMaterialView />}
        />

        {/* SESSION RECORDINGS */}
        <Route
          path="classes/:subjectId/session-recordings"
          element={<SessionRecordings />}
        />

        <Route
          path="classes/:subjectId/session-recordings/upload"
          element={<UploadRecording />}
        />

        <Route
          path="classes/:subjectId/session-recordings/:recordingId/:videoId"
          element={<RecordingPlayer />}
        />

        {/* LIVE SESSIONS */}
        <Route
          path="classes/:subjectId/live-sessions"
          element={<LiveSessions />}
        />

        <Route
          path="classes/:subjectId/live-sessions/create"
          element={<TeacherCreateLiveSession />}
        />

        {/* LIVE ROOM */}
        <Route
          path="live/:id"
          element={<TeacherLiveSession />}
        />

      </Route>

    </Routes>
  );
}