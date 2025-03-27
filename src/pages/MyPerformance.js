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
  BookOpenIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444'];
const PERFORMANCE_METRICS = ['Grades', 'Attendance', 'Participation', 'Assignments'];

const MyPerformance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState({
    overallStats: {
      averageGrade: 0,
      attendanceRate: 0,
      participationRate: 0,
      completionRate: 0,
    },
    timelineData: [],
    skillsData: [],
    subjectPerformance: [],
  });

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        
        // Fetch enrolled classes
        const enrollmentsQuery = query(
          collection(db, 'enrollments'),
          where('studentEmail', '==', user.email)
        );
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        const classIds = enrollmentsSnapshot.docs.map(doc => doc.data().classId);

        // Fetch assignments, grades, and attendance data
        const [assignmentsData, gradesData, attendanceData] = await Promise.all([
          fetchAssignments(classIds),
          fetchGrades(classIds),
          fetchAttendance(classIds),
        ]);

        // Process and aggregate data
        const processedData = processPerformanceData(assignmentsData, gradesData, attendanceData);
        setPerformanceData(processedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching performance data:', error);
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [user.email]);

  const fetchAssignments = async (classIds) => {
    const assignments = [];
    for (const classId of classIds) {
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        where('classId', '==', classId),
        orderBy('dueDate', 'desc')
      );
      const snapshot = await getDocs(assignmentsQuery);
      assignments.push(...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    return assignments;
  };

  const fetchGrades = async (classIds) => {
    const gradesQuery = query(
      collection(db, 'grades'),
      where('studentEmail', '==', user.email)
    );
    const snapshot = await getDocs(gradesQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  const fetchAttendance = async (classIds) => {
    const attendance = [];
    for (const classId of classIds) {
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('classId', '==', classId),
        where('studentEmail', '==', user.email)
      );
      const snapshot = await getDocs(attendanceQuery);
      attendance.push(...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    return attendance;
  };

  const processPerformanceData = (assignments, grades, attendance) => {
    // Calculate overall stats
    const averageGrade = grades.length > 0
      ? grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length
      : 0;

    const attendanceRate = attendance.length > 0
      ? (attendance.filter(record => record.status === 'present').length / attendance.length) * 100
      : 0;

    const completionRate = assignments.length > 0
      ? (assignments.filter(assignment => assignment.submitted).length / assignments.length) * 100
      : 0;

    // Generate timeline data
    const timelineData = grades.map(grade => ({
      date: grade.date,
      grade: grade.score,
      attendance: attendance.find(a => a.date === grade.date)?.status === 'present' ? 100 : 0,
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Generate skills data
    const skillsData = PERFORMANCE_METRICS.map(metric => ({
      subject: metric,
      value: metric === 'Grades' ? averageGrade
        : metric === 'Attendance' ? attendanceRate
        : metric === 'Participation' ? 75 // Example value
        : completionRate,
    }));

    // Generate subject performance data
    const subjectPerformance = grades.reduce((acc, grade) => {
      if (!acc[grade.subject]) {
        acc[grade.subject] = {
          subject: grade.subject,
          grades: [],
        };
      }
      acc[grade.subject].grades.push(grade.score);
      return acc;
    }, {});

    const subjectStats = Object.values(subjectPerformance).map(subject => ({
      name: subject.subject,
      value: subject.grades.reduce((sum, grade) => sum + grade, 0) / subject.grades.length,
    }));

    return {
      overallStats: {
        averageGrade,
        attendanceRate,
        participationRate: 75, // Example value
        completionRate,
      },
      timelineData,
      skillsData,
      subjectPerformance: subjectStats,
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
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Performance</h1>
        <p className="mt-2 text-gray-600">Comprehensive view of your academic performance</p>
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
                {performanceData.overallStats.averageGrade.toFixed(1)}%
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-primary-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {performanceData.overallStats.attendanceRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <BookOpenIcon className="h-8 w-8 text-primary-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Participation</p>
              <p className="text-2xl font-bold text-gray-900">
                {performanceData.overallStats.participationRate.toFixed(1)}%
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
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {performanceData.overallStats.completionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Radar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceData.skillsData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke="#6366F1"
                  fill="#6366F1"
                  fillOpacity={0.6}
                />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Subject Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performanceData.subjectPerformance}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                >
                  {performanceData.subjectPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Timeline Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6 lg:col-span-2"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Timeline</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData.timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value) => `${value.toFixed(1)}%`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="grade"
                  stroke="#6366F1"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Grades"
                />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Attendance"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MyPerformance; 