import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { saveSurvey, Survey, Question, QuestionType } from '../store';
import { useSurveys } from '../hooks/useFirestore';
import { generateSurveyFromText, generateSurveyFromFile } from '../lib/gemini';
import { Plus, Trash2, GripVertical, Upload, Sparkles, Loader2, Eye, X } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableQuestionProps {
  key?: React.Key;
  q: Question;
  qIndex: number;
  handleUpdateQuestion: (index: number, updates: Partial<Question>) => void;
  handleDeleteQuestion: (index: number) => void;
  handleAddOption: (index: number) => void;
  handleUpdateOption: (qIndex: number, oIndex: number, value: string) => void;
  handleDeleteOption: (qIndex: number, oIndex: number) => void;
}

function SortableQuestion({ 
  q, 
  qIndex, 
  handleUpdateQuestion, 
  handleDeleteQuestion, 
  handleAddOption, 
  handleUpdateOption, 
  handleDeleteOption 
}: SortableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: q.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 group relative">
      <div 
        {...attributes} 
        {...listeners} 
        className="pt-3 text-slate-400 cursor-grab active:cursor-grabbing hidden sm:block focus:outline-none"
      >
        <GripVertical className="h-5 w-5" />
      </div>
      
      <div className="flex-1 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex items-start gap-2">
            <div 
              {...attributes} 
              {...listeners} 
              className="pt-3 text-slate-400 cursor-grab active:cursor-grabbing sm:hidden focus:outline-none"
            >
              <GripVertical className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={q.text}
              onChange={(e) => handleUpdateQuestion(qIndex, { text: e.target.value })}
              placeholder="Question text"
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none font-medium"
            />
          </div>
          <div className="w-full sm:w-48 shrink-0">
            <select
              value={q.type}
              onChange={(e) => handleUpdateQuestion(qIndex, { type: e.target.value as QuestionType })}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
            >
              <option value="text">Text Answer</option>
              <option value="rating">1-5 Rating</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="checkbox">Checkboxes</option>
              <option value="date">Date</option>
              <option value="time">Time</option>
              <option value="file_upload">File Upload</option>
            </select>
          </div>
        </div>

        {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
          <div className="space-y-2 pl-4 border-l-2 border-slate-100">
            {(q.options || []).map((opt, oIndex) => (
              <div key={oIndex} className="flex items-center gap-2">
                <div className={`h-4 w-4 border border-slate-300 ${q.type === 'multiple_choice' ? 'rounded-full' : 'rounded-sm'}`} />
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleUpdateOption(qIndex, oIndex, e.target.value)}
                  className="flex-1 p-2 border-b border-slate-200 focus:border-teal-500 outline-none bg-transparent"
                />
                <button
                  onClick={() => handleDeleteOption(qIndex, oIndex)}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => handleAddOption(qIndex)}
              className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1 mt-2"
            >
              <Plus className="h-4 w-4" /> Add Option
            </button>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={q.required}
              onChange={(e) => handleUpdateQuestion(qIndex, { required: e.target.checked })}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 rounded"
            />
            <span className="text-sm font-medium text-slate-700">Required</span>
          </label>
          
          <button
            onClick={() => handleDeleteQuestion(qIndex)}
            className="text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1 text-sm font-medium"
          >
            <Trash2 className="h-4 w-4" /> Delete Question
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreateSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { surveys } = useSurveys();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((q) => q.id === active.id);
        const newIndex = items.findIndex((q) => q.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    if (id && surveys.length > 0) {
      const existing = surveys.find(s => s.id === id);
      if (existing) {
        setTitle(existing.title);
        setDescription(existing.description);
        setQuestions(existing.questions);
      }
    }
  }, [id, surveys]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { id: `q_${Date.now()}`, text: '', type: 'text', required: false }
    ]);
  };

  const handleUpdateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleAddOption = (qIndex: number) => {
    const q = questions[qIndex];
    handleUpdateQuestion(qIndex, { options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] });
  };

  const handleUpdateOption = (qIndex: number, oIndex: number, value: string) => {
    const q = questions[qIndex];
    const newOptions = [...(q.options || [])];
    newOptions[oIndex] = value;
    handleUpdateQuestion(qIndex, { options: newOptions });
  };

  const handleDeleteOption = (qIndex: number, oIndex: number) => {
    const q = questions[qIndex];
    const newOptions = (q.options || []).filter((_, i) => i !== oIndex);
    handleUpdateQuestion(qIndex, { options: newOptions });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsGenerating(true);
    setError('');

    try {
      const reader = new FileReader();
      
      reader.onerror = () => {
        setError('Failed to read the file.');
        setIsGenerating(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };

      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        reader.onload = async (event) => {
          try {
            const base64String = (event.target?.result as string).split(',')[1];
            const generated = await generateSurveyFromFile(base64String, file.type);
            
            setTitle(generated.title);
            setDescription(generated.description);
            setQuestions(generated.questions.map((q, i) => ({ ...q, id: `q_gen_${Date.now()}_${i}` })));
          } catch (err: any) {
            const errorMsg = err?.message || 'Failed to generate survey from file. Please ensure the file is valid and try again.';
            setError(errorMsg.includes('GEMINI_API_KEY') ? 'API Key missing: Please add GEMINI_API_KEY to Vercel and redeploy.' : errorMsg);
            console.error(err);
          } finally {
            setIsGenerating(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('text/') || file.type === 'application/json' || file.name.endsWith('.csv') || file.name.endsWith('.md')) {
        reader.onload = async (event) => {
          try {
            const text = event.target?.result as string;
            const generated = await generateSurveyFromText(text);
            
            setTitle(generated.title);
            setDescription(generated.description);
            setQuestions(generated.questions.map((q, i) => ({ ...q, id: `q_gen_${Date.now()}_${i}` })));
          } catch (err: any) {
            const errorMsg = err?.message || 'Failed to generate survey from document. Please try a plain text file or enter manually.';
            setError(errorMsg.includes('GEMINI_API_KEY') ? 'API Key missing: Please add GEMINI_API_KEY to Vercel and redeploy.' : errorMsg);
            console.error(err);
          } finally {
            setIsGenerating(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        };
        reader.readAsText(file);
      } else {
        setError('Unsupported file type. Please upload a PDF, Image, or Text file (.txt, .csv, .md). Word documents (.docx) are not supported directly.');
        setIsGenerating(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (err) {
      setError('An unexpected error occurred while processing the file.');
      setIsGenerating(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!title) {
      setError('Please enter a survey title.');
      return;
    }
    if (questions.length === 0) {
      setError('Please add at least one question.');
      return;
    }

    const survey: Survey = {
      id: id || `s_${Date.now()}`,
      title,
      description,
      questions,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    try {
      await saveSurvey(survey);
      navigate('/admin/surveys', { state: { message: 'Survey saved successfully!' } });
    } catch (err) {
      setError('Failed to save survey. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{id ? 'Edit Survey' : 'Create New Survey'}</h1>
          <p className="text-slate-600 mt-1">Design your survey manually or use AI to generate from a document.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsPreview(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-teal-600 font-medium bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button
            onClick={() => navigate('/admin/surveys')}
            className="flex-1 sm:flex-none px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 sm:flex-none px-6 py-2 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors"
          >
            Save Survey
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex-1 w-full space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Survey Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Patient Satisfaction Survey"
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the purpose of this survey..."
                rows={3}
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
          </div>

          <div className="w-full md:w-72 bg-slate-50 p-5 rounded-xl border border-slate-200 shrink-0">
            <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              AI Generation
            </h3>
            <p className="text-sm text-slate-600 mb-4">Upload a document (.txt, .md, .pdf) containing hospital guidelines or topics to automatically generate a survey.</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".txt,.md,.csv,.pdf" 
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isGenerating ? 'Generating...' : 'Upload Document'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Questions</h2>
        
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={questions.map(q => q.id)}
            strategy={verticalListSortingStrategy}
          >
            {questions.map((q, qIndex) => (
              <SortableQuestion 
                key={q.id}
                q={q}
                qIndex={qIndex}
                handleUpdateQuestion={handleUpdateQuestion}
                handleDeleteQuestion={handleDeleteQuestion}
                handleAddOption={handleAddOption}
                handleUpdateOption={handleUpdateOption}
                handleDeleteOption={handleDeleteOption}
              />
            ))}
          </SortableContext>
        </DndContext>

        <button
          onClick={handleAddQuestion}
          className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-medium hover:border-teal-500 hover:text-teal-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Question
        </button>
      </div>

      {isPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-50 w-full max-w-3xl rounded-3xl shadow-xl overflow-hidden my-8">
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Eye className="h-5 w-5 text-teal-600" />
                Survey Preview
              </h2>
              <button
                onClick={() => setIsPreview(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 sm:p-8 space-y-8">
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{title || 'Untitled Survey'}</h1>
                <p className="text-slate-600 text-lg">{description || 'No description provided.'}</p>
              </div>

              <div className="space-y-8 pointer-events-none opacity-90">
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Your Details</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Place / City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your city or location"
                      className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50"
                      readOnly
                    />
                  </div>
                </div>

                {questions.map((q, index) => (
                  <div key={q.id} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
                    <label className="block text-lg font-medium text-slate-900 mb-4">
                      {index + 1}. {q.text || 'Untitled Question'}
                      {q.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {q.type === 'text' && (
                      <textarea
                        className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50"
                        rows={4}
                        placeholder="Type your answer here..."
                        readOnly
                      />
                    )}

                    {q.type === 'rating' && (
                      <div className="flex flex-wrap gap-2 sm:gap-4">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button
                            key={rating}
                            type="button"
                            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full font-bold text-base sm:text-lg transition-all bg-slate-100 text-slate-600"
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.type === 'multiple_choice' && (
                      <div className="space-y-3">
                        {q.options?.map(option => (
                          <label key={option} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200">
                            <input
                              type="radio"
                              disabled
                              className="h-5 w-5 text-teal-600"
                            />
                            <span className="text-slate-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === 'checkbox' && (
                      <div className="space-y-3">
                        {q.options?.map(option => (
                          <label key={option} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200">
                            <input
                              type="checkbox"
                              disabled
                              className="h-5 w-5 text-teal-600 rounded"
                            />
                            <span className="text-slate-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === 'date' && (
                      <input
                        type="date"
                        className="w-full sm:w-auto p-3 border border-slate-300 rounded-xl bg-slate-50"
                        disabled
                      />
                    )}

                    {q.type === 'time' && (
                      <input
                        type="time"
                        className="w-full sm:w-auto p-3 border border-slate-300 rounded-xl bg-slate-50"
                        disabled
                      />
                    )}

                    {q.type === 'file_upload' && (
                      <div className="p-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-slate-500">
                        <Upload className="h-8 w-8 mb-2 text-slate-400" />
                        <p className="text-sm font-medium">Click or drag file to upload</p>
                        <p className="text-xs mt-1">Maximum file size: 10MB</p>
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    disabled
                    className="px-8 py-3 bg-teal-600/50 text-white font-semibold rounded-xl"
                  >
                    Submit Survey
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
