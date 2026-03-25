import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { saveResponse, Survey, SurveyResponse } from '../store';
import { useSurveys } from '../hooks/useFirestore';
import { Upload, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TakeSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { surveys, loading } = useSurveys(true);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const answersRef = useRef(answers);
  
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const [patientName, setPatientName] = useState('');
  const [attendantName, setAttendantName] = useState('');
  const [relationToPatient, setRelationToPatient] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [mrNo, setMrNo] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0); // 0 = details, 1 to N = questions
  const [direction, setDirection] = useState(1);

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
    handleAnswerChange(questionId, `[File Uploaded] ${file.name}`);
  };

  const visibleQuestions = survey?.questions.filter(q => {
    if (!q.condition) return true;
    const dependsOnAnswer = answers[q.condition.dependsOnId];
    if (Array.isArray(dependsOnAnswer)) {
      return dependsOnAnswer.includes(q.condition.equals as string);
    }
    return dependsOnAnswer === q.condition.equals;
  }) || [];

  const visibleQuestionsRef = useRef(visibleQuestions);
  useEffect(() => {
    visibleQuestionsRef.current = visibleQuestions;
  }, [visibleQuestions]);

  const nextStep = () => {
    setError('');
    if (currentStep === 0) {
      if (!patientName.trim() || !age.trim() || !gender.trim() || !city.trim() || !state.trim() || !country.trim()) {
        setError('Please fill in all required fields to continue.');
        return;
      }
    } else {
      const q = visibleQuestionsRef.current[currentStep - 1];
      if (q && q.required) {
        const val = answersRef.current[q.id];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          setError('This question is required. Please provide an answer.');
          return;
        }
      }
    }
    
    if (currentStep < visibleQuestionsRef.current.length) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    setError('');
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  // Auto-advance for single choice questions
  const handleAutoAdvance = (questionId: string, value: any) => {
    handleAnswerChange(questionId, value);
    setTimeout(() => {
      nextStep();
    }, 400); // Short delay so they see the selection
  };

  const handleSubmit = async () => {
    if (!survey) return;

    // Filter out answers for questions that are no longer visible due to conditions
    const visibleAnswers: Record<string, any> = {};
    visibleQuestionsRef.current.forEach(q => {
      if (answersRef.current[q.id] !== undefined) {
        visibleAnswers[q.id] = answersRef.current[q.id];
      }
    });

    const response: SurveyResponse = {
      id: `r_${Date.now()}`,
      surveyId: survey.id,
      patientName,
      attendantName,
      relationToPatient,
      age,
      gender,
      mrNo,
      city,
      state,
      country,
      answers: visibleAnswers,
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading survey...</div>;
  if (!survey) return <div className="min-h-screen flex items-center justify-center text-slate-500">Survey not found.</div>;

  const totalSteps = visibleQuestions.length;
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-lg w-full text-center py-16 px-8 bg-white rounded-3xl shadow-sm border border-slate-200"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle2 className="h-24 w-24 text-teal-500 mx-auto mb-6" />
          </motion.div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Thank You!</h2>
          <p className="text-lg text-slate-600 mb-8">Your feedback is incredibly valuable to us and helps improve patient care at MIOT International.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
          >
            Return to Home
          </button>
        </motion.div>
      </div>
    );
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  };

  return (
    <div className="max-w-3xl mx-auto min-h-[80vh] flex flex-col">
      {/* Header & Progress */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{survey.title}</h1>
        {currentStep === 0 && <p className="text-slate-600 text-lg mb-6">{survey.description}</p>}
        
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">
              {currentStep === 0 ? 'Patient Details' : `Question ${currentStep} of ${totalSteps}`}
            </span>
            <span className="text-sm font-bold text-teal-600">{progressPercentage}% Completed</span>
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
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </motion.div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {currentStep === 0 ? (
            <motion.div
              key="step-0"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-6 sm:p-10 space-y-6"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Patient Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient name"
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Attendant Name
                  </label>
                  <input
                    type="text"
                    value={attendantName}
                    onChange={(e) => setAttendantName(e.target.value)}
                    placeholder="Enter attendant name"
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Relation to patient
                  </label>
                  <input
                    type="text"
                    value={relationToPatient}
                    onChange={(e) => setRelationToPatient(e.target.value)}
                    placeholder="e.g. Son, Daughter"
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Enter age"
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Mr. No
                  </label>
                  <input
                    type="text"
                    value={mrNo}
                    onChange={(e) => setMrNo(e.target.value)}
                    placeholder="Enter Mr. No"
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter City"
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Enter State"
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Enter Country"
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                    onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`step-${currentStep}`}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-6 sm:p-10"
            >
              {(() => {
                const q = visibleQuestions[currentStep - 1];
                if (!q) return null;
                return (
                  <div className="space-y-8">
                    <h2 className="text-2xl sm:text-3xl font-medium text-slate-900 leading-tight">
                      {q.text}
                      {q.required && <span className="text-red-500 ml-2 text-xl">*</span>}
                    </h2>

                    {q.type === 'text' && (
                      <textarea
                        className="w-full p-4 text-lg border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        rows={5}
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder="Type your answer here..."
                        autoFocus
                      />
                    )}

                    {q.type === 'rating' && (
                      <div className="flex flex-wrap gap-3 sm:gap-6 justify-center py-4">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => handleAutoAdvance(q.id, rating)}
                            className={`h-16 w-16 sm:h-20 sm:w-20 rounded-2xl font-bold text-2xl sm:text-3xl transition-all flex items-center justify-center ${
                              answers[q.id] === rating 
                                ? 'bg-teal-600 text-white shadow-lg scale-105 ring-4 ring-teal-600/20' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:scale-105'
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.type === 'multiple_choice' && (
                      <div className="space-y-3">
                        {q.options?.map(option => {
                          const isSelected = answers[q.id] === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => handleAutoAdvance(q.id, option)}
                              className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-center justify-between ${
                                isSelected 
                                  ? 'border-teal-600 bg-teal-50 text-teal-900' 
                                  : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span className="text-lg">{option}</span>
                              {isSelected && <Check className="h-6 w-6 text-teal-600" />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'checkbox' && (
                      <div className="space-y-3">
                        {q.options?.map(option => {
                          const isSelected = ((answers[q.id] as string[]) || []).includes(option);
                          return (
                            <label 
                              key={option} 
                              className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                                isSelected 
                                  ? 'border-teal-600 bg-teal-50' 
                                  : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                              }`}
                            >
                              <div className={`h-6 w-6 rounded border flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-teal-600 border-teal-600' : 'border-slate-400 bg-white'
                              }`}>
                                {isSelected && <Check className="h-4 w-4 text-white" />}
                              </div>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleCheckboxChange(q.id, option, e.target.checked)}
                                className="hidden"
                              />
                              <span className={`text-lg ${isSelected ? 'text-teal-900 font-medium' : 'text-slate-700'}`}>
                                {option}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'date' && (
                      <input
                        type="date"
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className="w-full p-4 text-lg border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                      />
                    )}

                    {q.type === 'time' && (
                      <input
                        type="time"
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className="w-full p-4 text-lg border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
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
                          className="cursor-pointer flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed border-slate-300 rounded-2xl hover:bg-slate-50 hover:border-teal-400 transition-all text-slate-700"
                        >
                          <div className="h-16 w-16 rounded-full bg-teal-50 flex items-center justify-center">
                            <Upload className="h-8 w-8 text-teal-600" />
                          </div>
                          <div className="text-center">
                            <span className="text-lg font-medium block mb-1">
                              {answers[q.id] ? 'Change File' : 'Upload Document'}
                            </span>
                            <span className="text-slate-500 text-sm">Tap to browse your files</span>
                          </div>
                        </label>
                        {answers[q.id] && (
                          <div className="mt-4 p-4 bg-teal-50 rounded-xl flex items-center gap-3 text-teal-800 border border-teal-100">
                            <CheckCircle2 className="h-5 w-5 text-teal-600" />
                            <span className="font-medium truncate">{answers[q.id].replace('[File Uploaded] ', '')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
            currentStep === 0 
              ? 'text-slate-300 cursor-not-allowed' 
              : 'text-slate-600 hover:bg-slate-200 bg-slate-100'
          }`}
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        <button
          onClick={nextStep}
          className="flex items-center gap-2 px-8 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 shadow-sm transition-all hover:scale-105 active:scale-95"
        >
          {currentStep === totalSteps ? 'Submit Survey' : 'Next'}
          {currentStep !== totalSteps && <ArrowRight className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
