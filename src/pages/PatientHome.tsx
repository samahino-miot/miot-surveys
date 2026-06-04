import { Link } from 'react-router';
import { ChevronRight, BarChart2, Share2 } from 'lucide-react';
import { useSurveys, useResponses } from '../hooks/useFirestore';
import { useAuth } from '../components/AuthProvider';

export default function PatientHome() {
  const { currentUser, adminUser, loading: authLoading } = useAuth();
  const editorId = adminUser?.id || currentUser?.uid;
  const { surveys, loading: surveysLoading } = useSurveys(true, editorId);
  const { responses, loading: responsesLoading } = useResponses(undefined, editorId);

  const handleShare = async (e: React.MouseEvent, surveyId: string, title: string) => {
    e.preventDefault();
    const surveyorId = currentUser?.uid || 'anonymous';
    const shareUrl = `${window.location.origin}/public-survey/${surveyId}?surveyorId=${surveyorId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Take Survey: ${title}`,
          text: `Please fill out this survey: ${title}`,
          url: shareUrl,
        });
      } catch (err) {
        // Fallback to clipboard if share failed or user cancelled
        navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    } else {
      // Fallback
      navigator.clipboard.writeText(shareUrl);
      alert('Public survey link copied to clipboard!');
    }
  };

  if (surveysLoading || responsesLoading || authLoading) {
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
        
      </div>

      <div className="space-y-4">
        {surveys.length > 0 ? (
          surveys.map(survey => (
            <div 
              key={survey.id}
              className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-teal-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <Link to={`/survey/${survey.id}`} className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-teal-700 transition-colors">{survey.title}</h3>
                  <p className="text-slate-600">{survey.description}</p>
                </Link>
                <div className="flex items-center gap-2 ml-4">
                  <button 
                    onClick={(e) => handleShare(e, survey.id, survey.title)}
                    className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                    title="Copy Share Link"
                  >
                    <Share2 className="h-6 w-6" />
                  </button>
                  <Link to={`/survey/${survey.id}`} className="flex items-center p-2 text-slate-400 group-hover:text-teal-500 transition-colors">
                    <ChevronRight className="h-6 w-6" />
                  </Link>
                </div>
              </div>
            </div>
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
