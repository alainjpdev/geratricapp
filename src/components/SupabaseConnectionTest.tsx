import { useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';

export const SupabaseConnectionTest = () => {
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🔌 Probando conexión con Supabase (auth.getSession)...');
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Error al conectar con Supabase:', error);
          setStatus('error');
          setMessage(error.message);
          return;
        }

        console.log('✅ Conexión a Supabase OK. Datos de sesión:', data);
        setStatus('ok');
        setMessage('Conexión OK');
      } catch (err: any) {
        console.error('❌ Error inesperado en la prueba de Supabase:', err);
        setStatus('error');
        setMessage(err?.message || 'Error inesperado');
      }
    };

    void testConnection();
  }, []);

  if (status === 'idle') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-md bg-slate-900/90 px-3 py-2 text-xs text-white shadow-lg">
      <div className="font-semibold">Supabase test: {status === 'ok' ? 'OK ✅' : 'ERROR ❌'}</div>
      {message && <div className="mt-1 text-[10px] opacity-80 break-all">{message}</div>}
    </div>
  );
};


