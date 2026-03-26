import { useState } from 'react';
import { Link } from 'react-router';
import { useSurveys, useResponses } from '../hooks/useFirestore';
import { BarChart2, CheckCircle2, XCircle } from 'lucide-react';
import { saveSurvey, Survey } from '../store';

export default function AdminSurveys() {
  const { surveys, loading: surveysLoading } = useSurveys(false);
  const { responses, loading: responsesLoading } = useResponses();
  const [toggling, setToggling] = useState<string | null>(null);

  if (surveysLoading || responsesLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  // Include the hardcoded survey if it's not in the DB
  const hasHardcoded = surveys.some(s => s.id === 'miot-registration-survey');
  const allSurveys = [...surveys];
  
  if (!hasHardcoded) {
    allSurveys.push({
      id: 'miot-registration-survey',
      title: 'MIOT International Patient Registration Survey',
      description: 'Please fill out the following details to register.',
      questions: [], // We don't need the full questions array just for the list
      createdAt: new Date().toISOString(),
      isActive: true,
    });
  }

  const handleToggleStatus = async (survey: Survey) => {
    setToggling(survey.id);
    try {
      await saveSurvey({
        ...survey,
        isActive: !survey.isActive
      });
    } catch (error) {
      console.error('Failed to toggle survey status:', error);
      alert('Failed to update survey status.');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Manage Surveys</h1>
          <p className="text-slate-600 mt-1">View and manage your surveys and their responses.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-900">Survey Title</th>
                <th className="hidden sm:table-cell px-6 py-4 text-sm font-semibold text-slate-900">Responses</th>
                <th className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                <th className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {allSurveys.map((survey) => {
                const surveyResponses = responses.filter(r => r.surveyId === survey.id);
                return (
                  <tr key={survey.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <p className="font-medium text-slate-900 line-clamp-1">{survey.title}</p>
                      <p className="text-sm text-slate-500 truncate max-w-[120px] sm:max-w-xs">{survey.description}</p>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 text-slate-600">
                      {surveyResponses.length}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(survey)}
                        disabled={toggling === survey.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          toggling === survey.id ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
                        } ${
                          survey.isActive 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-slate-100 text-slate-700'
                        }`}
                        title={survey.isActive ? "Click to make Draft" : "Click to make Live"}
                      >
                        {survey.isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        {survey.isActive ? 'Live' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <Link 
                          to={`/admin/surveys/${survey.id}/results`}
                          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                          title="View Results"
                        >
                          <BarChart2 className="h-5 w-5" />
                          View Results
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
