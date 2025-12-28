import React from 'react';
import { useLocation } from 'react-router-dom';

export const TestNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Test de Navegación</h1>
      
      <div className="bg-green-100 p-4 rounded-lg">
        <p className="text-green-800">
          <strong>Ruta actual:</strong> {location.pathname}
        </p>
        <p className="text-green-800">
          <strong>Estado:</strong> La navegación está funcionando correctamente
        </p>
      </div>

      {/* Test de Google OAuth eliminado */}
    </div>
  );
};
