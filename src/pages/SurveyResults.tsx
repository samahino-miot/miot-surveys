import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { useResponses, useSurveys } from '../hooks/useFirestore';
import { useWindowWidth } from '../hooks/useWindowWidth';
import { LocationHeatmap } from '../components/LocationHeatmap';
import { ArrowLeft, Download, FileText, ChevronLeft, ChevronRight, FileSpreadsheet, Trash2, MapPin } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Treemap } from 'recharts';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { deleteResponse, formatDate, getTimestamp } from '../store';
import { departments } from '../data/departments';

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', 
  '#06b6d4', '#f97316', '#84cc16', '#6366f1', '#d946ef', '#14b8a6', 
  '#e11d48', '#a855f7', '#22c55e', '#eab308', '#0ea5e9', '#94a3b8'
];

const hardcodedSurvey = {
  id: 'miot-registration-survey',
  title: 'MIOT International Patient Experience Survey',
  description: 'Please fill out the following questions to share your feedback.',
  questions: [
    { id: 'typeOfVisit', text: 'Type of visit', type: 'multiple_choice', options: ['OP', 'IP'] },
    { id: 'purposeOfVisit', text: 'Purpose of this visit', type: 'multiple_choice', options: ['OP Consultation', 'Review', 'Second opinion', 'Admission', 'MHC', 'Only Investigations'] },
    { id: 'department', text: 'For which Department', type: 'multiple_choice', options: departments },
    { id: 'consultingDuration', text: 'How long have you been consulting in MIOT?', type: 'multiple_choice', options: ['1st Visit', '<1 month', '1 month – 5yrs', '>5yrs'] },
    { id: 'howDidYouKnow', text: 'How did you know about MIOT?', type: 'checkbox', options: ['Apartment posters', 'CAMPS', 'CGHS', 'Corporate Tie-up', 'Digital (Website/Google/Social Media)', 'INSURANCE', 'Magazine', 'MIOT INFORMATION CENTRE', 'MIOT MEDICAL CENTER OVERSEAS', 'Neighborhood Hospital', 'Newspaper', 'Newspaper Inserts', 'Outdoor Hoardings / Bus Shelters', 'Outreach Clinics', 'Radio', 'Referred by Doctor', 'Television', 'Theatre Ads', 'Word of mouth (colleagues, relatives, friends)', 'Others'] },
    { id: 'whatInfluenced', text: 'Who/What influenced your decision to choose MIOT?', type: 'checkbox', options: ['Apartment posters', 'Brand Name', 'CAMPS', 'CGHS', 'Corporate Tie-up', 'Digital (Website/Google/Social Media)', 'Emergency', 'INSURANCE', 'Magazine', 'MIOT INFORMATION CENTRE', 'MIOT MEDICAL CENTER OVERSEAS', 'Neighborhood Hospitals', 'Newspaper', 'Newspaper Inserts', 'Outdoor Hoardings / Bus Shelters', 'Outreach Clinics', 'Radio', 'Referred by Doctor', 'Television', 'Theatre Ads', 'Treating Doctors (MIOT)', 'Word of mouth (colleagues, relatives, friends)', 'Others'] },
    
    { id: 'evalCure', text: 'Cure', type: 'rating' },
    
    { id: 'evalCare', text: 'Care', type: 'rating' },

    { id: 'evalCost', text: 'Cost', type: 'multiple_choice', options: ['Exorbitant', 'Higher side', 'On a par with other hospitals', 'Affordable'] },

    { id: 'evalComm', text: 'Communication', type: 'rating' },

    { id: 'evalComfort', text: 'Comfort', type: 'rating' },

    { id: 'evalConv', text: 'Convenience', type: 'rating' },
    
    { id: 'specialitiesAssociated', text: 'What specialities do you associate with MIOT?', type: 'text' },
    { id: 'willReturn', text: 'I will return to MIOT for further treatment', type: 'multiple_choice', options: ['Yes', 'No'] },
    { id: 'returnYesReasons', text: 'If YES, because of', type: 'checkbox', options: ['Empathetic nurses', 'Hassle free experience from appointment booking to consultation/discharge', 'Neighborhood Hospital', 'Others, if any', 'Responsible & Experienced support staff', 'Transparency in treatment, bills, etc', 'Treating Doctors', 'Treatment Outcome', 'Trusted Hospital', 'ALL THE ABOVE'] },
    { id: 'returnNoReasons', text: 'If NO, please specify', type: 'checkbox', options: ['Treating Doctors', 'Nurses', 'Support staff (Security, PRO, etc)', 'Not my neighbourhood hospitals', 'Treatment Cost', 'Higher Cost', 'Treatment outcome', 'Waiting time', 'Travel Time', 'Billing', 'Insurance', 'Cleanliness & Hygiene', 'Others'] },
    { id: 'otherHospital', text: 'If not MIOT, which multispecialty or superspecialty hospital would you choose for your medical treatment?', type: 'text' }
  ]
};

export default function SurveyResults() {
  const { id } = useParams();
  const { responses, loading: responsesLoading } = useResponses(id || '');
  const { surveys, loading: surveysLoading } = useSurveys(false);
  const width = useWindowWidth();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedResponses, setSelectedResponses] = useState<string[]>([]);
  const [lastFetched, setLastFetched] = useState<Date>(new Date());
  const rowsPerPage = 10;

  // Update last fetched time when responses change
  useEffect(() => {
    if (!responsesLoading) {
      setLastFetched(new Date());
    }
    console.log('--- DEBUG: SurveyResults Responses:', responses);
  }, [responses, responsesLoading]);

  if (responsesLoading || surveysLoading) return <div className="text-center py-12">Loading...</div>;
  
  const dbSurvey = surveys.find(s => s.id === id);
  let survey = dbSurvey || (id === 'miot-registration-survey' ? hardcodedSurvey : null);

  // If the survey is the hardcoded one but was saved to DB without questions, restore them
  if (survey && survey.id === 'miot-registration-survey' && (!survey.questions || survey.questions.length === 0)) {
    survey = { ...survey, questions: hardcodedSurvey.questions };
  }

  if (!survey) return <div className="text-center py-12">Survey not found.</div>;

  const sortedResponses = [...responses].sort((a, b) => getTimestamp(b.submittedAt) - getTimestamp(a.submittedAt));
  const totalPages = Math.max(1, Math.ceil(sortedResponses.length / rowsPerPage));
  const paginatedResponses = sortedResponses.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const evalMap: Record<string, string> = {
    'evalCure': 'Cure',
    'evalCare': 'Care',
    'evalCost': 'Cost',
    'evalComm': 'Communication',
    'evalComfort': 'Comfort',
    'evalConv': 'Convenience'
  };

  const costMapping: Record<string, number> = {
    'Exorbitant': 1,
    'Higher side': 2,
    'On a par with other hospitals': 3,
    'Affordable': 4
  };

  // Cost values are 1-4, others are 1-5. Normalize to 1-5 for accuracy.
  const normalizeRating = (val: number, isCost: boolean) => isCost ? ((val - 1) / 3 * 4 + 1) : val;

  let totalSum = 0;
  let totalCount = 0;

  const evalData = Object.keys(evalMap).map(id => {
    let sum = 0;
    let count = 0;
    responses.forEach(r => {
      const val = (r.answers || {})[id];
      if (val !== undefined && val !== null) {
        let numVal = 0;
        if (id === 'evalCost') {
          numVal = costMapping[val as string] || 0;
        } else if (typeof val === 'number') {
          numVal = val;
        }
        if (numVal > 0) {
          const normalized = normalizeRating(numVal, id === 'evalCost');
          sum += normalized;
          totalSum += normalized;
          count++;
          totalCount++;
        }
      }
    });
    return { name: evalMap[id], value: count > 0 ? parseFloat((sum / count).toFixed(2)) : 0 };
  });

  const overallAverage = totalCount > 0 ? (totalSum / totalCount).toFixed(1) : '0.0';

  const toggleSelectAll = () => {
    if (selectedResponses.length === sortedResponses.length) {
      setSelectedResponses([]);
    } else {
      setSelectedResponses(sortedResponses.map(r => r.id));
    }
  };

  const toggleSelectResponse = (id: string) => {
    if (selectedResponses.includes(id)) {
      setSelectedResponses(selectedResponses.filter(rId => rId !== id));
    } else {
      setSelectedResponses([...selectedResponses, id]);
    }
  };

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

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedResponses.length} responses? This action cannot be undone.`)) return;
    
    setIsDeleting('bulk');
    try {
      for (const id of selectedResponses) {
        await deleteResponse(id);
      }
      setSelectedResponses([]);
    } catch (error) {
      console.error('Failed to delete responses:', error);
      alert('Failed to delete some responses.');
    } finally {
      setIsDeleting(null);
    }
  };

  const exportCSV = () => {
    if (responses.length === 0) return;

    // Headers
    const headers = ['Response ID', 'Date', 'Patient Name', 'Attendant Name', 'Relation', 'Age', 'Gender', 'MR No', 'City', 'State', 'Country', ...survey.questions.map(q => q.text)];
    
    // Rows
    const rows = sortedResponses.map(r => {
      const answers = r.answers || {};
      const row = [r.id, formatDate(r.submittedAt, true), answers.patientName || 'N/A', answers.attendantName || 'N/A', answers.relationToPatient || 'N/A', answers.age || 'N/A', answers.gender || 'N/A', answers.mrNo || 'N/A', answers.city || 'N/A', answers.state || 'N/A', answers.country || 'N/A'];
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
    
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(18);
    doc.text(`Survey Results: ${survey.title}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Total Responses: ${responses.length}`, 14, 30);
    doc.text(`Generated on: ${formatDate(new Date(), true)}`, 14, 36);

    // Add Summary Section
    doc.setFontSize(16);
    doc.text('Aggregated Results Summary', 14, 45);
    doc.setFontSize(10);
    
    let y = 55;
    
    // Helper to add section headers
    const addSectionHeader = (title: string) => {
      if (y > 180) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 14, y);
      doc.setFont('helvetica', 'normal');
      y += 10;
    };

    let currentSection = '';
    survey.questions.forEach((q, i) => {
      // Simple sectioning based on question ID prefixes
      const section = q.id.startsWith('eval') ? 'Evaluation' : 'General';
      if (section !== currentSection) {
        addSectionHeader(section);
        currentSection = section;
      }

      const hasResponses = responses.some(r => (r.answers || {})[q.id]);
      if (!hasResponses) return;

      if (y > 180) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(12);
      doc.text(`${i + 1}. ${q.text}`, 14, y);
      y += 7;
      
      const summaryData: string[][] = [];
      if (q.type === 'multiple_choice' || q.type === 'checkbox') {
        const counts: Record<string, number> = {};
        q.options?.forEach((opt: string) => counts[opt] = 0);
        let responseCount = 0;
        responses.forEach(r => {
          const val = (r.answers || {})[q.id];
          if (Array.isArray(val)) {
            responseCount++;
            val.forEach(v => counts[v] = (counts[v] || 0) + 1);
          } else if (val) {
            responseCount++;
            counts[val as string] = (counts[val as string] || 0) + 1;
          }
        });
        Object.entries(counts).forEach(([name, value]) => {
          if (value > 0) summaryData.push([name, value.toString(), responseCount > 0 ? ((value / responseCount) * 100).toFixed(1) + '%' : '0%']);
        });
        
        if (summaryData.length > 0) {
          autoTable(doc, {
            startY: y,
            head: [['Option', 'Count', 'Percentage']],
            body: summaryData,
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
            headStyles: { fillColor: [46, 86, 166], halign: 'center' },
            margin: { left: 14 },
            tableWidth: 'wrap'
          });
          y = (doc as any).lastAutoTable.finalY + 10;
        }
      } else if (q.type === 'rating') {
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
        Object.entries(counts).forEach(([name, value]) => {
          summaryData.push([`${name} Stars`, value.toString()]);
        });
        summaryData.push(['Average', (responseCount > 0 ? (sum / responseCount).toFixed(1) : '0.0')]);
        
        autoTable(doc, {
          startY: y,
          head: [['Rating', 'Count/Avg']],
          body: summaryData,
          styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
          headStyles: { fillColor: [46, 86, 166], halign: 'center' },
          margin: { left: 14 },
          tableWidth: 'wrap'
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.text('Text response provided.', 14, y);
        y += 10;
      }
    });

    // Raw Data Table
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Raw Data', 14, 20);
    const headers = [['Date', 'Patient Name', 'Age', 'Gender', 'City', ...survey.questions.map(q => q.text.substring(0, 30) + (q.text.length > 30 ? '...' : ''))]];
    const data = sortedResponses.map(r => {
      const answers = r.answers || {};
      const row = [formatDate(r.submittedAt), answers.patientName || 'N/A', answers.age || 'N/A', answers.gender || 'N/A', answers.city || 'N/A'];
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

    const columnStyles: Record<number, any> = {
      0: { cellWidth: 25 },
      1: { cellWidth: 35 },
      2: { cellWidth: 12 },
      3: { cellWidth: 18 },
      4: { cellWidth: 25 },
    };
    
    // Calculate remaining width for questions
    const fixedWidth = 25 + 35 + 12 + 18 + 25; // 115
    const availableWidth = 297 - 28 - fixedWidth; // 297 - margins - fixed
    const questionWidth = Math.max(25, availableWidth / survey.questions.length);
    
    survey.questions.forEach((_, i) => {
      columnStyles[5 + i] = { cellWidth: questionWidth };
    });

    autoTable(doc, {
      startY: 30,
      head: headers,
      body: data,
      styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: { 
        fillColor: [46, 86, 166], 
        halign: 'center', 
        valign: 'middle',
        overflow: 'hidden'
      },
      columnStyles: columnStyles,
      tableWidth: 'auto'
    });

    doc.save(`${survey.title.replace(/\s+/g, '_')}_Results.pdf`);
  };

  const exportExcel = () => {
    if (responses.length === 0) return;

    // Headers
    const headers = ['Response ID', 'Date', 'Patient Name', 'Attendant Name', 'Relation', 'Age', 'Gender', 'MR No', 'City', 'State', 'Country', ...survey.questions.map(q => q.text)];
    
    // Rows
    const rows = sortedResponses.map(r => {
      const answers = r.answers || {};
      const row = [r.id, formatDate(r.submittedAt, true), answers.patientName || 'N/A', answers.attendantName || 'N/A', answers.relationToPatient || 'N/A', answers.age || 'N/A', answers.gender || 'N/A', answers.mrNo || 'N/A', answers.city || 'N/A', answers.state || 'N/A', answers.country || 'N/A'];
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

  const getMostPopular = (data: { name: string; value: number }[]) => {
    if (data.length === 0) return <span className="text-slate-400 font-normal">No data available</span>;
    const maxCount = Math.max(...data.map((d) => d.value));
    const popular = data.filter((d) => d.value === maxCount);
    return (
      <div className="flex flex-wrap gap-1 justify-end font-bold text-slate-900">
        {popular.map((item, idx) => (
          <span key={idx} title={item.name}>
            {item.name}
            {idx < popular.length - 1 ? ', ' : ''}
          </span>
        ))}
      </div>
    );
  };

  const renderChart = (q: any, width: number) => {
    if (responses.length === 0) return <p className="text-slate-500 italic">No responses yet.</p>;

    if (q.id === 'otherHospital') {
      const counts: Record<string, number> = {};
      
      responses.forEach(r => {
        const val = (r.answers || {})[q.id];
        if (val && typeof val === 'string' && val.trim() !== '') {
          const raw = val.trim();
          const normalized = raw.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          counts[normalized] = (counts[normalized] || 0) + 1;
        } else {
          counts["Not specified"] = (counts["Not specified"] || 0) + 1;
        }
      });
      const data = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">Total Responses</p>
              <p className="text-3xl font-bold text-slate-900">{responses.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 font-medium mb-1">Most Popular</p>
              <p className="text-lg font-bold text-slate-900 truncate max-w-[150px] sm:max-w-[200px]">
                {data.length > 0 ? (data[0][0] === "Not specified" && data.length > 1 ? data[1][0] : data[0][0]) : '-'}
              </p>
            </div>
          </div>
          {data.length > 0 ? (
            <ul className="space-y-2">
              {data.map(([name, count]) => (
                <li key={name} className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className={`font-bold ${name === "Not specified" ? "text-slate-400 italic" : "text-slate-800"}`}>{name}</span>
                  <span className="text-teal-600 font-bold">{count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-slate-500 italic py-4">No valid hospital names provided.</p>
          )}
        </div>
      );
    }

    if (q.id === 'specialitiesAssociated') {
      const textResponses = responses.map(r => (r.answers || {})[q.id]).filter(Boolean);
      
      const departmentCounts: Record<string, number> = {};
      textResponses.forEach(text => {
        const lowerText = String(text).toLowerCase();
        departments.forEach(dept => {
          if (lowerText.includes(dept.toLowerCase())) {
            departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
          }
        });
      });

      const data = Object.entries(departmentCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ 
          name, 
          value,
          percentage: textResponses.length > 0 ? ((value / textResponses.length) * 100).toFixed(1) : '0.0'
        }));

      if (data.length === 0) return <p className="text-slate-500 italic">No responses.</p>;

      // Enhanced Donut Chart
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">Total Responses</p>
              <p className="text-3xl font-bold text-slate-900">{textResponses.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 font-medium mb-1">Most Popular</p>
              {getMostPopular(data)}
            </div>
          </div>
          <div className="h-64 sm:h-80">
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
                  label={({ percent }) => (percent * 100 < 1 ? '' : `${(percent * 100).toFixed(0)}%`)}
                  labelLine={false}
                >
                  {data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.map((item, index) => (
              <div key={index} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3 shadow-sm">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-500 truncate" title={item.name}>{item.name}</p>
                  <p className="text-sm font-bold text-slate-900">{item.value} responses</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

const SurveyBarChart = ({ data, responseCount }: { data: any[], responseCount: number }) => {
  const [showAll, setShowAll] = useState(false);
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const displayData = showAll ? sortedData : sortedData.slice(0, 5);
  const hasMore = sortedData.length > 5;

  return (
    <div className="space-y-3">
      {displayData.map((item, index) => {
        const percentage = ((item.value / responseCount) * 100).toFixed(1);
        const isTop = index === 0 && !showAll;
        
        return (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            key={item.name} 
            className="space-y-1.5 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
          >
            <div className="flex justify-between text-sm font-bold text-slate-800">
              <span className="truncate pr-4 leading-tight">{item.name}</span>
              <span className="font-mono text-slate-900 whitespace-nowrap">
                {item.value} <span className="text-slate-400 font-normal">({percentage}%)</span>
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / responseCount) * 100}%` }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className={`h-full rounded-full ${isTop ? 'bg-gradient-to-r from-teal-500 to-emerald-400' : 'bg-gradient-to-r from-blue-500 to-indigo-400'}`}
              />
            </div>
          </motion.div>
        );
      })}
      {hasMore && (
        <button 
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-sm font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors mt-2"
        >
          {showAll ? 'Show Fewer' : 'Show All Options'}
        </button>
      )}
    </div>
  );
};

// ... inside renderChart function:
    if (q.type === 'multiple_choice' || q.type === 'checkbox') {
      const counts: Record<string, number> = {};
      q.options?.forEach((opt: string) => counts[opt] = 0);
      
      responses.forEach(r => {
        const answers = r.answers || {};
        const val = answers[q.id];
        if (Array.isArray(val) && val.length > 0) {
          val.forEach(v => { 
            if (counts[v] !== undefined) { counts[v]++; } else { counts[v] = (counts[v] || 0) + 1; }
          });
        } else if (val !== undefined && val !== null && !Array.isArray(val)) {
          const valStr = String(val);
          if (counts[valStr] !== undefined) { counts[valStr]++; } else { counts[valStr] = (counts[valStr] || 0) + 1; }
        }
      });

      // Filter and Normalize options
      const allowedPurposeOptions = ["First time consultation", "Second opinion", "Review", "For Admission", "MHC", "Investigations", "First time admission", "Second time admission or Above"];
      const filteredData = Object.entries(counts)
        .reduce((acc, [name, value]) => {
           let key = name;
           if (q.id === 'purposeOfVisit') {
              const lowerName = name.toLowerCase().trim();
              
              // Mapping logic for required options
              if (lowerName.includes('second') && lowerName.includes('opinion')) {
                key = 'Second opinion';
              } else if (lowerName.includes('second') && lowerName.includes('admission')) {
                key = 'Second time admission or Above';
              } else if (lowerName.includes('first') && lowerName.includes('consultation')) {
                key = 'First time consultation';
              } else if (lowerName.includes('first') && lowerName.includes('admission')) {
                key = 'First time admission';
              } else if (lowerName.includes('admission')) {
                key = 'For Admission';
              } else if (lowerName.includes('review')) {
                key = 'Review';
              } else if (lowerName.includes('investigation')) {
                key = 'Investigations';
              } else if (lowerName.includes('mhc')) {
                key = 'MHC';
              } else {
                return acc; // Ignore this option, it's not one of our allowed ones
              }
           }

           // Check if the resulting key is allowed
           if (q.id === 'purposeOfVisit' && !allowedPurposeOptions.includes(key)) {
             return acc;
           }

           // Add to accumulator
           if (acc[key]) {
             acc[key] += value;
           } else {
             acc[key] = value;
           }
           return acc;

        }, {} as Record<string, number>);
      
      // Ensure all options are included, even with 0 responses
      const optionsToInclude = q.id === 'purposeOfVisit' ? allowedPurposeOptions : q.options;
      optionsToInclude?.forEach((opt: string) => {
        if (filteredData[opt] === undefined) {
          filteredData[opt] = 0;
        }
      });
      
      const dataForProcessing = Object.entries(filteredData)
        .map(([name, value]) => ({ name, value }));

      // Calculate participants who answered this specific question
      let participantsWhoAnsweredThisQuestion = 0;
      responses.forEach(r => {
        const val = (r.answers || {})[q.id];
        
        // Conditional filtering based on the 'willReturn' answer
        if (q.id === 'returnYesReasons' && (r.answers || {})['willReturn'] !== 'Yes') return;
        if (q.id === 'returnNoReasons' && (r.answers || {})['willReturn'] !== 'No') return;

        if (val !== undefined && val !== null && val !== '') {
          if (Array.isArray(val) && val.length === 0) return;
          participantsWhoAnsweredThisQuestion++;
        } 
      });

      // Maintain sumOfSelections for percentages
      const sumOfSelections = dataForProcessing.reduce((sum, item) => sum + item.value, 0);

      const data = dataForProcessing
        .map(item => ({ 
          ...item,
          percentage: sumOfSelections > 0 ? ((item.value / sumOfSelections) * 100).toFixed(1) : '0.0'
        }))
        .sort((a, b) => b.value - a.value);

      if (data.length === 0) return <p className="text-slate-500 italic">No selections made.</p>;

      const useBarChart = q.id === 'willReturn' || q.id === 'consultingDuration';

      if (useBarChart) {
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Total Responses</p>
                <p className="text-3xl font-bold text-slate-900">{q.type === 'checkbox' ? sumOfSelections : participantsWhoAnsweredThisQuestion}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 font-medium mb-1">Most Popular</p>
                <p className="text-lg font-bold text-slate-900 truncate max-w-[150px] sm:max-w-[200px]">
                  {data.length > 0 ? data[0].name : '-'}
                </p>
              </div>
            </div>
            <SurveyBarChart data={data} responseCount={participantsWhoAnsweredThisQuestion} />
          </div>
        );
      }

      // Enhanced Donut Chart
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">Total Responses</p>
              <p className="text-3xl font-bold text-slate-900">{q.type === 'checkbox' ? sumOfSelections : participantsWhoAnsweredThisQuestion}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 font-medium mb-1">Most Popular</p>
              {getMostPopular(data)}
            </div>
          </div>
          <div className="h-64 sm:h-80">
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
                  label={({ percent }) => (percent * 100 < 1 ? '' : `${(percent * 100).toFixed(0)}%`)}
                  labelLine={false}
                >
                  {data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.map((item, index) => (
              <div key={index} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3 shadow-sm">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-500 truncate" title={item.name}>{item.name}</p>
                  <p className="text-sm font-bold text-slate-900">{item.value} responses</p>
                </div>
              </div>
            ))}
          </div>
          {q.options?.includes('Others') && (
            <div className="mt-6 border-t border-slate-200 pt-4">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Other Responses</h4>
              <ul className="space-y-2">
                {responses
                  .map(r => {
                    const answers = r.answers || {};
                    const primaryKey = q.id === 'returnNoReasons' ? 'returnNoReasonOther' : q.id + 'Other';
                    const alternativeKey = q.id === 'returnNoReasons' ? 'returnNoReasonother' : q.id + 'other';
                    const val = answers[primaryKey] || answers[alternativeKey];
                    return { id: r.id, val, key: answers[primaryKey] ? primaryKey : (answers[alternativeKey] ? alternativeKey : 'none') };
                  })
                  .filter(item => item.val && typeof item.val === 'string' && item.val.trim() !== '')
                  .map((item, idx) => (
                    <li key={idx} className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700 italic border border-slate-100 flex justify-between">
                      <span>"{item.val}"</span>
                      <span className="text-xs text-slate-400">({item.key})</span>
                    </li>
                  ))}
                {responses
                  .filter(r => {
                    const answers = r.answers || {};
                    const primaryKey = q.id === 'returnNoReasons' ? 'returnNoReasonOther' : q.id + 'Other';
                    const alternativeKey = q.id === 'returnNoReasons' ? 'returnNoReasonother' : q.id + 'other';
                    const val = answers[primaryKey] || answers[alternativeKey];
                    const answer = answers[q.id];
                    return (answer === 'Others' || (Array.isArray(answer) && (answer as string[]).includes('Others'))) && !(val && typeof val === 'string' && val.trim() !== '');
                  }).length > 0 && responses
                  .filter(r => (r.answers || {})[q.id === 'returnNoReasons' ? 'returnNoReasonOther' : q.id + 'Other']).length === 0 
                  && <p className="text-sm text-slate-400 italic">No other responses provided.</p>}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (q.type === 'text') {
      const textResponses = responses.map(r => (r.answers || {})[q.id]).filter(Boolean);
      return (
        <div className="space-y-3 w-full">
          {textResponses.length === 0 ? (
            <p className="text-slate-500 italic">No responses.</p>
          ) : (
            textResponses.map((text, i) => (
              <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-700 text-sm leading-relaxed">
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
        if (val !== undefined && val !== null && typeof val === 'number') {
          if (counts[val.toString()] !== undefined) {
            counts[val.toString()]++;
          } else {
            counts[val.toString()] = 1;
          }
          if (val > 0) {
            responseCount++;
            sum += val;
          }
        }
      });

      const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
      const average = responseCount > 0 ? (sum / responseCount).toFixed(1) : '0.0';

      const CustomBarTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
          return (
            <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-xl">
              <p className="font-medium text-slate-900 mb-1">Rating: {payload[0].payload.name} Stars</p>
              <p className="text-sm text-slate-600">Count: <span className="font-medium text-slate-900">{payload[0].value}</span></p>
            </div>
          );
        }
        return null;
      };

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
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: width < 640 ? 10 : 12 }} 
                  interval={width < 640 ? 'preserveStartEnd' : 0}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={width < 640 ? 20 : 40} />
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
        {survey.questions
          .filter(q => !['evalCure', 'evalCare', 'evalCost', 'evalComm', 'evalComfort', 'evalConv'].includes(q.id))
          .map((q, i) => (
            <div key={q.id} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-6 line-clamp-2" title={q.text}>
                {i + 1}. {
                  q.id === 'otherHospital' ? 'Preferred Alternative Hospitals (if not MIOT)' :
                  q.id === 'returnYesReasons' ? 'I will return to MIOT for further treatment – YES, because of:' :
                  q.id === 'returnNoReason' ? 'I will not return to MIOT for further treatment – NO, because:' :
                  q.text
                }
              </h3>
              {renderChart(q, width)}
            </div>
          ))}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Patient Overall Experience</h3>
        <p className="text-teal-600 font-bold mb-6">Overall Average: {overallAverage} / 5.0</p>
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 w-fit">
          <p className="text-sm font-medium text-slate-500">Total Responses</p>
          <p className="text-3xl font-bold text-slate-900">{responses.length}</p>
        </div>

        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={evalData} margin={{ top: 30, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} domain={[0, 5]} hide />
              <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar 
                dataKey="value" 
                radius={[8, 8, 8, 8]} 
                barSize={width < 640 ? 30 : 50}
                label={{ position: 'top', fill: '#0f172a', fontWeight: 'bold' }}
              >
                {evalData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#gradient)`}
                  />
                ))}
              </Bar>
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#2dd4bf" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-teal-600" />
          Patient Location Heatmap
        </h2>
        <LocationHeatmap responses={responses} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900">Recent Respondents</h2>
          <div className="flex items-center gap-4">
            {selectedResponses.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                disabled={isDeleting === 'bulk'}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" /> Delete {selectedResponses.length}
              </button>
            )}
            <div className="text-sm text-slate-500 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Auto-updating (Last fetched: {lastFetched.toLocaleTimeString()})
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {/* Desktop Table */}
          <table className="hidden sm:table w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">
                  <input type="checkbox" checked={selectedResponses.length === sortedResponses.length && sortedResponses.length > 0} onChange={toggleSelectAll} className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                </th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Age</th>
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {responses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No responses yet</td>
                </tr>
              ) : (
                paginatedResponses.map(r => {
                  const answers = r.answers || {};
                  const isSelected = selectedResponses.includes(r.id);
                  return (
                    <tr key={r.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-teal-50/50' : ''}`}>
                      <td className="px-6 py-4">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelectResponse(r.id)} className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(r.submittedAt, true)}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{answers.patientName || 'N/A'}</td>
                      <td className="px-6 py-4">{answers.age || 'N/A'}</td>
                      <td className="px-6 py-4">{answers.city || 'N/A'}</td>
                      <td className="px-6 py-4 text-right">
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

          {/* Mobile Card Layout */}
          <div className="sm:hidden divide-y divide-slate-200">
            {responses.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No responses yet</div>
            ) : (
              paginatedResponses.map(r => {
                const answers = r.answers || {};
                const isSelected = selectedResponses.includes(r.id);
                return (
                  <div key={r.id} className={`p-4 ${isSelected ? 'bg-teal-50/50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelectResponse(r.id)} className="mt-1 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{answers.patientName || 'N/A'}</p>
                        <p className="text-sm text-slate-500">{formatDate(r.submittedAt, true)}</p>
                        <div className="mt-2 text-sm text-slate-600">
                          <span className="font-medium">Age:</span> {answers.age || 'N/A'} | <span className="font-medium">City:</span> {answers.city || 'N/A'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={isDeleting === r.id}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete response"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
