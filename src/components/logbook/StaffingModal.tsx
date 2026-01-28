import React, { useState, useEffect } from 'react';
import { X, User, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { DailyStaffing } from '../../services/medicalService';

interface StaffingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: DailyStaffing) => void;
    initialData?: DailyStaffing | null;
    residentId: string;
    date: string;
}

export const StaffingModal: React.FC<StaffingModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData,
    residentId,
    date
}) => {
    const [tmNurse, setTmNurse] = useState('');
    const [tvNurse, setTvNurse] = useState('');
    const [tnNurse, setTnNurse] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTmNurse(initialData?.tmNurse || '');
            setTvNurse(initialData?.tvNurse || '');
            setTnNurse(initialData?.tnNurse || '');
        }
    }, [isOpen, initialData]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const data: DailyStaffing = {
                residentId,
                date,
                tmNurse: tmNurse || undefined,
                tvNurse: tvNurse || undefined,
                tnNurse: tnNurse || undefined
            };
            await onSave(data);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Asignar Personal
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Turno Mañana (Enfermero/a)
                        </label>
                        <input
                            type="text"
                            value={tmNurse}
                            onChange={(e) => setTmNurse(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Nombre del enfermero/a..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Turno Tarde (Enfermero/a)
                        </label>
                        <input
                            type="text"
                            value={tvNurse}
                            onChange={(e) => setTvNurse(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="Nombre del enfermero/a..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Turno Noche (Enfermero/a)
                        </label>
                        <input
                            type="text"
                            value={tnNurse}
                            onChange={(e) => setTnNurse(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Nombre del enfermero/a..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Guardar
                    </Button>
                </div>
            </div>
        </div>
    );
};
