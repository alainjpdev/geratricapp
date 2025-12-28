import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { createTestModule } from '../../data/testModules';

interface TribuMateriaParams {
  tribuId: string;
  materia: string;
}

export const TribuMateria: React.FC = () => {
  const { tribuId, materia } = useParams<TribuMateriaParams>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estado para el formulario de creación de módulo
  const [newModule, setNewModule] = useState({
    title: '',
    description: '',
    url: '',
    pdfUrl: '',
    videoUrl: '',
    instructions: '',
    quiz: '',
    photoInstructions: ''
  });

  // Función para crear un módulo de prueba
  const createTestModuleForTribu = () => {
    const testModule = createTestModule();
    // Personalizar el módulo para la tribu y materia específica
    testModule.title = `${testModule.title} - ${materia}`;
    testModule.description = `Módulo de prueba para ${materia} en ${tribuId}. ${testModule.description}`;
    testModule.category = materia || 'General';
    testModule.tags = [...testModule.tags, tribuId || 'Tribu', materia || 'Materia'];
    
    setModules(prev => [...prev, testModule]);
    setSuccessMsg(`¡Módulo de prueba creado para ${materia} en ${tribuId}!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Función para crear módulo desde el formulario
  const handleCreateModule = () => {
    if (!newModule.title.trim()) {
      alert('El título es obligatorio');
      return;
    }

    const module = {
      id: `mod-${Date.now()}`,
      title: newModule.title,
      description: newModule.description,
      url: newModule.url,
      category: materia || 'General',
      difficulty: 'beginner' as const,
      duration: 120, // 2 horas por defecto
      prerequisites: ['Conocimientos básicos'],
      learningObjectives: ['Completar el módulo exitosamente'],
      tags: [tribuId || 'Tribu', materia || 'Materia'],
      instructor: 'Profesor Asignado',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      isPublished: true,
      order: modules.length + 1,
      progress: 0,
      totalLessons: 1,
      completedLessons: 0,
      resources: {
        videos: newModule.videoUrl ? [newModule.videoUrl] : [],
        documents: newModule.pdfUrl ? [newModule.pdfUrl] : [],
        links: newModule.url ? [newModule.url] : []
      },
      assignments: [],
      quizzes: [],
      // Campos adicionales del formulario
      pdfUrl: newModule.pdfUrl,
      videoUrl: newModule.videoUrl,
      instructions: newModule.instructions,
      quiz: newModule.quiz,
      photoInstructions: newModule.photoInstructions
    };

    setModules(prev => [...prev, module]);
    setShowCreateModal(false);
    setNewModule({
      title: '',
      description: '',
      url: '',
      pdfUrl: '',
      videoUrl: '',
      instructions: '',
      quiz: '',
      photoInstructions: ''
    });
    setSuccessMsg(`¡Módulo "${module.title}" creado exitosamente!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {materia} - {tribuId}
        </h1>
        <p className="text-gray-600">
          Gestión de módulos para la materia {materia} en {tribuId}
        </p>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-4 mb-6">
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-400 hover:bg-blue-500 text-white"
        >
          Crear Nuevo Módulo
        </Button>
        <Button 
          onClick={createTestModuleForTribu}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Crear Módulo de Prueba
        </Button>
      </div>

      {/* Mensaje de éxito */}
      {successMsg && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMsg}
        </div>
      )}

      {/* Lista de módulos */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Módulos Disponibles</h2>
          {modules.length === 0 ? (
            <p className="text-gray-500">No hay módulos creados aún.</p>
          ) : (
            <div className="space-y-4">
              {modules.map((module, index) => (
                <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-800">{module.title}</h3>
                      <p className="text-gray-600 mt-1">{module.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {module.tags.map((tag, i) => (
                          <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                      {module.url && (
                        <a 
                          href={module.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                        >
                          Ver módulo →
                        </a>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {module.duration} min
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Modal de creación de módulo */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Crear Nuevo Módulo</h2>
              <button 
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowCreateModal(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x w-6 h-6">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título del módulo *</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="Ej: Introducción a la materia" 
                  value={newModule.title}
                  onChange={(e) => setNewModule({...newModule, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                <textarea 
                  rows="3" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="Describe el contenido del módulo..."
                  value={newModule.description}
                  onChange={(e) => setNewModule({...newModule, description: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL del módulo (opcional)</label>
                <input 
                  type="url" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="https://ejemplo.com/modulo (opcional)" 
                  value={newModule.url}
                  onChange={(e) => setNewModule({...newModule, url: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">Deja este campo vacío si el módulo no tiene una URL específica</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descargar PDF para imprimir (opcional)</label>
                <input 
                  type="url" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="https://ejemplo.com/modulo.pdf (opcional)" 
                  value={newModule.pdfUrl}
                  onChange={(e) => setNewModule({...newModule, pdfUrl: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">Enlace al PDF que los estudiantes pueden descargar e imprimir</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link de video de YouTube (opcional)</label>
                <input 
                  type="url" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="https://youtube.com/watch?v=... (opcional)" 
                  value={newModule.videoUrl}
                  onChange={(e) => setNewModule({...newModule, videoUrl: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">Enlace al video de YouTube relacionado con el módulo</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texto de indicaciones (opcional)</label>
                <textarea 
                  rows="4" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="Instrucciones detalladas para los estudiantes..."
                  value={newModule.instructions}
                  onChange={(e) => setNewModule({...newModule, instructions: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">Instrucciones paso a paso para completar el módulo</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Formularios de opción múltiple (opcional)</label>
                <textarea 
                  rows="3" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="Pregunta 1: ¿Cuál es...?
a) Opción A
b) Opción B
c) Opción C
Respuesta: a"
                  value={newModule.quiz}
                  onChange={(e) => setNewModule({...newModule, quiz: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">Formato: Pregunta, opciones (a, b, c) y respuesta correcta</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Espacio para subir foto de su trabajo (opcional)</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="Instrucciones para subir fotos del trabajo realizado" 
                  value={newModule.photoInstructions}
                  onChange={(e) => setNewModule({...newModule, photoInstructions: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">Instrucciones sobre cómo los estudiantes deben subir fotos de su trabajo</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800"><strong>Materia asignada:</strong> {materia}</p>
                <p className="text-sm text-blue-800"><strong>Tribu asignada:</strong> {tribuId}</p>
                <p className="text-xs text-blue-600 mt-1">Este módulo se creará automáticamente para {materia} en {tribuId}</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCreateModule}
                disabled={loading}
              >
                {loading ? 'Creando...' : 'Crear Módulo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TribuMateria;


