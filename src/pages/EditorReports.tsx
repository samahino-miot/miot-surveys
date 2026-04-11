import { useResponses } from '../hooks/useFirestore';

export default function EditorReports() {
  const { responses, loading } = useResponses();

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  const editorStats = responses.reduce((acc, response) => {
    const editorId = response.editorId || 'unknown';
    const editorName = response.editorName && response.editorName !== 'Unknown' ? response.editorName : 'Unknown (No Editor Info)';
    
    if (!acc[editorId]) {
      acc[editorId] = { name: editorName, count: 0 };
    }
    acc[editorId].count += 1;
    return acc;
  }, {} as Record<string, { name: string, count: number }>);

  const statsArray = Object.entries(editorStats).map(([id, data]) => ({
    id,
    name: data.name,
    count: data.count
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Editor Reports</h1>
        <p className="text-slate-600 mt-1">Track survey performance by editor.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-700">Editor Name</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Total Surveys Taken</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {statsArray.map(stat => (
              <tr key={stat.id}>
                <td className="px-6 py-4 text-slate-900 font-medium">{stat.name}</td>
                <td className="px-6 py-4 text-slate-600">{stat.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
