import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { deleteSurvey, Survey, saveSurvey } from '../store';
import { useSurveys } from '../hooks/useFirestore';
import { Plus, Edit2, Trash2, BarChart2, Eye, EyeOff, AlertTriangle, CheckCircle2, X } from 'lucide-react';

export default function AdminSurveys() {
  const { surveys, loading } = useSurveys();
  const [surveyToDelete, setSurveyToDelete] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.message) {
      setToastMessage(location.state.message);
      // Clear the state so the toast doesn't reappear on refresh
      navigate(location.pathname, { replace: true, state: {} });
      
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  const confirmDelete = async () => {
    if (surveyToDelete) {
      try {
        await deleteSurvey(surveyToDelete);
        setSurveyToDelete(null);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const toggleActive = async (survey: Survey) => {
    const updated = { ...survey, isActive: !survey.isActive };
    try {
      await saveSurvey(updated);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-5 w-5 text-teal-400" />
          <p className="font-medium">{toastMessage}</p>
          <button 
            onClick={() => setToastMessage(null)}
            className="ml-4 p-1 text-slate-400 hover:text-white transition-colors rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {surveyToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-4 text-red-600 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Delete Survey</h3>
            </div>
            <p className="text-slate-600 mb-6">Are you sure you want to delete this survey? This action cannot be undone and all associated responses will be orphaned.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setSurveyToDelete(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Manage Surveys</h1>
          <p className="text-slate-600 mt-1">Create, edit, and manage your hospital surveys.</p>
        </div>
        <Link 
          to="/admin/surveys/new" 
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors shrink-0"
        >
          <Plus className="h-5 w-5" />
          Create Survey
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-900">Survey Title</th>
                <th className="hidden sm:table-cell px-6 py-4 text-sm font-semibold text-slate-900">Questions</th>
                <th className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                <th className="hidden md:table-cell px-6 py-4 text-sm font-semibold text-slate-900">Created</th>
                <th className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {surveys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No surveys found. Create one to get started.
                  </td>
                </tr>
              ) : (
                surveys.map(survey => (
                  <tr key={survey.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <p className="font-medium text-slate-900 line-clamp-1">{survey.title}</p>
                      <p className="text-sm text-slate-500 truncate max-w-[120px] sm:max-w-xs">{survey.description}</p>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 text-slate-600">
                      {survey.questions.length}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <button 
                        onClick={() => toggleActive(survey)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          survey.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {survey.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">{survey.isActive ? 'Active' : 'Draft'}</span>
                      </button>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 text-sm text-slate-500">
                      {new Date(survey.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <Link 
                          to={`/admin/surveys/${survey.id}/results`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Results"
                        >
                          <BarChart2 className="h-5 w-5" />
                        </Link>
                        <Link 
                          to={`/admin/surveys/${survey.id}/edit`}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Survey"
                        >
                          <Edit2 className="h-5 w-5" />
                        </Link>
                        <button 
                          onClick={() => setSurveyToDelete(survey.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Survey"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
