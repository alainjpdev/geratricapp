import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabaseClient';
import { updatePassword } from '../../services/authService';
import { Save, User as UserIcon, Mail, Shield, Lock } from 'lucide-react';

const Configuration: React.FC = () => {
    const { user, setUser } = useAuthStore();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        fontSize: 16 // Default value
    });

    // Estado para cambio de contraseña
    const [pwdData, setPwdData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(false);
    const [pwdLoading, setPwdLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                fontSize: user.fontSize || 16
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePwdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPwdData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('users')
                .update({
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    font_size: formData.fontSize
                })
                .eq('id', user.id);

            if (error) throw error;

            // Update local state and auth store
            const updatedUser = { ...user, ...formData };
            setUser(updatedUser);

            setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });

            // Clear success message after 3 seconds
            setTimeout(() => setMessage(null), 3000);

        } catch (error: any) {
            console.error('Error actualizando perfil:', error);
            setMessage({ type: 'error', text: 'Error al actualizar perfil: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (pwdData.newPassword !== pwdData.confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
            return;
        }

        if (pwdData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
            return;
        }

        setPwdLoading(true);
        setMessage(null);

        try {
            await updatePassword(user.id, pwdData.newPassword);
            setMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' });
            setPwdData({ newPassword: '', confirmPassword: '' });

            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Error al actualizar contraseña: ' + error.message });
        } finally {
            setPwdLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="p-6">
                <Card className="bg-red-50 border-red-200">
                    <div className="p-4 text-red-600 text-center uppercase font-bold">
                        Usuario no autenticado.
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 bg-white dark:bg-black min-h-screen p-6 overflow-y-auto">
            <div className="flex-none">
                <h1 className="text-3xl font-bold uppercase dark:text-white text-gray-900 mb-2">
                    Configuración
                </h1>
                <p className="dark:text-gray-400 text-gray-600 text-sm uppercase">
                    Gestiona tu perfil y actualiza tu información personal.
                </p>
                {message && (
                    <div className={`mt-4 p-3 rounded-lg border uppercase text-xs font-bold ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'}`}>
                        {message.text}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Editable Personal Information */}
                <Card className="dark:bg-black bg-white dark:border-white/20 border-gray-200 shadow-sm">
                    <form onSubmit={handleSave}>
                        <div className="border-b dark:border-white/10 border-gray-100 p-4 mb-4">
                            <h2 className="text-lg font-bold dark:text-white text-gray-800 flex items-center gap-2 uppercase">
                                <UserIcon className="w-5 h-5 text-sky-500" />
                                Información Personal
                            </h2>
                        </div>
                        <div className="space-y-4 px-4 pb-6">
                            <div>
                                <label htmlFor="firstName" className="block text-xs font-semibold dark:text-gray-400 text-gray-700 uppercase mb-1">Nombre</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border dark:border-white/20 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:text-white text-gray-900 dark:bg-white/5 bg-white uppercase"
                                    placeholder="Tu nombre"
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-xs font-semibold dark:text-gray-400 text-gray-700 uppercase mb-1">Apellido</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border dark:border-white/20 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:text-white text-gray-900 dark:bg-white/5 bg-white uppercase"
                                    placeholder="Tu apellido"
                                />
                            </div>

                            {/* Font Size Configuration */}
                            <div>
                                <label htmlFor="fontSize" className="block text-xs font-semibold dark:text-gray-400 text-gray-700 uppercase mb-1">Tamaño de Letra (px)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        id="fontSize"
                                        name="fontSize"
                                        min="12"
                                        max="24"
                                        step="1"
                                        value={formData.fontSize || 16}
                                        onChange={(e) => setFormData(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                    />
                                    <span className="text-sm font-bold dark:text-white text-gray-900 min-w-[3ch]">
                                        {formData.fontSize || 16}px
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 uppercase">Ajusta el tamaño de letra de la aplicación.</p>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`flex items-center gap-2 px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold uppercase text-sm rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Save className="w-4 h-4" />
                                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    </form>
                </Card>

                {/* Password Change */}
                <Card className="dark:bg-black bg-white dark:border-white/20 border-gray-200 shadow-sm">
                    <form onSubmit={handleUpdatePassword}>
                        <div className="border-b dark:border-white/10 border-gray-100 p-4 mb-4">
                            <h2 className="text-lg font-bold dark:text-white text-gray-800 flex items-center gap-2 uppercase">
                                <Lock className="w-5 h-5 text-sky-500" />
                                Cambiar Contraseña
                            </h2>
                        </div>
                        <div className="space-y-4 px-4 pb-6">
                            <div>
                                <label htmlFor="newPassword" className="block text-xs font-semibold dark:text-gray-400 text-gray-700 uppercase mb-1">Nueva Contraseña</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    name="newPassword"
                                    value={pwdData.newPassword}
                                    onChange={handlePwdChange}
                                    className="w-full px-3 py-2 border dark:border-white/20 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:text-white text-gray-900 dark:bg-white/5 bg-white"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-xs font-semibold dark:text-gray-400 text-gray-700 uppercase mb-1">Confirmar Contraseña</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={pwdData.confirmPassword}
                                    onChange={handlePwdChange}
                                    className="w-full px-3 py-2 border dark:border-white/20 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:text-white text-gray-900 dark:bg-white/5 bg-white"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={pwdLoading}
                                    className={`flex items-center gap-2 px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold uppercase text-sm rounded-lg transition-colors ${pwdLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Lock className="w-4 h-4" />
                                    {pwdLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                                </button>
                            </div>
                        </div>
                    </form>
                </Card>

                {/* Read-Only Information */}
                <Card className="dark:bg-black bg-white dark:border-white/20 border-gray-200 shadow-sm md:col-span-2">
                    <div className="border-b dark:border-white/10 border-gray-100 p-4 mb-4">
                        <h2 className="text-lg font-bold dark:text-white text-gray-800 flex items-center gap-2 uppercase">
                            <Shield className="w-5 h-5 text-sky-500" />
                            Información de la Cuenta
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 pb-6">
                        <div>
                            <label className="block text-xs font-semibold dark:text-gray-400 text-gray-700 uppercase mb-1">Email</label>
                            <div className="flex items-center gap-2 px-3 py-2 dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 rounded-lg dark:text-white text-gray-600">
                                <Mail className="w-4 h-4 text-sky-400" />
                                {user.email}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold dark:text-gray-400 text-gray-700 uppercase mb-1">Rol</label>
                            <div className="px-3 py-2 dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 rounded-lg dark:text-white text-gray-600 uppercase">
                                {user.role}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold dark:text-gray-400 text-gray-700 uppercase mb-1">ID de Usuario</label>
                            <div className="px-3 py-2 dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 rounded-lg dark:text-gray-400 text-gray-500 text-xs font-mono truncate">
                                {user.id}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold dark:text-gray-400 text-gray-700 uppercase mb-1">Grupo Asignado</label>
                            <div className="px-3 py-2 dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 rounded-lg dark:text-white text-gray-600 uppercase">
                                {user.grupoAsignado || 'N/A'}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Configuration;
