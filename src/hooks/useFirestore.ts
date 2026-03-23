import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Survey, SurveyResponse, User } from '../store';

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
      console.error("Error fetching surveys", error);
      setLoading(false);
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
      console.error("Error fetching responses", error);
      setLoading(false);
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
      console.error("Error fetching users", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { users, loading };
};
