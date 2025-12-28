import React, { useEffect, useState } from 'react';
import { Users, Calendar, FileText, Plus, BookOpen, TrendingUp } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  // Estados para datos reales
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  // Elimina el array dummy de recentStudents y usa estado
  const [recentStudents, setRecentStudents] = useState<any[]>([]);

  useEffect(() => {
    // Obtener clases y filtrar por profesor (user.id)
    fetch(`${import.meta.env.VITE_API_URL}/api/classes`)
      .then(res => res.json())
      .then(data => {
        if (user?.id) {
          setMyClasses(data.filter((cls: any) => cls.teacherId === user.id));
        } else {
          setMyClasses(data);
        }
      });
    // Obtener tareas y filtrar por profesor (user.id)
    fetch(`${import.meta.env.VITE_API_URL}/api/assignments`)
      .then(res => res.json())
      .then(data => {
        if (user?.id) {
          setPendingAssignments(data.filter((a: any) => a.teacherId === user.id));
        } else {
          setPendingAssignments(data);
        }
      });
  }, [user?.id]);

  useEffect(() => {
    // Obtener clases del profesor
    fetch(`${import.meta.env.VITE_API_URL}/api/classes`)
      .then(res => res.json())
      .then(classesData => {
        if (user?.id) {
          const myClasses = classesData.filter((cls: any) => cls.teacherId === user.id);
          const myClassIds = myClasses.map((cls: any) => cls.id);

          // Obtener inscripciones de estudiantes en mis clases
          fetch(`${import.meta.env.VITE_API_URL}/api/studentclasses`)
            .then(res => res.json())
            .then(studentClassesData => {
              // Filtrar inscripciones solo de mis clases
              const myStudentClasses = studentClassesData.filter((sc: any) =>
                myClassIds.includes(sc.classId)
              );
              // Mapear a estudiantes únicos
              const studentsMap: { [id: string]: any } = {};
              myStudentClasses.forEach((sc: any) => {
                if (!studentsMap[sc.student.id]) {
                  studentsMap[sc.student.id] = {
                    id: sc.student.id,
                    name: sc.student.firstName + ' ' + sc.student.lastName,
                    email: sc.student.email,
                    joinDate: sc.joinedAt,
                    progress: 0 // Puedes calcular progreso real si tienes ese dato
                  };
                }
              });
              // Tomar los más recientes (por fecha de inscripción)
              const recent = Object.values(studentsMap)
                .sort((a: any, b: any) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
                .slice(0, 4);
              setRecentStudents(recent);
            });
        }
      });
  }, [user?.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">
            {t('teacherDashboard.greeting', { name: user?.firstName })}
          </h1>
          <p className="text-text-secondary mt-1">
            {t('teacherDashboard.subtitle')}
          </p>
        </div>
        <Button className="flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          {t('teacherDashboard.newClass')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center">
          <Calendar className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-text">{myClasses.length}</h3>
          <p className="text-gray-600">{t('teacherDashboard.activeClasses')}</p>
        </Card>
        <Card className="text-center">
          <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-text">
            {myClasses.reduce((total, cls) => total + cls.students, 0)}
          </h3>
          <p className="text-gray-600">{t('teacherDashboard.totalStudents')}</p>
        </Card>
        <Card className="text-center">
          <FileText className="w-8 h-8 text-orange-600 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-text">{pendingAssignments.length}</h3>
          <p className="text-gray-600">{t('teacherDashboard.pendingAssignments')}</p>
        </Card>
        <Card className="text-center">
          <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-text">87%</h3>
          <p className="text-gray-600">{t('teacherDashboard.avgSatisfaction')}</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Mis Clases */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text">{t('teacherDashboard.myClasses')}</h2>
              <Button variant="outline" size="sm">{t('teacherDashboard.viewAll')}</Button>
            </div>
            <div className="space-y-4">
              {myClasses.map((cls) => (
                <div key={cls.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-text">{cls.title}</h3>
                    <span className="text-sm text-gray-500">
                      {t('teacherDashboard.students', { current: cls.students, max: cls.maxStudents })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-gray-600 text-sm">{t('teacherDashboard.schedule', { schedule: cls.schedule })}</p>
                    <span className="text-sm font-medium text-green-600">{t('teacherDashboard.nextClass', { nextClass: cls.nextClass })}</span>
                  </div>
                  {/* Student Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">{t('teacherDashboard.occupation')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {Math.round((cls.students / cls.maxStudents) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(cls.students / cls.maxStudents) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      {t('teacherDashboard.viewDetail')}
                    </Button>
                    <Button size="sm" variant="outline">
                      {t('teacherDashboard.manage')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Tareas por Revisar */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text">{t('teacherDashboard.assignmentsToReview')}</h2>
              <Button variant="outline" size="sm">{t('teacherDashboard.viewAll')}</Button>
            </div>
            <div className="space-y-3">
              {pendingAssignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-text">{assignment.title}</h3>
                    <p className="text-sm text-gray-600">{assignment.class}</p>
                    <p className="text-sm text-gray-500">{t('teacherDashboard.due', { date: assignment.dueDate })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-text">
                      {assignment.submissions}/{assignment.totalStudents}
                    </p>
                    <p className="text-sm text-gray-600">{t('teacherDashboard.delivered')}</p>
                    <Button size="sm" className="mt-2">
                      {t('teacherDashboard.review')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Estudiantes Recientes */}
          <Card>
            <h2 className="text-xl font-bold text-text mb-4">{t('teacherDashboard.recentStudents')}</h2>
            <div className="space-y-3">
              {recentStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {student.name.split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm">{student.name}</h3>
                      <p className="text-xs text-gray-600">{t('teacherDashboard.progress', { progress: student.progress })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button size="sm" variant="outline" className="w-full mt-4">
              {t('teacherDashboard.viewAllStudents')}
            </Button>
          </Card>

          {/* Acciones Rápidas */}
          <Card>
            <h2 className="text-xl font-bold text-text mb-4">{t('teacherDashboard.quickActions')}</h2>
            <div className="space-y-3">
              <Button size="sm" variant="outline" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                {t('teacherDashboard.createAssignment')}
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                {t('teacherDashboard.uploadMaterial')}
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                {t('teacherDashboard.manageStudents')}
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                <BookOpen className="w-4 h-4 mr-2" />
                {t('teacherDashboard.createModule')}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};