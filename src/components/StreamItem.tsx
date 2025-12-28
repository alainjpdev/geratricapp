import React, { useState } from 'react';
import { MoreVertical, Users, Clock, Trash2, Edit, Archive, ArchiveRestore } from 'lucide-react';

interface StreamItemProps {
  id: string;
  type: 'announcement' | 'assignment' | 'quiz' | 'material';
  title: string;
  content?: string;
  author: {
    name: string;
    avatar?: string;
  };
  createdAt: string;
  classId?: string; // ID de la clase para navegación
  className?: string; // Nombre de la clase (para admins que ven todos los items)
  attachments?: Array<{
    id: string;
    type: 'drive' | 'youtube' | 'upload' | 'link';
    name: string;
    url?: string;
  }>;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  isArchived?: boolean;
  onClick?: (id: string, classId?: string) => void;
}

export const StreamItem: React.FC<StreamItemProps> = ({
  id,
  type,
  title,
  content,
  author,
  createdAt,
  classId,
  className,
  attachments,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
  isArchived = false,
  onClick
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const getTypeLabel = () => {
    switch (type) {
      case 'announcement':
        return 'Announcement';
      case 'assignment':
        return 'Assignment';
      case 'quiz':
        return 'Quiz assignment';
      case 'material':
        return 'Material';
      default:
        return 'Post';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'assignment':
      case 'quiz':
        return (
          <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 15h7v2H7zm0-4h10v2H7zm0-4h10v2H7z" />
            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-.14 0-.27.01-.4.04a2.008 2.008 0 0 0-1.44 1.19c-.1.23-.16.49-.16.77v14c0 .27.06.54.16.78s.25.45.43.64c.27.27.62.47 1.01.55.13.02.26.03.4.03h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7-.25c.41 0 .75.34.75.75s-.34.75-.75.75-.75-.34-.75-.75.34-.75.75-.75zM19 19H5V5h14v14z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
    }
  };

  const getAuthorText = () => {
    if (type === 'assignment' || type === 'quiz') {
      return `${author.name} posted a new ${type === 'quiz' ? 'quiz assignment' : 'assignment'}: ${title}`;
    }
    return author.name;
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${classId ? 'cursor-pointer' : ''
        } ${isArchived ? 'opacity-75 border-gray-300' : ''}`}
      onClick={(e) => {
        // Solo navegar si hay classId y onClick está definido
        if (onClick && classId) {
          console.log('StreamItem onClick triggered:', { id, classId });
          e.preventDefault();
          e.stopPropagation();
          onClick(id, classId);
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {author.avatar ? (
            <img
              src={author.avatar}
              alt={author.name}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 text-sm font-medium">
                {author.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {/* Type and Title */}
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {getTypeIcon()}
                <h3 className="text-base font-medium text-gray-900">
                  {getTypeLabel()}: "{title}"
                </h3>
                {isArchived && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    <Archive className="w-3 h-3" />
                    Archivado
                  </span>
                )}
              </div>

              {/* Author and Date */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <span className="font-medium">{getAuthorText()}</span>
                {className && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {className}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Created {formatDate(createdAt)}</span>
                </span>
              </div>
            </div>

            {/* Menu */}
            <div className="relative flex-shrink-0">
              {(onEdit || onDelete || onArchive || onUnarchive) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(!menuOpen);
                  }}
                  className="p-1 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="More options"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              )}
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                    }}
                  ></div>
                  <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[160px]">
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(id);
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                    {(onArchive || onUnarchive) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isArchived && onUnarchive) {
                            onUnarchive(id);
                          } else if (!isArchived && onArchive) {
                            onArchive(id);
                          }
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-2"
                      >
                        {isArchived ? (
                          <>
                            {/* <ArchiveRestore className="w-4 h-4" /> */}
                            Unarchive
                          </>
                        ) : (
                          <>
                            <Archive className="w-4 h-4" />
                            Archive
                          </>
                        )}
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this item?')) {
                            onDelete(id);
                          }
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          {content && (
            <div className="mt-3 text-gray-700 whitespace-pre-wrap">
              {content}
            </div>
          )}

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200"
                >
                  <span className="text-sm text-gray-600">{attachment.name}</span>
                  {attachment.url && (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Comments section placeholder */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>No class comments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

