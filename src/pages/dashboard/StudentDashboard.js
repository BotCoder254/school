import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpenIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch enrolled classes
        const classesQuery = query(
          collection(db, 'enrollments'),
          where('studentEmail', '==', user.email)
        );
        const unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
          const classesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setEnrolledClasses(classesData);
        });

        // Fetch assignments for enrolled classes
        const assignmentsQuery = query(
          collection(db, 'assignments'),
          where('class', 'in', enrolledClasses.map(c => c.classId) || ['placeholder']),
          limit(5)
        );
        const unsubscribeAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
          const assignmentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setAssignments(assignmentsData);
        });

        // Fetch grades
        const gradesQuery = query(
          collection(db, 'grades'),
          where('studentEmail', '==', user.email),
          limit(5)
        );
        const unsubscribeGrades = onSnapshot(gradesQuery, (snapshot) => {
          const gradesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setGrades(gradesData);
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
          unsubscribeAssignments();
          unsubscribeGrades();
          unsubscribeAnnouncements();
        };
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchData();
    }
  }, [user?.email, enrolledClasses.length]);

  const calculateAverageGrade = () => {
    if (!grades.length) return 'N/A';
    const sum = grades.reduce((acc, grade) => acc + (grade.score || 0), 0);
    return (sum / grades.length).toFixed(1);
  };

  const getNextDueAssignment = () => {
    if (!assignments.length) return 'No upcoming assignments';
    const sortedAssignments = [...assignments].sort((a, b) => 
      (a.dueDate?.seconds || 0) - (b.dueDate?.seconds || 0)
    );
    const nextAssignment = sortedAssignments[0];
    return nextAssignment.dueDate 
      ? new Date(nextAssignment.dueDate.seconds * 1000).toLocaleDateString()
      : 'No due date';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Welcome back, {user.displayName || user.email}!
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Here's your academic progress overview
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <BookOpenIcon className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Enrolled Classes</p>
              <p className="text-2xl font-bold text-gray-900">{enrolledClasses.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <ClipboardDocumentListIcon className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Assignments Due</p>
              <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <AcademicCapIcon className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Average Grade</p>
              <p className="text-2xl font-bold text-gray-900">{calculateAverageGrade()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <BellIcon className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Next Due Date</p>
              <p className="text-2xl font-bold text-gray-900">{getNextDueAssignment()}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-display font-bold text-gray-900 mb-4">My Classes</h2>
          <div className="space-y-4">
            {enrolledClasses.map((classItem) => (
              <div
                key={classItem.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <BookOpenIcon className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{classItem.className}</p>
                    <p className="text-sm text-gray-500">{classItem.teacherName}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">{classItem.schedule}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-display font-bold text-gray-900 mb-4">Recent Assignments</h2>
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <ClipboardDocumentListIcon className="w-4 h-4 text-primary-500" />
                    <p className="font-medium text-gray-900">{assignment.title}</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Due: {assignment.dueDate ? new Date(assignment.dueDate.seconds * 1000).toLocaleDateString() : 'No due date'}
                  </p>
                </div>
                <p className="text-sm text-gray-600">{assignment.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-display font-bold text-gray-900 mb-4">Recent Grades</h2>
          <div className="space-y-4">
            {grades.map((grade) => (
              <div
                key={grade.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <AcademicCapIcon className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{grade.assignmentTitle}</p>
                    <p className="text-sm text-gray-500">{grade.className}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900">{grade.score}%</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-display font-bold text-gray-900 mb-4">Announcements</h2>
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
                  {announcement.createdAt ? new Date(announcement.createdAt.seconds * 1000).toLocaleDateString() : 'No date'}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StudentDashboard; 