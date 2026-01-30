import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { BookOpen, Mail, Lock, Eye, EyeOff, Heart } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { useDarkMode } from '../hooks/useDarkMode';
import logo from '../assets/logolp.png';
import logoWhite from '../assets/logolpwhite.png';

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [dark] = useDarkMode();
  const currentLogo = dark ? logo : logoWhite;

  const { register, handleSubmit, formState: { errors } } = useForm();
  const onSubmit = async (data: any) => {
    console.log('Submit ejecutado', data);
    setIsLoading(true);
    setError('');
    try {
      await login(data.email, data.password);
      // Siempre redirigir al dashboard principal después del login
      navigate('/dashboard', { replace: true });
    }
    catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    }
    finally {
      setIsLoading(false);
    }
  };
  return (<div className="min-h-screen bg-white flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4 gap-2">
          <div className="bg-sky-100 p-3 rounded-full">
            <Heart className="h-8 w-8 text-sky-500" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">GeriApp</h2>
        <p className="text-slate-600 text-lg font-medium">Ingresa a tu cuenta</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Bloque de credenciales de prueba eliminado */}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="email" {...register('email', {
                required: 'Correo Electrónico es requerido',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Correo Electrónico inválido'
                }
              })} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-gray-400" placeholder="tu@email.com" />
            </div>
            {typeof errors.email?.message === 'string' && (<p className="mt-1 text-sm text-red-600">{errors.email.message}</p>)}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type={showPassword ? 'text' : 'password'} {...register('password', { required: 'Contraseña es requerida' })} className="w-full pl-10 pr-10 py-2.5 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-gray-400" placeholder="••••••••" />
              <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                <span className="sr-only">{showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}</span>
              </button>
            </div>
            {typeof errors.password?.message === 'string' && (<p className="mt-1 text-sm text-red-600">{errors.password.message}</p>)}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading} size="lg">
            Iniciar Sesión
          </Button>
        </form>

        <div className="mt-6 text-center">
          {/* <p className="text-gray-600 text-sm">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-sky-600 hover:text-sky-700 font-medium underline">
              Regístrate aquí
            </Link>
          </p> */}
        </div>

        <div className="mt-4 text-center">
          <Link
            to="/"
            className="text-gray-600 hover:text-gray-900 font-medium underline transition-colors text-sm"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  </div>);
};
