import React from 'react';
import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export const PlaceholderPage: React.FC = () => {
    const location = useLocation();

    // Convert path to readable title
    // e.g. /dashboard/care-plans -> Care Plans
    const title = location.pathname
        .split('/')
        .pop()
        ?.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') || 'Page';

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    {title}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    GeriatricApp Module
                </p>
            </div>

            <Card className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-sky-100 dark:bg-sky-900/30 p-4 rounded-full mb-6 relative">
                    <Construction className="w-12 h-12 text-sky-600 dark:text-sky-400" />
                </div>

                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    Módulo en Construcción
                </h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6">
                    Estamos trabajando implementando la funcionalidad para <strong>{title}</strong>.
                    Pronto estará disponible para su uso.
                </p>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-left max-w-md w-full border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Detalles Técnicos:</h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                        <li>Ruta: <code className="bg-gray-200 dark:bg-gray-900 px-1 rounded">{location.pathname}</code></li>
                        <li>Estado: Pendiente de implementación</li>
                        <li>Prioridad: Según roadmap</li>
                    </ul>
                </div>
            </Card>
        </div>
    );
};
