import React from 'react';
import { Link } from 'react-router';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center py-16 px-8 bg-white rounded-3xl shadow-sm border border-slate-200">
        <AlertCircle className="h-16 w-16 text-teal-600 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-slate-900 mb-4">404 - Page Not Found</h2>
        <p className="text-lg text-slate-600 mb-8">The page you are looking for doesn’t exist.</p>
        <Link
          to="/"
          className="px-8 py-4 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
