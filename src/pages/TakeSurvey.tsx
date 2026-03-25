import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { saveResponse, Survey, SurveyResponse } from '../store';
import { useSurveys } from '../hooks/useFirestore';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TakeSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { surveys, loading } = useSurveys(true);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPlace, setPatientPlace] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id && surveys.length > 0) {
      const s = surveys.find(s => s.id === id);
      if (s) setSurvey(s);
    }
  }, [id, surveys]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    setAnswers(prev => {
      const current = (prev[questionId] as string[]) || [];
      if (checked) {
        return { ...prev, [questionId]: [...current, option] };
      } else {
        return { ...prev, [questionId]: current.filter(o => o !== option) };
      }
    });
  };

  const handleFileUploadAnswer = (questionId: string, file: File | undefined) => {
    if (!file) return;
    // For this demo, we store the file name. In a real app, we would upload the file to a server/storage.
    handleAnswerChange(questionId, `[File Uploaded] ${file.name}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;

    if (!patientName.trim() || !patientEmail.trim() || !patientPlace.trim()) {
      setError('Please fill in your name, email, and place.');
      return;
    }

    // Validate required fields
    for (const q of survey.questions) {
      if (q.required) {
        const val = answers[q.id];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          setError(`Please answer all required questions. Missing: "${q.text}"`);
          return;
        }
      }
    }

    const response: SurveyResponse = {
      id: `r_${Date.now()}`,
      surveyId: survey.id,
      patientName,
      patientEmail,
      patientPlace,
      answers,
      submittedAt: new Date().toISOString()
    };

    try {
      await saveResponse(response);
      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit survey. Please try again.');
      console.error(err);
    }
  };

  if (loading) return <div className="text-center py-12">Loading survey...</div>;
  if (!survey) return <div className="text-center py-12">Survey not found.</div>;

  const totalQuestions = survey.questions.length;
  const completedQuestions = survey.questions.filter(q => {
    const val = answers[q.id];
    if (val === undefined || val === null || val === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  }).length;
  
  const progressPercentage = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 bg-white rounded-3xl shadow-sm border border-slate-200">
        <CheckCircle2 className="h-20 w-20 text-teal-500 mx-auto mb-6" />
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Thank You!</h2>
        <p className="text-lg text-slate-600 mb-8">Your feedback has been submitted successfully and will help us improve our services.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{survey.title}</h1>
        <p className="text-slate-600 text-lg mb-6">{survey.description}</p>
        
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">Survey Progress</span>
            <span className="text-sm font-bold text-teal-600">{completedQuestions} of {totalQuestions} answered</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-teal-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Your Details</h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Place / City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={patientPlace}
              onChange={(e) => setPatientPlace(e.target.value)}
              placeholder="Enter your city or location"
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
            />
          </div>
        </div>

        {survey.questions.map((q, index) => (
          <div key={q.id} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
            <label className="block text-lg font-medium text-slate-900 mb-4">
              {index + 1}. {q.text}
              {q.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {q.type === 'text' && (
              <textarea
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                rows={4}
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                placeholder="Type your answer here..."
              />
            )}

            {q.type === 'rating' && (
              <div className="flex flex-wrap gap-2 sm:gap-4">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleAnswerChange(q.id, rating)}
                    className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full font-bold text-base sm:text-lg transition-all ${
                      answers[q.id] === rating 
                        ? 'bg-teal-600 text-white shadow-md scale-110' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'multiple_choice' && (
              <div className="space-y-3">
                {q.options?.map(option => (
                  <label key={option} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name={q.id}
                      value={option}
                      checked={answers[q.id] === option}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="h-5 w-5 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-slate-700">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'checkbox' && (
              <div className="space-y-3">
                {q.options?.map(option => (
                  <label key={option} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={((answers[q.id] as string[]) || []).includes(option)}
                      onChange={(e) => handleCheckboxChange(q.id, option, e.target.checked)}
                      className="h-5 w-5 text-teal-600 focus:ring-teal-500 rounded"
                    />
                    <span className="text-slate-700">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'date' && (
              <input
                type="date"
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                className="w-full sm:w-auto p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              />
            )}

            {q.type === 'time' && (
              <input
                type="time"
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                className="w-full sm:w-auto p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              />
            )}

            {q.type === 'file_upload' && (
              <div className="w-full">
                <input
                  type="file"
                  id={`file-${q.id}`}
                  onChange={(e) => handleFileUploadAnswer(q.id, e.target.files?.[0])}
                  className="hidden"
                />
                <label
                  htmlFor={`file-${q.id}`}
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-medium"
                >
                  <Upload className="h-5 w-5 text-slate-400" />
                  {answers[q.id] ? answers[q.id].replace('[File Uploaded] ', '') : 'Choose File'}
                </label>
                {answers[q.id] && (
                  <p className="mt-2 text-sm text-teal-600 font-medium">File selected successfully.</p>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 shadow-sm transition-colors"
          >
            Submit Survey
          </button>
        </div>
      </form>
    </div>
  );
}
