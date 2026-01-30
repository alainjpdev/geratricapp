import React, { useEffect, useState } from 'react';
import { Plus, Search, User } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { residentService, Resident } from '../../../services/residentService';
import { Link } from 'react-router-dom';

const ResidentsDirectory: React.FC = () => {
    const [residents, setResidents] = useState<Resident[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadResidents();
    }, []);

    const loadResidents = async () => {
        try {
            setLoading(true);
            const data = await residentService.getAllResidents();
            setResidents(data);
        } catch (error) {
            console.error('Failed to load residents', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredResidents = residents.filter(r =>
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Directorio de Residentes</h1>
                    <p className="text-gray-500 dark:text-gray-400">Gestión de adultos mayores en la residencia</p>
                </div>
                <Link
                    to="/dashboard?tab=residents"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Residente
                </Link>
            </div>

            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    placeholder="Buscar por nombre o habitación..."
                    className="pl-10 max-w-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-12">Cargando residentes...</div>
            ) : residents.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No hay residentes registrados</h3>
                    <p className="text-gray-500 mb-4">Comienza agregando el primer residente al sistema.</p>
                    <Button>Agregar Residente</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredResidents.map((resident) => (
                        <Link to={`/dashboard/residents/${resident.id}`} key={resident.id}>
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                <div className="flex items-start gap-4 p-4">
                                    <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-lg">
                                        {resident.firstName?.[0] || '?'}{resident.lastName?.[0] || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                            {resident.firstName} {resident.lastName}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Habitación: <span className="font-medium text-gray-700 dark:text-gray-300">{resident.roomNumber || 'N/A'}</span>
                                        </p>
                                        <div className="mt-2 flex gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${resident.status === 'Active' ? 'bg-green-100 text-green-700' :
                                                resident.status === 'Hospitalized' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {resident.status === 'Active' ? 'Activo' : resident.status === 'Hospitalized' ? 'Hospitalizado' : resident.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ResidentsDirectory;
