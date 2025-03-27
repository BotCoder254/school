import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TeacherDashboard from './dashboard/TeacherDashboard';
import StudentDashboard from './dashboard/StudentDashboard';

const Dashboard = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (userRole === 'teacher') {
      navigate('/teacher-dashboard', { replace: true });
    } else if (userRole === 'student') {
      navigate('/student-dashboard', { replace: true });
    }
  }, [userRole, navigate]);

  if (userRole === 'teacher') {
    return <TeacherDashboard />;
  }

  return <StudentDashboard />;
};

export default Dashboard; 