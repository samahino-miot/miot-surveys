import { useState } from 'react';
import { Link } from 'react-router';
import { useSurveys, useResponses } from '../hooks/useFirestore';
import { BarChart2, CheckCircle2, XCircle } from 'lucide-react';
import { saveSurvey, Survey } from '../store';
import ConfirmationModal from '../components/ConfirmationModal';

export default function AdminSurveys() {
  const { surveys, loading: surveysLoading } = useSurveys(false);
  const { responses, loading: responsesLoading } = useResponses();
  const [toggling, setToggling] = useState<string | null>(null);
  const [selectedSurveys, setSelectedSurveys] = useState<string[]>([]);
  const [surveyToToggle, setSurveyToToggle] = useState<Survey | null>(null);
  const [bulkToggleStatus, setBulkToggleStatus] = useState<boolean | null>(null);

  if (surveysLoading || responsesLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  // Include the hardcoded survey if it's not in the DB
  const hasHardcoded = surveys.some(s => s.id === 'miot-registration-survey');
  const allSurveys = [...surveys];
  
  if (!hasHardcoded) {
    allSurveys.push({
      id: 'miot-registration-survey',
      title: 'MIOT International Patient Experience Survey',
      description: 'Please fill out the following questions to share your feedback.',
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

  const handleBulkToggleStatus = async (isActive: boolean) => {
    try {
      for (const id of selectedSurveys) {
        const survey = allSurveys.find(s => s.id === id);
        if (survey) {
          await saveSurvey({ ...survey, isActive });
        }
      }
      setSelectedSurveys([]);
    } catch (error) {
      console.error('Failed to update survey statuses:', error);
      alert('Failed to update some survey statuses.');
    }
  };

  const toggleSelectAll = () => {
    if (selectedSurveys.length === allSurveys.length) {
      setSelectedSurveys([]);
    } else {
      setSelectedSurveys(allSurveys.map(s => s.id));
    }
  };

  const toggleSelectSurvey = (id: string) => {
    if (selectedSurveys.includes(id)) {
      setSelectedSurveys(selectedSurveys.filter(sId => sId !== id));
    } else {
      setSelectedSurveys([...selectedSurveys, id]);
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmationModal
        isOpen={!!surveyToToggle}
        onClose={() => setSurveyToToggle(null)}
        onConfirm={() => surveyToToggle && handleToggleStatus(surveyToToggle)}
        title="Confirm Status Change"
        message={`Are you sure you want to make this survey ${surveyToToggle?.isActive ? 'Draft' : 'Live'}?`}
      />
      <ConfirmationModal
        isOpen={bulkToggleStatus !== null}
        onClose={() => setBulkToggleStatus(null)}
        onConfirm={() => bulkToggleStatus !== null && handleBulkToggleStatus(bulkToggleStatus)}
        title="Confirm Bulk Status Change"
        message={`Are you sure you want to set ${selectedSurveys.length} surveys to ${bulkToggleStatus ? 'Live' : 'Draft'}?`}
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Manage Surveys</h1>
          <p className="text-slate-600 mt-1">View and manage your surveys and their responses.</p>
        </div>
        {selectedSurveys.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl">
            <span className="text-sm font-medium text-slate-700 px-2">{selectedSurveys.length} selected</span>
            <button onClick={() => setBulkToggleStatus(true)} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700">Set Live</button>
            <button onClick={() => setBulkToggleStatus(false)} className="px-3 py-1.5 bg-slate-600 text-white text-xs font-medium rounded-lg hover:bg-slate-700">Set Draft</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {/* Desktop Table */}
          <table className="hidden sm:table w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4">
                  <input type="checkbox" checked={selectedSurveys.length === allSurveys.length && allSurveys.length > 0} onChange={toggleSelectAll} className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-900">Survey Title</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-900">Responses</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {allSurveys.map((survey) => {
                const surveyResponses = responses.filter(r => r.surveyId === survey.id);
                const isSelected = selectedSurveys.includes(survey.id);
                return (
                  <tr key={survey.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-teal-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelectSurvey(survey.id)} className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{survey.title}</p>
                      <p className="text-sm text-slate-500">{survey.description}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {surveyResponses.length}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSurveyToToggle(survey)}
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
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/admin/surveys/${survey.id}/results`}
                        className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                        title="View Results"
                      >
                        <BarChart2 className="h-5 w-5" />
                        View Results
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mobile Card Layout */}
          <div className="sm:hidden divide-y divide-slate-200">
            {allSurveys.map((survey) => {
              const surveyResponses = responses.filter(r => r.surveyId === survey.id);
              const isSelected = selectedSurveys.includes(survey.id);
              return (
                <div key={survey.id} className={`p-4 ${isSelected ? 'bg-teal-50/50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelectSurvey(survey.id)} className="mt-1 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{survey.title}</p>
                      <p className="text-sm text-slate-500 line-clamp-2">{survey.description}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSurveyToToggle(survey)}
                          disabled={toggling === survey.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            toggling === survey.id ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
                          } ${
                            survey.isActive 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {survey.isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          {survey.isActive ? 'Live' : 'Draft'}
                        </button>
                        <Link 
                          to={`/admin/surveys/${survey.id}/results`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium text-sm"
                        >
                          <BarChart2 className="h-4 w-4" />
                          Results
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
