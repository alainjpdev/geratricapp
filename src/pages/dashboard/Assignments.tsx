import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useTranslation } from 'react-i18next';

const Assignments: React.FC = () => {
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/assignments`)
      .then(res => res.json())
      .then(data => {
        setAssignments(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text mb-6">{t('adminDashboard.allAssignments', 'Todas las Tareas')}</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {/* <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th> */}
                <th className="text-left py-3 px-4 font-medium text-text">Título</th>
                <th className="text-left py-3 px-4 font-medium text-text">Descripción</th>
                <th className="text-left py-3 px-4 font-medium text-text">Clase</th>
                <th className="text-left py-3 px-4 font-medium text-text">Fecha Entrega</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                  {/* <td className="py-3 px-4">{a.id}</td> */}
                  <td className="py-3 px-4">{a.title}</td>
                  <td className="py-3 px-4">{a.description}</td>
                  <td className="py-3 px-4">{a.classId || '-'}</td>
                  <td className="py-3 px-4">{a.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Assignments; 