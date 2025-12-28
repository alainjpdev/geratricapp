import React from 'react';
import { Card } from '../../components/ui/Card';
import { MenuManager } from '../../components/layout/MenuManager';
import { useDynamicMenu } from '../../hooks/useDynamicMenu';
import { useAuthStore } from '../../store/authStore';

export const MenuManagement: React.FC = () => {
  const { user } = useAuthStore();
  const { allMenuItems, refreshMenu } = useDynamicMenu(user?.role as 'admin' | 'enfermero' | 'paciente' | 'pariente');
  const [activeTab, setActiveTab] = React.useState<'admin' | 'enfermero' | 'paciente'>('admin');

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center border-red-200 bg-red-50">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600">
            Solo los administradores pueden acceder a esta página.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* Header compacto */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Menús</h1>
          <p className="text-gray-500 text-sm">
            Administra los elementos de navegación para cada rol
          </p>
        </div>
      </div>

      {/* Tabs para roles */}
      <div className="bg-white rounded-lg p-1 border border-gray-200 shadow-sm inline-flex">
        {['admin', 'enfermero', 'paciente'].map((role) => (
          <button
            key={role}
            onClick={() => setActiveTab(role as any)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === role
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
          >
            {role === 'admin' ? 'Administradores' :
              role === 'enfermero' ? 'Enfermeros' : 'Pacientes'}
          </button>
        ))}
      </div>

      {/* Contenido principal - Solo mostrar el rol activo */}
      <div className="transition-all duration-300">
        <Card className="p-6 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800 capitalize">
              Menú de {activeTab === 'admin' ? 'Administradores' : activeTab === 'enfermero' ? 'Enfermeros' : 'Pacientes'}
            </h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
              {allMenuItems.filter(item => item.role === activeTab).length} elementos
            </span>
          </div>
          <MenuManager
            menuItems={allMenuItems.filter(item => item.role === activeTab)}
            onMenuChange={refreshMenu}
            role={activeTab}
          />
        </Card>
      </div>

      {/* Información compacta */}
      <Card className="p-4 bg-blue-50 border border-blue-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-blue-900">Información Rápida</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-blue-800">
          <div className="text-center p-2 bg-white/50 rounded">
            <div className="font-medium text-blue-900">Agregar</div>
            <div>Nuevos elementos</div>
          </div>
          <div className="text-center p-2 bg-white/50 rounded">
            <div className="font-medium text-blue-900">Editar</div>
            <div>Elementos existentes</div>
          </div>
          <div className="text-center p-2 bg-white/50 rounded">
            <div className="font-medium text-blue-900">Visibilidad</div>
            <div>Activar/Desactivar</div>
          </div>
          <div className="text-center p-2 bg-white/50 rounded">
            <div className="font-medium text-blue-900">Eliminar</div>
            <div>Elementos no usados</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
