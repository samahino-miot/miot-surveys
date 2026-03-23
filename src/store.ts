import { db, auth } from './firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, onSnapshot } from 'firebase/firestore';

export type QuestionType = 'text' | 'rating' | 'multiple_choice' | 'checkbox' | 'date' | 'time' | 'file_upload';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[]; // For multiple_choice and checkbox
  required: boolean;
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
  patientEmail: string;
  patientPlace: string;
  answers: Record<string, string | string[] | number>;
  submittedAt: string;
}

export const saveSurvey = async (survey: Survey) => {
  try {
    await setDoc(doc(db, 'surveys', survey.id), survey);
  } catch (error) {
    console.error("Error saving survey", error);
    throw error;
  }
};

export const deleteSurvey = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'surveys', id));
  } catch (error) {
    console.error("Error deleting survey", error);
    throw error;
  }
};

export const saveResponse = async (response: SurveyResponse) => {
  try {
    await setDoc(doc(db, 'responses', response.id), response);
  } catch (error) {
    console.error("Error saving response", error);
    throw error;
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
    console.error("Error saving user", error);
    throw error;
  }
};

export const deleteUser = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'users', id));
  } catch (error) {
    console.error("Error deleting user", error);
    throw error;
  }
};

// We will use hooks in components to fetch data instead of synchronous functions

