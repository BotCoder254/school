import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import {
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const MyGrades = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [overallStats, setOverallStats] = useState({
    averageGrade: 0,
    totalAssignments: 0,
    completedAssignments: 0,
    upcomingAssignments: 0,
  });

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        
        // Fetch enrolled classes
        const enrollmentsQuery = query(
          collection(db, 'enrollments'),
          where('studentEmail', '==', user.email)
        );
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        const classIds = enrollmentsSnapshot.docs.map(doc => doc.data().classId);

        // Fetch assignments and grades for enrolled classes
        const assignmentsData = [];
        const performanceBySubject = {};
        
        for (const classId of classIds) {
          const assignmentsQuery = query(
            collection(db, 'assignments'),
            where('classId', '==', classId),
            orderBy('dueDate', 'asc')
          );
          const assignmentsSnapshot = await getDocs(assignmentsQuery);
          
          const classQuery = query(collection(db, 'classes'), where('__name__', '==', classId));
          const classSnapshot = await getDocs(classQuery);
          const classData = classSnapshot.docs[0]?.data();

          assignmentsSnapshot.docs.forEach(doc => {
            const assignment = {
              id: doc.id,
              ...doc.data(),
              className: classData?.name || 'Unknown Class',
              subject: classData?.subject || 'Unknown Subject',
            };

            if (assignment.grade) {
              assignmentsData.push(assignment);
              
              if (!performanceBySubject[assignment.subject]) {
                performanceBySubject[assignment.subject] = {
                  subject: assignment.subject,
                  totalGrade: 0,
                  count: 0,
                };
              }
              performanceBySubject[assignment.subject].totalGrade += assignment.grade;
              performanceBySubject[assignment.subject].count += 1;
            }
          });
        }

        // Calculate performance metrics
        const totalGrades = assignmentsData.reduce((sum, assignment) => sum + assignment.grade, 0);
        const averageGrade = assignmentsData.length > 0 ? totalGrades / assignmentsData.length : 0;
        
        const performanceData = Object.values(performanceBySubject).map(subject => ({
          subject: subject.subject,
          averageGrade: subject.count > 0 ? subject.totalGrade / subject.count : 0,
        }));

        setGrades(assignmentsData);
        setPerformanceData(performanceData);
        setOverallStats({
          averageGrade,
          totalAssignments: assignmentsData.length,
          completedAssignments: assignmentsData.filter(a => a.submitted).length,
          upcomingAssignments: assignmentsData.filter(a => !a.submitted).length,
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching grades:', error);
        setLoading(false);
      }
    };

    fetchGrades();
  }, [user.email]);

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
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Grades</h1>
        <p className="mt-2 text-gray-600">Track your academic performance and progress</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-primary-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Grade</p>
              <p className="text-2xl font-bold text-gray-900">
                {overallStats.averageGrade.toFixed(1)}%
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-primary-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900">
                {overallStats.totalAssignments}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-primary-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {overallStats.completedAssignments}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-primary-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">
                {overallStats.upcomingAssignments}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Grade Progression</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={grades}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="dueDate"
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value) => [`${value}%`]}
                />
                <Line
                  type="monotone"
                  dataKey="grade"
                  stroke="#6366F1"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance by Subject</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`]} />
                <Legend />
                <Bar
                  dataKey="averageGrade"
                  fill="#6366F1"
                  name="Average Grade"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Detailed Grades Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Detailed Grades</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {grades.map((grade) => (
                <tr key={grade.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {grade.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {grade.className}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {grade.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(grade.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                      {grade.grade}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default MyGrades; 