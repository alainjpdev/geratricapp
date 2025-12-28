import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (classData: {
    className: string;
    section: string;
    room: string;
  }) => Promise<void>;
}

const subjects = [
  'Art',
  'Biology',
  'Chemistry',
  'Computer Science',
  'Economics',
  'English',
  'Geography',
  'History',
  'Mathematics',
  'Music',
  'Physics',
  'Science',
  'Social Studies',
  'Technology',
  'Other'
];

export const CreateClassModal: React.FC<CreateClassModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [formData, setFormData] = useState({
    className: '',
    section: '',
    room: ''
  });
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [filteredSubjects, setFilteredSubjects] = useState(subjects);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({ className: '', section: '', room: '' });
      setError(null);
      setSubjectDropdownOpen(false);
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    
    if (field === 'className') {
      const filtered = subjects.filter(s => 
        s.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSubjects(filtered);
      setSubjectDropdownOpen(true);
    }
  };

  const handleSubjectSelect = (subject: string) => {
    setFormData(prev => ({ ...prev, className: subject }));
    setSubjectDropdownOpen(false);
  };

  const handleCreate = async () => {
    if (!formData.className.trim()) {
      setError('Subject is required');
      return;
    }

    setIsCreating(true);
    setError(null);
    
    try {
      await onCreate(formData);
      onClose();
    } catch (err: any) {
      console.error('Error in CreateClassModal:', err);
      const errorMessage = err.message || 'Error creating class';
      setError(errorMessage);
      // Mantener el modal abierto para que el usuario pueda corregir los datos
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-class-title"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 id="create-class-title" className="text-2xl font-medium text-gray-900">
            Create class
          </h2>
        </div>

        {/* Form */}
        <div className="px-6 pb-6">
          <div className="space-y-4">
            {/* Subject (Class name) */}
            <div>
              <label htmlFor="className" className="block text-sm font-medium text-gray-700 mb-1">
                Subject<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="className"
                  type="text"
                  value={formData.className}
                  onChange={(e) => handleInputChange('className', e.target.value)}
                  onFocus={() => setSubjectDropdownOpen(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green-medium focus:border-brand-green-medium text-gray-900"
                  placeholder="Subject name"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={subjectDropdownOpen}
                  aria-controls="subject-listbox"
                />
                {subjectDropdownOpen && filteredSubjects.length > 0 && (
                  <div
                    id="subject-listbox"
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto"
                    role="listbox"
                  >
                    {filteredSubjects.map((subject) => (
                      <div
                        key={subject}
                        onClick={() => handleSubjectSelect(subject)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-900"
                        role="option"
                      >
                        {subject}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">*Required</p>
            </div>

            {/* Section */}
            <div className="hidden">
              <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <input
                id="section"
                type="text"
                value={formData.section}
                onChange={(e) => handleInputChange('section', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green-medium focus:border-brand-green-medium text-gray-900"
                placeholder="Section"
                autoComplete="off"
              />
            </div>

            {/* Room */}
            <div className="hidden">
              <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-1">
                Room
              </label>
              <input
                id="room"
                type="text"
                value={formData.room}
                onChange={(e) => handleInputChange('room', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green-medium focus:border-brand-green-medium text-gray-900"
                placeholder="Room"
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm font-medium">{error}</p>
                <p className="text-red-500 text-xs mt-1">Please check your connection and try again.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !formData.className.trim()}
            className="px-4 py-2 bg-brand-green-light text-white rounded-md hover:bg-brand-green-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

