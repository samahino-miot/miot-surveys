import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function TakeSurvey() {
  const navigate = useNavigate();
  
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
    whatInfluenced: [] as string[],
    whatInfluencedOther: ''
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 3;
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  const handleCheckboxChange = (field: 'howDidYouKnow' | 'whatInfluenced', value: string) => {
    setFormData(prev => {
      const current = prev[field];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
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
      if (formData.whatInfluenced.length === 0) {
        setError('Please select at least one option for what influenced your decision.');
        return;
      }
      if (formData.whatInfluenced.includes('Others') && !formData.whatInfluencedOther.trim()) {
        setError('Please specify the other influence.');
        return;
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
        surveyId: 'miot-registration-survey',
        surveyTitle: 'MIOT International Patient Registration Survey',
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
              {currentStep === 0 ? 'Patient Details' : currentStep === 1 ? 'Visit Details' : 'Consultation & Awareness'}
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
                    1. Patient Name <span className="text-red-500">*</span>
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
                    2. Attendant Name
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
                    3. Relation to patient
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
                    4. Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    placeholder="Enter age"
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    5. Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
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
                    6. Mr. No
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
                    7. City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Enter City"
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    8. State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    placeholder="Enter State"
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    9. Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    placeholder="Enter Country"
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                    onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                  />
                </div>
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    For which Department:
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    placeholder="e.g. Cardiology, Orthopedics"
                    className="w-full p-4 text-lg border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                    onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
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
                      const isSelected = formData.whatInfluenced.includes(option);
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
                            onChange={() => handleCheckboxChange('whatInfluenced', option)}
                            className="hidden"
                          />
                          <span className={`text-sm font-medium ${isSelected ? 'text-teal-900' : 'text-slate-700'}`}>
                            {option}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {formData.whatInfluenced.includes('Others') && (
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
