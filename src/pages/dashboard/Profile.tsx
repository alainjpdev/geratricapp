import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabaseClient';

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { user: authUser, setUser } = useAuthStore();

  const [firstName, setFirstName] = useState(authUser?.firstName || 'Usuario');
  const [lastName, setLastName] = useState(authUser?.lastName || '');
  const [email, setEmail] = useState(authUser?.email || '');
  const [avatar, setAvatar] = useState(authUser?.avatar || '');
  const [role] = useState(authUser?.role || 'admin');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Efecto para sincronizar estado local cuando cambia el usuario del store
  useEffect(() => {
    if (authUser) {
      setFirstName(authUser.firstName || '');
      setLastName(authUser.lastName || '');
      setEmail(authUser.email || '');
      setAvatar(authUser.avatar || '');
    }
  }, [authUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!authUser) {
      setError('No hay usuario autenticado');
      setLoading(false);
      return;
    }

    try {
      // Actualizar usuario en la tabla users
      const { data, error } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          avatar: avatar,
          // role: role // Generalmente no dejamos que el usuario cambie su propio rol aquí
        })
        .eq('id', authUser.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Error al actualizar el perfil en la base de datos');
      }

      if (data) {
        const updatedUser = {
          ...authUser,
          firstName: data.first_name,
          lastName: data.last_name,
          avatar: data.avatar,
        };
        // Actualizar el store
        setUser(updatedUser);
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-text mb-6">{t('adminDashboard.profile', 'Perfil de Usuario')}</h1>
      <Card className="p-6 flex flex-col items-center">
        <form className="w-full max-w-md" onSubmit={handleSubmit}>
          <div className="flex flex-col items-center mb-4">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-purple-500" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center border-2 border-purple-500">
                <User className="w-12 h-12 text-purple-500" />
              </div>
            )}
            <input
              type="text"
              className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-center"
              placeholder="URL del avatar"
              value={avatar}
              onChange={e => setAvatar(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-text font-medium mb-1">Nombre</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-text font-medium mb-1">Apellido</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-text font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-text font-medium mb-1">Rol</label>
            <input
              type="text"
              className="w-full border border-border rounded-lg px-3 py-2 bg-panel text-text-secondary"
              value="Administrador"
              disabled
            />
          </div>
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
          {success && <p className="text-green-600 mt-2 text-sm">¡Perfil actualizado!</p>}
          <Button type="submit" className="w-full mt-4" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Cambios'}</Button>
        </form>
      </Card>
    </div>
  );
};

export default Profile; 