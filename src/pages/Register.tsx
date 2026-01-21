import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, User, Eye, EyeOff, Heart } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { useDarkMode } from '../hooks/useDarkMode';

export const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { register: registerUser } = useAuthStore();
  const [dark] = useDarkMode();

  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const password = watch('password');

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError('');
    try {
      const { confirmPassword, ...userData } = data;
      await registerUser({ ...userData, role: 'enfermero' });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4 gap-2">
            <div className="bg-sky-100 p-3 rounded-full">
              <Heart className="h-8 w-8 text-sky-500" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">GeriatricApp</h2>
          <p className="text-slate-600 text-lg font-medium">Crea tu cuenta</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Nombre
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    {...register('firstName', {
                      required: 'Nombre es requerido',
                      minLength: {
                        value: 2,
                        message: 'El nombre debe tener al menos 2 caracteres'
                      }
                    })}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4B8B3B] focus:border-[#4B8B3B] placeholder-gray-400"
                    placeholder="Nombre"
                  />
                </div>
                {errors.firstName?.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  {...register('lastName', {
                    required: 'Apellido es requerido',
                    minLength: {
                      value: 2,
                      message: 'El apellido debe tener al menos 2 caracteres'
                    }
                  })}
                  className="w-full px-3 py-2.5 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4B8B3B] focus:border-[#4B8B3B] placeholder-gray-400"
                  placeholder="Apellido"
                />
                {errors.lastName?.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message as string}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  {...register('email', {
                    required: 'Correo Electrónico es requerido',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Correo inválido'
                    }
                  })}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4B8B3B] focus:border-[#4B8B3B] placeholder-gray-400"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              {errors.email?.message && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Contraseña es requerida',
                    minLength: {
                      value: 6,
                      message: 'La contraseña debe tener al menos 6 caracteres'
                    }
                  })}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4B8B3B] focus:border-[#4B8B3B] placeholder-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password?.message && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Confirmar Contraseña es requerido',
                    validate: (value) => value === password || 'Las contraseñas no coinciden'
                  })}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4B8B3B] focus:border-[#4B8B3B] placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword?.message && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message as string}</p>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full" size="lg">
              {isLoading ? 'Registrando...' : 'Registrarse'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-brand-green-medium hover:text-brand-green-dark font-medium underline">
                Inicia sesión
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium underline transition-colors text-sm">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
