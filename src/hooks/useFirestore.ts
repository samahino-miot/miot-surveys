import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Survey, SurveyResponse, User } from '../store';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We log the error but do not throw it to prevent crashing the React app
}

export const useSurveys = (activeOnly: boolean = false) => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = collection(db, 'surveys');
    if (activeOnly) {
      q = query(q, where('isActive', '==', true)) as any;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Survey);
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

export const useResponses = (surveyId?: string) => {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = collection(db, 'responses');
    if (surveyId) {
      q = query(q, where('surveyId', '==', surveyId)) as any;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as SurveyResponse);
      setResponses(data);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.LIST, 'responses');
      }
    });

    return unsubscribe;
  }, [surveyId]);

  return { responses, loading };
};

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as User);
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
