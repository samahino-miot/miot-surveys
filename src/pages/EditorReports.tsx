import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useResponses, useSurveys, useUsers } from '../hooks/useFirestore';
import { useAuth } from '../components/AuthProvider';

export default function EditorReports() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { responses, loading: responsesLoading } = useResponses();
  const { surveys, loading: surveysLoading } = useSurveys(false);
  const { users } = useUsers();
  const [selectedEditorId, setSelectedEditorId] = useState<string | null>(null);

  const currentUserData = users.find(u => u.id === currentUser?.uid);
  const isEditor = currentUserData?.role === 'editor';
  
  const filteredResponses = isEditor 
    ? responses.filter(r => r.editorId === currentUser?.uid)
    : responses;

  const editorStats = filteredResponses.reduce((acc, response) => {
    const editorId = response.editorId || 'unknown';
    const editorName = response.editorName && response.editorName !== 'Unknown' ? response.editorName : 'Unknown (No Editor Info)';
    const survey = surveys.find(s => s.id === response.surveyId);
    const surveyTitle = survey?.title || 'Unknown Survey';
    const patientName = String(response.answers?.patientName || 'Anonymous');
    
    if (!acc[editorId]) {
      acc[editorId] = { name: editorName, surveys: {} };
    }
    if (!acc[editorId].surveys[surveyTitle]) {
      acc[editorId].surveys[surveyTitle] = { count: 0, respondents: [] };
    }
    acc[editorId].surveys[surveyTitle].count += 1;
    acc[editorId].surveys[surveyTitle].respondents.push(patientName);
    return acc;
  }, {} as Record<string, { name: string, surveys: Record<string, { count: number, respondents: string[] }> }>);

  useEffect(() => {
    if (!selectedEditorId && Object.keys(editorStats).length > 0) {
      setSelectedEditorId(Object.keys(editorStats)[0]);
    }
  }, [editorStats, selectedEditorId]);

  if (responsesLoading || surveysLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  const selectedEditor = selectedEditorId ? editorStats[selectedEditorId] : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Surveyor Reports</h1>
        <p className="text-slate-600 mt-1">Click on a surveyor to view their survey data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Surveyor List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 font-semibold text-slate-700">Surveyors</div>
          <div className="divide-y divide-slate-100">
            {Object.entries(editorStats).map(([id, data]) => (
              <button
                key={id}
                onClick={() => setSelectedEditorId(id)}
                className={`w-full text-left px-6 py-4 hover:bg-teal-50 transition-colors ${selectedEditorId === id ? 'bg-teal-50 text-teal-900 font-medium' : 'text-slate-700'}`}
              >
                {data.name}
              </button>
            ))}
          </div>
        </div>

        {/* Surveyor Details */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 font-semibold text-slate-700">
            {selectedEditor ? `Surveys taken by ${selectedEditor.name}` : 'Select a surveyor to view details'}
          </div>
          {selectedEditor ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-full">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-700">Survey Title</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Count</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Respondents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(selectedEditor.surveys).map(([surveyTitle, data]) => (
                      <tr key={surveyTitle}>
                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{surveyTitle}</td>
                        <td className="px-6 py-4 text-slate-600">{data.count}</td>
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          <button
                            onClick={() => {
                              const survey = surveys.find(s => s.title === surveyTitle);
                              if (survey) {
                                navigate(`/admin/editor-reports/${selectedEditorId}/${survey.id}`);
                              }
                            }}
                            className="text-teal-600 hover:text-teal-800 font-medium underline"
                          >
                            View Respondents
                          </button>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-slate-500 text-center">No editor selected.</div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          Surveyor Daily Reports
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Surveyor ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(filteredResponses.reduce((acc: Record<string, Record<string, number>>, r) => {
                const surveyorId = r.editorId || 'Unknown';
                const surveyorName = users.find(u => u.id === surveyorId)?.name || surveyorId;
                if (!acc[surveyorName]) acc[surveyorName] = {};
                const date = new Date(r.submittedAt instanceof Date ? r.submittedAt : (typeof r.submittedAt?.toDate === 'function' ? r.submittedAt.toDate() : new Date(r.submittedAt))).toLocaleDateString();
                acc[surveyorName][date] = (acc[surveyorName][date] || 0) + 1;
                return acc;
              }, {})).flatMap(([surveyor, dates]) => 
                Object.entries(dates).map(([date, count]) => ({ surveyor, date, count }))
              ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((report, idx) => (
                <tr key={`${report.surveyor}-${report.date}-${idx}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{report.surveyor}</td>
                  <td className="px-6 py-4">{report.date}</td>
                  <td className="px-6 py-4 font-bold text-teal-600">{report.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
