import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { signInWithGoogle, signInWithEmailUser, logout } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import { Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { currentUser, adminUser, loading } = useAuth();

  useEffect(() => {
    if (!loading && currentUser) {
      if (adminUser) {
        if (adminUser.status === 'pending') {
          setError('Your account is under review. Please wait for admin approval.');
          (async () => { await logout(); })();
        } else if (adminUser.role === 'admin' || adminUser.role === 'superadmin') {
          navigate('/admin');
        } else if (adminUser.role === 'editor' || adminUser.role === 'viewer') {
          navigate('/');
        }
      } else {
        // User is logged in but has no role in Firestore
        setError('Your account does not have a valid role assigned.');
      }
    }
  }, [currentUser, adminUser, loading, navigate]);

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError('Failed to sign in with Google. Please try again.');
      setIsLoggingIn(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setIsLoggingIn(true);
    try {
      await signInWithEmailUser(email, password);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid credentials.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="text-center mb-8">
        <img src="https://www.miotinternational.com/wp-content/uploads/2025/06/logo_cmp_pg.png" alt="MIOT International" className="h-16 sm:h-20 mx-auto mb-6 object-contain" referrerPolicy="no-referrer" onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }} />
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center">
            <Lock className="h-8 w-8" />
          </div>
        </div>
        
        <p className="text-center text-slate-600 mb-8 font-bold">Sign in to continue.</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email ID / Phone Number</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <div className="text-right mt-1">
              <Link to="/forgot-password" className="text-xs text-teal-600 hover:underline">Forgot password?</Link>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoggingIn || loading}
            className="w-full py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 shadow-sm transition-colors disabled:opacity-50"
          >
            {isLoggingIn ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={isLoggingIn || loading}
          className="w-full py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 shadow-sm transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
        </button>
        
        <div className="mt-6 text-center text-sm text-slate-600">
          Not a registered user?{' '}
          <Link to="/register" className="text-teal-600 font-medium hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
