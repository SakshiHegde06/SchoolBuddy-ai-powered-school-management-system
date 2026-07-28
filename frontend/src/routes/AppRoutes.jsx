import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

import LoginPage from '../pages/auth/LoginPage';

import { ROLES } from '../utils/constants';
import { roleNavConfig } from '../utils/roleConfig';
import { useAuth } from '../hooks/useAuth';

// ==================== ADMIN ====================

import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import TeachersPage from '../pages/admin/TeachersPage';
import StudentsPage from '../pages/admin/StudentsPage';
import ParentsPage from '../pages/admin/ParentsPage';
import ClassesPage from '../pages/admin/ClassesPage';
import SubjectsPage from '../pages/admin/SubjectsPage';
import TimetableGeneratorPage from '../pages/admin/TimetableGeneratorPage';
import AnnouncementsPage from '../pages/admin/AnnouncementsPage';

// ==================== TEACHER ====================

import TeacherDashboardPage from '../pages/teacher/TeacherDashboardPage';
import AttendancePage from '../pages/teacher/AttendancePage';
import MarksPage from '../pages/teacher/MarksPage';
import HomeworkPage from '../pages/teacher/HomeworkPage';
import TeacherRemarksPage from '../pages/teacher/TeacherRemarksPage';
import TeacherStudyMaterialsPage from '../pages/teacher/StudyMaterialPage';

// ==================== PARENT ====================

import ParentDashboardPage from '../pages/parent/ParentDashboardPage';
import ChildProgressPage from '../pages/parent/ChildProgressPage';

// ==================== STUDENT ====================

import StudentDashboardPage from '../pages/student/StudentDashboardPage';
import StudentStudyMaterialsPage from '../pages/student/StudyMaterialsPage';
import CalendarPage from '../pages/student/CalendarPage';

function RoleHome() {
  const { user } = useAuth();
  return <Navigate to={roleNavConfig[user.role]?.landing || '/login'} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RoleHome />} />

        <Route path="/calendar" element={<DashboardLayoutWrapper />}>
          <Route index element={<CalendarPage />} />
        </Route>
      </Route>

      {/* ==================== ADMIN ==================== */}

      <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
        <Route
          path="/admin"
          element={<DashboardLayout links={roleNavConfig[ROLES.ADMIN].links} />}
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="teachers" element={<TeachersPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="parents" element={<ParentsPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="timetable" element={<TimetableGeneratorPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
        </Route>
      </Route>

      {/* ==================== TEACHER ==================== */}

      <Route element={<ProtectedRoute allowedRoles={[ROLES.TEACHER]} />}>
        <Route
          path="/teacher"
          element={<DashboardLayout links={roleNavConfig[ROLES.TEACHER].links} />}
        >
          <Route index element={<TeacherDashboardPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="marks" element={<MarksPage />} />
          <Route path="homework" element={<HomeworkPage />} />
          <Route path="materials" element={<TeacherStudyMaterialsPage />} />
          <Route path="remarks" element={<TeacherRemarksPage />} />
        </Route>
      </Route>

      {/* ==================== PARENT ==================== */}

      <Route element={<ProtectedRoute allowedRoles={[ROLES.PARENT]} />}>
        <Route
          path="/parent"
          element={<DashboardLayout links={roleNavConfig[ROLES.PARENT].links} />}
        >
          <Route index element={<ParentDashboardPage />} />
          <Route path="progress" element={<ChildProgressPage />} />
        </Route>
      </Route>

      {/* ==================== STUDENT ==================== */}

      <Route element={<ProtectedRoute allowedRoles={[ROLES.STUDENT]} />}>
        <Route
          path="/student"
          element={<DashboardLayout links={roleNavConfig[ROLES.STUDENT].links} />}
        >
          <Route index element={<StudentDashboardPage />} />
          <Route path="materials" element={<StudentStudyMaterialsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Shared calendar layout
function DashboardLayoutWrapper() {
  const { user } = useAuth();

  return (
    <DashboardLayout
      links={roleNavConfig[user.role]?.links || []}
    />
  );
}