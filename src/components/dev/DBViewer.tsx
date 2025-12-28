/**
 * Componente para ver el contenido de la base de datos local
 * Solo visible en modo desarrollo
 */

import { useState, useEffect } from 'react';
import { localDB } from '../../db/localDB';
import { localUserService } from '../../services/localUserService';
import { USE_LOCAL_DB } from '../../config/devMode';
import { Users, BookOpen, FileText, HelpCircle, Folder, Database } from 'lucide-react';

export const DBViewer = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'students' | 'teachers' | 'classes'>('stats');
  const [stats, setStats] = useState<any>(null);

  // Solo mostrar en modo desarrollo con base local
  if (!USE_LOCAL_DB) {
    return null;
  }

  useEffect(() => {
    loadData();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const statistics = await getStats();
      setStats(statistics);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar estudiantes
      const studentsData = await localUserService.getAllStudents();
      setStudents(studentsData);

      // Cargar profesores/admins
      const teachersData = await localUserService.getTeachers();
      setTeachers(teachersData);

      // Cargar clases
      const classesData = await localDB.classes
        .where('isArchived')
        .equals(false)
        .toArray();
      setClasses(classesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener estadísticas completas
  const getStats = async () => {
    try {
      const stats = {
        users: await localDB.users.count(),
        students: await localDB.users.where('role').equals('student').and(u => u.isActive).count(),
        teachers: await localDB.users.where('role').anyOf(['teacher', 'admin']).and(u => u.isActive).count(),
        classes: await localDB.classes.where('isArchived').equals(false).count(),
        streamItems: await localDB.streamItems.where('isArchived').equals(false).count(),
        assignments: await localDB.assignments.where('isDeleted').equals(false).count(),
        quizzes: await localDB.quizzes.count(),
        materials: await localDB.materials.count(),
        attachments: await localDB.attachments.count(),
        classMembers: await localDB.classMembers.count(),
        assignmentSubmissions: await localDB.assignmentSubmissions.count(),
        quizSubmissions: await localDB.quizSubmissions.count(),
        grades: await localDB.grades.count(),
      };
      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  };

  const getPassword = (email: string) => {
    const emailPrefix = email.split('@')[0];
    return `${emailPrefix}@2025!`;
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl max-w-md max-h-[80vh] overflow-hidden flex flex-col">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Base de Datos Local</h3>
        </div>
        <button
          onClick={() => {
            loadData();
            loadStats();
          }}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
            activeTab === 'stats'
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Database className="w-3 h-3 inline-block mr-1" />
          Stats
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
            activeTab === 'students'
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Users className="w-3 h-3 inline-block mr-1" />
          Estudiantes ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('teachers')}
          className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
            activeTab === 'teachers'
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Users className="w-3 h-3 inline-block mr-1" />
          Profesores ({teachers.length})
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
            activeTab === 'classes'
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <BookOpen className="w-3 h-3 inline-block mr-1" />
          Clases ({classes.length})
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Cargando...</p>
          </div>
        ) : (
          <>
            {activeTab === 'stats' && (
              <div className="space-y-3">
                {stats ? (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-semibold text-gray-900">Usuarios</div>
                        <div className="text-2xl font-bold text-blue-600">{stats.users}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-semibold text-gray-900">Estudiantes</div>
                        <div className="text-2xl font-bold text-green-600">{stats.students}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-semibold text-gray-900">Profesores</div>
                        <div className="text-2xl font-bold text-purple-600">{stats.teachers}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-semibold text-gray-900">Clases</div>
                        <div className="text-2xl font-bold text-orange-600">{stats.classes}</div>
                      </div>
                    </div>
                    <div className="border-t pt-3 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stream Items:</span>
                        <span className="font-semibold">{stats.streamItems}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Assignments:</span>
                        <span className="font-semibold">{stats.assignments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quizzes:</span>
                        <span className="font-semibold">{stats.quizzes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Materials:</span>
                        <span className="font-semibold">{stats.materials}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Attachments:</span>
                        <span className="font-semibold">{stats.attachments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Class Members:</span>
                        <span className="font-semibold">{stats.classMembers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Assignment Submissions:</span>
                        <span className="font-semibold">{stats.assignmentSubmissions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quiz Submissions:</span>
                        <span className="font-semibold">{stats.quizSubmissions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Grades:</span>
                        <span className="font-semibold">{stats.grades}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600">Cargando estadísticas...</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'students' && (
              <div className="space-y-3">
                {students.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No hay estudiantes</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Usa "Importar CSV" para agregar estudiantes
                    </p>
                  </div>
                ) : (
                  students.map((student) => (
                    <div
                      key={student.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        📧 {student.email}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 font-mono">
                        🔑 {getPassword(student.email)}
                      </div>
                      {student.grupoAsignado && (
                        <div className="text-xs text-blue-600 mt-1">
                          👥 Grupo: {student.grupoAsignado}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'teachers' && (
              <div className="space-y-3">
                {teachers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No hay profesores/admins</p>
                  </div>
                ) : (
                  teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">
                        {teacher.firstName} {teacher.lastName}
                        <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                          {teacher.role}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        📧 {teacher.email}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 font-mono">
                        🔑 {getPassword(teacher.email)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'classes' && (
              <div className="space-y-3">
                {classes.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No hay clases</p>
                  </div>
                ) : (
                  classes.map((cls) => (
                    <div
                      key={cls.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{cls.title}</div>
                      {cls.subject && (
                        <div className="text-sm text-gray-600 mt-1">
                          📖 {cls.subject}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        🆔 {cls.id}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

