import React, { useState, useEffect } from 'react';
import { X, BookOpen, Save } from 'lucide-react';
import { Button } from './Button';

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: {
    id: string;
    title: string;
    description: string;
    section?: string;
    subject?: string;
    room?: string;
  };
  onSave?: (updatedData: {
    title: string;
    description: string;
    section?: string;
    subject?: string;
    room?: string;
  }) => void;
}

export const EditClassModal: React.FC<EditClassModalProps> = ({
  isOpen,
  onClose,
  classData,
  onSave
}) => {
  const [formData, setFormData] = useState({
    title: classData.title || '',
    description: classData.description || '',
    section: classData.section || '',
    subject: classData.subject || '',
    room: classData.room || ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen && classData) {
      setFormData({
        title: classData.title || '',
        description: classData.description || '',
        section: classData.section || '',
        subject: classData.subject || '',
        room: classData.room || ''
      });
      setErrors({});
    }
  }, [isOpen, classData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (onSave) {
      onSave({
        title: formData.title.trim(),
        description: formData.description.trim(),
        section: formData.section.trim() || undefined,
        subject: formData.subject.trim() || undefined,
        room: formData.room.trim() || undefined
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative my-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-class-modal-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full">
              <BookOpen className="w-6 h-6 text-gray-600" />
            </div>
            <h2 id="edit-class-modal-title" className="text-2xl font-medium text-gray-900">
              Edit class information
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Class Name */}
          <div>
            <label htmlFor="className" className="block text-sm font-medium text-gray-700 mb-2">
              Class name <span className="text-red-500">*</span>
            </label>
            <input
              id="className"
              type="text"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter class name"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Section */}
          <div>
            <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-2">
              Section
            </label>
            <input
              id="section"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.section}
              onChange={(e) => handleInputChange('section', e.target.value)}
              placeholder="Enter section (e.g., Period 1)"
            />
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Enter subject (e.g., Math, Science)"
            />
          </div>

          {/* Room */}
          <div>
            <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-2">
              Room
            </label>
            <input
              id="room"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.room}
              onChange={(e) => handleInputChange('room', e.target.value)}
              placeholder="Enter room number"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter class description"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end items-center gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
};










