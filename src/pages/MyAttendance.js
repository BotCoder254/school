import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import {
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const MyAttendance = () => {
  const { user } = useAuth();
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!user?.email) return;

      try {
        // Fetch enrolled classes
        const enrollmentsQuery = query(
          collection(db, 'enrollments'),
          where('studentEmail', '==', user.email)
        );
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        const classIds = enrollmentsSnapshot.docs.map(doc => doc.data().classId);

        // Fetch class details
        const classesData = [];
        for (const classId of classIds) {
          const classDoc = await getDocs(query(
            collection(db, 'classes'),
            where('__name__', '==', classId)
          ));
          if (!classDoc.empty) {
            classesData.push({
              id: classId,
              ...classDoc.docs[0].data(),
            });
          }
        }
        setEnrolledClasses(classesData);

        // Fetch attendance records
        const attendanceRecords = {};
        for (const classId of classIds) {
          const attendanceQuery = query(
            collection(db, 'attendance'),
            where('classId', '==', classId),
            where('studentEmail', '==', user.email)
          );
          const attendanceSnapshot = await getDocs(attendanceQuery);
          attendanceRecords[classId] = attendanceSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
        }
        setAttendanceData(attendanceRecords);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [user?.email]);

  const calculateAttendanceStats = (classId) => {
    const records = attendanceData[classId] || [];
    const total = records.length;
    const present = records.filter(record => record.status === 'present').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      total,
      present,
      absent: total - present,
      percentage,
    };
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
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-8">
        My Attendance
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrolledClasses.map((classItem) => {
          const stats = calculateAttendanceStats(classItem.id);
          return (
            <motion.div
              key={classItem.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {classItem.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {classItem.teacher}
                  </p>
                </div>
                <div className="p-2 bg-primary-100 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-primary-500" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ChartBarIcon className="w-5 h-5 text-primary-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Attendance Rate
                    </span>
                  </div>
                  <span className={`text-lg font-bold ${
                    stats.percentage >= 75
                      ? 'text-green-600'
                      : stats.percentage >= 60
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}>
                    {stats.percentage}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-lg font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Present</p>
                    <p className="text-lg font-bold text-green-700">{stats.present}</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-600">Absent</p>
                    <p className="text-lg font-bold text-red-700">{stats.absent}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        stats.percentage >= 75
                          ? 'bg-green-500'
                          : stats.percentage >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {(attendanceData[classItem.id] || []).slice(0, 5).map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-500">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                      {record.status === 'present' ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircleIcon className="w-5 h-5 mr-1" />
                          Present
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <XCircleIcon className="w-5 h-5 mr-1" />
                          Absent
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default MyAttendance; 