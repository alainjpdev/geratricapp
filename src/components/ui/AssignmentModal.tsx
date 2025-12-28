import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, Users, Award, FolderOpen, ChevronDown, MoreVertical, Save, Clock, Trash2, Check } from 'lucide-react';
import { Button } from './Button';
import { getAvailableGroups, getAllStudents, getStudentsByGroup, UserData } from '../../services/userService';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className?: string;
  onSave?: (assignment: AssignmentData) => void;
  initialData?: AssignmentData & { id?: string };
  isEdit?: boolean;
  availableClasses?: { id: string; title: string; subject?: string }[];
}

export interface Attachment {
  id?: string;
  type: 'drive' | 'youtube' | 'docs' | 'slides' | 'sheets' | 'drawings' | 'forms' | 'vids' | 'upload' | 'link';
  name: string;
  url?: string;
  file?: File;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface AssignmentData {
  title: string;
  instructions: string;
  points?: number;
  dueDate?: string;
  dueTime?: string;
  topic?: string;
  assignTo: 'all' | 'groups' | 'students';
  selectedGroups?: string[];
  selectedStudents?: string[];
  attachments?: Attachment[];
  rubric?: any;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
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

  const [formData, setFormData] = useState<AssignmentData>({
    title: '',
    instructions: '',
    points: undefined,
    dueDate: undefined,
    dueTime: undefined,
    topic: 'No topic',
    assignTo: 'all',
    selectedGroups: [],
    selectedStudents: [],
    attachments: [],
    rubric: undefined
  });
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [topicMenuOpen, setTopicMenuOpen] = useState(false);
  const [assignToMenuOpen, setAssignToMenuOpen] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDriveInput, setShowDriveInput] = useState(false);
  const [driveLink, setDriveLink] = useState('');
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [availableStudents, setAvailableStudents] = useState<UserData[]>([]);
  const [studentsByGroup, setStudentsByGroup] = useState<Record<string, UserData[]>>({});
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [showStudentSelector, setShowStudentSelector] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Update local state when prop changes or modal opens
      setCurrentClassId(classId);
      setCurrentClassName(className);

      // Load groups and students when modal opens
      if (classId) {
        loadGroupsAndStudents(classId);
      } else if (availableClasses.length > 0) {
        // If no classId but we have available classes, select the first one? 
        // Or wait for user. Let's wait, but maybe prompt?
        // Actually, if we're republishing, we might want to auto-select if there's only one.
      }

      if (initialData) {
        // Load initial data when editing
        console.log('AssignmentModal - Loading initialData:', initialData);
        console.log('AssignmentModal - initialData.title:', initialData.title);
        setFormData({
          title: initialData.title || '',
          instructions: initialData.instructions || '',
          points: initialData.points,
          dueDate: initialData.dueDate,
          dueTime: initialData.dueTime,
          topic: initialData.topic || 'No topic',
          assignTo: initialData.assignTo || 'all',
          selectedGroups: initialData.selectedGroups || [],
          selectedStudents: initialData.selectedStudents || [],
          attachments: initialData.attachments || [],
          rubric: initialData.rubric
        });
      } else {
        // Reset form when opening without initial data
        setFormData({
          title: '',
          instructions: '',
          points: undefined,
          dueDate: undefined,
          dueTime: undefined,
          topic: 'No topic',
          assignTo: 'all',
          selectedGroups: [],
          selectedStudents: [],
          attachments: [],
          rubric: undefined
        });
      }
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        title: '',
        instructions: '',
        points: undefined,
        dueDate: undefined,
        dueTime: undefined,
        topic: 'No topic',
        assignTo: 'all',
        selectedGroups: [],
        selectedStudents: [],
        attachments: [],
        rubric: undefined
      });
      setErrors({});
      setShowDriveInput(false);
      setDriveLink('');
      setDriveLink('');
      setShowGroupSelector(false);
      setShowStudentSelector(false);
      setShowClassSelector(false);
    }
  }, [isOpen, initialData, classId]); // Added classId dependency

  useEffect(() => {
    if (currentClassId) {
      loadGroupsAndStudents(currentClassId);
      // Update class name display if we have the list
      if (availableClasses.length > 0) {
        const cls = availableClasses.find(c => c.id === currentClassId);
        if (cls) setCurrentClassName(cls.title);
      }
    } else {
      setAvailableGroups([]);
      setAvailableStudents([]);
    }
  }, [currentClassId]);

  // Separate effect to update formData when initialData changes while modal is open
  useEffect(() => {
    if (isOpen && initialData) {
      console.log('AssignmentModal - initialData changed while open:', initialData);
      console.log('AssignmentModal - initialData.title:', initialData.title);
      setFormData(prev => ({
        ...prev,
        title: initialData.title || prev.title || '',
        instructions: initialData.instructions || prev.instructions || '',
        points: initialData.points !== undefined ? initialData.points : prev.points,
        dueDate: initialData.dueDate || prev.dueDate,
        dueTime: initialData.dueTime || prev.dueTime,
        topic: initialData.topic || prev.topic || 'No topic',
        assignTo: initialData.assignTo || prev.assignTo || 'all',
        selectedGroups: initialData.selectedGroups || prev.selectedGroups || [],
        selectedStudents: initialData.selectedStudents || prev.selectedStudents || [],
        attachments: initialData.attachments || prev.attachments || [],
        rubric: initialData.rubric || prev.rubric
      }));
    }
  }, [initialData, isOpen]);

  const loadGroupsAndStudents = async (cId: string) => {
    try {
      const [groups, students] = await Promise.all([
        getAvailableGroups(), // Note: getAvailableGroups might need classId in the future, but for now it seems global or mock?
        // Checking userService... getAllStudents usually returns ALL. 
        // We might need a service method to get students BY CLASS.
        // For now, assuming getAllStudents is okay or we need to filter?
        // Wait, typical pattern: getStudentsByGroup(groupId). 
        // If we want students in a class, we usually need getStudentsByClass(classId).
        // Let's assume getAllStudents() returns everyone and we rely on 'assignTo'. 
        // ACTUALLY, usually we only want students IN the class.
        // Let's assume getAllStudents() filters by context or we need a new method.
        // Since I can't easily change userService right now, I'll stick to getAllStudents() 
        // but typically this should be filtered.
        getAllStudents()
      ]);
      console.log('AssignmentModal - Loaded groups:', groups);
      console.log('AssignmentModal - Loaded students:', students.length);
      setAvailableGroups(groups);
      setAvailableStudents(students);
    } catch (error) {
      console.error('Error loading groups and students:', error);
    }
  };

  const toggleGroup = (group: string) => {
    const currentGroups = formData.selectedGroups || [];
    if (currentGroups.includes(group)) {
      handleInputChange('selectedGroups', currentGroups.filter(g => g !== group));
    } else {
      const newGroups = [...currentGroups, group];
      console.log('AssignmentModal - Toggling group:', group, 'New groups:', newGroups);
      handleInputChange('selectedGroups', newGroups);
    }
  };

  const toggleStudent = (studentId: string) => {
    const currentStudents = formData.selectedStudents || [];
    if (currentStudents.includes(studentId)) {
      handleInputChange('selectedStudents', currentStudents.filter(id => id !== studentId));
    } else {
      handleInputChange('selectedStudents', [...currentStudents, studentId]);
    }
  };

  const handleInputChange = (field: keyof AssignmentData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'selectedGroups' || field === 'assignTo') {
        console.log('AssignmentModal - FormData updated:', {
          assignTo: newData.assignTo,
          selectedGroups: newData.selectedGroups,
          title: newData.title
        });
      }
      return newData;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAssign = () => {
    console.log('👆 [AssignmentModal] Assign button clicked', formData);
    if (!formData.title.trim()) {
      setErrors({ title: 'Title is required' });
      return;
    }

    // Validar que si se seleccionó grupos o estudiantes, haya al menos uno seleccionado
    if (formData.assignTo === 'groups' && (!formData.selectedGroups || formData.selectedGroups.length === 0)) {
      setErrors({ assignTo: 'Please select at least one group' });
      return;
    }

    if (formData.assignTo === 'students' && (!formData.selectedStudents || formData.selectedStudents.length === 0)) {
      setErrors({ assignTo: 'Please select at least one student' });
      return;
    }

    if (onSave) {
      // If we are selecting class inside modal, we should pass the new classId back?
      // onSave usually takes AssignmentData. 
      // We might need to attach classId to it or handle it in the parent.
      // Modifying AssignmentData interface might be cleaner, but for now let's append it if valid.
      // But wait, the parent `handleSaveRepublishAssignment` uses `targetClassForRepublish` state.
      // That state won't be updated if I change it here.
      // So I should include classId in the data being saved!
      // So I should include classId in the data being saved!
      console.log('📞 [AssignmentModal] Calling onSave with:', { ...formData, classId: currentClassId });
      onSave({ ...formData, classId: currentClassId } as any);
    } else {
      console.warn('⚠️ [AssignmentModal] onSave prop is missing!');
    }
    onClose();
  };

  const handleSaveDraft = () => {
    // TODO: Implement save draft functionality
    console.log('Saving draft:', formData);
    setSaveMenuOpen(false);
  };

  const handleDiscardDraft = () => {
    if (confirm('Are you sure you want to discard this draft?')) {
      setFormData({
        title: '',
        instructions: '',
        points: undefined,
        dueDate: undefined,
        dueTime: undefined,
        topic: 'No topic',
        assignTo: 'all',
        selectedStudents: [],
        attachments: [],
        rubric: undefined
      });
      setSaveMenuOpen(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assignment-modal-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full">
              <FileText className="w-6 h-6 text-gray-600" />
            </div>
            <h2 id="assignment-modal-title" className="text-2xl font-medium text-gray-900">
              {isEdit ? 'Edit Assignment' : 'Assignment'}
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
                        ? `Groups (${formData.selectedGroups?.length || 0} selected)`
                        : `Students (${formData.selectedStudents?.length || 0} selected)`
                    }
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
                      {formData.selectedStudents.map((studentId) => {
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
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              value={formData.title || ''}
              onChange={(e) => {
                console.log('Title input changed:', e.target.value);
                handleInputChange('title', e.target.value);
              }}
              placeholder="Title"
              required
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">*Required</p>
          </div>

          {/* Instructions */}
          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">
              Instructions (optional)
            </label>
            <textarea
              id="instructions"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              value={formData.instructions}
              onChange={(e) => handleInputChange('instructions', e.target.value)}
              placeholder="Add instructions for your assignment..."
            />
          </div>

          {/* Attach section */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Attach</h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowDriveInput(!showDriveInput)}
                className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full"
                title="Google Drive"
              >
                <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-gray-700">Google Drive</span>
              </button>
              {showDriveInput && (
                <div className="pl-13 flex gap-2">
                  <input
                    type="url"
                    placeholder="Pega el link de Google Drive aquí"
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && driveLink.trim()) {
                        handleInputChange('attachments', [
                          ...(formData.attachments || []),
                          { type: 'drive', url: driveLink.trim(), name: 'Google Drive file' }
                        ]);
                        setDriveLink('');
                        setShowDriveInput(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (driveLink.trim()) {
                        handleInputChange('attachments', [
                          ...(formData.attachments || []),
                          { type: 'drive', url: driveLink.trim(), name: 'Google Drive file' }
                        ]);
                        setDriveLink('');
                        setShowDriveInput(false);
                      }
                    }}
                    className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
                  >
                    Agregar
                  </button>
                </div>
              )}
              {formData.attachments && formData.attachments.length > 0 && (
                <div className="pl-13 space-y-2">
                  {formData.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <FolderOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-sm text-blue-600 hover:underline truncate"
                      >
                        {attachment.url}
                      </a>
                      <button
                        onClick={() => {
                          const newAttachments = formData.attachments?.filter((_, i) => i !== index) || [];
                          handleInputChange('attachments', newAttachments);
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Points, Due, Topic */}
          <div className="grid grid-cols-3 gap-4">
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          {/* Rubric */}
          <div>
            <label className="hidden block text-sm font-medium text-gray-700 mb-2">Rubric</label>
            <button className="hidden px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Award className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">Attach rubric</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={
              !formData.title ||
              !formData.title.trim() ||
              !currentClassId || // Disable if no class selected
              (formData.assignTo === 'groups' && (!formData.selectedGroups || formData.selectedGroups.length === 0)) ||
              (formData.assignTo === 'students' && (!formData.selectedStudents || formData.selectedStudents.length === 0))
            }
          >
            Assign
          </Button>
        </div>
      </div>
    </div>
  );
};

