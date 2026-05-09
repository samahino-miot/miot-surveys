import { Link } from 'react-router';
import { ChevronRight, BarChart2 } from 'lucide-react';
import { useSurveys, useResponses } from '../hooks/useFirestore';
import { useAuth } from '../components/AuthProvider';

export default function PatientHome() {
  const { surveys, loading: surveysLoading } = useSurveys(true);
  const { currentUser, adminUser } = useAuth();
  const editorId = adminUser?.id || currentUser?.uid;
  const { responses, loading: responsesLoading } = useResponses(undefined, editorId);

  if (surveysLoading || responsesLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <img src="https://www.miotinternational.com/wp-content/uploads/2025/06/logo_cmp_pg.png" alt="MIOT International" className="h-16 sm:h-20 mx-auto mb-6 object-contain" referrerPolicy="no-referrer" onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }} />
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Welcome to MIOT International</h1>
        <p className="text-lg text-slate-600 mb-8">Help us make your experience better, share your feedback with us.</p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="inline-flex items-center gap-3 bg-teal-50 px-6 py-3 rounded-full text-teal-800 font-semibold shadow-sm border border-teal-100">
            <BarChart2 className="w-5 h-5" />
            <span>Today's submissions: {responses.filter(r => new Date(r.submittedAt).toDateString() === new Date().toDateString()).length} (Target: 50)</span>
          </div>
          <div className="text-sm text-slate-500">
            <span>Total completed by you: {responses.length}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {surveys.length > 0 ? (
          surveys.map(survey => (
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
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-200">
            <p className="text-slate-500 text-lg">No surveys available</p>
          </div>
        )}
      </div>
    </div>
  );
}
