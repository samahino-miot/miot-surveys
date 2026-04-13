import { useParams, useNavigate } from 'react-router';
import { useResponses, useSurveys } from '../hooks/useFirestore';
import { ArrowLeft } from 'lucide-react';
import { formatDate } from '../store';

export default function EditorSurveyRespondents() {
  const { editorId, surveyId } = useParams();
  const navigate = useNavigate();
  const { responses, loading: responsesLoading } = useResponses(surveyId);
  const { surveys, loading: surveysLoading } = useSurveys(false);

  if (responsesLoading || surveysLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  const survey = surveys.find(s => s.id === surveyId);
  const editorResponses = responses.filter(r => r.editorId === editorId);

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Reports
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Respondents for {survey?.title || 'Unknown Survey'}
        </h1>
        <p className="text-slate-600">
          Editor: {editorResponses[0]?.editorName || 'Unknown'}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Patient Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Submitted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {editorResponses.map((response) => (
                <tr key={response.id}>
                  <td className="px-6 py-4 text-slate-600">
                    {String(response.answers?.patientName || 'Anonymous')}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {formatDate(response.submittedAt, true)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
