import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/dashboard/TeacherDashboard';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import UserManagement from './pages/UserManagement';
import ClassManagement from './pages/ClassManagement';
import TimetableManagement from './pages/TimetableManagement';
import AssignmentManagement from './pages/AssignmentManagement';
import MyAssignments from './pages/MyAssignments';
import AttendanceTracking from './pages/AttendanceTracking';
import MyAttendance from './pages/MyAttendance';
import Analytics from './pages/Analytics';
import Announcements from './pages/Announcements';
import MyGrades from './pages/MyGrades';
import PerformanceAnalytics from './pages/PerformanceAnalytics';
import MyPerformance from './pages/MyPerformance';
import ResetPassword from './pages/ResetPassword';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

const TeacherRoute = ({ children }) => {
  const { userRole } = useAuth();

  if (userRole !== 'teacher') {
    return <Navigate to="/student-dashboard" />;
  }

  return children;
};

const StudentRoute = ({ children }) => {
  const { userRole } = useAuth();

  if (userRole !== 'student') {
    return <Navigate to="/teacher-dashboard" />;
  }

  return children;
};

const DashboardRedirect = () => {
  const { userRole } = useAuth();
  
  return <Navigate to={userRole === 'teacher' ? "/teacher-dashboard" : "/student-dashboard"} replace />;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<DashboardRedirect />} />
            
            {/* Teacher routes */}
            <Route
              path="teacher-dashboard"
              element={
                <TeacherRoute>
                  <TeacherDashboard />
                </TeacherRoute>
              }
            />
            <Route
              path="class-management"
              element={
                <TeacherRoute>
                  <ClassManagement />
                </TeacherRoute>
              }
            />
            <Route
              path="timetable-management"
              element={
                <TeacherRoute>
                  <TimetableManagement />
                </TeacherRoute>
              }
            />
            <Route
              path="user-management"
              element={
                <TeacherRoute>
                  <UserManagement />
                </TeacherRoute>
              }
            />
            <Route
              path="assignment-management"
              element={
                <TeacherRoute>
                  <AssignmentManagement />
                </TeacherRoute>
              }
            />
            <Route
              path="attendance-tracking"
              element={
                <TeacherRoute>
                  <AttendanceTracking />
                </TeacherRoute>
              }
            />
            <Route
              path="analytics"
              element={
                <TeacherRoute>
                  <Analytics />
                </TeacherRoute>
              }
            />
            <Route
              path="performance-analytics"
              element={
                <TeacherRoute>
                  <PerformanceAnalytics />
                </TeacherRoute>
              }
            />

            {/* Student routes */}
            <Route
              path="student-dashboard"
              element={
                <StudentRoute>
                  <StudentDashboard />
                </StudentRoute>
              }
            />
            <Route
              path="my-classes"
              element={
                <StudentRoute>
                  <ClassManagement />
                </StudentRoute>
              }
            />
            <Route
              path="my-schedule"
              element={
                <StudentRoute>
                  <TimetableManagement />
                </StudentRoute>
              }
            />
            <Route
              path="my-assignments"
              element={
                <StudentRoute>
                  <MyAssignments />
                </StudentRoute>
              }
            />
            <Route
              path="my-attendance"
              element={
                <StudentRoute>
                  <MyAttendance />
                </StudentRoute>
              }
            />
            <Route
              path="my-performance"
              element={
                <StudentRoute>
                  <MyPerformance />
                </StudentRoute>
              }
            />
            <Route
              path="my-grades"
              element={
                <StudentRoute>
                  <MyGrades />
                </StudentRoute>
              }
            />

            {/* Common routes */}
            <Route path="dashboard" element={<DashboardRedirect />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="settings" element={<DashboardRedirect />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
