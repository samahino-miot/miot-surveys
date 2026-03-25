import { db, auth } from './firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, onSnapshot } from 'firebase/firestore';

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

// We will use hooks in components to fetch data instead of synchronous functions

