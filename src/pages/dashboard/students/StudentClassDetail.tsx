/**
 * Vista de detalle de clase para estudiantes
 * Muestra información de la clase y permite ver assignments, quizzes y materials
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { loadClass, getStudentClasses } from '../../../services/classService';
import { StudentClasswork } from '../../../components/students/StudentClasswork';
import classroomCode from '../../../assets/classroom-code.jpg';
import classroomRead from '../../../assets/classroom-read.jpg';
import classroomBookclub from '../../../assets/classroom-bookclub.jpg';
import classroomBacktoschool from '../../../assets/classroom-backtoschool.jpg';
import { StudentGrades as GradesView } from '../../../components/students/StudentGrades';

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

export const StudentClassDetail: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'classwork' | 'people' | 'grades'>('classwork');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['classwork', 'people', 'grades'].includes(tab)) {
      setCurrentTab(tab as 'classwork' | 'people' | 'grades');
    } else {
      setCurrentTab('classwork');
    }
  }, [searchParams, classId]);

  useEffect(() => {
    if (classId) {
      loadClassData();
    }
  }, [classId]);

  const loadClassData = async () => {
    if (!classId || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Verificar que el estudiante esté en esta clase
      const studentClasses = await getStudentClasses(user.id);
      const isInClass = studentClasses.some(c => c.id === classId);

      if (!isInClass) {
        alert('No tienes acceso a esta clase');
        navigate('/dashboard');
        return;
      }

      const classInfo = await loadClass(classId);

      if (!classInfo) {
        alert('Clase no encontrada');
        navigate('/dashboard');
        return;
      }

      setClassData({
        id: classInfo.id!,
        title: classInfo.title,
        description: classInfo.description || '',
        classCode: classInfo.classCode,
        section: classInfo.section,
        subject: classInfo.subject,
        room: classInfo.room,
        backgroundImage: classInfo.backgroundImage,
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

  const getBackgroundImage = () => {
    if (classData?.backgroundImage) {
      return classData.backgroundImage;
    }

    const backgroundImages = [
      classroomCode,
      classroomRead,
      classroomBookclub,
      classroomBacktoschool,
    ];

    if (classData?.id) {
      const hash = classData.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return backgroundImages[hash % backgroundImages.length];
    }

    return classroomCode;
  };

  const backgroundImageUrl = getBackgroundImage();

  return (
    <div className="min-h-screen bg-white">
      {/* Header con imagen de fondo */}
      <div className="relative">
        <div
          className="h-40 bg-cover bg-center relative"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`
          }}
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
                setCurrentTab('classwork');
                navigate(`/dashboard/classes/${classId}?tab=classwork`, { replace: true });
              }}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${currentTab === 'classwork'
                ? 'border-brand-green-medium text-brand-green-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              Classwork
            </button>
            <button
              onClick={() => {
                setCurrentTab('people');
                navigate(`/dashboard/classes/${classId}?tab=people`, { replace: true });
              }}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors hidden ${currentTab === 'people'
                ? 'border-brand-green-medium text-brand-green-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              People
            </button>
            <button
              onClick={() => {
                setCurrentTab('grades');
                navigate(`/dashboard/classes/${classId}?tab=grades`, { replace: true });
              }}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${currentTab === 'grades'
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
          {currentTab === 'classwork' && (
            <StudentClasswork classId={classId || ''} className={classData.title} />
          )}

          {currentTab === 'people' && (
            <div className="hidden">
              {/* TODO: Implementar vista de People para estudiantes */}
            </div>
          )}

          {currentTab === 'grades' && (
            <div className="p-6">
              <GradesView classId={classId || ''} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
