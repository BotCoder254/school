import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, storage } from '../config/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { CloudArrowUpIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const MyAssignments = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [uploadingSubmission, setUploadingSubmission] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // Get enrolled classes
        const enrollmentsQuery = query(
          collection(db, 'enrollments'),
          where('studentEmail', '==', user.email)
        );
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        const classIds = enrollmentsSnapshot.docs.map(doc => doc.data().classId);

        if (classIds.length === 0) {
          setLoading(false);
          return;
        }

        // Get assignments for enrolled classes
        const assignmentsQuery = query(
          collection(db, 'assignments'),
          where('classId', 'in', classIds)
        );
        const assignmentsSnapshot = await getDocs(assignmentsQuery);
        const assignmentsData = assignmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAssignments(assignmentsData);

        // Get submissions for these assignments
        const submissionsQuery = query(
          collection(db, 'submissions'),
          where('studentEmail', '==', user.email)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const submissionsData = submissionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSubmissions(submissionsData);
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setError('Failed to load assignments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchAssignments();
    }
  }, [user?.email, authLoading]);

  const handleSubmission = async (assignmentId, file) => {
    try {
      setUploadingSubmission(assignmentId);
      
      // Upload file to storage
      const fileRef = ref(storage, `submissions/${assignmentId}/${user.email}/${file.name}`);
      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);

      // Create submission document
      const submissionData = {
        assignmentId,
        studentEmail: user.email,
        fileUrl,
        submittedAt: new Date().toISOString(),
        status: 'submitted',
      };

      const existingSubmission = submissions.find(s => s.assignmentId === assignmentId);
      
      if (existingSubmission) {
        // Update existing submission
        await updateDoc(doc(db, 'submissions', existingSubmission.id), submissionData);
        setSubmissions(prev => prev.map(s => 
          s.id === existingSubmission.id ? { ...s, ...submissionData } : s
        ));
      } else {
        // Create new submission
        const submissionRef = await addDoc(collection(db, 'submissions'), submissionData);
        setSubmissions(prev => [...prev, { id: submissionRef.id, ...submissionData }]);
      }

      setUploadingSubmission(null);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      setUploadingSubmission(null);
    }
  };

  const getSubmissionStatus = (assignment) => {
    const submission = submissions.find(s => s.assignmentId === assignment.id);
    if (!submission) return 'Not Submitted';
    if (submission.grade !== undefined) return `Graded: ${submission.grade}/${assignment.totalPoints}`;
    return 'Submitted';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6"
    >
      <h1 className="text-2xl font-bold mb-6">My Assignments</h1>

      <div className="grid gap-6">
        {assignments.map(assignment => {
          const submission = submissions.find(s => s.assignmentId === assignment.id);
          const isOverdue = new Date(assignment.dueDate) < new Date();
          const status = getSubmissionStatus(assignment);
          
          return (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4 rounded shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{assignment.title}</h3>
                  <p className="text-gray-600">{assignment.description}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-500">
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Points: {assignment.totalPoints}
                    </p>
                    <p className={`text-sm ${
                      status.includes('Graded') ? 'text-green-600' :
                      status === 'Submitted' ? 'text-blue-600' :
                      isOverdue ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      Status: {status}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {assignment.fileUrl && (
                    <a
                      href={assignment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Assignment
                    </a>
                  )}
                  
                  {submission?.fileUrl && (
                    <a
                      href={submission.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Submission
                    </a>
                  )}
                </div>
              </div>

              {!isOverdue && status !== 'Graded' && (
                <div className="mt-4">
                  <label className="relative flex justify-center items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer">
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => e.target.files?.[0] && handleSubmission(assignment.id, e.target.files[0])}
                      disabled={uploadingSubmission === assignment.id}
                    />
                    <div className="flex items-center space-x-2 text-gray-600">
                      <CloudArrowUpIcon className="w-6 h-6" />
                      <span>
                        {uploadingSubmission === assignment.id
                          ? 'Uploading...'
                          : submission
                          ? 'Upload New Submission'
                          : 'Upload Submission'}
                      </span>
                    </div>
                  </label>
                </div>
              )}

              {submission?.grade !== undefined && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <h4 className="font-semibold mb-2">Feedback</h4>
                  <div className="flex items-center space-x-2">
                    {submission.grade >= (assignment.totalPoints * 0.7) ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 text-red-500" />
                    )}
                    <p>
                      Grade: {submission.grade}/{assignment.totalPoints} 
                      ({((submission.grade / assignment.totalPoints) * 100).toFixed(1)}%)
                    </p>
                  </div>
                  {submission.feedback && (
                    <p className="mt-2 text-gray-600">{submission.feedback}</p>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}

        {assignments.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No assignments found. Make sure you're enrolled in classes.
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MyAssignments; 