import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import {
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const AttendanceTracking = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!user?.email) return;

    // Fetch classes taught by the teacher
    const classesQuery = query(
      collection(db, 'classes'),
      where('teacher', '==', user.email)
    );

    const unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
      const classesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClasses(classesData);
      setLoading(false);
    });

    return () => unsubscribeClasses();
  }, [user?.email]);

  useEffect(() => {
    if (!selectedClass) return;

    // Fetch students enrolled in the selected class
    const fetchStudents = async () => {
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('classId', '==', selectedClass.id)
      );

      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      const studentEmails = enrollmentsSnapshot.docs.map(doc => doc.data().studentEmail);

      if (studentEmails.length > 0) {
        const studentsQuery = query(
          collection(db, 'users'),
          where('email', 'in', studentEmails)
        );

        const studentsSnapshot = await getDocs(studentsQuery);
        const studentsData = studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStudents(studentsData);
      }
    };

    fetchStudents();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !selectedDate) return;

    // Fetch attendance for the selected date and class
    const dateString = selectedDate.toISOString().split('T')[0];
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('classId', '==', selectedClass.id),
      where('date', '==', dateString)
    );

    const unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
      const attendanceData = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        attendanceData[data.studentEmail] = data.status;
      });
      setAttendance(attendanceData);
    });

    return () => unsubscribeAttendance();
  }, [selectedClass, selectedDate]);

  const handleDateChange = (increment) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + increment);
    setSelectedDate(newDate);
  };

  const handleAttendanceChange = async (studentEmail, status) => {
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      await addDoc(collection(db, 'attendance'), {
        classId: selectedClass.id,
        studentEmail,
        date: dateString,
        status,
        markedBy: user.email,
        markedAt: new Date(),
      });
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Attendance Tracking
        </h1>
        <select
          value={selectedClass?.id || ''}
          onChange={(e) => setSelectedClass(classes.find(c => c.id === e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Select a class</option>
          {classes.map(classItem => (
            <option key={classItem.id} value={classItem.id}>
              {classItem.name}
            </option>
          ))}
        </select>
      </div>

      {selectedClass && (
        <>
          <div className="flex items-center justify-center space-x-4 mb-8">
            <button
              onClick={() => handleDateChange(-1)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-primary-500" />
              <span className="text-lg font-medium text-gray-900">
                {selectedDate.toLocaleDateString()}
              </span>
            </div>
            <button
              onClick={() => handleDateChange(1)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={student.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}`}
                          alt={student.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="ml-3 font-medium text-gray-900">
                          {student.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleAttendanceChange(student.email, 'present')}
                          className={`p-2 rounded-lg transition-colors ${
                            attendance[student.email] === 'present'
                              ? 'bg-green-100 text-green-800'
                              : 'hover:bg-gray-100 text-gray-400'
                          }`}
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(student.email, 'absent')}
                          className={`p-2 rounded-lg transition-colors ${
                            attendance[student.email] === 'absent'
                              ? 'bg-red-100 text-red-800'
                              : 'hover:bg-gray-100 text-gray-400'
                          }`}
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default AttendanceTracking; 