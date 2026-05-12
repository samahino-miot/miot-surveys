import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, Home, LogOut, ClipboardList } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { logout } from '../firebase';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, adminUser } = useAuth();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isLoginPath = location.pathname === '/admin/login' || location.pathname === '/admin/register';
  const isAuth = !!currentUser && !!adminUser && adminUser.status === 'active';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight truncate">
                MIOT <span className="hidden sm:inline">International</span>
              </span>
            </div>
            {isAuth && (
              <nav className="flex gap-4 sm:gap-6 shrink-0 items-center">
                {(adminUser.role === 'admin' || adminUser.role === 'superadmin' || adminUser.role === 'viewer') && (
                  <Link to="/" className={`flex items-center gap-2 text-sm font-medium ${location.pathname === '/' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-900'}`}>
                    <Home className="h-5 w-5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Survey Portal</span>
                  </Link>
                )}
                {(adminUser.role === 'admin' || adminUser.role === 'superadmin' || adminUser.role === 'editor') && (
                  <Link to="/admin/editor-reports" className={`flex items-center gap-2 text-sm font-medium ${location.pathname === '/admin/editor-reports' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-900'}`}>
                    <ClipboardList className="h-5 w-5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Surveyor Reports</span>
                  </Link>
                )}
                {(adminUser.role === 'admin' || adminUser.role === 'superadmin') && (
                  <Link to="/admin" className={`flex items-center gap-2 text-sm font-medium ${isAdminPath ? 'text-teal-600' : 'text-slate-500 hover:text-slate-900'}`}>
                    <LayoutDashboard className="h-5 w-5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </nav>
            )}
          </div>
        </div>
      </header>
      
      {isAdminPath && !isLoginPath && isAuth && (
        <div className="bg-slate-900 text-white overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-12">
              <nav className="flex gap-6 items-center whitespace-nowrap">
                <Link to="/admin" className={`text-sm font-medium ${location.pathname === '/admin' ? 'text-teal-400' : 'text-slate-300 hover:text-white'}`}>
                  Overview
                </Link>
                <Link to="/admin/surveys" className={`text-sm font-medium ${location.pathname.includes('/admin/surveys') ? 'text-teal-400' : 'text-slate-300 hover:text-white'}`}>
                  Manage Surveys
                </Link>
                {(adminUser.role === 'admin' || adminUser.role === 'superadmin' || adminUser.role === 'editor') && (
                  <Link to="/admin/editor-reports" className={`text-sm font-medium ${location.pathname.includes('/admin/editor-reports') ? 'text-teal-400' : 'text-slate-300 hover:text-white'}`}>
                    Surveyor Reports
                  </Link>
                )}
                {(adminUser.role === 'admin' || adminUser.role === 'superadmin') && (
                  <Link to="/admin/users" className={`text-sm font-medium ${location.pathname.includes('/admin/users') ? 'text-teal-400' : 'text-slate-300 hover:text-white'}`}>
                    User Management
                  </Link>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
