import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { useSurveys } from '../hooks/useFirestore';

export default function PatientHome() {
  const { surveys, loading } = useSurveys(true);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading surveys...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <img src="/logo.png" alt="MIOT International" className="h-16 sm:h-20 mx-auto mb-6 object-contain" onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }} />
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Welcome to MIOT International</h1>
        <p className="text-lg text-slate-600">Your feedback helps us provide better care. Please take a moment to complete our surveys.</p>
      </div>

      <div className="space-y-4">
        {surveys.map(survey => (
          <Link 
            key={survey.id}
            to={`/survey/${survey.id}`}
            className="block bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-teal-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-teal-700 transition-colors">{survey.title}</h3>
                <p className="text-slate-600">{survey.description}</p>
              </div>
              <ChevronRight className="h-6 w-6 text-slate-400 group-hover:text-teal-500 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
