import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import PrivateSessionLive from "../pages/PrivateSessionLive";
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
import StudentsList from "../pages/StudentsList";
import StudentDetail from "../pages/StudentDetail";
import AllStudents from "../pages/AllStudents";
import AllStudentDetail from "../pages/AllStudentDetail";
import ProtectedTeacherRoute from "./ProtectedTeacherRoute";
import QuizStudentAttemptsView from "../pages/QuizStudentAttemptsView";
import PrivateSessionsDashboard from "../pages/PrivateSessionsDashboard";
import PrivateRequestDetail from "../pages/PrivateRequestDetail";
import PrivateSessionAvailability from "../pages/PrivateSessionAvailability";
import PrivateSessionDetail from "../pages/PrivateSessionDetail";

function RedirectToMainLogin() {
  useEffect(() => {
    window.location.href = "https://www.shikshacom.com/login";
  }, []);
  return null;
}

export default function TeacherRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RedirectToMainLogin />} />

      <Route
        path="/teacher"
        element={
          <ProtectedTeacherRoute>
            <TeacherLayout />
          </ProtectedTeacherRoute>
        }
      >
        <Route path="profile" element={<Profile />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="students" element={<AllStudents />} />
        <Route path="students/:studentId" element={<AllStudentDetail />} />
        <Route path="classes" element={<ClassesList />} />
        <Route path="classes/:subjectId" element={<Classes />} />

        {/* Assignments */}
        <Route path="classes/:subjectId/assignments" element={<Assignments />} />
        <Route path="classes/:subjectId/assignments/create" element={<CreateAssignment />} />
        <Route path="classes/:subjectId/assignments/:assignmentId" element={<AssignmentView />} />
        <Route path="classes/:subjectId/assignments/:assignmentId/submissions" element={<SubmissionView />} />

        {/* Quizzes */}
        <Route path="classes/:subjectId/quizzes" element={<Quizzes />} />
        <Route path="classes/:subjectId/quizzes/create" element={<CreateQuiz />} />
        <Route path="classes/:subjectId/quizzes/:quizId" element={<QuizView />} />
        <Route path="classes/:subjectId/quizzes/:quizId/submissions" element={<QuizSubmissionView />} />
        <Route path="classes/:subjectId/quizzes/:quizId/student/:studentId" element={<QuizStudentAttemptsView />} />
        <Route path="classes/:subjectId/quizzes/:quizId/review/:attemptId" element={<QuizReviewView />} />

        {/* Study Materials */}
        <Route path="classes/:subjectId/study-materials" element={<StudyMaterials />} />
        <Route path="classes/:subjectId/study-materials/upload" element={<UploadMaterial />} />
        <Route path="classes/:subjectId/study-materials/:materialId" element={<StudyMaterialView />} />

        {/* Session Recordings */}
        <Route path="classes/:subjectId/session-recordings" element={<SessionRecordings />} />
        <Route path="classes/:subjectId/session-recordings/upload" element={<UploadRecording />} />
        <Route path="classes/:subjectId/session-recordings/:recordingId/:videoId" element={<RecordingPlayer />} />

        {/* Students (per class) */}
        <Route path="classes/:subjectId/students" element={<StudentsList />} />
        <Route path="classes/:subjectId/students/:studentId" element={<StudentDetail />} />

        {/* Live Sessions */}
        <Route path="live-sessions" element={<LiveSessions />} />
        <Route path="classes/:subjectId/live-sessions" element={<LiveSessions />} />
        <Route path="classes/:subjectId/live-sessions/create" element={<TeacherCreateLiveSession />} />
        <Route path="live/:id" element={<TeacherLiveSession />} />

        {/* ═══ PRIVATE SESSIONS ═══ */}
        <Route path="private-sessions" element={<PrivateSessionsDashboard />} />
        <Route path="private-sessions/availability" element={<PrivateSessionAvailability />} />
        <Route path="private-sessions/scheduled/:id" element={<PrivateSessionDetail />} />
        <Route path="private-sessions/request/:id" element={<PrivateSessionDetail />} />
        <Route path="private-sessions/history/:id" element={<PrivateSessionDetail />} />
      </Route>
    </Routes>
  );
}