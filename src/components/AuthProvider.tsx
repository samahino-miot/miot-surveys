import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as FirebaseUser, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { User } from '../store';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  adminUser: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  adminUser: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      window.location.href = '/login'; // Force redirect to login
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, 30 * 60 * 1000); // 30 minutes
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    if (currentUser) {
      events.forEach(event => window.addEventListener(event, resetTimer));
      resetTimer();
    }

    return () => {
      clearTimeout(timer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [currentUser, logout]);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      
      // Clean up previous document listener if it exists
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = undefined;
      }
      
      if (user) {
        // Listen to the user document in Firestore to get role/status
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setAdminUser(docSnap.data() as User);
          } else {
            setAdminUser(null);
          }
          setLoading(false);
        }, (error) => {
          setAdminUser(null);
          setLoading(false);
          // Only log error if the user is still authenticated (ignore sign-out race conditions)
          if (auth.currentUser) {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          }
        });
      } else {
        setAdminUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, adminUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
