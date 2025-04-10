import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, storage } from '../config/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const AssignmentManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    totalPoints: 100,
    file: null,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.email) return;

    const fetchClasses = async () => {
      try {
        const classesQuery = query(
          collection(db, 'classes'),
          where('teacherEmail', '==', user.email)
        );
        
        const unsubscribe = onSnapshot(classesQuery, (snapshot) => {
          const classesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setClasses(classesData);
          if (classesData.length > 0 && !selectedClass) {
            setSelectedClass(classesData[0].id);
          }
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching classes:', error);
        setError('Failed to load classes');
        setLoading(false);
      }
    };

    fetchClasses();
  }, [user?.email]);

  useEffect(() => {
    if (!selectedClass) return;

    const fetchAssignmentsAndSubmissions = async () => {
      try {
        setLoading(true);
        
        const assignmentsQuery = query(
          collection(db, 'assignments'),
          where('classId', '==', selectedClass)
        );
        
        const unsubscribeAssignments = onSnapshot(assignmentsQuery, async (snapshot) => {
          const assignmentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setAssignments(assignmentsData);

          // Fetch submissions for all assignments
          const submissionsPromises = assignmentsData.map(assignment => {
            const submissionsQuery = query(
              collection(db, 'submissions'),
              where('assignmentId', '==', assignment.id)
            );
            return getDocs(submissionsQuery);
          });

          const submissionsSnapshots = await Promise.all(submissionsPromises);
          const submissionsData = submissionsSnapshots.flatMap(snapshot =>
            snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
          );
          setSubmissions(submissionsData);
          setLoading(false);
        });

        return () => unsubscribeAssignments();
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setError('Failed to load assignments');
        setLoading(false);
      }
    };

    fetchAssignmentsAndSubmissions();
  }, [selectedClass]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass) return;

    try {
      setLoading(true);
      setError(null);
      let fileUrl = '';
      
      if (formData.file) {
        const fileRef = ref(storage, `assignments/${selectedClass}/${formData.file.name}`);
        await uploadBytes(fileRef, formData.file);
        fileUrl = await getDownloadURL(fileRef);
      }

      const assignmentData = {
        classId: selectedClass,
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        totalPoints: Number(formData.totalPoints),
        fileUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        teacherEmail: user.email,
      };

      if (editingAssignment) {
        await updateDoc(doc(db, 'assignments', editingAssignment.id), assignmentData);
      } else {
        await addDoc(collection(db, 'assignments'), assignmentData);
      }

      setFormData({
        title: '',
        description: '',
        dueDate: '',
        totalPoints: 100,
        file: null,
      });
      setShowForm(false);
      setEditingAssignment(null);
    } catch (error) {
      console.error('Error saving assignment:', error);
      setError('Failed to save assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      totalPoints: assignment.totalPoints,
      file: null,
    });
    setShowForm(true);
  };

  const handleDelete = async (assignmentId, fileUrl) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;

    try {
      setLoading(true);
      setError(null);

      // Delete the assignment document
      await deleteDoc(doc(db, 'assignments', assignmentId));

      // Delete the file from storage if it exists
      if (fileUrl) {
        const fileRef = ref(storage, fileUrl);
        await deleteObject(fileRef);
      }

      // Delete all submissions for this assignment
      const submissionsQuery = query(
        collection(db, 'submissions'),
        where('assignmentId', '==', assignmentId)
      );
      const submissionsSnapshot = await getDocs(submissionsQuery);
      const deletePromises = submissionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting assignment:', error);
      setError('Failed to delete assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (submissionId, grade, feedback = '') => {
    if (!submissionId) return;
    
    try {
      setError(null);
      await updateDoc(doc(db, 'submissions', submissionId), {
        grade: Number(grade),
        feedback,
        gradedAt: serverTimestamp(),
        gradedBy: user.email,
      });
    } catch (error) {
      console.error('Error grading submission:', error);
      setError('Failed to save grade');
    }
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
      <h1 className="text-2xl font-bold mb-6">Assignment Management</h1>
      
      <div className="mb-6">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full md:w-64 p-2 border rounded"
        >
          <option value="">Select a class</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>

      {selectedClass && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(!showForm)}
          className="mb-6 bg-blue-600 text-white px-4 py-2 rounded flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          {showForm ? 'Cancel' : 'Create Assignment'}
        </motion.button>
      )}

      {showForm && (
        <motion.form
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mb-6 p-4 bg-white rounded shadow"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4">
            <input
              type="text"
              placeholder="Assignment Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="p-2 border rounded"
              required
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="p-2 border rounded"
              required
            />
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="p-2 border rounded"
              required
            />
            <input
              type="number"
              placeholder="Total Points"
              value={formData.totalPoints}
              onChange={(e) => setFormData(prev => ({ ...prev, totalPoints: e.target.value }))}
              className="p-2 border rounded"
              required
            />
            <input
              type="file"
              onChange={(e) => setFormData(prev => ({ ...prev, file: e.target.files[0] }))}
              className="p-2 border rounded"
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
            </button>
          </div>
        </motion.form>
      )}

      <div className="grid gap-6">
        {assignments.map(assignment => (
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
                <p className="text-sm text-gray-500">
                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(assignment)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(assignment.id, assignment.fileUrl)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold mb-2">Submissions</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">Student</th>
                      <th className="px-4 py-2 text-left">Submitted At</th>
                      <th className="px-4 py-2 text-left">Grade</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions
                      .filter(sub => sub.assignmentId === assignment.id)
                      .map(submission => (
                        <tr key={submission.id} className="border-t">
                          <td className="px-4 py-2">{submission.studentEmail}</td>
                          <td className="px-4 py-2">
                            {new Date(submission.submittedAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={submission.grade || ''}
                              onChange={(e) => handleGrade(submission.id, e.target.value)}
                              className="w-20 p-1 border rounded"
                              max={assignment.totalPoints}
                            />
                            /{assignment.totalPoints}
                          </td>
                          <td className="px-4 py-2">
                            <a
                              href={submission.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View Submission
                            </a>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default AssignmentManagement; 