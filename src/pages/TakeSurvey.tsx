import React, { useState } from 'react';
import Select from 'react-select';
import { useNavigate, useParams } from 'react-router';
import { CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useSurveys } from '../hooks/useFirestore';
import { LocationInput } from '../components/LocationInput';
import { locations } from '../data/locations';
import { departments } from '../data/departments';

const CategoryRatingCard = ({ title, subPoints, value, onChange }: { title: string, subPoints: string, value: number, onChange: (val: number) => void }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(rating => (
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
            {rating}
          </button>
        ))}
      </div>
    </div>
    <p className="text-sm text-slate-600">{subPoints}</p>
  </div>
);

export default function TakeSurvey() {
  const navigate = useNavigate();
  const { id } = useParams();
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
    purposeOfVisit: '',
    department: '',
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
    returnNoReason: ''
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 5;
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  if (surveysLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  const dbSurvey = surveys.find(s => s.id === surveyId);
  const isActive = dbSurvey ? dbSurvey.isActive : true; // Default to true if not in DB

  if (!isActive) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center py-16 px-8 bg-white rounded-3xl shadow-sm border border-slate-200">
          <AlertCircle className="h-16 w-16 text-slate-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Survey Unavailable</h2>
          <p className="text-slate-600 mb-8">This survey is currently not active and cannot accept new responses.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const handleCheckboxChange = (field: 'howDidYouKnow' | 'returnYesReasons', value: string) => {
    setFormData(prev => {
      const current = prev[field];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const handleRadioChange = (field: 'whatInfluenced', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    setError('');
    if (currentStep === 0) {
      if (!formData.patientName.trim() || !formData.age.trim() || !formData.gender.trim() || !formData.city.trim() || !formData.state.trim() || !formData.country.trim()) {
        setError('Please fill in all required fields (*) to continue.');
        return;
      }
    } else if (currentStep === 1) {
      if (!formData.purposeOfVisit.trim()) {
        setError('Please select the purpose of your visit.');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.consultingDuration) {
        setError('Please select how long you have been consulting.');
        return;
      }
      if (formData.howDidYouKnow.length === 0) {
        setError('Please select at least one option for how you knew about MIOT.');
        return;
      }
      if (formData.howDidYouKnow.includes('Others') && !formData.howDidYouKnowOther.trim()) {
        setError('Please specify the other source for how you knew about MIOT.');
        return;
      }
      if (!formData.whatInfluenced.trim()) {
        setError('Please select at least one option for what influenced your decision.');
        return;
      }
      if (formData.whatInfluenced === 'Others' && !formData.whatInfluencedOther.trim()) {
        setError('Please specify the other influence.');
        return;
      }
    } else if (currentStep === 3) {
      const requiredRatings = [
        'evalCure', 'evalCare', 'evalComm', 'evalComfort', 'evalConv'
      ];
      
      const missingRating = requiredRatings.some(key => formData[key as keyof typeof formData] === 0);
      if (missingRating || !formData.evalCost) {
        setError('Please complete all ratings and selections on this page.');
        return;
      }
    } else if (currentStep === 4) {
      if (formData.specialitiesAssociated.length === 0) {
        setError('Please specify the specialities associated with MIOT.');
        return;
      }
      if (!formData.willReturn) {
        setError('Please select whether you will return to MIOT.');
        return;
      }
      if (formData.willReturn === 'Yes') {
        if (formData.returnYesReasons.length === 0) {
          setError('Please select at least one reason for returning.');
          return;
        }
        if (formData.returnYesReasons.includes('Others, if any') && !formData.returnYesOther.trim()) {
          setError('Please specify the other reason for returning.');
          return;
        }
      } else if (formData.willReturn === 'No') {
        if (!formData.returnNoReason.trim()) {
          setError('Please specify the reason for not returning.');
          return;
        }
      }
    }

    if (currentStep < totalSteps - 1) {
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await addDoc(collection(db, 'responses'), {
        surveyId: surveyId,
        surveyTitle: dbSurvey?.title || 'MIOT International Patient Registration Survey',
        answers: formData,
        submittedAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError('Failed to submit survey. Please try again.');
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
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">MIOT International Patient Registration Survey</h1>
        {currentStep === 0 && <p className="text-slate-600 text-lg mb-6">Please fill out the following details to register.</p>}
        
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">
              {currentStep === 0 ? 'Patient Details' : currentStep === 1 ? 'Visit Details' : currentStep === 2 ? 'Consultation & Awareness' : 'Evaluation'}
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
                    1. Mr. No
                  </label>
                  <input
                    type="text"
                    value={formData.mrNo}
                    onChange={(e) => setFormData({...formData, mrNo: e.target.value})}
                    placeholder="Enter Mr. No"
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    2. Patient Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.patientName}
                    onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                    placeholder="Enter patient name"
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    3. Attendant Name
                  </label>
                  <input
                    type="text"
                    value={formData.attendantName}
                    onChange={(e) => setFormData({...formData, attendantName: e.target.value})}
                    placeholder="Enter attendant name"
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    4. Relation to patient
                  </label>
                  <input
                    type="text"
                    value={formData.relationToPatient}
                    onChange={(e) => setFormData({...formData, relationToPatient: e.target.value})}
                    placeholder="e.g. Son, Daughter"
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    5. Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    placeholder="Enter age"
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>

                <LocationInput
                  label="6. Gender"
                  value={formData.gender}
                  onChange={(val) => setFormData({...formData, gender: val})}
                  suggestions={['Male', 'Female', 'Other']}
                  placeholder="Select or enter Gender"
                  required
                />

                <LocationInput
                  label="7. Country"
                  value={formData.country}
                  onChange={(val) => setFormData({...formData, country: val, state: '', city: ''})}
                  suggestions={locations.countries}
                  placeholder="Enter or select Country"
                  required
                />

                <LocationInput
                  label="8. State"
                  value={formData.state}
                  onChange={(val) => setFormData({...formData, state: val, city: ''})}
                  suggestions={locations.states[formData.country as keyof typeof locations.states] || []}
                  placeholder="Enter or select State"
                  required
                />

                <LocationInput
                  label="9. City"
                  value={formData.city}
                  onChange={(val) => setFormData({...formData, city: val})}
                  suggestions={locations.cities[formData.state as keyof typeof locations.cities] || []}
                  placeholder="Enter or select City"
                  required
                />
              </div>
            </motion.div>
          ) : currentStep === 1 ? (
            <motion.div
              key="step-1"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-6 sm:p-10 space-y-6"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Visit Details</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    10. Purpose of this visit: <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['OP Consultation', 'Review', 'Second opinion', 'Admission', 'MHC', 'Only Investigations'].map(option => (
                      <label 
                        key={option} 
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.purposeOfVisit === option 
                            ? 'border-teal-600 bg-teal-50' 
                            : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          formData.purposeOfVisit === option ? 'border-teal-600' : 'border-slate-400'
                        }`}>
                          {formData.purposeOfVisit === option && <div className="h-2.5 w-2.5 rounded-full bg-teal-600" />}
                        </div>
                        <input
                          type="radio"
                          name="purposeOfVisit"
                          value={option}
                          checked={formData.purposeOfVisit === option}
                          onChange={(e) => setFormData({...formData, purposeOfVisit: e.target.value})}
                          className="hidden"
                        />
                        <span className={`font-medium ${formData.purposeOfVisit === option ? 'text-teal-900' : 'text-slate-700'}`}>
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <LocationInput
                  label="For which Department:"
                  value={formData.department}
                  onChange={(val) => setFormData({...formData, department: val})}
                  suggestions={departments}
                  placeholder="e.g. Cardiology, Orthopedics"
                  required={false}
                />
              </div>
            </motion.div>
          ) : currentStep === 2 ? (
            <motion.div
              key="step-2"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-6 sm:p-10 space-y-10"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Consultation & Awareness</h2>
              
              <div className="space-y-8">
                {/* Q11 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    11. How long have you been consulting in MIOT? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['1st Visit', '<1 month', '1 month – 5yrs', '>5yrs'].map(option => (
                      <label 
                        key={option} 
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.consultingDuration === option 
                            ? 'border-teal-600 bg-teal-50' 
                            : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          formData.consultingDuration === option ? 'border-teal-600' : 'border-slate-400'
                        }`}>
                          {formData.consultingDuration === option && <div className="h-2.5 w-2.5 rounded-full bg-teal-600" />}
                        </div>
                        <input
                          type="radio"
                          name="consultingDuration"
                          value={option}
                          checked={formData.consultingDuration === option}
                          onChange={(e) => setFormData({...formData, consultingDuration: e.target.value})}
                          className="hidden"
                        />
                        <span className={`font-medium ${formData.consultingDuration === option ? 'text-teal-900' : 'text-slate-700'}`}>
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Q12 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    12. How did you know about MIOT? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {['Newspaper', 'Magazine', 'Television', 'Radio', 'Theatre Ads', 'Newspaper Inserts', 'Apartment posters', 'Friends', 'Relatives', 'Colleagues', 'Outdoor Hoardings/ Bus Shelters', 'Corporate Tie-up', 'Outreach Clinics', 'Referred by Doctor', 'Digital (Website/Google/Social Media)', 'Others'].map(option => {
                      const isSelected = formData.howDidYouKnow.includes(option);
                      return (
                        <label 
                          key={option} 
                          className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-teal-600 bg-teal-50' 
                              : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`mt-0.5 h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-teal-600 border-teal-600' : 'border-slate-400 bg-white'
                          }`}>
                            {isSelected && <Check className="h-4 w-4 text-white" />}
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleCheckboxChange('howDidYouKnow', option)}
                            className="hidden"
                          />
                          <span className={`text-sm font-medium ${isSelected ? 'text-teal-900' : 'text-slate-700'}`}>
                            {option}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {formData.howDidYouKnow.includes('Others') && (
                    <div className="mt-4">
                      <input
                        type="text"
                        placeholder="Please specify other source"
                        value={formData.howDidYouKnowOther}
                        onChange={(e) => setFormData({...formData, howDidYouKnowOther: e.target.value})}
                        className="w-full p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                      />
                    </div>
                  )}
                </div>

                {/* Q13 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    13. Who/What influenced your decision to choose MIOT? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {['Newspaper', 'Magazine', 'Television', 'Radio', 'Newspaper Inserts', 'Apartment posters', 'Neighbourhood', 'Friends', 'Relatives', 'Colleague', 'Outdoor Hoardings/ Bus Shelters', 'Corporate tie-up', 'Theatre Ads', 'Outreach clinics', 'Referred by Doctor', 'Treating Doctor', 'Emergency', 'Digital (Website/Google/Social Media)', 'Brand Name', 'Others'].map(option => {
                      const isSelected = formData.whatInfluenced === option;
                      return (
                        <label 
                          key={option} 
                          className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-teal-600 bg-teal-50' 
                              : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'border-teal-600' : 'border-slate-400'
                          }`}>
                            {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-teal-600" />}
                          </div>
                          <input
                            type="radio"
                            name="whatInfluenced"
                            checked={isSelected}
                            onChange={() => handleRadioChange('whatInfluenced', option)}
                            className="hidden"
                          />
                          <span className={`text-sm font-medium ${isSelected ? 'text-teal-900' : 'text-slate-700'}`}>
                            {option}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {formData.whatInfluenced === 'Others' && (
                    <div className="mt-4">
                      <input
                        type="text"
                        placeholder="Please specify other influence"
                        value={formData.whatInfluencedOther}
                        onChange={(e) => setFormData({...formData, whatInfluencedOther: e.target.value})}
                        className="w-full p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : currentStep === 3 ? (
            <motion.div
              key="step-3"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-6 sm:p-10 space-y-8"
            >
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">14. How do you evaluate MIOT based on your Experience?</h2>
                <p className="text-slate-600 mb-6">Rating on a scale of 1 to 5</p>
              </div>

              <CategoryRatingCard 
                title="1. Cure" 
                subPoints="Highly Qualified Doctors & experienced nurses, Infrastructure, Latest Technology & Equipment, Accuracy of diagnosis and treatment, Success rates and patient outcomes"
                value={formData.evalCure} 
                onChange={(v) => setFormData({...formData, evalCure: v})} 
              />

              <CategoryRatingCard 
                title="2. Care" 
                subPoints="Compassion of Doctor, Cleanliness and hygiene, Staff behaviour (politeness, empathy, respect), Waiting time for consultation or procedures, Ease of admission and discharge, Clear explanation of billing, Availability of insurance support"
                value={formData.evalCare} 
                onChange={(v) => setFormData({...formData, evalCare: v})} 
              />

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">2. Cost</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {['Exorbitant', 'Higher side', 'Industry standards', 'Moderate', 'Low'].map(option => (
                    <label 
                      key={option} 
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.evalCost === option 
                          ? 'border-teal-600 bg-teal-50' 
                          : 'border-slate-200 hover:border-teal-300 hover:bg-white bg-white'
                      }`}
                    >
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        formData.evalCost === option ? 'border-teal-600' : 'border-slate-400'
                      }`}>
                        {formData.evalCost === option && <div className="h-2.5 w-2.5 rounded-full bg-teal-600" />}
                      </div>
                      <input
                        type="radio"
                        name="evalCost"
                        value={option}
                        checked={formData.evalCost === option}
                        onChange={(e) => setFormData({...formData, evalCost: e.target.value})}
                        className="hidden"
                      />
                      <span className={`font-medium text-sm ${formData.evalCost === option ? 'text-teal-900' : 'text-slate-700'}`}>
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <CategoryRatingCard 
                title="3. Communication" 
                subPoints="Doctors explaining conditions clearly, Staff responsiveness to questions, Transparency about treatment options, costs and risks"
                value={formData.evalComm} 
                onChange={(v) => setFormData({...formData, evalComm: v})} 
              />

              <CategoryRatingCard 
                title="4. Comfort" 
                subPoints="Spacious waiting areas/ rooms, Clean and neat Rooms, Other Services, No hospital feel, Balanced diet & Hygienic food"
                value={formData.evalComfort} 
                onChange={(v) => setFormData({...formData, evalComfort: v})} 
              />

              <CategoryRatingCard 
                title="5. Convenience" 
                subPoints="Within Heart of the city, Near to residence, Easy Mobility, Ambulance service, Parking facilities"
                value={formData.evalConv} 
                onChange={(v) => setFormData({...formData, evalConv: v})} 
              />

            </motion.div>
          ) : (
            <motion.div
              key="step-4"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-6 sm:p-10 space-y-10"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Final Questions</h2>
              
              <div className="space-y-8">
                {/* Q15 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    15. What specialities do you associate with MIOT? (Select up to 5) <span className="text-red-500">*</span>
                  </label>
                  <Select
                    isMulti
                    options={departments.map(d => ({ label: d, value: d }))}
                    value={formData.specialitiesAssociated.map(s => ({ label: s, value: s }))}
                    onChange={(options) => {
                      if (options.length <= 5) {
                        setFormData({...formData, specialitiesAssociated: options.map(o => o.value)});
                      }
                    }}
                    placeholder="Select departments..."
                    className="text-sm"
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        borderRadius: '0.75rem',
                        borderColor: '#cbd5e1',
                        padding: '0.5rem',
                        '&:hover': { borderColor: '#14b8a6' },
                        boxShadow: 'none',
                      }),
                    }}
                  />
                </div>

                {/* Q16 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    16. I will return to MIOT for further treatment: <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4 mb-6">
                    {['Yes', 'No'].map(option => (
                      <label 
                        key={option} 
                        className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.willReturn === option 
                            ? 'border-teal-600 bg-teal-50' 
                            : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          formData.willReturn === option ? 'border-teal-600' : 'border-slate-400'
                        }`}>
                          {formData.willReturn === option && <div className="h-2.5 w-2.5 rounded-full bg-teal-600" />}
                        </div>
                        <input
                          type="radio"
                          name="willReturn"
                          value={option}
                          checked={formData.willReturn === option}
                          onChange={(e) => setFormData({...formData, willReturn: e.target.value as 'Yes' | 'No'})}
                          className="hidden"
                        />
                        <span className={`font-bold text-lg ${formData.willReturn === option ? 'text-teal-900' : 'text-slate-700'}`}>
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>

                  {formData.willReturn === 'Yes' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 bg-teal-50/50 p-6 rounded-2xl border border-teal-100"
                    >
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        If YES, because of: <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          'Treating Doctors',
                          'Treatment Outcome',
                          'Hassle free experience from appointment booking to consultation/discharge',
                          'Transparency in treatment, bills, etc',
                          'Responsible & Experienced support staff',
                          'Others, if any'
                        ].map(option => {
                          const isSelected = formData.returnYesReasons.includes(option);
                          return (
                            <label 
                              key={option} 
                              className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all bg-white ${
                                isSelected 
                                  ? 'border-teal-600 bg-teal-50' 
                                  : 'border-slate-200 hover:border-teal-300'
                              }`}
                            >
                              <div className={`mt-0.5 h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-teal-600 border-teal-600' : 'border-slate-400 bg-white'
                              }`}>
                                {isSelected && <Check className="h-4 w-4 text-white" />}
                              </div>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleCheckboxChange('returnYesReasons', option)}
                                className="hidden"
                              />
                              <span className={`text-sm font-medium ${isSelected ? 'text-teal-900' : 'text-slate-700'}`}>
                                {option}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {formData.returnYesReasons.includes('Others, if any') && (
                        <div className="mt-4">
                          <input
                            type="text"
                            placeholder="Please specify other reason"
                            value={formData.returnYesOther}
                            onChange={(e) => setFormData({...formData, returnYesOther: e.target.value})}
                            className="w-full p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-white"
                          />
                        </div>
                      )}
                    </motion.div>
                  )}

                  {formData.willReturn === 'No' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4"
                    >
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        If NO, please specify: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Please specify why you will not return"
                        value={formData.returnNoReason}
                        onChange={(e) => setFormData({...formData, returnNoReason: e.target.value})}
                        className="w-full p-4 text-lg border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 0 || isSubmitting}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
            currentStep === 0 || isSubmitting
              ? 'text-slate-300 cursor-not-allowed' 
              : 'text-slate-600 hover:bg-slate-200 bg-slate-100'
          }`}
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        <button
          onClick={nextStep}
          disabled={isSubmitting}
          className={`flex items-center gap-2 px-8 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 shadow-sm transition-all hover:scale-105 active:scale-95 ${
            isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Submitting...' : currentStep === totalSteps - 1 ? 'Submit Survey' : 'Next'}
          {!isSubmitting && currentStep !== totalSteps - 1 && <ArrowRight className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
