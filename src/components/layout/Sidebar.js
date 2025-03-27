import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  UserGroupIcon,
  BookOpenIcon,
  CalendarIcon,
  ChartBarIcon,
  CogIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  ClipboardDocumentCheckIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const teacherMenuItems = [
  { name: 'Dashboard', icon: HomeIcon, path: '/teacher-dashboard' },
  { name: 'Class Management', icon: BookOpenIcon, path: '/class-management' },
  { name: 'Timetable Management', icon: CalendarIcon, path: '/timetable-management' },
  { name: 'Student Management', icon: UserGroupIcon, path: '/student-management' },
  { name: 'Assignment Management', icon: ClipboardDocumentListIcon, path: '/assignment-management' },
  { name: 'Attendance Tracking', icon: ClipboardDocumentCheckIcon, path: '/attendance-tracking' },
  { name: 'Announcements', icon: BellIcon, path: '/announcements' },
  { name: 'Analytics Dashboard', icon: ChartBarIcon, path: '/analytics' },
  { name: 'Performance Analytics', icon: PresentationChartLineIcon, path: '/performance-analytics' },
  { name: 'User Management', icon: AcademicCapIcon, path: '/user-management' },
  { name: 'Settings', icon: CogIcon, path: '/settings' },
];

const studentMenuItems = [
  { name: 'Dashboard', icon: HomeIcon, path: '/student-dashboard' },
  { name: 'My Classes', icon: BookOpenIcon, path: '/my-classes' },
  { name: 'My Schedule', icon: CalendarIcon, path: '/my-schedule' },
  { name: 'My Assignments', icon: ClipboardDocumentListIcon, path: '/my-assignments' },
  { name: 'My Attendance', icon: ClipboardDocumentCheckIcon, path: '/my-attendance' },
  { name: 'My Performance', icon: PresentationChartLineIcon, path: '/my-performance' },
  { name: 'My Grades', icon: ChartBarIcon, path: '/my-grades' },
  { name: 'Announcements', icon: BellIcon, path: '/announcements' },
  { name: 'Profile Settings', icon: CogIcon, path: '/settings' },
];

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logOut } = useAuth();
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setIsTeacher(user.email.endsWith('@teacher.edu'));
    }
  }, [user?.email]);

  const menuItems = isTeacher ? teacherMenuItems : studentMenuItems;

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <motion.div
      initial={{ width: 240 }}
      animate={{ width: isCollapsed ? 80 : 240 }}
      className="h-screen bg-white border-r border-gray-200 flex flex-col"
    >
      <div className="p-4 flex items-center justify-between border-b border-gray-200">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xl font-display font-bold text-primary-500"
            >
              SchoolSync
            </motion.h1>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-3 mb-2 rounded-lg transition-colors ${
              location.pathname === item.path
                ? 'bg-primary-100 text-primary-500'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <item.icon className={`w-6 h-6 flex-shrink-0 ${
              location.pathname === item.path ? 'text-primary-500' : 'text-gray-500'
            }`} />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="ml-3 font-medium"
                >
                  {item.name}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center mb-4">
          <img
            src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || '')}`}
            alt="Profile"
            className="w-8 h-8 rounded-full bg-gray-200"
          />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="ml-3"
              >
                <p className="text-sm font-medium text-gray-700 truncate max-w-[140px]">
                  {user?.displayName || user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  {isTeacher ? 'Teacher' : 'Student'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <button
          onClick={handleLogout}
          className={`flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
            isCollapsed ? 'justify-center' : 'justify-start'
          }`}
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="ml-3"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar; 