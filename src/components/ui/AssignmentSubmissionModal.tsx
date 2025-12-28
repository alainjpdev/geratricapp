import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Send, FileText, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { saveSubmission, getSubmission } from '../../services/submissionService';

interface AssignmentSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  streamItemId: string;
  assignmentTitle: string;
  instructions?: string;
  dueDate?: string;
  dueTime?: string;
  onSubmitted?: () => void;
}

export const AssignmentSubmissionModal: React.FC<AssignmentSubmissionModalProps> = ({
  isOpen,
  onClose,
  assignmentId,
  streamItemId,
  assignmentTitle,
  instructions,
  dueDate,
  dueTime,
  onSubmitted,
}) => {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [driveLinks, setDriveLinks] = useState<string[]>([]);
  const [driveLinkInput, setDriveLinkInput] = useState('');
  const [status, setStatus] = useState<'draft' | 'submitted' | 'returned' | 'graded'>('draft');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen && user?.id) {
      loadExistingSubmission();
    } else if (!isOpen) {
      // Reset form when modal closes
      setContent('');
      setDriveLinks([]);
      setDriveLinkInput('');
      setStatus('draft');
      setErrors({});
    }
  }, [isOpen, assignmentId, user?.id]);

  const loadExistingSubmission = async () => {
    if (!user?.id) return;
    
    try {
      const submission = await getSubmission(assignmentId, user.id);
      if (submission) {
        setContent(submission.content || '');
        setStatus(submission.status);
        
        // Parse attachments if they exist
        if (submission.attachments && Array.isArray(submission.attachments)) {
          const links = submission.attachments
            .filter((att: any) => att.type === 'drive' && att.url)
            .map((att: any) => att.url);
          setDriveLinks(links);
        }
      }
    } catch (error) {
      console.error('Error loading submission:', error);
    }
  };

  const addDriveLink = () => {
    if (!driveLinkInput.trim()) {
      setErrors({ driveLink: 'Por favor ingresa un link válido' });
      return;
    }

    // Validar que sea un link de Google Drive
    if (!driveLinkInput.includes('drive.google.com') && !driveLinkInput.includes('docs.google.com')) {
      setErrors({ driveLink: 'Por favor ingresa un link válido de Google Drive' });
      return;
    }

    if (driveLinks.includes(driveLinkInput.trim())) {
      setErrors({ driveLink: 'Este link ya fue agregado' });
      return;
    }

    setDriveLinks([...driveLinks, driveLinkInput.trim()]);
    setDriveLinkInput('');
    setErrors({});
  };

  const removeDriveLink = (index: number) => {
    setDriveLinks(driveLinks.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const attachments = driveLinks.map(link => ({
        type: 'drive',
        name: 'Google Drive Link',
        url: link,
      }));

      await saveSubmission({
        assignmentId,
        studentId: user.id,
        content: content.trim() || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        status: 'draft',
      });

      alert('Borrador guardado correctamente');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Error al guardar el borrador');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    console.log('🔵 handleSubmit llamado');
    if (!user?.id) {
      console.error('❌ No hay usuario');
      return;
    }

    console.log('📝 Contenido:', content);
    console.log('📎 Drive links:', driveLinks);
    console.log('📋 Assignment ID:', assignmentId);

    // Validar que tenga contenido o attachments
    if (!content.trim() && driveLinks.length === 0) {
      console.warn('⚠️ No hay contenido ni attachments');
      setErrors({ submit: 'Por favor agrega una respuesta o al menos un archivo adjunto' });
      return;
    }

    // Verificar fecha de vencimiento
    if (dueDate) {
      const due = new Date(dueDate);
      if (dueTime) {
        const [hours, minutes] = dueTime.split(':');
        due.setHours(parseInt(hours), parseInt(minutes));
      }
      const now = new Date();
      if (now > due) {
        if (!confirm('La fecha de vencimiento ya pasó. ¿Deseas enviar de todas formas?')) {
          return;
        }
      }
    }

    setLoading(true);
    setErrors({});

    try {
      const attachments = driveLinks.map(link => ({
        type: 'drive',
        name: 'Google Drive Link',
        url: link,
      }));

      console.log('💾 Guardando submission con:', {
        assignmentId,
        studentId: user.id,
        content: content.trim() || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        status: 'submitted',
      });

      await saveSubmission({
        assignmentId,
        studentId: user.id,
        content: content.trim() || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        status: 'submitted',
      });

      console.log('✅ Submission guardada exitosamente');
      setStatus('submitted');
      alert('Respuesta enviada correctamente');
      
      if (onSubmitted) {
        onSubmitted();
      }
      
      onClose();
    } catch (error) {
      console.error('❌ Error submitting assignment:', error);
      alert('Error al enviar la respuesta: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  console.log('🎭 AssignmentSubmissionModal render - isOpen:', isOpen, 'assignmentId:', assignmentId, 'assignmentTitle:', assignmentTitle);

  if (!isOpen) {
    console.log('❌ Modal no está abierto, retornando null');
    return null;
  }

  const isPastDue = dueDate && new Date(dueDate) < new Date();
  const canEdit = status === 'draft' || status === 'returned';

  console.log('✅ Renderizando modal con z-50');

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{assignmentTitle}</h2>
            {isPastDue && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                La fecha de vencimiento ya pasó
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Instructions */}
          {instructions && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Instrucciones</h3>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">{instructions}</p>
            </div>
          )}

          {/* Due Date */}
          {dueDate && (
            <div className="text-sm text-gray-600">
              <strong>Fecha de vencimiento:</strong>{' '}
              {new Date(dueDate).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {dueTime && ` a las ${dueTime}`}
            </div>
          )}

          {/* Status Badge */}
          {status !== 'draft' && (
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                status === 'returned' ? 'bg-yellow-100 text-yellow-800' :
                status === 'graded' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {status === 'submitted' ? 'Enviado' :
                 status === 'returned' ? 'Devuelto para correcciones' :
                 status === 'graded' ? 'Calificado' :
                 'Borrador'}
              </span>
            </div>
          )}

          {/* Content Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tu respuesta {!canEdit && status === 'submitted' && '(Ya enviada)'}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={!canEdit}
              placeholder="Escribe tu respuesta aquí..."
              className="w-full min-h-[200px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Attachments - Google Drive Links */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Enlaces de Google Drive
            </label>
            
            {/* Drive Links List */}
            {driveLinks.length > 0 && (
              <div className="space-y-2 mb-4">
                {driveLinks.map((link, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <LinkIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate"
                      >
                        {link}
                      </a>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => removeDriveLink(index)}
                        className="ml-2 text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add Drive Link - Siempre visible cuando se puede editar */}
            {canEdit && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={driveLinkInput}
                    onChange={(e) => {
                      setDriveLinkInput(e.target.value);
                      setErrors({});
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addDriveLink();
                      }
                    }}
                    placeholder="Pega el link de Google Drive aquí..."
                    className="flex-1 px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <button
                    onClick={addDriveLink}
                    disabled={!driveLinkInput.trim()}
                    className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Agregar
                  </button>
                </div>
                {errors.driveLink && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{errors.driveLink}</p>
                )}
                <p className="text-xs text-blue-700 mt-1">
                  💡 Puedes agregar múltiples enlaces de Google Drive. Presiona Enter o haz clic en "Agregar" después de pegar cada link.
                </p>
              </div>
            )}
            
            {!canEdit && driveLinks.length === 0 && (
              <p className="text-sm text-blue-700 italic">No hay enlaces de Google Drive adjuntos</p>
            )}
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          {canEdit && (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar borrador'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔘 Botón Enviar clickeado, loading:', loading, 'content:', content, 'driveLinks:', driveLinks);
                  if (!loading && (content.trim() || driveLinks.length > 0)) {
                    handleSubmit();
                  } else {
                    console.warn('⚠️ Botón deshabilitado o sin contenido');
                  }
                }}
                disabled={loading || (!content.trim() && driveLinks.length === 0)}
                className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </>
          )}
          {!canEdit && status === 'submitted' && (
            <p className="text-sm text-gray-600">
              Tu respuesta ya fue enviada. El profesor la revisará pronto.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // Renderizar usando portal para asegurar que esté en el nivel superior del DOM
  return createPortal(modalContent, document.body);
};



