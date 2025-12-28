import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabaseClient';
import { Save, User as UserIcon, Mail, Shield } from 'lucide-react';

const Configuration: React.FC = () => {
    const { user, setUser } = useAuthStore();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || ''
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                    last_name: formData.lastName
                })
                .eq('id', user.id);

            if (error) throw error;

            // Update local state and auth store
            const updatedUser = { ...user, ...formData };
            setUser(updatedUser);

            setMessage({ type: 'success', text: 'Profile updated successfully.' });

            // Clear success message after 3 seconds
            setTimeout(() => setMessage(null), 3000);

        } catch (error: any) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: 'Error updating profile: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="p-6">
                <Card className="bg-red-50 border-red-200">
                    <div className="p-4 text-red-600 text-center">
                        User not authenticated.
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 bg-white min-h-screen p-6">
            <div className="flex-none">
                <h1 className="text-3xl font-bold uppercase text-gray-900 mb-2">
                    Configuration
                </h1>
                <p className="text-gray-600 text-sm">
                    View your profile and update your personal information.
                </p>
                {message && (
                    <div className={`mt-4 p-3 rounded-lg border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} font-medium`}>
                        {message.text}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Read-Only Information */}
                <Card className="bg-white border-gray-200 shadow-sm">
                    <div className="border-b border-gray-100 p-4 mb-4">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-gray-500" />
                            Account Information
                        </h2>
                    </div>
                    <div className="space-y-4 px-4 pb-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                                <Mail className="w-4 h-4 text-gray-400" />
                                {user.email}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Role</label>
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 capitalize">
                                {user.role}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">User ID</label>
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-xs font-mono truncate">
                                {user.id}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Assigned Group</label>
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                                {user.grupoAsignado || 'N/A'}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Editable Personal Information */}
                <Card className="bg-white border-gray-200 shadow-sm">
                    <form onSubmit={handleSave}>
                        <div className="border-b border-gray-100 p-4 mb-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <UserIcon className="w-5 h-5 text-gray-500" />
                                Personal Information
                            </h2>
                        </div>
                        <div className="space-y-4 px-4 pb-6">
                            <div>
                                <label htmlFor="firstName" className="block text-xs font-semibold text-gray-700 uppercase mb-1">First Name</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                                    placeholder="Enter your first name"
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-xs font-semibold text-gray-700 uppercase mb-1">Last Name</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                                    placeholder="Enter your last name"
                                />
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-sm rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Save className="w-4 h-4" />
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default Configuration;
