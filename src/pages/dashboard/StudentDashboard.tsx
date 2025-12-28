import React, { useEffect, useState } from 'react';
import { BookOpen, Calendar, ClipboardList, Trophy, Clock, CheckCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import useAutoTranslate from '../../hooks/useAutoTranslate';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [modules, setModules] = useState<any[]>([]); // módulos asignados (UserModule)
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [allModules, setAllModules] = useState<any[]>([]); // todos los módulos
  const [accessedModuleIds, setAccessedModuleIds] = useState<string[]>([]); // IDs de módulos accedidos
  // Puedes agregar loading y error states si lo deseas

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    // Obtener todos los módulos
    apiClient.get('/api/modules').then(res => setAllModules(res.data));
    // Obtener módulos asignados
    apiClient.get(`/api/users/${user.id}/modules`).then(res => {
      setModules(res.data);
      setLoading(false);
    });
    // Obtener módulos accedidos (simulado: localStorage o API real)
    const accessed = JSON.parse(localStorage.getItem(`accessedModules_${user?.id}`) || '[]');
    setAccessedModuleIds(accessed);
  }, [user]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/assignments`)
      .then(res => res.json())
      .then(setAssignments);
  }, []);

  // Dummy para upcomingClasses y logros recientes (puedes migrar esto a la base de datos después)
  const upcomingClasses = [];

  // Calcular progreso general
  const totalModules = allModules.length;
  const assignedCount = modules.length;
  const progress = totalModules === 0 ? 0 : Math.round((assignedCount / totalModules) * 100);

  const TranslatedModuleCard: React.FC<{ module: any; i18n: any }> = ({ module, i18n }) => {
    const translatedTitle = useAutoTranslate(module.title, 'es', i18n.language);
    const translatedDescription = useAutoTranslate(module.description, 'es', i18n.language);
    return (
      <div className="p-4 border border-border rounded-lg hover:shadow-sm transition-shadow bg-panel">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-text">{translatedTitle}</h3>
        </div>
        <p className="text-text-secondary text-sm mb-3">{translatedDescription}</p>
        <div className="flex gap-2 mt-4">
          <a
            href={module.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-white font-medium text-sm py-1.5 px-3 rounded-lg transition-all duration-200 hover:bg-primary/80"
          >
            Let's Go!
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">
            {t('studentDashboard.greeting', { name: user?.firstName })}
          </h1>
          <p className="text-text-secondary mt-1">
            {t('studentDashboard.welcomeBack')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-warning" />
          <span className="text-lg font-semibold text-text">{t('studentDashboard.level', { level: 1 })}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center">
          <BookOpen className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-text">{modules.length}</h3>
          <p className="text-text-secondary">{t('studentDashboard.activeModules')}</p>
        </Card>
        <Card className="text-center">
          <Calendar className="w-8 h-8 text-success mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-text">{user?.hours ?? 0}</h3>
          <p className="text-text-secondary">Horas</p>
        </Card>
        <Card className="text-center">
          <Trophy className="w-8 h-8 text-accent mx-auto mb-3" />
          {modules.length > 1 && (
            <h3 className="text-2xl font-bold text-text">{progress}%</h3>
          )}
          <p className="text-text-secondary">{t('studentDashboard.overallProgress')}</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Módulos */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text">{t('studentDashboard.myModules')}</h2>
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/modules')}>
                {t('studentDashboard.viewAll')}
              </Button>
            </div>
            <div className="space-y-4">
              {modules.map((module) => (
                <TranslatedModuleCard key={module.id} module={module} i18n={i18n} />
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Logros Recientes */}
          <Card>
            <h2 className="text-xl font-bold text-text mb-4">{t('studentDashboard.recentAchievements')}</h2>
            <div className="space-y-3 text-text-secondary text-center">
              Aquí se verán tus logros
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};