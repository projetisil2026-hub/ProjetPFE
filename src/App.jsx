import { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useLanguage } from './contexts/LanguageContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';

// Auth pages
import RoleSelect from './pages/auth/RoleSelect';
import Login from './pages/auth/Login';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminTeachers from './pages/admin/Teachers';
import AdminClasses from './pages/admin/Classes';
import AdminAttendance from './pages/admin/Attendance';
import AdminMemorization from './pages/admin/Memorization';
import AdminReports from './pages/admin/Reports';
import AdminMessages from './pages/admin/Messages';

// Teacher pages
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherStudents from './pages/teacher/Students';
import TeacherAttendance from './pages/teacher/Attendance';
import TeacherMemorization from './pages/teacher/Memorization';
import TeacherReports from './pages/teacher/Reports';
import TeacherMessages from './pages/teacher/Messages';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import StudentAttendance from './pages/student/Attendance';
import StudentMemorization from './pages/student/Memorization';
import StudentMessages from './pages/student/Messages';

// Parent pages
import ParentDashboard from './pages/parent/Dashboard';
import ParentAttendance from './pages/parent/Attendance';
import ParentMemorization from './pages/parent/Memorization';
import ParentMessages from './pages/parent/Messages';
import ParentReports from './pages/parent/Reports';

// Layout wrapper with sidebar + navbar
const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { dir } = useLanguage();
  const { user } = useAuth();

  return (
    <NotificationProvider userId={user?.id}>
      <SocketProvider userId={user?.id}>
        <div className="flex min-h-screen" dir={dir}>
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className={`flex-1 flex flex-col min-h-screen ${dir === 'rtl' ? 'lg:mr-64' : 'lg:ml-64'}`}>
            <Navbar onMenuClick={() => setSidebarOpen(true)} />
            <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
              {children}
            </main>
          </div>
        </div>
      </SocketProvider>
    </NotificationProvider>
  );
};

const App = () => {
  const { isAuthenticated, user } = useAuth();
  const { dir } = useLanguage();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={
        isAuthenticated ? <Navigate to={`/${user?.role}/dashboard`} replace /> : <RoleSelect />
      } />
      <Route path="/login" element={
        isAuthenticated ? <Navigate to={`/${user?.role}/dashboard`} replace /> : <Login />
      } />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}>
          <AppLayout><Outlet /></AppLayout>
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="teachers" element={<AdminTeachers />} />
        <Route path="classes" element={<AdminClasses />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="memorization" element={<AdminMemorization />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="messages" element={<AdminMessages />} />
      </Route>

      {/* Teacher routes */}
      <Route path="/teacher" element={
        <ProtectedRoute roles={['teacher']}>
          <AppLayout><Outlet /></AppLayout>
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="students" element={<TeacherStudents />} />
        <Route path="attendance" element={<TeacherAttendance />} />
        <Route path="memorization" element={<TeacherMemorization />} />
        <Route path="reports" element={<TeacherReports />} />
        <Route path="messages" element={<TeacherMessages />} />
      </Route>

      {/* Student routes */}
      <Route path="/student" element={
        <ProtectedRoute roles={['student']}>
          <AppLayout><Outlet /></AppLayout>
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="memorization" element={<StudentMemorization />} />
        <Route path="messages" element={<StudentMessages />} />
      </Route>

      {/* Parent routes */}
      <Route path="/parent" element={
        <ProtectedRoute roles={['parent']}>
          <AppLayout><Outlet /></AppLayout>
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ParentDashboard />} />
        <Route path="attendance" element={<ParentAttendance />} />
        <Route path="memorization" element={<ParentMemorization />} />
        <Route path="messages" element={<ParentMessages />} />
        <Route path="reports" element={<ParentReports />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={
        isAuthenticated
          ? <Navigate to={`/${user?.role}/dashboard`} replace />
          : <Navigate to="/" replace />
      } />
    </Routes>
  );
};

export default App;
