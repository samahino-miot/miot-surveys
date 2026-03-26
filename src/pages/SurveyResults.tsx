import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { useResponses, useSurveys } from '../hooks/useFirestore';
import { ArrowLeft, Download, FileText, ChevronLeft, ChevronRight, FileSpreadsheet, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { deleteResponse } from '../store';

const COLORS = ['#2e56a6', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

const hardcodedSurvey = {
  id: 'miot-registration-survey',
  title: 'MIOT International Patient Registration Survey',
  description: 'Please fill out the following details to register.',
  questions: [
    { id: 'purposeOfVisit', text: 'Purpose of this visit', type: 'multiple_choice', options: ['OP Consultation', 'Review', 'Second opinion', 'Admission', 'MHC', 'Only Investigations'] },
    { id: 'department', text: 'For which Department', type: 'text' },
    { id: 'consultingDuration', text: 'How long have you been consulting in MIOT?', type: 'multiple_choice', options: ['1st Visit', '<1 month', '1 month – 5yrs', '>5yrs'] },
    { id: 'howDidYouKnow', text: 'How did you know about MIOT?', type: 'checkbox', options: ['Newspaper', 'Magazine', 'Television', 'Radio', 'Theatre Ads', 'Newspaper Inserts', 'Apartment posters', 'Friends', 'Relatives', 'Colleagues', 'Outdoor Hoardings/ Bus Shelters', 'Corporate Tie-up', 'Outreach Clinics', 'Referred by Doctor', 'Digital (Website/Google/Social Media)', 'Others'] },
    { id: 'whatInfluenced', text: 'Who/What influenced your decision to choose MIOT?', type: 'checkbox', options: ['Newspaper', 'Magazine', 'Television', 'Radio', 'Newspaper Inserts', 'Apartment posters', 'Neighbourhood', 'Friends', 'Relatives', 'Colleague', 'Outdoor Hoardings/ Bus Shelters', 'Corporate tie-up', 'Theatre Ads', 'Outreach clinics', 'Referred by Doctor', 'Treating Doctor', 'Emergency', 'Digital (Website/Google/Social Media)', 'Brand Name', 'Others'] },
    
    { id: 'evalCure_doctors', text: 'Cure: Highly Qualified Doctors & experienced nurses', type: 'rating' },
    { id: 'evalCure_infrastructure', text: 'Cure: Infrastructure', type: 'rating' },
    { id: 'evalCure_technology', text: 'Cure: Latest Technology & Equipment', type: 'rating' },
    { id: 'evalCure_accuracy', text: 'Cure: Accuracy of diagnosis and treatment', type: 'rating' },
    { id: 'evalCure_successRates', text: 'Cure: Success rates and patient outcomes', type: 'rating' },
    
    { id: 'evalCare_compassion', text: 'Care: Compassion of Doctor', type: 'rating' },
    { id: 'evalCare_cleanliness', text: 'Care: Cleanliness and hygiene', type: 'rating' },
    { id: 'evalCare_staffBehaviour', text: 'Care: Staff behaviour', type: 'rating' },
    { id: 'evalCare_waitingTime', text: 'Care: Waiting time for consultation or procedures', type: 'rating' },
    { id: 'evalCare_admission', text: 'Care: Ease of admission and discharge', type: 'rating' },
    { id: 'evalCare_billing', text: 'Care: Clear explanation of billing', type: 'rating' },
    { id: 'evalCare_insurance', text: 'Care: Availability of insurance support', type: 'rating' },

    { id: 'evalCost', text: 'Cost', type: 'multiple_choice', options: ['Exorbitant', 'On the higher side', 'Industry standards', 'Moderate', 'Low'] },

    { id: 'evalComm_doctorsExplaining', text: 'Communication: Doctors explaining conditions clearly', type: 'rating' },
    { id: 'evalComm_staffResponsiveness', text: 'Communication: Staff responsiveness to questions', type: 'rating' },
    { id: 'evalComm_transparency', text: 'Communication: Transparency about treatment options, costs and risks', type: 'rating' },

    { id: 'evalComfort_spacious', text: 'Comfort: Spacious waiting areas/ rooms', type: 'rating' },
    { id: 'evalComfort_cleanRooms', text: 'Comfort: Clean and neat Rooms', type: 'rating' },
    { id: 'evalComfort_otherServices', text: 'Comfort: Other Services', type: 'rating' },
    { id: 'evalComfort_noHospitalFeel', text: 'Comfort: No hospital feel', type: 'rating' },
    { id: 'evalComfort_diet', text: 'Comfort: Balanced diet & Hygienic food', type: 'rating' },

    { id: 'evalConv_cityHeart', text: 'Convenience: Within Heart of the city', type: 'rating' },
    { id: 'evalConv_nearResidence', text: 'Convenience: Near to residence', type: 'rating' },
    { id: 'evalConv_mobility', text: 'Convenience: Easy Mobility', type: 'rating' },
    { id: 'evalConv_ambulance', text: 'Convenience: Ambulance service', type: 'rating' },
    { id: 'evalConv_parking', text: 'Convenience: Parking facilities', type: 'rating' },
    
    { id: 'specialitiesAssociated', text: 'What specialities do you associate with MIOT?', type: 'text' },
    { id: 'willReturn', text: 'I will return to MIOT for further treatment', type: 'multiple_choice', options: ['Yes', 'No'] },
    { id: 'returnYesReasons', text: 'If YES, because of', type: 'checkbox', options: ['Treating Doctors', 'Treatment Outcome', 'Hassle free experience from appointment booking to consultation/discharge', 'Transparency in treatment, bills, etc', 'Responsible & Experienced support staff', 'Others, if any'] },
    { id: 'returnNoReason', text: 'If NO, please specify', type: 'text' }
  ]
};

export default function SurveyResults() {
  const { id } = useParams();
  const { responses, loading: responsesLoading } = useResponses(id || '');
  const { surveys, loading: surveysLoading } = useSurveys(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const rowsPerPage = 10;

  if (responsesLoading || surveysLoading) return <div className="text-center py-12">Loading...</div>;
  
  const dbSurvey = surveys.find(s => s.id === id);
  const survey = dbSurvey || (id === 'miot-registration-survey' ? hardcodedSurvey : null);

  if (!survey) return <div className="text-center py-12">Survey not found.</div>;

  const reversedResponses = [...responses].reverse();
  const totalPages = Math.max(1, Math.ceil(reversedResponses.length / rowsPerPage));
  const paginatedResponses = reversedResponses.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleDelete = async (responseId: string) => {
    if (window.confirm('Are you sure you want to delete this response? This action cannot be undone and will permanently remove this data from the results.')) {
      setIsDeleting(responseId);
      try {
        await deleteResponse(responseId);
      } catch (error) {
        console.error('Failed to delete response:', error);
        alert('Failed to delete response. Please try again.');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const exportCSV = () => {
    if (responses.length === 0) return;

    // Headers
    const headers = ['Response ID', 'Date', 'Patient Name', 'Attendant Name', 'Relation', 'Age', 'Gender', 'Mr. No', 'City', 'State', 'Country', ...survey.questions.map(q => q.text)];
    
    // Rows
    const rows = responses.map(r => {
      const answers = r.answers || {};
      const row = [r.id, new Date(r.submittedAt).toLocaleString(), answers.patientName || 'N/A', answers.attendantName || 'N/A', answers.relationToPatient || 'N/A', answers.age || 'N/A', answers.gender || 'N/A', answers.mrNo || 'N/A', answers.city || 'N/A', answers.state || 'N/A', answers.country || 'N/A'];
      survey.questions.forEach(q => {
        const val = answers[q.id];
        if (Array.isArray(val)) {
          let str = val.join('; ');
          if (val.includes('Others') && answers[`${q.id}Other`]) {
            str += ` (${answers[`${q.id}Other`]})`;
          }
          row.push(str);
        } else {
          row.push(String(val || ''));
        }
      });
      return row;
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${survey.title.replace(/\s+/g, '_')}_Results.csv`;
    link.click();
  };

  const exportPDF = () => {
    if (responses.length === 0) return;
    
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Survey Results: ${survey.title}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Total Responses: ${responses.length}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);

    const headers = [['Date', 'Patient Name', 'Age', 'Gender', 'City', ...survey.questions.map(q => q.text.substring(0, 30) + (q.text.length > 30 ? '...' : ''))]];
    const data = responses.map(r => {
      const answers = r.answers || {};
      const row = [new Date(r.submittedAt).toLocaleDateString(), answers.patientName || 'N/A', answers.age || 'N/A', answers.gender || 'N/A', answers.city || 'N/A'];
      survey.questions.forEach(q => {
        const val = answers[q.id];
        if (Array.isArray(val)) {
          let str = val.join(', ');
          if (val.includes('Others') && answers[`${q.id}Other`]) {
            str += ` (${answers[`${q.id}Other`]})`;
          }
          row.push(str);
        } else {
          row.push(String(val || '-'));
        }
      });
      return row;
    });

    autoTable(doc, {
      startY: 45,
      head: headers,
      body: data,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [46, 86, 166] }
    });

    doc.save(`${survey.title.replace(/\s+/g, '_')}_Results.pdf`);
  };

  const exportExcel = () => {
    if (responses.length === 0) return;

    // Headers
    const headers = ['Response ID', 'Date', 'Patient Name', 'Attendant Name', 'Relation', 'Age', 'Gender', 'Mr. No', 'City', 'State', 'Country', ...survey.questions.map(q => q.text)];
    
    // Rows
    const rows = responses.map(r => {
      const answers = r.answers || {};
      const row = [r.id, new Date(r.submittedAt).toLocaleString(), answers.patientName || 'N/A', answers.attendantName || 'N/A', answers.relationToPatient || 'N/A', answers.age || 'N/A', answers.gender || 'N/A', answers.mrNo || 'N/A', answers.city || 'N/A', answers.state || 'N/A', answers.country || 'N/A'];
      survey.questions.forEach(q => {
        const val = answers[q.id];
        if (Array.isArray(val)) {
          let str = val.join('; ');
          if (val.includes('Others') && answers[`${q.id}Other`]) {
            str += ` (${answers[`${q.id}Other`]})`;
          }
          row.push(str);
        } else {
          row.push(String(val || ''));
        }
      });
      return row;
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, `${survey.title.replace(/\s+/g, '_')}_Results.xlsx`);
  };

  const renderChart = (q: any) => {
    if (responses.length === 0) return <p className="text-slate-500 italic">No responses yet.</p>;

    if (q.type === 'multiple_choice' || q.type === 'checkbox') {
      const counts: Record<string, number> = {};
      q.options?.forEach((opt: string) => counts[opt] = 0);
      
      let responseCount = 0;

      responses.forEach(r => {
        const answers = r.answers || {};
        const val = answers[q.id];
        if (Array.isArray(val) && val.length > 0) {
          responseCount++;
          val.forEach(v => { 
            if (counts[v] !== undefined) {
              counts[v]++; 
            } else {
              counts[v] = 1;
            }
          });
        } else if (val && !Array.isArray(val)) {
          responseCount++;
          if (counts[val as string] !== undefined) {
            counts[val as string]++;
          } else {
            counts[val as string] = 1;
          }
        }
      });

      const data = Object.entries(counts).map(([name, value]) => ({ 
        name, 
        value,
        percentage: responseCount > 0 ? ((value / responseCount) * 100).toFixed(1) : '0.0'
      })).filter(d => d.value > 0);

      if (data.length === 0) return <p className="text-slate-500 italic">No selections made.</p>;

      const CustomPieTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
          return (
            <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-xl">
              <p className="font-medium text-slate-900 mb-1">{payload[0].name}</p>
              <p className="text-sm text-slate-600">Count: <span className="font-medium text-slate-900">{payload[0].value}</span></p>
              <p className="text-sm text-slate-600">Share: <span className="font-medium text-slate-900">{payload[0].payload.percentage}%</span></p>
            </div>
          );
        }
        return null;
      };

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">Total Responses</p>
              <p className="text-3xl font-bold text-slate-900">{responseCount}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 font-medium mb-1">Most Popular</p>
              <p className="text-lg font-bold text-slate-900 truncate max-w-[150px] sm:max-w-[200px]">
                {data.length > 0 ? [...data].sort((a, b) => b.value - a.value)[0].name : '-'}
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (q.type === 'text') {
      const textResponses = responses.map(r => (r.answers || {})[q.id]).filter(Boolean);
      return (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
          {textResponses.length === 0 ? (
            <p className="text-slate-500 italic">No responses.</p>
          ) : (
            textResponses.map((text, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 text-sm">
                "{text}"
              </div>
            ))
          )}
        </div>
      );
    }

    if (q.type === 'rating') {
      const counts: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
      let responseCount = 0;
      let sum = 0;

      responses.forEach(r => {
        const val = (r.answers || {})[q.id];
        if (val && typeof val === 'number') {
          counts[val.toString()]++;
          responseCount++;
          sum += val;
        }
      });

      const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
      const average = responseCount > 0 ? (sum / responseCount).toFixed(1) : '0.0';

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">Total Ratings</p>
              <p className="text-3xl font-bold text-slate-900">{responseCount}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 font-medium mb-1">Average Rating</p>
              <p className="text-3xl font-bold text-teal-600">{average} <span className="text-lg text-slate-400">/ 5</span></p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-2">
        <Link to="/admin/surveys" className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{survey.title} - Results</h1>
          <p className="text-slate-600 mt-1">{responses.length} total responses</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <button 
          onClick={exportCSV}
          disabled={responses.length === 0}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <FileText className="h-4 w-4" />
          Export CSV
        </button>
        <button 
          onClick={exportExcel}
          disabled={responses.length === 0}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export Excel
        </button>
        <button 
          onClick={exportPDF}
          disabled={responses.length === 0}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {survey.questions.map((q, i) => (
          <div key={q.id} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-6 line-clamp-2" title={q.text}>
              {i + 1}. {q.text}
            </h3>
            {renderChart(q)}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Recent Respondents</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 sm:px-6 sm:py-4">Date</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4">Name</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4">Age</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4">City</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {responses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No responses yet</td>
                </tr>
              ) : (
                paginatedResponses.map(r => {
                  const answers = r.answers || {};
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{new Date(r.submittedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 font-medium text-slate-900">{answers.patientName || 'N/A'}</td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4">{answers.age || 'N/A'}</td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4">{answers.city || 'N/A'}</td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={isDeleting === r.id}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete response"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {responses.length > 0 && (
          <div className="p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              Showing <span className="font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * rowsPerPage, responses.length)}</span> of <span className="font-medium">{responses.length}</span> results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-slate-700 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
