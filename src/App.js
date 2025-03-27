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
  const { user } = useAuth();
  const isTeacher = user?.email?.endsWith('@teacher.edu');

  if (!isTeacher) {
    return <Navigate to="/student-dashboard" />;
  }

  return children;
};

const StudentRoute = ({ children }) => {
  const { user } = useAuth();
  const isStudent = !user?.email?.endsWith('@teacher.edu');

  if (!isStudent) {
    return <Navigate to="/teacher-dashboard" />;
  }

  return children;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  const isTeacher = user?.email?.endsWith('@teacher.edu');
  
  return <Navigate to={isTeacher ? "/teacher-dashboard" : "/student-dashboard"} replace />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={<Layout />}
          >
            <Route index element={<DashboardRedirect />} />
            
            {/* Teacher routes */}
            <Route
              path="teacher-dashboard"
              element={<TeacherDashboard />}
            />
            <Route
              path="class-management"
              element={<ClassManagement />}
            />
            <Route
              path="timetable-management"
              element={<TimetableManagement />}
            />
            <Route
              path="user-management"
              element={<UserManagement />}
            />
            <Route
              path="assignment-management"
              element={<AssignmentManagement />}
            />
            <Route
              path="attendance-tracking"
              element={<AttendanceTracking />}
            />
            <Route
              path="analytics"
              element={<Analytics />}
            />
            <Route
              path="performance-analytics"
              element={<PerformanceAnalytics />}
            />

            {/* Student routes */}
            <Route
              path="student-dashboard"
              element={<StudentDashboard />}
            />
            <Route
              path="my-classes"
              element={<ClassManagement />}
            />
            <Route
              path="my-schedule"
              element={<TimetableManagement />}
            />
            <Route
              path="my-assignments"
              element={<MyAssignments />}
            />
            <Route
              path="my-attendance"
              element={<MyAttendance />}
            />
            <Route
              path="my-performance"
              element={<MyPerformance />}
            />
            <Route
              path="my-grades"
              element={<MyGrades />}
            />

            {/* Common routes */}
            <Route path="dashboard" element={<DashboardRedirect />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="settings" element={<DashboardRedirect />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
