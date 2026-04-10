import React from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { currentUser, adminUser, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  if (!currentUser || !adminUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(adminUser.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
