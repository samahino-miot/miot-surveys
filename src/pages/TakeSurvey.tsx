import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useSurveys } from '../hooks/useFirestore';
import { useAuth } from '../components/AuthProvider';
import { LocationInput } from '../components/LocationInput';
import { Country, State, City } from 'country-state-city';
import { newSurveyDepartments } from '../data/departments';

const CategoryRatingCard = ({ id, title, subPoints, value, onChange, error, allowZero = false }: { id: string, title: string, subPoints: string, value: number, onChange: (val: number) => void, error?: boolean, allowZero?: boolean }) => {
  const points = subPoints.split(' - ');
  const options = allowZero ? [0, 1, 2, 3, 4, 5] : [1, 2, 3, 4, 5];
  return (
    <div id={id} className={`bg-white p-6 rounded-2xl shadow-sm border ${error ? 'border-red-500' : 'border-slate-200'} mb-6`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <div className="flex flex-wrap gap-2">
          {options.map(rating => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(rating)}
              className={`h-10 w-10 rounded-lg font-bold text-sm transition-all flex items-center justify-center ${
                value === rating 
                  ? 'bg-teal-600 text-white shadow-md ring-2 ring-teal-600/20' 
                  : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {rating === 0 ? 'N/A' : rating}
            </button>
          ))}
        </div>
      </div>
      <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
        {points.map((point, index) => (
          <li key={index}>{point}</li>
        ))}
      </ul>
    </div>
  );
};

export default function TakeSurvey() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const surveyorId = searchParams.get('surveyorId');
  const { currentUser, adminUser } = useAuth();
  const surveyId = id || 'miot-registration-survey';
  
  const { surveys, loading: surveysLoading } = useSurveys(false);
  
  const [formData, setFormData] = useState({
    patientName: '',
    attendantName: '',
    relationToPatient: '',
    age: '',
    gender: '',
    mrNo: '',
    city: '',
    state: '',
    country: '',
    pinCode: '',
    typeOfVisit: '',
    purposeOfVisit: '',
    department: [] as string[],
    consultingDuration: '',
    howDidYouKnow: [] as string[],
    howDidYouKnowOther: '',
    whatInfluenced: '' as string,
    whatInfluencedOther: '',
    
    evalCure: 0,
    evalCare: 0,
    evalComm: 0,
    evalComfort: 0,
    evalConv: 0,
    evalCost: '',
    
    specialitiesAssociated: [] as string[],
    willReturn: '',
    returnYesReasons: [] as string[],
    returnYesOther: '',
    returnNoReasons: [] as string[],
    returnNoReasonOther: '',
    otherHospital: '',
    comments: ''
  });

  const [liverAnswers, setLiverAnswers] = useState<Record<string, any>>({});

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 5;
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  if (surveysLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  const dbSurvey = surveys.find(s => s.id === surveyId);
  
  if (dbSurvey.id === 'liver-gym-feedback-form') {
    // Liver Gym Logic
    const handleInputChange = (id: string, value: any) => {
      setLiverAnswers(prev => ({ ...prev, [id]: value }));
    };

    const submitSurvey = async () => {
      setIsSubmitting(true);
      try {
        await addDoc(collection(db, 'responses'), {
          surveyId: dbSurvey.id,
          surveyTitle: dbSurvey.title,
          answers: liverAnswers,
          submittedAt: serverTimestamp(),
          editorId: currentUser?.uid || surveyorId || 'unknown',
          editorName: currentUser?.displayName || currentUser?.email || 'Anonymous'
        });
        setSubmitted(true);
      } catch (err) {
        console.error(err);
        setError('Failed to submit survey.');
      } finally {
        setIsSubmitting(false);
      }
    };


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

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto px-2.5 sm:px-10 py-6 sm:p-10"
        >
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{dbSurvey.title}</h1>
            <p className="text-slate-600 mb-8">Please fill out the following questions to share your feedback.</p>
            
            <div className="space-y-6">
                {dbSurvey.questions.map((q: any) => (
                    <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <label className="block text-lg font-medium text-slate-900 mb-4">{q.text} {q.required && '*'}</label>
                        
                        {q.type === 'text' && (
                            <input 
                                type="text" 
                                value={liverAnswers[q.id] || ''}
                                onChange={(e: any) => handleInputChange(q.id, e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" 
                            />
                        )}
                        {q.type === 'date' && (
                            <input 
                                type="date" 
                                value={liverAnswers[q.id] || ''}
                                onChange={(e: any) => handleInputChange(q.id, e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" 
                            />
                        )}
                        {q.type === 'multiple_choice' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {q.options?.map((o: any) => (
                                    <label 
                                        key={o} 
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                            liverAnswers[q.id] === o 
                                            ? 'border-teal-600 bg-teal-50' 
                                            : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <input 
                                            type="radio" 
                                            value={o} 
                                            name={q.id}
                                            checked={liverAnswers[q.id] === o}
                                            onChange={() => handleInputChange(q.id, o)}
                                            className="hidden"
                                        />
                                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                            liverAnswers[q.id] === o ? 'border-teal-600' : 'border-slate-400'
                                        }`}>
                                            {liverAnswers[q.id] === o && <div className="h-2.5 w-2.5 rounded-full bg-teal-600" />}
                                        </div>
                                        <span className={`font-medium ${liverAnswers[q.id] === o ? 'text-teal-900' : 'text-slate-700'}`}>
                                            {o}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                        {q.type === 'checkbox' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {q.options?.map((o: any) => (
                                    <label 
                                        key={o} 
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                            (liverAnswers[q.id] || []).includes(o)
                                            ? 'border-teal-600 bg-teal-50' 
                                            : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <input 
                                            type="checkbox" 
                                            value={o} 
                                            checked={(liverAnswers[q.id] || []).includes(o)}
                                            onChange={(e: any) => {
                                                const current = liverAnswers[q.id] || [];
                                                const next = e.target.checked ? [...current, o] : current.filter((x: string) => x !== o);
                                                handleInputChange(q.id, next);
                                            }}
                                            className="hidden"
                                        />
                                        <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                                            (liverAnswers[q.id] || []).includes(o) ? 'bg-teal-600 border-teal-600' : 'border-slate-400'
                                        }`}>
                                            {(liverAnswers[q.id] || []).includes(o) && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                        <span className={`font-medium ${(liverAnswers[q.id] || []).includes(o) ? 'text-teal-900' : 'text-slate-700'}`}>
                                            {o}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                        {q.type === 'rating' && (
                            <div className="flex gap-4">
                                {[1, 2, 3, 4, 5].map(r => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => handleInputChange(q.id, r)}
                                        className={`h-12 w-12 rounded-xl font-bold text-lg transition-all ${
                                            liverAnswers[q.id] === r 
                                            ? 'bg-teal-600 text-white' 
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                
                <button 
                  onClick={submitSurvey}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
            </div>
        </motion.div>
    );
  } else {
    // Fallback for other surveys
    return <div className="text-center py-10">Survey functionality for this path is under construction.</div>;
  }
}