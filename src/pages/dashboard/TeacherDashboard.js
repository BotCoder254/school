import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, onSnapshot, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import {
  UserGroupIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;

    const fetchData = async () => {
      try {
        // Fetch classes
        const classesQuery = query(
          collection(db, 'classes'),
          where('teacherEmail', '==', user.email)
        );
        const unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
          const classesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setClasses(classesData);
        });

        // Fetch students
        const studentsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'student'),
          limit(5)
        );
        const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
          const studentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setStudents(studentsData);
        });

        // Fetch assignments
        const assignmentsQuery = query(
          collection(db, 'assignments'),
          where('teacherEmail', '==', user.email),
          orderBy('dueDate', 'desc'),
          limit(5)
        );
        const unsubscribeAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
          const assignmentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setAssignments(assignmentsData);
        });

        // Fetch announcements
        const announcementsQuery = query(
          collection(db, 'announcements'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const unsubscribeAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
          const announcementsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setAnnouncements(announcementsData);
        });

        setLoading(false);

        return () => {
          unsubscribeClasses();
          unsubscribeStudents();
          unsubscribeAssignments();
          unsubscribeAnnouncements();
        };
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.email]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Welcome back, {user?.displayName || user?.email}!
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Here's what's happening in your classes today
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <BookOpenIcon className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Classes</p>
              <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <ClipboardDocumentListIcon className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <BellIcon className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Announcements</p>
              <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h2 className="text-lg font-display font-bold text-gray-900 mb-4">Recent Classes</h2>
          <div className="space-y-4">
            {classes.map((classItem) => (
              <div
                key={classItem.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <BookOpenIcon className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{classItem.name}</p>
                    <p className="text-sm text-gray-500">Room {classItem.room}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">{classItem.schedule}</p>
              </div>
            ))}
            {classes.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No classes found</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h2 className="text-lg font-display font-bold text-gray-900 mb-4">Recent Announcements</h2>
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <BellIcon className="w-4 h-4 text-primary-500" />
                  <p className="font-medium text-gray-900">{announcement.title}</p>
                </div>
                <p className="text-sm text-gray-600">{announcement.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {announcement.createdAt?.toDate().toLocaleDateString() || 'No date'}
                </p>
              </div>
            ))}
            {announcements.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No announcements found</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TeacherDashboard; 