import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../config/supabaseClient';
import { Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const RestrictedUsers: React.FC = () => {
    const { t } = useTranslation();
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const loadUsers = async () => {
            if (currentUser?.email !== 'ark2784@gmail.com') {
                setErrorMsg('Acceso denegado. Este componente es exclusivo para ark2784@gmail.com');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                // Correctly query the 'users' table which is the actual table name
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .order('email');

                if (error) throw error;

                // Pass the raw data directly to see ALL columns including 'grupoasignado'
                // We can still try to derive some common fields for easier searching if strictly needed,
                // but for "show me all info", raw data is best.
                setUsers(data || []);
                setLoading(false);
            } catch (err: any) {
                console.error('Error loading users:', err);
                setErrorMsg('Error al cargar usuarios');
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            loadUsers();
        }
    }, [currentUser]);

    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Get all unique keys from all users to ensure we show all columns
    const hiddenColumns = ['id', 'avatar', 'password_hash', 'created_at', 'updated_at', 'encrypted_password'];
    const allKeys = Array.from(new Set(users.reduce((keys: string[], user: any) => [...keys, ...Object.keys(user)], [])))
        .filter(key => !hiddenColumns.includes(key)) as string[];

    // Extract unique roles and statuses for filter options
    const uniqueRoles = Array.from(new Set(users.map(u => u.role || u.rol || ''))).filter(Boolean);
    const uniqueStatuses = Array.from(new Set(users.map(u => String(u.status !== undefined ? u.status : (u.activo !== undefined ? u.activo : ''))))).filter(Boolean);

    const filteredUsers = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();

        // Filter by Role
        if (roleFilter !== 'all') {
            const userRole = user.role || user.rol || '';
            if (userRole !== roleFilter) return false;
        }

        // Filter by Status
        if (statusFilter !== 'all') {
            const userStatus = String(user.status !== undefined ? user.status : (user.activo !== undefined ? user.activo : ''));
            if (userStatus !== statusFilter) return false;
        }

        // Search across ALL values
        return Object.values(user).some(val =>
            String(val).toLowerCase().includes(searchLower)
        );
    });

    if (errorMsg) {
        return (
            <div className="p-6">
                <Card className="bg-red-900/20 border-red-800">
                    <div className="p-4 text-red-500 font-bold text-center">
                        {errorMsg}
                    </div>
                </Card>
            </div>
        );
    }

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

    const handleEditClick = (user: any) => {
        setEditingId(user.id);
        setEditForm({ ...user });
        setSaveError(null);
        setSaveSuccess(null);
    };

    const handleCancelClick = () => {
        setEditingId(null);
        setEditForm({});
        setSaveError(null);
        setSaveSuccess(null);
    };

    const handleInputChange = (key: string, value: any) => {
        setEditForm((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSaveClick = async () => {
        if (!editingId) return;
        setSaveError(null);
        setSaveSuccess(null);

        try {
            // Prepare update data - excluding read-only fields that might be in the form
            // We only update fields that are in 'allKeys' (which filters restricted ones)
            const updateData: any = {};
            allKeys.forEach(key => {
                if (editForm[key] !== undefined) {
                    updateData[key] = editForm[key];
                }
            });

            // Map frontend naming back to DB naming if needed
            // But we fetched raw data using 'select *', so keys should match DB columns exactly
            // except for the mapped ones?
            // Wait, in previous steps I removed the mapping and set 'data' directly.
            // So `allKeys` are actual DB column names. Excellent.

            const { error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', editingId);

            if (error) throw error;

            // Update local state
            setUsers(prev => prev.map(u => u.id === editingId ? { ...u, ...updateData } : u));
            setEditingId(null);
            console.log('Usuario actualizado correctamente en Supabase:', updateData);
            setSaveSuccess('Usuario actualizado correctamente en la base de datos.');

            // Auto-clear success message after 3 seconds
            setTimeout(() => setSaveSuccess(null), 3000);
        } catch (err: any) {
            console.error('Error updating user:', err);
            setSaveError('Error al guardar: ' + err.message);
        }
    };

    const renderCellInput = (key: string, value: any) => {
        // Dropdown cases
        if (key === 'role' || key === 'rol') {
            return (
                <select
                    value={value}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                    <option value="parent">Parent</option>
                    <option value="productor">Productor</option>
                    <option value="coordinador">Coordinador</option>
                </select>
            );
        }

        if (key === 'status' || key === 'activo') {
            return (
                <select
                    value={String(value)}
                    onChange={(e) => handleInputChange(key, e.target.value === 'true' || e.target.value === 'active')}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                    <option value="active">Active (String)</option>
                    <option value="suspended">Suspended</option>
                </select>
            );
        }

        // Generic Input
        return (
            <input
                type="text"
                value={value ?? ''}
                onChange={(e) => handleInputChange(key, e.target.value)}
                className="w-full bg-white text-gray-900 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
            />
        );
    };

    return (
        <div className="space-y-4 md:space-y-6 bg-white min-h-screen p-0 md:p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex-none p-4 md:p-0">
                <h1 className="text-xl md:text-3xl font-bold uppercase text-gray-900 mb-0 md:mb-2">
                    Restricted Users List (Full View)
                </h1>
                <p className="text-gray-600 uppercase text-sm">
                    Exclusive view for ark2784@gmail.com - Editable
                </p>
                {saveError && <p className="text-red-500 font-bold mt-2">{saveError}</p>}
                {saveSuccess && <p className="text-green-600 font-bold mt-2 bg-green-50 border border-green-200 p-2 rounded inline-block">{saveSuccess}</p>}
            </div>

            {/* Búsqueda y Filtros */}
            <Card className="bg-white border-gray-200 mx-4 md:mx-0 shadow-sm" padding="none">
                <div className="p-3 md:p-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 md:pl-10 pr-3 py-1.5 md:py-2 text-sm md:text-base border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase placeholder-gray-400"
                        />
                    </div>

                    {/* Filtro por Rol */}
                    <div className="w-full md:w-48">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full px-3 py-1.5 md:py-2 text-sm md:text-base border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                        >
                            <option value="all">Role: All</option>
                            {uniqueRoles.map(role => (
                                <option key={role as string} value={role as string}>{role as string}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro por Status */}
                    <div className="w-full md:w-48">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-1.5 md:py-2 text-sm md:text-base border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                        >
                            <option value="all">Status: All</option>
                            {uniqueStatuses.map(status => (
                                <option key={status as string} value={status as string}>{status as string}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Tabla de Usuarios */}
            <Card className="bg-white border-gray-200 shadow-sm">
                <div className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-4 font-bold text-gray-700 uppercase whitespace-nowrap">Actions</th>
                                {allKeys.map((key: string) => (
                                    <th key={key} className="text-left py-3 px-4 font-bold text-gray-700 uppercase whitespace-nowrap">
                                        {key}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={allKeys.length + 1} className="py-6 text-center text-gray-900 uppercase">{t('loading', 'Cargando...')}</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={allKeys.length + 1} className="py-6 text-center text-gray-900 uppercase">{t('adminDashboard.noUsers', 'No hay usuarios')}</td></tr>
                            ) : (
                                filteredUsers.map((user: any, idx: number) => {
                                    const isEditing = editingId === user.id;
                                    return (
                                        <tr key={user.id || idx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4 whitespace-nowrap sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                                {isEditing ? (
                                                    <div className="flex gap-2">
                                                        <button onClick={handleSaveClick} className="text-green-600 hover:text-green-700 font-bold text-xs uppercase border border-green-600 bg-green-50 px-2 py-1 rounded">Save</button>
                                                        <button onClick={handleCancelClick} className="text-red-600 hover:text-red-700 font-bold text-xs uppercase border border-red-600 bg-red-50 px-2 py-1 rounded">Cancel</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => handleEditClick(user)} className="text-blue-600 hover:text-blue-700 font-bold text-xs uppercase border border-blue-600 bg-blue-50 px-2 py-1 rounded">Edit</button>
                                                )}
                                            </td>
                                            {allKeys.map((key: string) => (
                                                <td key={`${user.id || idx}-${key}`} className="py-3 px-4 text-gray-900 whitespace-nowrap">
                                                    {isEditing ? (
                                                        renderCellInput(key, editForm[key])
                                                    ) : (
                                                        typeof user[key] === 'object' ? JSON.stringify(user[key]) : String(user[key] ?? '-')
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default RestrictedUsers;
