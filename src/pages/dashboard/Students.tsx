import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
// Sin autenticación, no necesitamos useAuthStore
import { useTranslation } from 'react-i18next';

const TeacherStudents: React.FC = () => {
  // Sin autenticación, usar datos mock
  const { t } = useTranslation();
  const [studentClasses, setStudentClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sin backend, usar datos mock
    const mockStudentClasses = [
      { id: '1', studentName: 'Juan Pérez', className: 'Matemáticas', status: 'active' },
      { id: '2', studentName: 'María García', className: 'Ciencias', status: 'active' }
    ];
    setStudentClasses(mockStudentClasses);
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text mb-6">
        {t('teacherDashboard.manageStudents', 'Gestión de Estudiantes')}
      </h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-text">Nombre</th>
                <th className="text-left py-3 px-4 font-medium text-text">Email</th>
                <th className="text-left py-3 px-4 font-medium text-text">Clase</th>
                <th className="text-left py-3 px-4 font-medium text-text">Fecha de Inscripción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">Cargando...</td>
                </tr>
              ) : studentClasses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">No hay estudiantes inscritos</td>
                </tr>
              ) : (
                studentClasses.map(sc => (
                  <tr key={sc.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{sc.student.firstName} {sc.student.lastName}</td>
                    <td className="py-3 px-4">{sc.student.email}</td>
                    <td className="py-3 px-4">{sc.class.title}</td>
                    <td className="py-3 px-4">{new Date(sc.joinedAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TeacherStudents; 