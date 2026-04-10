import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { resetPassword } from '../firebase';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setMessage('');
    setIsSending(true);
    try {
      await resetPassword(email);
      setMessage('Password reset email sent. Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Reset Password</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email ID</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              placeholder="admin@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={isSending}
            className="w-full py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 shadow-sm transition-colors disabled:opacity-50"
          >
            {isSending ? 'Sending...' : 'Send Reset Email'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          <Link to="/login" className="text-teal-600 font-medium hover:underline flex items-center justify-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
