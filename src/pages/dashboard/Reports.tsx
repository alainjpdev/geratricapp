import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { useTranslation } from 'react-i18next';
import { Users, BookOpen, ClipboardList, BarChart3 } from 'lucide-react';
import { apiClient } from '../../services/api';

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/api/users').then(res => setUsers(res.data));
    apiClient.get('/api/classes').then(res => setClasses(res.data));
    apiClient.get('/api/assignments').then(res => setAssignments(res.data));
    apiClient.get('/api/modules').then(res => setModules(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text mb-6">{t('adminDashboard.reportsQuick', 'Reportes del Sistema')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="text-center">
          <Users className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-text">{users.length}</h3>
          <p className="text-text-secondary">{t('adminDashboard.totalUsers', 'Total Usuarios')}</p>
        </Card>
        <Card className="text-center">
          <BookOpen className="w-8 h-8 text-success mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-text">{classes.length}</h3>
          <p className="text-text-secondary">{t('adminDashboard.classes', { count: classes.length })}</p>
        </Card>
        <Card className="text-center">
          <ClipboardList className="w-8 h-8 text-warning mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-text">{assignments.length}</h3>
          <p className="text-text-secondary">{t('adminDashboard.allAssignments', 'Todas las Tareas')}</p>
        </Card>
        <Card className="text-center">
          <BarChart3 className="w-8 h-8 text-accent mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-text">{modules.length}</h3>
          <p className="text-text-secondary">{t('adminDashboard.allModules', 'Todos los Módulos')}</p>
        </Card>
      </div>
      <Card>
        <h2 className="text-xl font-bold text-text mb-4">{t('adminDashboard.performanceAnalysis', 'Análisis de Rendimiento')}</h2>
        <div className="h-48 flex items-center justify-center text-text-secondary">
          {/* Aquí puedes agregar un gráfico real más adelante */}
          <span>Gráfico de rendimiento próximamente...</span>
        </div>
      </Card>
    </div>
  );
};

export default Reports; 