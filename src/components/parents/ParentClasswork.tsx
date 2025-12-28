/**
 * Componente Classwork específico para padres
 * Muestra assignments, quizzes y materials de las clases de sus hijos
 * Solo lectura - no puede crear/editar/eliminar
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, HelpCircle, Book, Calendar, Award } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
// TODO: Implementar funciones para obtener assignments/quizzes/materials de hijos del padre

interface ParentClassworkProps {
  classId: string;
  className?: string;
  studentId?: string; // ID del hijo del padre
}

export const ParentClasswork: React.FC<ParentClassworkProps> = ({ classId, className = '', studentId }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Cargar items del hijo del padre
    setLoading(false);
  }, [classId, studentId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green-medium mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tareas y Materiales</h2>
          <p className="text-sm text-gray-600">
            Vista de solo lectura de las tareas y materiales de la clase
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay tareas</h3>
            <p className="text-gray-600">No hay assignments, quizzes o materials en esta clase</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {item.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(item.dueDate).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      {item.points !== undefined && (
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          <span>{item.points} puntos</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};








