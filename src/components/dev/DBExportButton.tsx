/**
 * Componente para exportar datos de la base de datos local
 * Solo visible en modo desarrollo
 */

import { useState } from 'react';
import { exportLocalDB, clearLocalDB } from '../../db/localDB';
import { Download, Trash2, Check, Database } from 'lucide-react';
import { USE_LOCAL_DB } from '../../config/devMode';

export const DBExportButton = () => {
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Solo mostrar en modo desarrollo con base local
  if (!USE_LOCAL_DB) {
    return null;
  }

  const handleExport = async () => {
    setExporting(true);
    setMessage(null);
    
    try {
      const data = await exportLocalDB();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `local-db-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage('✅ Datos exportados correctamente');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error exportando:', error);
      setMessage('❌ Error al exportar datos');
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setExporting(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('¿Estás seguro de que quieres limpiar toda la base de datos local? Esta acción no se puede deshacer.')) {
      return;
    }

    setClearing(true);
    setMessage(null);
    
    try {
      await clearLocalDB();
      setMessage('✅ Base de datos local limpiada');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error limpiando:', error);
      setMessage('❌ Error al limpiar base de datos');
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="hidden fixed bottom-4 left-4 z-50 bg-yellow-100 border border-yellow-400 rounded-lg p-3 shadow-lg max-w-xs">
      <div className="text-xs font-semibold text-yellow-800 mb-2 flex items-center gap-1">
        <Database className="w-3 h-3" />
        Modo Desarrollo - Base Local
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center justify-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
        >
          <Download className="w-3 h-3" />
          {exporting ? 'Exportando...' : 'Exportar DB'}
        </button>
        <button
          onClick={handleClear}
          disabled={clearing}
          className="flex items-center justify-center gap-1 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
        >
          <Trash2 className="w-3 h-3" />
          {clearing ? 'Limpiando...' : 'Limpiar DB'}
        </button>
      </div>
      {message && (
        <div className="mt-2 text-xs text-yellow-800 flex items-center gap-1">
          <Check className="w-3 h-3" />
          {message}
        </div>
      )}
    </div>
  );
};

