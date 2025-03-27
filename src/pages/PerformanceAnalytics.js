import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import {
  ChartBarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  BookOpenIcon,
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
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444'];
const PERFORMANCE_METRICS = ['Grades', 'Attendance', 'Participation', 'Assignments'];

const PerformanceAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');
  const [performanceData, setPerformanceData] = useState({
    classAverages: [],
    studentDistribution: [],
    subjectPerformance: [],
    timelineData: [],
    attendanceData: [],
    skillsData: [],
  });
  const [overallStats, setOverallStats] = useState({
    totalStudents: 0,
    averageGrade: 0,
    topPerformers: 0,
    needsImprovement: 0,
    attendanceRate: 0,
    participationRate: 0,
  });
  const [filters, setFilters] = useState({
    subject: 'all',
    performanceLevel: 'all',
    dateRange: 'month',
  });

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user?.email) return;

      try {
        const classesQuery = query(
          collection(db, 'classes'),
          where('teacherEmail', '==', user.email)
        );
        const snapshot = await getDocs(classesQuery);
        const classesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setClasses(classesData);
        if (classesData.length > 0) {
          setSelectedClass(classesData[0].id);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };

    fetchClasses();
  }, [user?.email]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedClass) return;

      try {
        setLoading(true);
        const [enrollments, assignments, attendance] = await Promise.all([
          fetchEnrollments(),
          fetchAssignments(),
          fetchAttendance(),
        ]);

        const processedData = processAnalyticsData(enrollments, assignments, attendance);
        setPerformanceData(processedData);
        
        // Calculate overall stats
        setOverallStats({
          totalStudents: enrollments.length,
          averageGrade: processedData.classAverages.reduce((acc, curr) => acc + curr.average, 0) / 
            (processedData.classAverages.length || 1),
          topPerformers: processedData.studentDistribution[0].value,
          needsImprovement: processedData.studentDistribution[3].value,
          attendanceRate: processedData.classAverages.reduce((acc, curr) => acc + curr.attendance, 0) / 
            (processedData.classAverages.length || 1),
          participationRate: processedData.classAverages.reduce((acc, curr) => acc + curr.participation, 0) / 
            (processedData.classAverages.length || 1),
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedClass, selectedTimeRange, filters]);

  const fetchEnrollments = async () => {
    if (!selectedClass) return [];
    
    const enrollmentsQuery = query(
      collection(db, 'enrollments'),
      where('classId', '==', selectedClass)
    );
    const snapshot = await getDocs(enrollmentsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  };

  const fetchAssignments = async () => {
    if (!selectedClass) return [];
    
    const assignmentsQuery = query(
      collection(db, 'assignments'),
      where('classId', '==', selectedClass),
      orderBy('dueDate', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(assignmentsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  };

  const fetchAttendance = async () => {
    if (!selectedClass) return [];
    
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('classId', '==', selectedClass),
      orderBy('date', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(attendanceQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  };

  const processAnalyticsData = (enrollments, assignments, attendance) => {
    // Calculate class averages
    const classAverages = enrollments.map(enrollment => {
      const studentAssignments = assignments.filter(a => 
        a.submissions?.some(s => s.studentId === enrollment.studentId)
      );
      
      const average = studentAssignments.reduce((acc, curr) => {
        const submission = curr.submissions?.find(s => s.studentId === enrollment.studentId);
        return acc + (submission?.grade || 0);
      }, 0) / (studentAssignments.length || 1);

      const studentAttendance = attendance.filter(a => 
        a.attendees?.includes(enrollment.studentId)
      ).length;

      return {
        email: enrollment.studentEmail,
        average: average,
        attendance: (studentAttendance / attendance.length) * 100,
        participation: Math.random() * 100, // Replace with actual participation data
      };
    });

    // Calculate student distribution
    const distribution = [
      { name: 'Excellent', value: 0 },
      { name: 'Good', value: 0 },
      { name: 'Average', value: 0 },
      { name: 'Needs Improvement', value: 0 },
    ];

    classAverages.forEach(student => {
      if (student.average >= 90) distribution[0].value++;
      else if (student.average >= 80) distribution[1].value++;
      else if (student.average >= 70) distribution[2].value++;
      else distribution[3].value++;
    });

    // Generate timeline data
    const timelineData = assignments.map(assignment => ({
      date: assignment.dueDate,
      grades: assignment.submissions?.reduce((acc, curr) => acc + (curr.grade || 0), 0) / 
        (assignment.submissions?.length || 1),
      attendance: Math.random() * 100, // Replace with actual attendance data
    }));

    return {
      classAverages,
      studentDistribution: distribution,
      timelineData,
      skillsData: PERFORMANCE_METRICS.map(metric => ({
        subject: metric,
        A: Math.random() * 100,
        fullMark: 100,
      })),
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
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="mt-2 text-gray-600">Comprehensive analysis of student performance</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-primary-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.totalStudents}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-primary-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Grade</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.averageGrade.toFixed(1)}%</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-primary-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.attendanceRate.toFixed(1)}%</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <ArrowTrendingUpIcon className="h-8 w-8 text-primary-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Top Performers</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.topPerformers}</p>
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
              <p className="text-2xl font-bold text-gray-900">{overallStats.participationRate.toFixed(1)}%</p>
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
              <p className="text-sm font-medium text-gray-600">Needs Help</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.needsImprovement}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Grade Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performanceData.studentDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label
                >
                  {performanceData.studentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceData.skillsData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Performance" dataKey="A" stroke="#6366F1" fill="#6366F1" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
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
                <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value) => [`${value.toFixed(1)}%`]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="grades"
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

      {/* Student Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Student Performance</h2>
          <div className="flex gap-4">
            <select
              value={filters.performanceLevel}
              onChange={(e) => setFilters({ ...filters, performanceLevel: e.target.value })}
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="all">All Levels</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="needsImprovement">Needs Improvement</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance Level
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performanceData.classAverages.map((student) => (
                <tr key={student.email}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                      {student.average.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {student.attendance.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {student.participation.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        student.average >= 90
                          ? 'bg-green-100 text-green-800'
                          : student.average >= 80
                          ? 'bg-blue-100 text-blue-800'
                          : student.average >= 70
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {student.average >= 90
                        ? 'Excellent'
                        : student.average >= 80
                        ? 'Good'
                        : student.average >= 70
                        ? 'Average'
                        : 'Needs Improvement'}
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

export default PerformanceAnalytics; 