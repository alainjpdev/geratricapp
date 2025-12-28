/**
 * Vista de detalle de clase para padres
 * Muestra información de la clase de sus hijos en modo solo lectura
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { loadClass } from '../../../services/classService';
import { ParentClasswork } from '../../../components/parents/ParentClasswork';
import classroomCode from '../../../assets/classroom-code.jpg';
import classroomRead from '../../../assets/classroom-read.jpg';
import classroomBookclub from '../../../assets/classroom-bookclub.jpg';
import classroomBacktoschool from '../../../assets/classroom-backtoschool.jpg';

interface ClassDetail {
  id: string;
  title: string;
  description: string;
  classCode?: string;
  section?: string;
  subject?: string;
  room?: string;
  backgroundImage?: string;
  module?: {
    id: string;
    title: string;
  };
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export const ParentClassDetail: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'classwork' | 'people' | 'grades'>('classwork');
  const [studentId, setStudentId] = useState<string | undefined>(); // ID del hijo del padre

  useEffect(() => {
    const tab = searchParams.get('tab');
    const student = searchParams.get('student'); // ID del hijo
    if (tab && ['classwork', 'people', 'grades'].includes(tab)) {
      setActiveTab(tab as 'classwork' | 'people' | 'grades');
    }
    if (student) {
      setStudentId(student);
    }
  }, [searchParams, classId]);

  useEffect(() => {
    if (classId) {
      loadClassData();
    }
  }, [classId]);

  const loadClassData = async () => {
    if (!classId) {
      setLoading(false);
      return;
    }

    try {
      const classInfo = await loadClass(classId);
      setClassData({
        id: classInfo.id!,
        title: classInfo.title,
        description: classInfo.description || '',
        classCode: classInfo.classCode,
        section: classInfo.section,
        subject: classInfo.subject,
        room: classInfo.room,
        module: classInfo.module,
        teacher: classInfo.teacher,
      });
    } catch (err: any) {
      console.error('Error loading class:', err);
      alert('Error al cargar la clase');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green-medium"></div>
      </div>
    );
  }

  if (!classData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header con imagen de fondo */}
      <div className="relative">
        <div
          className="h-40 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${(() => {
            const backgroundImages = [
              classroomCode,
              classroomRead,
              classroomBookclub,
              classroomBacktoschool,
            ];
            if (classData?.backgroundImage) {
              return classData.backgroundImage;
            }
            if (classData?.id) {
              const hash = classData.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
              return backgroundImages[hash % backgroundImages.length];
            }
            return classroomCode;
          })()})` }}
        >
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="max-w-7xl mx-auto flex items-end justify-between">
              <div>
                <h1 className="text-3xl font-normal text-white mb-1 drop-shadow-lg">{classData.title}</h1>
                {classData.subject && (
                  <p className="text-white text-sm drop-shadow-md">{classData.subject}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto">
        <div className="border-b border-gray-200 mb-4">
          <nav className="flex gap-6">
            <button
              onClick={() => {
                setActiveTab('classwork');
                navigate(`/dashboard/classes/${classId}?tab=classwork`, { replace: true });
              }}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'classwork'
                  ? 'border-brand-green-medium text-brand-green-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Classwork
            </button>
            <button
              onClick={() => {
                setActiveTab('grades');
                navigate(`/dashboard/classes/${classId}?tab=grades`, { replace: true });
              }}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'grades'
                  ? 'border-brand-green-medium text-brand-green-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Grades
            </button>
          </nav>
        </div>

        {/* Content */}
        <main className="min-h-screen bg-white">
          {activeTab === 'classwork' && (
            <ParentClasswork classId={classId || ''} className={classData.title} studentId={studentId} />
          )}

          {activeTab === 'grades' && (
            <div className="p-6">
              {/* TODO: Implementar vista de Grades para padres */}
              <p className="text-gray-600">Vista de calificaciones (próximamente)</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};


