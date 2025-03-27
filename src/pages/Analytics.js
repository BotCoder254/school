import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import {
  ChartBarIcon,
  UserGroupIcon,
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    averageAttendance: 0,
    assignmentCompletion: 0,
    averageGrade: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const classesQuery = query(
          collection(db, 'classes'),
          where('teacherEmail', '==', user.email)
        );
        const classesSnapshot = await getDocs(classesQuery);
        const classIds = classesSnapshot.docs.map(doc => doc.id);

        // Fetch students enrolled in teacher's classes
        const studentsSet = new Set();
        for (const classId of classIds) {
          const enrollmentsQuery = query(
            collection(db, 'enrollments'),
            where('classId', '==', classId)
          );
          const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
          enrollmentsSnapshot.docs.forEach(doc => {
            studentsSet.add(doc.data().studentEmail);
          });
        }

        // Fetch attendance records
        let totalAttendance = 0;
        let attendanceCount = 0;
        for (const classId of classIds) {
          const attendanceQuery = query(
            collection(db, 'attendance'),
            where('classId', '==', classId)
          );
          const attendanceSnapshot = await getDocs(attendanceQuery);
          attendanceSnapshot.docs.forEach(doc => {
            const data = doc.data();
            totalAttendance += data.present ? 1 : 0;
            attendanceCount++;
          });
        }

        // Fetch assignments
        let completedAssignments = 0;
        let totalAssignments = 0;
        let totalGrades = 0;
        let gradedAssignments = 0;
        
        for (const classId of classIds) {
          const assignmentsQuery = query(
            collection(db, 'assignments'),
            where('classId', '==', classId)
          );
          const assignmentsSnapshot = await getDocs(assignmentsQuery);
          assignmentsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.submitted) completedAssignments++;
            if (data.grade) {
              totalGrades += data.grade;
              gradedAssignments++;
            }
            totalAssignments++;
          });
        }

        setStats({
          totalStudents: studentsSet.size,
          totalClasses: classesSnapshot.size,
          averageAttendance: attendanceCount > 0 ? (totalAttendance / attendanceCount) * 100 : 0,
          assignmentCompletion: totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0,
          averageGrade: gradedAssignments > 0 ? totalGrades / gradedAssignments : 0,
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setLoading(false);
      }
    };

    fetchAnalytics();
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
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-2 text-gray-600">Overview of your teaching statistics and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Stats Cards */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-primary-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
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
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalClasses}</p>
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
              <p className="text-sm font-medium text-gray-600">Average Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageAttendance.toFixed(1)}%</p>
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
              <p className="text-sm font-medium text-gray-600">Assignment Completion</p>
              <p className="text-2xl font-bold text-gray-900">{stats.assignmentCompletion.toFixed(1)}%</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.averageGrade.toFixed(1)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performance Metrics Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Metrics</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
              <span className="text-sm font-medium text-gray-700">{stats.averageAttendance.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full"
                style={{ width: `${stats.averageAttendance}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Assignment Completion Rate</span>
              <span className="text-sm font-medium text-gray-700">{stats.assignmentCompletion.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full"
                style={{ width: `${stats.assignmentCompletion}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Average Grade Performance</span>
              <span className="text-sm font-medium text-gray-700">{(stats.averageGrade / 100 * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full"
                style={{ width: `${(stats.averageGrade / 100 * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Analytics; 