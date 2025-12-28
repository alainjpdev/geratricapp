import React, { useState, useEffect } from 'react';
import { X, Megaphone, Users, ChevronDown, Save, Clock, Upload, Link as LinkIcon, Youtube, FolderOpen } from 'lucide-react';
import { Button } from './Button';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className?: string;
  onSave?: (announcement: AnnouncementData) => void;
}

export interface AnnouncementData {
  content: string;
  assignTo: 'all' | 'selected';
  selectedStudents?: string[];
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  type: 'drive' | 'youtube' | 'upload' | 'link';
  name: string;
  url?: string;
  file?: File;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  isOpen,
  onClose,
  classId,
  className = '',
  onSave
}) => {
  const [formData, setFormData] = useState<AnnouncementData>({
    content: '',
    assignTo: 'all',
    selectedStudents: [],
    attachments: []
  });
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const [assignToMenuOpen, setAssignToMenuOpen] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        content: '',
        assignTo: 'all',
        selectedStudents: [],
        attachments: []
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof AnnouncementData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  };

  const handlePost = () => {
    if (!formData.content.trim()) {
      setErrors({ content: 'Content is required' });
      return;
    }

    if (onSave) {
      onSave(formData);
    }
    setSaveMenuOpen(false);
    onClose();
  };

  const handleSaveDraft = () => {
    console.log('Saving draft:', formData);
    setSaveMenuOpen(false);
  };

  const handleSchedule = () => {
    // TODO: Open schedule modal
    console.log('Schedule announcement');
    setSaveMenuOpen(false);
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
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative my-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-modal-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full">
              <Megaphone className="w-6 h-6 text-gray-600" />
            </div>
            <h2 id="announcement-modal-title" className="text-2xl font-medium text-gray-900">
              Announcement
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
                    {formData.assignTo === 'all' ? 'All students' : 'Selected students'}
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
                        setAssignToMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                    >
                      All students
                    </button>
                    <button
                      onClick={() => {
                        handleInputChange('assignTo', 'selected');
                        setAssignToMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                    >
                      Selected students
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Content Editor */}
          <div>
            <label htmlFor="announcementContent" className="block text-sm font-medium text-gray-700 mb-1">
              Announce something to your class
            </label>
            <textarea
              id="announcementContent"
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Announce something to your class"
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content}</p>
            )}
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
              <div className="w-px h-4 bg-gray-300 mx-1"></div>
              <button className="p-1 hover:bg-gray-200 rounded" title="Remove formatting">
                <span className="text-sm">T</span>
              </button>
            </div>
          </div>

          {/* Attach Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-medium text-gray-700">Attach</h3>
            </div>
            <div className="flex items-center gap-2">
              {/* Drive */}
              <button
                onClick={() => handleAddAttachment('drive', 'Google Drive file')}
                className="flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Add Google Drive file"
              >
                <FolderOpen className="w-6 h-6 text-blue-600" />
              </button>

              {/* YouTube */}
              <button
                onClick={() => handleAddAttachment('youtube', 'YouTube video')}
                className="flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Add YouTube video"
              >
                <Youtube className="w-6 h-6 text-red-600" />
              </button>

              {/* Upload */}
              <label className="flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" title="Upload file">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  multiple
                />
                <Upload className="w-6 h-6 text-gray-600" />
              </label>

              {/* Link */}
              <button
                onClick={() => handleAddAttachment('link', 'Link')}
                className="flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Add link"
              >
                <LinkIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Attachments list */}
            {formData.attachments && formData.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {formData.attachments.map(attachment => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {attachment.type === 'drive' && <FolderOpen className="w-5 h-5 text-blue-600" />}
                      {attachment.type === 'youtube' && <Youtube className="w-5 h-5 text-red-600" />}
                      {attachment.type === 'upload' && <Upload className="w-5 h-5 text-gray-600" />}
                      {attachment.type === 'link' && <LinkIcon className="w-5 h-5 text-gray-600" />}
                      <span className="text-sm text-gray-700">{attachment.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            {/* Post button with dropdown */}
            <div className="relative">
              <button
                onClick={handlePost}
                disabled={!formData.content.trim()}
                className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                      <Megaphone className="w-4 h-4" />
                      Post
                    </button>
                    <button
                      onClick={handleSchedule}
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
                  </div>
                </>
              )}
            </div>
            {/* More options button */}
            <button
              onClick={() => setSaveMenuOpen(!saveMenuOpen)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Save options"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


