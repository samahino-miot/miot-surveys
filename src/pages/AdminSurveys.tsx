import { Link } from 'react-router';
import { useResponses } from '../hooks/useFirestore';
import { BarChart2 } from 'lucide-react';

export default function AdminSurveys() {
  const { responses, loading } = useResponses('miot-registration-survey');

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Manage Surveys</h1>
          <p className="text-slate-600 mt-1">View responses for your active surveys.</p>
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
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-4 sm:px-6 py-4">
                  <p className="font-medium text-slate-900 line-clamp-1">MIOT International Patient Registration Survey</p>
                  <p className="text-sm text-slate-500 truncate max-w-[120px] sm:max-w-xs">Please fill out the following details to register.</p>
                </td>
                <td className="hidden sm:table-cell px-6 py-4 text-slate-600">
                  {responses.length}
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    Active
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 sm:gap-2">
                    <Link 
                      to={`/admin/surveys/miot-registration-survey/results`}
                      className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                      title="View Results"
                    >
                      <BarChart2 className="h-5 w-5" />
                      View Results
                    </Link>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
