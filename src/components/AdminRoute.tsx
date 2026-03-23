import { Navigate, Outlet } from 'react-router';
import { useAuth } from './AuthProvider';

export default function AdminRoute() {
  const { currentUser, adminUser, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  if (!currentUser || !adminUser || adminUser.status !== 'active') {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
