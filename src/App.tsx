/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import RegisterPage from './pages/RegisterPage';
import PatientHome from './pages/PatientHome';
import TakeSurvey from './pages/TakeSurvey';
import AdminDashboard from './pages/AdminDashboard';
import AdminSurveys from './pages/AdminSurveys';
import EditorReports from './pages/EditorReports';
import EditorSurveyRespondents from './pages/EditorSurveyRespondents';
import SurveyResults from './pages/SurveyResults';
import AdminLogin from './pages/AdminLogin';
import { ProtectedRoute } from './components/ProtectedRoute';
import UserManagement from './pages/UserManagement';
import NotFound from './pages/NotFound';
import { AuthProvider } from './components/AuthProvider';

export default function App() {
  // Force system redeploy
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Layout />}>
            <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin', 'editor', 'viewer']} />}>
              <Route index element={<PatientHome />} />
              <Route path="survey/:id" element={<TakeSurvey />} />
            </Route>
            <Route path="admin/login" element={<AdminLogin />} />
            <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin']} />}>
              <Route path="admin/editor-reports" element={<EditorReports />} />
              <Route path="admin/editor-reports/:editorId/:surveyId" element={<EditorSurveyRespondents />} />
              <Route path="admin/users" element={<UserManagement />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin', 'viewer']} />}>
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/surveys" element={<AdminSurveys />} />
              <Route path="admin/surveys/:id/results" element={<SurveyResults />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
