import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, storage } from '../config/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { 
  CloudArrowUpIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  DocumentIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const MyAssignments = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [uploadingSubmission, setUploadingSubmission] = useState(null);
  const [error, setError] = useState(null);
  const [enrolledClasses, setEnrolledClasses] = useState([]);

  useEffect(() => {
    if (!user?.email || authLoading) return;

    const fetchEnrolledClasses = async () => {
      try {
        const enrollmentsQuery = query(
          collection(db, 'enrollments'),
          where('studentEmail', '==', user.email)
        );
        
        const unsubscribe = onSnapshot(enrollmentsQuery, async (snapshot) => {
          const classIds = snapshot.docs.map(doc => doc.data().classId);
          setEnrolledClasses(classIds);
          
          if (classIds.length > 0) {
            // Set up real-time listener for assignments
            const assignmentsQuery = query(
              collection(db, 'assignments'),
              where('classId', 'in', classIds)
            );
            
            const assignmentsUnsubscribe = onSnapshot(assignmentsQuery, (assignmentsSnapshot) => {
              const assignmentsData = assignmentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              setAssignments(assignmentsData);
            });

            // Set up real-time listener for submissions
            const submissionsQuery = query(
              collection(db, 'submissions'),
              where('studentEmail', '==', user.email)
            );
            
            const submissionsUnsubscribe = onSnapshot(submissionsQuery, (submissionsSnapshot) => {
              const submissionsData = submissionsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              setSubmissions(submissionsData);
            });

            return () => {
              assignmentsUnsubscribe();
              submissionsUnsubscribe();
            };
          }
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching enrolled classes:', error);
        setError('Failed to load assignments');
        setLoading(false);
      }
    };

    fetchEnrolledClasses();
  }, [user?.email, authLoading]);

  const handleSubmission = async (assignmentId, file) => {
    if (!file) return;

    try {
      setError(null);
      setUploadingSubmission(assignmentId);
      
      // Upload file to storage
      const fileRef = ref(storage, `submissions/${assignmentId}/${user.email}/${file.name}`);
      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);

      // Create submission document
      const submissionData = {
        assignmentId,
        studentEmail: user.email,
        fileName: file.name,
        fileUrl,
        submittedAt: serverTimestamp(),
        status: 'submitted',
      };

      const existingSubmission = submissions.find(s => s.assignmentId === assignmentId);
      
      if (existingSubmission) {
        // Update existing submission
        await updateDoc(doc(db, 'submissions', existingSubmission.id), submissionData);
      } else {
        // Create new submission
        await addDoc(collection(db, 'submissions'), submissionData);
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      setError('Failed to submit assignment');
    } finally {
      setUploadingSubmission(null);
    }
  };

  const getSubmissionStatus = (assignment) => {
    const submission = submissions.find(s => s.assignmentId === assignment.id);
    if (!submission) return 'Not Submitted';
    if (submission.grade !== undefined) return `Graded: ${submission.grade}/${assignment.totalPoints}`;
    return 'Submitted';
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const getTimeRemaining = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;
    
    if (diff < 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} days remaining`;
    if (hours > 0) return `${hours} hours remaining`;
    return 'Due soon';
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

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-red-50 text-red-700 rounded-md"
        >
          {error}
        </motion.div>
      )}

      <div className="grid gap-6">
        <AnimatePresence>
          {assignments.map(assignment => {
            const submission = submissions.find(s => s.assignmentId === assignment.id);
            const status = getSubmissionStatus(assignment);
            const timeRemaining = getTimeRemaining(assignment.dueDate);
            const isLate = isOverdue(assignment.dueDate);
            
            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-6 rounded-lg shadow-md"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold">{assignment.title}</h3>
                    <p className="text-gray-600 mt-2">{assignment.description}</p>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <ClockIcon className="w-4 h-4 mr-2" />
                        <span className={isLate ? 'text-red-600' : ''}>
                          Due: {new Date(assignment.dueDate).toLocaleDateString()} ({timeRemaining})
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <DocumentIcon className="w-4 h-4 mr-2" />
                        <span>Points: {assignment.totalPoints}</span>
                      </div>

                      <div className="flex items-center text-sm">
                        {status === 'Not Submitted' ? (
                          <ExclamationCircleIcon className="w-4 h-4 mr-2 text-yellow-500" />
                        ) : status.includes('Graded') ? (
                          <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500" />
                        ) : (
                          <CloudArrowUpIcon className="w-4 h-4 mr-2 text-blue-500" />
                        )}
                        <span className={
                          status === 'Not Submitted' ? 'text-yellow-700' :
                          status.includes('Graded') ? 'text-green-700' : 'text-blue-700'
                        }>
                          {status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    {assignment.fileUrl && (
                      <a
                        href={assignment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center"
                      >
                        <DocumentIcon className="w-4 h-4 mr-1" />
                        View Assignment
                      </a>
                    )}
                    
                    {submission?.fileUrl && (
                      <a
                        href={submission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center"
                      >
                        <CloudArrowUpIcon className="w-4 h-4 mr-1" />
                        View Submission
                      </a>
                    )}
                  </div>
                </div>

                {!isLate && status !== 'Graded' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6"
                  >
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
                  </motion.div>
                )}

                {submission?.grade !== undefined && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 p-4 bg-gray-50 rounded-lg"
                  >
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
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {assignments.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-500 py-8"
          >
            No assignments found. Make sure you're enrolled in classes.
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default MyAssignments; 