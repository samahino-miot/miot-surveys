import { db, auth } from './firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firebaseUtils';

export type QuestionType = 'text' | 'rating' | 'multiple_choice' | 'checkbox' | 'date' | 'time' | 'file_upload';

export interface QuestionCondition {
  dependsOnId: string;
  equals: string | number | boolean;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[]; // For multiple_choice and checkbox
  required: boolean;
  condition?: QuestionCondition;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: string;
  isActive: boolean;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  patientName: string;
  attendantName: string;
  relationToPatient: string;
  age: string;
  gender: string;
  mrNo: string;
  city: string;
  state: string;
  country: string;
  purposeOfVisit: string;
  department: string;
  answers: Record<string, string | string[] | number>;
  submittedAt: string;
}

export const saveSurvey = async (survey: Survey) => {
  try {
    await setDoc(doc(db, 'surveys', survey.id), survey);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `surveys/${survey.id}`);
  }
};

export const deleteSurvey = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'surveys', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `surveys/${id}`);
  }
};

export const saveResponse = async (response: SurveyResponse) => {
  try {
    await setDoc(doc(db, 'responses', response.id), response);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `responses/${response.id}`);
  }
};

export const deleteResponse = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'responses', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `responses/${id}`);
  }
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'superadmin' | 'editor';
  status: 'pending' | 'active';
  createdAt: string;
}

export const saveUser = async (user: User) => {
  try {
    await setDoc(doc(db, 'users', user.id), user);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
  }
};

export const deleteUser = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'users', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
  }
};

// Date formatting utilities for Firestore Timestamps
export const getTimestamp = (dateVal: any): number => {
  if (!dateVal) return 0;
  if (typeof dateVal.toMillis === 'function') return dateVal.toMillis();
  if (typeof dateVal.seconds === 'number') return dateVal.seconds * 1000;
  const parsed = new Date(dateVal).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

export const formatDate = (dateVal: any, includeTime: boolean = false): string => {
  if (!dateVal) return 'N/A';
  
  let date: Date;
  if (typeof dateVal.toDate === 'function') {
    date = dateVal.toDate();
  } else if (typeof dateVal.seconds === 'number') {
    date = new Date(dateVal.seconds * 1000);
  } else {
    date = new Date(dateVal);
  }

  if (isNaN(date.getTime())) return 'Invalid Date';

  if (includeTime) {
    return date.toLocaleString();
  }
  return date.toLocaleDateString();
};

// We will use hooks in components to fetch data instead of synchronous functions

