import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, Users, Award, ChevronDown, MoreVertical, Save, Clock, Trash2, Plus, Image, Copy, HelpCircle } from 'lucide-react';
import { Button } from './Button';
import { getAvailableGroups, getAllStudents, getStudentsByGroup, UserData } from '../../services/userService';

interface QuizAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className?: string;
  onSave?: (quiz: QuizData) => void;
  initialData?: QuizData & { id?: string };
  isEdit?: boolean;
  availableClasses?: { id: string; title: string; subject?: string }[];
}

export interface Question {
  id: string;
  title: string;
  description: string;
  type: 'short-answer' | 'paragraph' | 'multiple-choice' | 'checkboxes' | 'dropdown' | 'file-upload' | 'linear-scale' | 'rating';
  options?: string[];
  required: boolean;
  points: number;
  correctAnswer?: string | string[];
  order?: number;
}

export interface QuizData {
  title: string;
  description: string;
  points?: number;
  dueDate?: string;
  dueTime?: string;
  topic?: string;
  assignTo: 'all' | 'groups' | 'students';
  selectedGroups?: string[];
  selectedStudents?: string[];
  questions: Question[];
}

export const QuizAssignmentModal: React.FC<QuizAssignmentModalProps> = ({
  isOpen,
  onClose,
  classId,
  className = '',
  onSave,
  initialData,
  isEdit = false,
  availableClasses = []
}) => {
  const [currentClassId, setCurrentClassId] = useState(classId);
  const [currentClassName, setCurrentClassName] = useState(className);
  const [showClassSelector, setShowClassSelector] = useState(false);

  const [formData, setFormData] = useState<QuizData>({
    title: 'Blank Quiz',
    description: '',
    points: undefined,
    dueDate: undefined,
    dueTime: undefined,
    topic: 'No topic',
    assignTo: 'all',
    selectedGroups: [],
    selectedStudents: [],
    questions: []
  });
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const [topicMenuOpen, setTopicMenuOpen] = useState(false);
  const [assignToMenuOpen, setAssignToMenuOpen] = useState(false);
  const [questionTypeMenuOpen, setQuestionTypeMenuOpen] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [availableStudents, setAvailableStudents] = useState<UserData[]>([]);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [showStudentSelector, setShowStudentSelector] = useState(false);

  // Load groups and students
  const loadGroupsAndStudents = async () => {
    try {
      const groups = await getAvailableGroups();
      setAvailableGroups(groups);
      const students = await getAllStudents();
      setAvailableStudents(students);
    } catch (error) {
      console.error('Error loading groups and students:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentClassId(classId);
      setCurrentClassName(className);

      if (classId) {
        loadGroupsAndStudents(); // Ideally pass currentClassId but keeping generic for now or update signatures
      }

      if (initialData) {
        // Load initial data when editing
        setFormData({
          title: initialData.title || 'Blank Quiz',
          description: initialData.description || '',
          points: initialData.points,
          dueDate: initialData.dueDate,
          dueTime: initialData.dueTime,
          topic: initialData.topic || 'No topic',
          assignTo: initialData.assignTo || 'all',
          selectedGroups: initialData.selectedGroups || [],
          selectedStudents: initialData.selectedStudents || [],
          questions: initialData.questions || []
        });
      } else {
        // Reset form when creating new
        setFormData({
          title: 'Blank Quiz',
          description: '',
          points: undefined,
          dueDate: undefined,
          dueTime: undefined,
          topic: 'No topic',
          assignTo: 'all',
          selectedGroups: [],
          selectedStudents: [],
          questions: []
        });
      }
      setErrors({});
      setErrors({});
      setShowGroupSelector(false);
      setShowStudentSelector(false);
      setShowClassSelector(false);
    }
  }, [isOpen, initialData, classId]);

  useEffect(() => {
    if (availableClasses.length > 0 && currentClassId) {
      const cls = availableClasses.find(c => c.id === currentClassId);
      if (cls) setCurrentClassName(cls.title);
    }
  }, [currentClassId, availableClasses]);

  const handleInputChange = (field: keyof QuizData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  };

  const toggleGroup = (group: string) => {
    setFormData(prev => {
      const currentGroups = prev.selectedGroups || [];
      if (currentGroups.includes(group)) {
        return { ...prev, selectedGroups: currentGroups.filter(g => g !== group) };
      } else {
        return { ...prev, selectedGroups: [...currentGroups, group] };
      }
    });
  };

  const toggleStudent = (studentId: string) => {
    setFormData(prev => {
      const currentStudents = prev.selectedStudents || [];
      if (currentStudents.includes(studentId)) {
        return { ...prev, selectedStudents: currentStudents.filter(id => id !== studentId) };
      } else {
        return { ...prev, selectedStudents: [...currentStudents, studentId] };
      }
    });
  };

  const handleQuestionChange = (questionId: string, field: keyof Question, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.id === questionId ? { ...q, [field]: value } : q
      )
    }));
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `question_${Date.now()}`,
      title: 'Untitled Question',
      description: '',
      type: 'multiple-choice',
      options: ['Option 1'],
      required: true,
      points: 0
    };
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const removeQuestion = (questionId: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const duplicateQuestion = (questionId: string) => {
    const question = formData.questions.find(q => q.id === questionId);
    if (question) {
      const newQuestion: Question = {
        ...question,
        id: `question_${Date.now()}`,
        title: `${question.title} (Copy)`
      };
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, newQuestion]
      }));
    }
  };

  const addOption = (questionId: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId) {
          const optionNumber = (q.options?.length || 0) + 1;
          return {
            ...q,
            options: [...(q.options || []), `Option ${optionNumber}`]
          };
        }
        return q;
      })
    }));
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId && q.options) {
          return {
            ...q,
            options: q.options.filter((_, idx) => idx !== optionIndex)
          };
        }
        return q;
      })
    }));
  };

  const handleAssign = () => {
    console.log('👆 [QuizAssignmentModal] Assign button clicked', formData);
    if (!formData.title.trim()) {
      setErrors({ title: 'Title is required' });
      return;
    }

    if (onSave) {
      console.log('📞 [QuizAssignmentModal] Calling onSave with:', { ...formData, classId: currentClassId });
      onSave({ ...formData, classId: currentClassId } as any);
    } else {
      console.warn('⚠️ [QuizAssignmentModal] onSave prop is missing!');
    }
    onClose();
  };

  const handleSaveDraft = () => {
    console.log('Saving draft:', formData);
    setSaveMenuOpen(false);
  };

  const handleDiscardDraft = () => {
    if (confirm('Are you sure you want to discard this draft?')) {
      setFormData({
        title: 'Blank Quiz',
        description: '',
        points: undefined,
        dueDate: undefined,
        dueTime: undefined,
        topic: 'No topic',
        assignTo: 'all',
        selectedStudents: [],
        questions: []
      });
      setSaveMenuOpen(false);
      onClose();
    }
  };

  const questionTypes = [
    { value: 'short-answer', label: 'Short answer' },
    { value: 'paragraph', label: 'Paragraph' },
    { value: 'multiple-choice', label: 'Multiple choice' },
    { value: 'checkboxes', label: 'Checkboxes' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'file-upload', label: 'File upload' },
    { value: 'linear-scale', label: 'Linear scale' },
    { value: 'rating', label: 'Rating' }
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative my-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-modal-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full">
              <FileText className="w-6 h-6 text-gray-600" />
            </div>
            <h2 id="quiz-modal-title" className="text-2xl font-medium text-gray-900">
              Quiz assignment
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Save options menu */}
            <div className="relative">
              <button
                onClick={() => setSaveMenuOpen(!saveMenuOpen)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Save options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {saveMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setSaveMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 top-10 z-20 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[180px]">
                    <button
                      onClick={handleAssign}
                      className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Assign
                    </button>
                    <button
                      onClick={() => setSaveMenuOpen(false)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Schedule
                    </button>
                    <button
                      onClick={handleSaveDraft}
                      className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save draft
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleDiscardDraft}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Discard draft
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* For - Class selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">For</label>
            {availableClasses.length > 0 ? (
              <div className="relative">
                <button
                  onClick={() => setShowClassSelector(!showClassSelector)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-left flex items-center justify-between bg-white hover:bg-gray-50"
                >
                  <span className={currentClassId ? 'text-gray-900' : 'text-gray-500'}>
                    {currentClassName || 'Select class'}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showClassSelector ? 'rotate-180' : ''}`} />
                </button>
                {showClassSelector && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowClassSelector(false)}
                    ></div>
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {availableClasses.map(cls => (
                        <button
                          key={cls.id}
                          onClick={() => {
                            setCurrentClassId(cls.id);
                            setCurrentClassName(cls.title + (cls.subject ? ` (${cls.subject})` : ''));
                            setShowClassSelector(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-900"
                        >
                          {cls.title}
                          {cls.subject && <span className="text-gray-500 ml-2">({cls.subject})</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg px-4 py-2 bg-gray-50">
                <span className="text-gray-700">{className || 'Select class'}</span>
              </div>
            )}
          </div>

          {/* Assign to */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign to</label>
            <div className="relative">
              <button
                onClick={() => setAssignToMenuOpen(!assignToMenuOpen)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-left flex items-center justify-between bg-white hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">
                    {formData.assignTo === 'all'
                      ? 'All students'
                      : formData.assignTo === 'groups'
                        ? 'Groups'
                        : 'Selected students'}
                  </span>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>
              {assignToMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setAssignToMenuOpen(false)}
                  ></div>
                  <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                    <button
                      onClick={() => {
                        handleInputChange('assignTo', 'all');
                        handleInputChange('selectedGroups', []);
                        handleInputChange('selectedStudents', []);
                        setAssignToMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                    >
                      All students
                    </button>
                    <button
                      onClick={() => {
                        handleInputChange('assignTo', 'groups');
                        handleInputChange('selectedStudents', []);
                        setAssignToMenuOpen(false);
                        setShowGroupSelector(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                    >
                      Groups
                    </button>
                    <button
                      onClick={() => {
                        handleInputChange('assignTo', 'students');
                        handleInputChange('selectedGroups', []);
                        setAssignToMenuOpen(false);
                        setShowStudentSelector(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                    >
                      Selected students
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Group selector */}
            {formData.assignTo === 'groups' && (
              <div className="mt-3 border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Select groups</span>
                  <button
                    onClick={() => setShowGroupSelector(!showGroupSelector)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {showGroupSelector ? 'Hide' : 'Show'} groups
                  </button>
                </div>
                {showGroupSelector && (
                  <div className="space-y-2">
                    {availableGroups.map((group) => (
                      <label
                        key={group}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedGroups?.includes(group) || false}
                          onChange={() => toggleGroup(group)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{group}</span>
                      </label>
                    ))}
                    {availableGroups.length === 0 && (
                      <p className="text-sm text-gray-500">No groups available</p>
                    )}
                  </div>
                )}
                {formData.selectedGroups && formData.selectedGroups.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Selected groups:</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.selectedGroups.map((group) => (
                        <span
                          key={group}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {group}
                          <button
                            onClick={() => toggleGroup(group)}
                            className="hover:text-blue-900"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Student selector */}
            {formData.assignTo === 'students' && (
              <div className="mt-3 border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Select students</span>
                  <button
                    onClick={() => setShowStudentSelector(!showStudentSelector)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {showStudentSelector ? 'Hide' : 'Show'} students
                  </button>
                </div>
                {showStudentSelector && (
                  <div className="space-y-2">
                    {availableStudents.map((student) => (
                      <label
                        key={student.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedStudents?.includes(student.id) || false}
                          onChange={() => toggleStudent(student.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {student.firstName} {student.lastName}
                          {student.grupoAsignado && (
                            <span className="text-xs text-gray-500 ml-1">({student.grupoAsignado})</span>
                          )}
                        </span>
                      </label>
                    ))}
                    {availableStudents.length === 0 && (
                      <p className="text-sm text-gray-500">No students available</p>
                    )}
                  </div>
                )}
                {formData.selectedStudents && formData.selectedStudents.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Selected students:</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.selectedStudents
                        .map((studentId) => {
                          const student = availableStudents.find(s => s.id === studentId);
                          return student ? (
                            <span
                              key={studentId}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                            >
                              {student.firstName} {student.lastName}
                              <button
                                onClick={() => toggleStudent(studentId)}
                                className="hover:text-green-900"
                              >
                                ×
                              </button>
                            </span>
                          ) : null;
                        })
                        .filter(Boolean)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quiz Title */}
          <div>
            <label htmlFor="quizTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Form title
            </label>
            <input
              type="text"
              id="quizTitle"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Blank Quiz"
            />
          </div>

          {/* Quiz Description */}
          <div>
            <label htmlFor="quizDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Form description
            </label>
            <textarea
              id="quizDescription"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Add a description for your quiz..."
            />
          </div>

          {/* Questions Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Section 1 of 1
              </h3>
              <button
                onClick={addQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add question
              </button>
            </div>

            {formData.questions.length === 0 ? (
              <div key="no-questions" className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No questions yet</p>
                <button
                  onClick={addQuestion}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add your first question
                </button>
              </div>
            ) : (
              <div key="questions-list" className="space-y-6">
                {formData.questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    {/* Question Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-500">Question {index + 1}</span>
                          <span className="text-red-500">*</span>
                        </div>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={question.title}
                          onChange={(e) => handleQuestionChange(question.id, 'title', e.target.value)}
                          placeholder="Untitled Question"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => duplicateQuestion(question.id)}
                          className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                          title="Duplicate question"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeQuestion(question.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question Type */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Type
                      </label>
                      <div className="relative">
                        <button
                          onClick={() => setQuestionTypeMenuOpen(prev => ({ ...prev, [question.id]: !prev[question.id] }))}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-left flex items-center justify-between bg-white hover:bg-gray-50"
                        >
                          <span className="text-gray-700">
                            {questionTypes.find(t => t.value === question.type)?.label || 'Multiple choice'}
                          </span>
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        </button>
                        {questionTypeMenuOpen[question.id] && (
                          <React.Fragment key={`menu-${question.id}`}>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setQuestionTypeMenuOpen(prev => ({ ...prev, [question.id]: false }))}
                            ></div>
                            <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                              {questionTypes.map(type => (
                                <button
                                  key={type.value}
                                  onClick={() => {
                                    handleQuestionChange(question.id, 'type', type.value);
                                    setQuestionTypeMenuOpen(prev => ({ ...prev, [question.id]: false }));
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                                >
                                  {type.label}
                                </button>
                              ))}
                            </div>
                          </React.Fragment>
                        )}
                      </div>
                    </div>

                    {/* Question Description */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        value={question.description}
                        onChange={(e) => handleQuestionChange(question.id, 'description', e.target.value)}
                        placeholder="Add description (optional)"
                      />
                    </div>

                    {/* Options for multiple choice, checkboxes, dropdown */}
                    {(question.type === 'multiple-choice' || question.type === 'checkboxes' || question.type === 'dropdown') && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Options
                        </label>
                        <div className="space-y-2">
                          {question.options?.map((option, optIndex) => (
                            <div key={`${question.id}-option-${optIndex}`} className="flex items-center gap-2">
                              <div className="flex-1 flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border-2 border-gray-400"></div>
                                <input
                                  type="text"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...(question.options || [])];
                                    newOptions[optIndex] = e.target.value;
                                    handleQuestionChange(question.id, 'options', newOptions);
                                  }}
                                  placeholder={`Option ${optIndex + 1}`}
                                />
                              </div>
                              {question.options && question.options.length > 1 && (
                                <button
                                  onClick={() => removeOption(question.id, optIndex)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => addOption(question.id)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            Add option
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Question Settings */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) => handleQuestionChange(question.id, 'required', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Required</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-700">Points:</label>
                          <input
                            type="number"
                            min="0"
                            className="w-20 px-2 py-1 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={question.points}
                            onChange={(e) => handleQuestionChange(question.id, 'points', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      <button
                        className="flex items-center gap-2 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        title="Answer key"
                      >
                        <Award className="w-4 h-4" />
                        Answer key
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Points, Due, Topic */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            {/* Points */}
            <div className="hidden">
              <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-1">
                Points
              </label>
              <input
                type="number"
                id="points"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.points || ''}
                onChange={(e) => handleInputChange('points', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="100"
              />
            </div>

            {/* Due */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  id="dueDate"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.dueDate || ''}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                />
                <input
                  type="time"
                  id="dueTime"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hidden"
                  value={formData.dueTime || ''}
                  onChange={(e) => handleInputChange('dueTime', e.target.value)}
                />
              </div>
            </div>

            {/* Topic */}
            <div className="hidden">
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
              <div className="relative">
                <button
                  onClick={() => setTopicMenuOpen(!topicMenuOpen)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-left flex items-center justify-between bg-white hover:bg-gray-50"
                >
                  <span className="text-gray-700">{formData.topic || 'No topic'}</span>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </button>
                {topicMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setTopicMenuOpen(false)}
                    ></div>
                    <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                      <button
                        onClick={() => {
                          handleInputChange('topic', 'No topic');
                          setTopicMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                      >
                        No topic
                      </button>
                      <button
                        onClick={() => {
                          // TODO: Open create topic modal
                          setTopicMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                      >
                        Create topic
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!formData.title.trim()}>
            Assign
          </Button>
        </div>
      </div>
    </div>
  );
};


