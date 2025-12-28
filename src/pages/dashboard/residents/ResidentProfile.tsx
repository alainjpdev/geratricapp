import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Phone, HeartPulse, Activity, AlertTriangle, FileText, Pill, BookOpen } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { residentService, Resident } from '../../../services/residentService';
import { emarService, MedicationOrder } from '../../../services/emarService';
import { medicalService, VitalSign, NursingNote } from '../../../services/medicalService';

const ResidentProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [resident, setResident] = useState<Resident | null>(null);
    const [orders, setOrders] = useState<MedicationOrder[]>([]);
    const [vitals, setVitals] = useState<VitalSign[]>([]);
    const [notes, setNotes] = useState<NursingNote[]>([]);
    const [activeTab, setActiveTab] = useState<'general' | 'medical' | 'medications' | 'vitals' | 'logbook'>('general');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadResident(id);
            loadRelatedData(id);
        }
    }, [id]);

    const loadResident = async (residentId: string) => {
        try {
            setLoading(true);
            const data = await residentService.getResidentById(residentId);
            setResident(data);
        } catch (error) {
            console.error('Failed to load resident', error);
        } finally {
            setLoading(false);
        }
    };

    const loadRelatedData = async (residentId: string) => {
        try {
            const [medsData, vitalsData, notesData] = await Promise.all([
                emarService.getOrdersByResident(residentId),
                medicalService.getVitalsByResident(residentId),
                medicalService.getNotesByResident(residentId)
            ]);
            setOrders(medsData);
            setVitals(vitalsData);
            setNotes(notesData);
        } catch (error) {
            console.error("Failed to load related data", error);
        }
    };

    if (loading && !resident) return <div className="p-6 text-center">Cargando perfil...</div>;
    if (!resident) return <div className="p-6 text-center">Residente no encontrado</div>;

    const age = new Date().getFullYear() - new Date(resident.dateOfBirth).getFullYear();

    const tabs = [
        { id: 'general', label: 'General' },
        { id: 'medical', label: 'Médico' },
        { id: 'medications', label: `Medicamentos (${orders.length})` },
        { id: 'vitals', label: 'Signos Vitales' },
        { id: 'logbook', label: 'Bitácora' },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link to="/dashboard/residents">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Volver
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Perfil de Residente
                </h1>
            </div>

            {/* Main Info Card */}
            <Card className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-24 h-24 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-3xl shrink-0">
                        {resident.firstName[0]}{resident.lastName[0]}
                    </div>

                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {resident.firstName} {resident.lastName}
                                </h2>
                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                    <span className="flex items-center gap-1">
                                        <User className="w-4 h-4" /> {age} años
                                    </span>
                                    <span>•</span>
                                    <span>Habitación: {resident.roomNumber || 'Sin asignar'}</span>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${resident.status === 'Active' ? 'bg-green-100 text-green-700' :
                                resident.status === 'Hospitalized' ? 'bg-amber-100 text-amber-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                {resident.status}
                            </span>
                        </div>

                        {/* Tabs Toggle */}
                        <div className="flex gap-4 mt-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`pb-2 px-1 text-sm font-medium whitespace-nowrap ${activeTab === tab.id ? 'text-sky-600 border-b-2 border-sky-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Tab Content */}
            {activeTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6 space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white border-b pb-2">
                            <Phone className="w-5 h-5 text-indigo-500" />
                            Contacto
                        </h3>
                        {resident.emergencyContact ? (
                            <div className="space-y-2">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Nombre</label>
                                    <p className="text-gray-900 dark:text-white">{resident.emergencyContact.name}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Teléfono</label>
                                    <p className="text-gray-900 dark:text-white">{resident.emergencyContact.phone}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Relación</label>
                                    <p className="text-gray-900 dark:text-white">{resident.emergencyContact.relation}</p>
                                </div>
                            </div>
                        ) : <p className="text-gray-500">No registrado</p>}
                    </Card>
                </div>
            )}

            {activeTab === 'medical' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6 space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white border-b pb-2">
                            <HeartPulse className="w-5 h-5 text-pink-500" />
                            Información Médica
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Alergias</label>
                                <div className="flex items-center gap-2 mt-1 bg-orange-50 dark:bg-orange-900/10 p-2 rounded text-orange-800 dark:text-orange-300">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>{resident.allergies || 'Ninguna registrada'}</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Condiciones Crónicas</label>
                                <p className="text-gray-700 dark:text-gray-300 mt-1">{resident.conditions || 'Ninguna registrada'}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white border-b pb-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            Plan de Cuidado
                        </h3>

                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Resumen</label>
                            <p className="text-gray-700 dark:text-gray-300 mt-2 leading-relaxed bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                {resident.carePlanSummary || 'No hay plan de cuidado registrado.'}
                            </p>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'medications' && (
                <div className="space-y-6">
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                                <Pill className="w-5 h-5 text-purple-500" />
                                Medicamentos Activos
                            </h3>
                            <Button size="sm">Nueva Receta</Button>
                        </div>

                        {orders.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No hay medicamentos activos.</p>
                        ) : (
                            <div className="space-y-3">
                                {orders.map(order => (
                                    <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{order.medicationName} {order.dosage}</p>
                                            <p className="text-sm text-gray-500">{order.route} • {order.frequency}</p>
                                            {order.instructions && <p className="text-xs text-amber-600 mt-1">{order.instructions}</p>}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Activo</span>
                                            <p className="text-xs text-gray-400 mt-1">Inicio: {new Date(order.startDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {activeTab === 'vitals' && (
                <div className="space-y-6">
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                                <Activity className="w-5 h-5 text-red-500" />
                                Historial de Signos Vitales
                            </h3>
                        </div>
                        {vitals.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No hay registros de signos vitales.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase font-medium">
                                        <tr>
                                            <th className="px-4 py-2">Fecha</th>
                                            <th className="px-4 py-2">P/A</th>
                                            <th className="px-4 py-2">FC</th>
                                            <th className="px-4 py-2">Temp</th>
                                            <th className="px-4 py-2">Sat O2</th>
                                            <th className="px-4 py-2">Glucosa</th>
                                            <th className="px-4 py-2">Registrado por</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {vitals.map(v => (
                                            <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                                                    {new Date(v.recordedAt).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3">{v.bloodPressureSystolic}/{v.bloodPressureDiastolic}</td>
                                                <td className="px-4 py-3">{v.heartRate} bpm</td>
                                                <td className="px-4 py-3">{v.temperature}°C</td>
                                                <td className="px-4 py-3">{v.oxygenSaturation}%</td>
                                                <td className="px-4 py-3">{v.glucose || '-'}</td>
                                                <td className="px-4 py-3 text-gray-500 text-xs">{(v as any).recorderName}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {activeTab === 'logbook' && (
                <div className="space-y-6">
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                                <BookOpen className="w-5 h-5 text-amber-500" />
                                Bitácora Personal
                            </h3>
                        </div>

                        {notes.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No hay entradas en la bitácora.</p>
                        ) : (
                            <div className="space-y-4">
                                {notes.map(note => (
                                    <div key={note.id} className="flex gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${note.category === 'Incident' ? 'bg-red-100 text-red-700' :
                                                        note.category === 'Medical' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-200 text-gray-700'
                                                    }`}>
                                                    {note.category}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(note.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-gray-800 dark:text-gray-200 mt-1">{note.content}</p>
                                            <p className="text-xs text-gray-500 mt-2">Registrado por: {note.author?.firstName} {note.author?.lastName}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
};

export default ResidentProfile;
