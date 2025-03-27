import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  db
} from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const defaultAuthContext = {
  user: null,
  loading: true,
  error: '',
  signUp: async () => {},
  signIn: async () => {},
  signInWithGoogle: async () => {},
  resetPassword: async () => {},
  logout: async () => {},
};

const AuthContext = createContext(defaultAuthContext);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Get user role from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.email));
          const userData = userDoc.data() || {};
          
          setUser({
            ...user,
            role: userData.role || 'student',
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email, password, role) => {
    try {
      setError('');
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Store user role in Firestore
      await setDoc(doc(db, 'users', email), {
        email,
        role,
        createdAt: new Date().toISOString(),
      });

      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const signIn = async (email, password) => {
    try {
      setError('');
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Get user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', email));
      const userData = userDoc.data() || {};
      
      setUser({
        ...user,
        role: userData.role || 'student',
      });

      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const signInWithGoogle = async (role) => {
    try {
      setError('');
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      
      // Store or update user role in Firestore
      await setDoc(doc(db, 'users', user.email), {
        email: user.email,
        role,
        createdAt: new Date().toISOString(),
      });

      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      setError('');
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setError('');
      await signOut(auth);
      setUser(null);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    resetPassword,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 