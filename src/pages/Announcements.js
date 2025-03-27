import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  MegaphoneIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  BellIcon,
  GlobeAltIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const Announcements = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [classes, setClasses] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'normal',
    visibility: 'all',
    classId: '',
  });
  const [isTeacher] = useState(user?.email?.endsWith('@teacher.edu'));

  useEffect(() => {
    let unsubscribe;

    const setupRealtimeAnnouncements = async () => {
      try {
        setLoading(true);
        
        // Fetch classes first
        if (isTeacher) {
          const classesQuery = query(
            collection(db, 'classes'),
            where('teacherEmail', '==', user.email)
          );
          const classesSnapshot = await getDocs(classesQuery);
          setClasses(classesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })));
        } else {
          const enrollmentsQuery = query(
            collection(db, 'enrollments'),
            where('studentEmail', '==', user.email)
          );
          const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
          const classIds = enrollmentsSnapshot.docs.map(doc => doc.data().classId);
          
          if (classIds.length > 0) {
            const classesQuery = query(
              collection(db, 'classes'),
              where('__name__', 'in', classIds)
            );
            const classesSnapshot = await getDocs(classesQuery);
            setClasses(classesSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })));
          }
        }

        // Set up real-time listener for announcements
        let announcementsQuery;
        if (isTeacher) {
          announcementsQuery = query(
            collection(db, 'announcements'),
            where('createdBy', '==', user.email),
            orderBy('createdAt', 'desc')
          );
        } else {
          announcementsQuery = query(
            collection(db, 'announcements'),
            orderBy('createdAt', 'desc')
          );
        }

        unsubscribe = onSnapshot(announcementsQuery, (snapshot) => {
          const announcementsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          })).filter(announcement => {
            if (!isTeacher) {
              return announcement.visibility === 'all' || 
                     (announcement.classId && classes.some(c => c.id === announcement.classId));
            }
            return true;
          });

          setAnnouncements(announcementsList);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error setting up announcements:', error);
        setLoading(false);
      }
    };

    setupRealtimeAnnouncements();
    return () => unsubscribe && unsubscribe();
  }, [user.email, isTeacher]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const announcementData = {
        ...newAnnouncement,
        createdBy: user.email,
        createdAt: serverTimestamp(),
        createdByName: user.displayName || user.email,
      };

      await addDoc(collection(db, 'announcements'), announcementData);
      setShowModal(false);
      setNewAnnouncement({
        title: '',
        content: '',
        priority: 'normal',
        visibility: 'all',
        classId: '',
      });
    } catch (error) {
      console.error('Error creating announcement:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet',
    'link'
  ];

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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="mt-2 text-gray-600">
            {isTeacher ? 'Manage your announcements' : 'View class announcements'}
          </p>
        </div>
        {isTeacher && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Announcement
          </button>
        )}
      </div>

      <div className="space-y-6">
        {announcements.map((announcement) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-lg shadow p-6 ${
              announcement.priority === 'urgent' ? 'border-l-4 border-red-500' : ''
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {announcement.visibility === 'all' ? (
                    <GlobeAltIcon className="h-6 w-6 text-primary-500" />
                  ) : (
                    <UserGroupIcon className="h-6 w-6 text-primary-500" />
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {announcement.title}
                  </h3>
                  <div 
                    className="mt-2 prose prose-sm max-w-none text-gray-600"
                    dangerouslySetInnerHTML={{ __html: announcement.content }}
                  />
                  <div className="mt-4 flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      Posted by {announcement.createdByName}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </span>
                    {announcement.priority === 'urgent' && (
                      <span className="px-2 py-1 text-xs font-semibold text-red-500 bg-red-100 rounded-full">
                        Urgent
                      </span>
                    )}
                    {announcement.classId && (
                      <span className="px-2 py-1 text-xs font-semibold text-primary-500 bg-primary-100 rounded-full">
                        {classes.find(c => c.id === announcement.classId)?.name || 'Class'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {isTeacher && (
                <button
                  onClick={() => handleDelete(announcement.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {announcements.length === 0 && (
          <div className="text-center py-12">
            <MegaphoneIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isTeacher
                ? 'Get started by creating a new announcement'
                : 'No announcements have been posted yet'}
            </p>
          </div>
        )}
      </div>

      {/* Create Announcement Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Create Announcement</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) =>
                    setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <ReactQuill
                  value={newAnnouncement.content}
                  onChange={(content) =>
                    setNewAnnouncement({ ...newAnnouncement, content })
                  }
                  modules={modules}
                  formats={formats}
                  className="bg-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    value={newAnnouncement.priority}
                    onChange={(e) =>
                      setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Visibility</label>
                  <select
                    value={newAnnouncement.visibility}
                    onChange={(e) =>
                      setNewAnnouncement({ ...newAnnouncement, visibility: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="all">All Students</option>
                    <option value="class">Specific Class</option>
                  </select>
                </div>
                {newAnnouncement.visibility === 'class' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Class</label>
                    <select
                      value={newAnnouncement.classId}
                      onChange={(e) =>
                        setNewAnnouncement({ ...newAnnouncement, classId: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required={newAnnouncement.visibility === 'class'}
                    >
                      <option value="">Select a class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Announcements; 