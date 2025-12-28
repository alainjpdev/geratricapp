import React, { useState, useEffect } from 'react';
import { X, Book, Users, ChevronDown, MoreVertical, Save, Clock, Trash2, FolderOpen, FileText } from 'lucide-react';
import { Button } from './Button';
import { getAvailableGroups, getAllStudents, UserData } from '../../services/userService';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className?: string;
  onSave?: (material: MaterialData) => void;
  initialData?: MaterialData & { id?: string };
  isEdit?: boolean;
}

export interface MaterialData {
  title: string;
  description: string;
  topic?: string;
  assignTo: 'all' | 'groups' | 'students';
  selectedGroups?: string[];
  selectedStudents?: string[];
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  type: 'drive' | 'youtube' | 'docs' | 'slides' | 'sheets' | 'drawings' | 'forms' | 'vids' | 'upload' | 'link';
  name: string;
  url?: string;
  file?: File;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
}

export const MaterialModal: React.FC<MaterialModalProps> = ({
  isOpen,
  onClose,
  classId,
  className = '',
  onSave,
  initialData,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<MaterialData>({
    title: '',
    description: '',
    topic: 'No topic',
    assignTo: 'all',
    selectedGroups: [],
    selectedStudents: [],
    attachments: []
  });
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const [topicMenuOpen, setTopicMenuOpen] = useState(false);
  const [assignToMenuOpen, setAssignToMenuOpen] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [driveLink, setDriveLink] = useState('');
  const [showDriveInput, setShowDriveInput] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [availableStudents, setAvailableStudents] = useState<UserData[]>([]);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      // Load groups and students when modal opens
      loadGroupsAndStudents();

      if (initialData) {
        // Load initial data when editing
        console.log('📝 MaterialModal - Loading initialData:', initialData);
        console.log('📝 MaterialModal - initialData.title:', initialData.title);
        setFormData({
          title: initialData.title || '',
          description: initialData.description || '',
          topic: initialData.topic || 'No topic',
          assignTo: initialData.assignTo || 'all',
          selectedGroups: initialData.selectedGroups || [],
          selectedStudents: initialData.selectedStudents || [],
          attachments: initialData.attachments || []
        });
      } else {
        // Reset form when creating new
        setFormData({
          title: '',
          description: '',
          topic: 'No topic',
          assignTo: 'all',
          selectedGroups: [],
          selectedStudents: [],
          attachments: []
        });
      }
      setDriveLink('');
      setShowDriveInput(false);
      setErrors({});
    }
  }, [isOpen, initialData]);

  const loadGroupsAndStudents = async () => {
    try {
      const [groups, students] = await Promise.all([
        getAvailableGroups(),
        getAllStudents()
      ]);
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
      handleInputChange('selectedGroups', [...currentGroups, group]);
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

  const handleInputChange = (field: keyof MaterialData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  };

  const handlePost = () => {
    if (!formData.title.trim()) {
      setErrors({ title: 'Title is required' });
      return;
    }

    console.log('📤 Posting material with attachments:', formData.attachments);
    if (onSave) {
      onSave(formData);
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
        title: '',
        description: '',
        topic: 'No topic',
        assignTo: 'all',
        selectedStudents: [],
        attachments: []
      });
      setSaveMenuOpen(false);
      onClose();
    }
  };

  const handleAddAttachment = (type: Attachment['type'], name?: string) => {
    const newAttachment: Attachment = {
      id: `attachment_${Date.now()}`,
      type,
      name: name || `${type} attachment`,
      url: type === 'link' ? '' : undefined
    };
    setFormData(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), newAttachment]
    }));
    setAttachMenuOpen(false);
    setCreateMenuOpen(false);
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter(att => att.id !== attachmentId) || []
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        handleAddAttachment('upload', file.name);
        // In a real implementation, you would upload the file here
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative my-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="material-modal-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full">
              <Book className="w-6 h-6 text-gray-600" />
            </div>
            <h2 id="material-modal-title" className="text-2xl font-medium text-gray-900">
              Material
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Post button with dropdown */}
            <div className="relative">
              <button
                onClick={handlePost}
                disabled={!formData.title || !formData.title.trim()}
                className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title={!formData.title || !formData.title.trim() ? 'Title is required' : 'Post material'}
              >
                <span>Post</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {saveMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setSaveMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 top-10 z-20 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[180px]">
                    <button
                      onClick={handlePost}
                      className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Post
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
            {/* More options button */}
            <div className="relative">
              <button
                onClick={() => setSaveMenuOpen(!saveMenuOpen)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Save options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
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
            <div className="border border-gray-300 rounded-lg px-4 py-2 bg-gray-50">
              <span className="text-gray-700">{className || 'Select class'}</span>
            </div>
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
            <label htmlFor="materialTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Title<span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              id="materialTitle"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter title"
              required
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">*Required</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="materialDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              id="materialDescription"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Add a description for your material..."
            />
            {/* Formatting toolbar */}
            <div className="flex items-center gap-1 mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
              <button className="p-1 hover:bg-gray-200 rounded" title="Bold">
                <span className="font-bold text-sm">B</span>
              </button>
              <button className="p-1 hover:bg-gray-200 rounded" title="Italic">
                <span className="italic text-sm">I</span>
              </button>
              <button className="p-1 hover:bg-gray-200 rounded" title="Underline">
                <span className="underline text-sm">U</span>
              </button>
              <div className="w-px h-4 bg-gray-300 mx-1"></div>
              <button className="p-1 hover:bg-gray-200 rounded" title="Bulleted list">
                <span className="text-sm">•</span>
              </button>
            </div>
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
                        const newAttachment = {
                          id: `attachment_${Date.now()}`,
                          type: 'drive' as const,
                          url: driveLink.trim(),
                          name: 'Google Drive file'
                        };
                        console.log('📎 Adding Google Drive attachment:', newAttachment);
                        handleInputChange('attachments', [
                          ...(formData.attachments || []),
                          newAttachment
                        ]);
                        setDriveLink('');
                        setShowDriveInput(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (driveLink.trim()) {
                        const newAttachment = {
                          id: `attachment_${Date.now()}`,
                          type: 'drive' as const,
                          url: driveLink.trim(),
                          name: 'Google Drive file'
                        };
                        console.log('📎 Adding Google Drive attachment:', newAttachment);
                        handleInputChange('attachments', [
                          ...(formData.attachments || []),
                          newAttachment
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
                    <div key={attachment.id || index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
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
                        onClick={() => handleRemoveAttachment(attachment.id)}
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

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handlePost} disabled={!formData.title || !formData.title.trim()}>
            Post
          </Button>
        </div>
      </div>
    </div>
  );
};


