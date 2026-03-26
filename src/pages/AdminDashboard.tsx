import { useResponses, useSurveys } from '../hooks/useFirestore';
import { Users, FileText, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { responses, loading: responsesLoading } = useResponses();
  const { surveys, loading: surveysLoading } = useSurveys(false);

  if (responsesLoading || surveysLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  const hasHardcoded = surveys.some(s => s.id === 'miot-registration-survey');
  const allSurveys = [...surveys];
  
  if (!hasHardcoded) {
    allSurveys.push({
      id: 'miot-registration-survey',
      title: 'MIOT International Patient Registration Survey',
      description: 'Please fill out the following details to register.',
      questions: [],
      createdAt: new Date().toISOString(),
      isActive: true,
    });
  }

  const recentResponses = [...responses].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 5);

  const responsesBySurvey = allSurveys.map(survey => ({
    name: survey.title.length > 20 ? survey.title.substring(0, 20) + '...' : survey.title,
    responses: responses.filter(r => r.surveyId === survey.id).length
  }));

  const activeSurveysCount = allSurveys.filter(s => s.isActive).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-600 mt-1">Monitor survey performance and patient feedback.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="h-12 w-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Surveys</p>
            <p className="text-2xl font-bold text-slate-900">{allSurveys.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Responses</p>
            <p className="text-2xl font-bold text-slate-900">{responses.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Surveys</p>
            <p className="text-2xl font-bold text-slate-900">{activeSurveysCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Responses by Survey</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responsesBySurvey} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="responses" fill="#2e56a6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Recent Responses</h2>
          <div className="space-y-4">
            {recentResponses.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No responses yet.</p>
            ) : (
              recentResponses.map(response => {
                const answers = response.answers || {};
                const survey = allSurveys.find(s => s.id === response.surveyId);
                return (
                  <div key={response.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-900">{survey?.title || 'Unknown Survey'}</p>
                      <p className="text-sm text-slate-600 mt-1">From: {answers.patientName || 'Anonymous'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(response.submittedAt).toLocaleString()}</p>
                    </div>
                    <div className="text-sm font-medium text-teal-600 bg-teal-50 px-3 py-1 rounded-full self-start sm:self-auto">
                      New
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
