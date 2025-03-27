import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import {
  PaperClipIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const MyAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    if (!user?.email) return;

    // Fetch enrolled classes
    const enrollmentsQuery = query(
      collection(db, 'enrollments'),
      where('studentEmail', '==', user.email)
    );

    const unsubscribeEnrollments = onSnapshot(enrollmentsQuery, async (snapshot) => {
      const classIds = snapshot.docs.map(doc => doc.data().classId);
      
      if (classIds.length > 0) {
        // Fetch assignments for enrolled classes
        const assignmentsQuery = query(
          collection(db, 'assignments'),
          where('classId', 'in', classIds)
        );

        const unsubscribeAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
          const assignmentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setAssignments(assignmentsData);
          setLoading(false);
        });

        // Fetch submissions
        const submissionsQuery = query(
          collection(db, 'submissions'),
          where('studentEmail', '==', user.email)
        );

        const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
          const submissionsData = {};
          snapshot.docs.forEach(doc => {
            submissionsData[doc.data().assignmentId] = {
              id: doc.id,
              ...doc.data(),
            };
          });
          setSubmissions(submissionsData);
        });

        return () => {
          unsubscribeAssignments();
          unsubscribeSubmissions();
        };
      }
    });

    return () => {
      unsubscribeEnrollments();
    };
  }, [user?.email]);

  const handleFileChange = (e, assignment) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setSelectedAssignment(assignment);
    }
  };

  const handleSubmit = async (assignment) => {
    if (!selectedFile) return;
    setSubmitting(true);

    try {
      const fileRef = ref(storage, `submissions/${selectedFile.name}-${Date.now()}`);
      await uploadBytes(fileRef, selectedFile);
      const fileUrl = await getDownloadURL(fileRef);

      const submissionData = {
        assignmentId: assignment.id,
        studentEmail: user.email,
        fileUrl,
        submittedAt: new Date(),
        status: 'submitted',
      };

      if (submissions[assignment.id]) {
        // Update existing submission
        await updateDoc(doc(db, 'submissions', submissions[assignment.id].id), submissionData);
      } else {
        // Create new submission
        await addDoc(collection(db, 'submissions'), submissionData);
      }

      setSelectedFile(null);
      setSelectedAssignment(null);
    } catch (error) {
      console.error('Error submitting assignment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getSubmissionStatus = (assignment) => {
    const submission = submissions[assignment.id];
    if (!submission) return 'Not Submitted';
    if (submission.grade) return `Graded: ${submission.grade}%`;
    return 'Submitted';
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
        My Assignments
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((assignment) => (
          <motion.div
            key={assignment.id}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{assignment.title}</h3>
                <p className="text-sm text-gray-500">
                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                </p>
              </div>
              {assignment.fileUrl && (
                <a
                  href={assignment.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-primary-500"
                >
                  <PaperClipIcon className="w-5 h-5" />
                </a>
              )}
            </div>
            <p className="text-gray-600 mb-4">{assignment.description}</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Points: {assignment.points}
                </span>
                <span className={`px-3 py-1 rounded-full ${
                  submissions[assignment.id]?.grade
                    ? 'bg-green-100 text-green-800'
                    : submissions[assignment.id]
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {getSubmissionStatus(assignment)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, assignment)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={() => handleSubmit(assignment)}
                  disabled={!selectedFile || selectedAssignment?.id !== assignment.id || submitting}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    !selectedFile || selectedAssignment?.id !== assignment.id || submitting
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  } transition-colors`}
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <CloudArrowUpIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default MyAssignments; 