import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Survey, SurveyResponse, User } from '../store';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';

export const useSurveys = (activeOnly: boolean = false) => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = collection(db, 'surveys');
    if (activeOnly) {
      q = query(q, where('isActive', '==', true)) as any;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Survey));
      setSurveys(data);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.LIST, 'surveys');
      }
    });

    return unsubscribe;
  }, [activeOnly]);

  return { surveys, loading };
};

export const useResponses = (surveyId?: string, editorId?: string) => {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = collection(db, 'responses');
    const constraints = [];
    if (surveyId) constraints.push(where('surveyId', '==', surveyId));
    if (editorId) constraints.push(where('editorId', '==', editorId));
    
    if (constraints.length > 0) {
      q = query(q, ...constraints) as any;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('--- DEBUG: useResponses snapshot size:', snapshot.size);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SurveyResponse));
      setResponses(data);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.LIST, 'responses');
      }
    });

    return unsubscribe;
  }, [surveyId, editorId]);

  return { responses, loading };
};

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(data);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
    });

    return unsubscribe;
  }, []);

  return { users, loading };
};
