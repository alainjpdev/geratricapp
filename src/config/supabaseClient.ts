import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
// Usar la nueva publishable key (antes anon key)
// También soporta VITE_SUPABASE_ANON_KEY para compatibilidad
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[Supabase] Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. ' +
    'Configúralas en tu archivo de entorno (.env.local, .env.development, etc.). ' +
    'Nota: También puedes usar VITE_SUPABASE_ANON_KEY para compatibilidad con keys antiguas.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);


