/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router';
import Layout from './components/Layout';
import PatientHome from './pages/PatientHome';
import TakeSurvey from './pages/TakeSurvey';
import AdminDashboard from './pages/AdminDashboard';
import AdminSurveys from './pages/AdminSurveys';
import SurveyResults from './pages/SurveyResults';
import AdminLogin from './pages/AdminLogin';
import AdminRegister from './pages/AdminRegister';
import AdminRoute from './components/AdminRoute';
import UserManagement from './pages/UserManagement';
import NotFound from './pages/NotFound';
import { AuthProvider } from './components/AuthProvider';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<PatientHome />} />
            <Route path="survey/:id" element={<TakeSurvey />} />
            <Route path="admin/login" element={<AdminLogin />} />
            <Route path="admin/register" element={<AdminRegister />} />
            <Route element={<AdminRoute />}>
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/surveys" element={<AdminSurveys />} />
              <Route path="admin/surveys/:id/results" element={<SurveyResults />} />
              <Route path="admin/users" element={<UserManagement />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
