/**
 * Script para ejecutar SQL directamente usando el cliente de Supabase
 * Ejecutar con: node scripts/execute-sql-direct.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Error: VITE_SUPABASE_URL no está configurado');
  console.error('Agrega VITE_SUPABASE_URL a tu archivo .env');
  process.exit(1);
}

// Usar service_role_key si está disponible, sino usar anon_key
const supabaseKey = supabaseServiceKey || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Error: No hay clave de Supabase configurada');
  console.error('Necesitas VITE_SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL() {
  try {
    console.log('📖 Leyendo archivo SQL...');
    const sqlPath = join(__dirname, '../supabase/migrations/20251217000000_create_items_and_cotizacion_items.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('⚠️  Supabase no permite ejecutar SQL arbitrario desde el cliente JavaScript');
    console.log('💡 Ejecuta el SQL manualmente:\n');
    console.log('OPCIÓN 1: En Supabase Dashboard');
    console.log('   1. Ve a tu proyecto en https://supabase.com/dashboard');
    console.log('   2. Abre "SQL Editor"');
    console.log('   3. Copia y pega el contenido de:');
    console.log(`      ${sqlPath}\n`);

    console.log('OPCIÓN 2: Usando psql (si tienes la conexión directa)');
    console.log('   psql "tu_connection_string" < supabase/migrations/20251217000000_create_items_and_cotizacion_items.sql\n');

    console.log('OPCIÓN 3: Usando Supabase CLI');
    console.log('   supabase db push\n');

    // Intentar verificar si las tablas ya existen
    console.log('\n🔍 Verificando si las tablas ya existen...');
    const { data, error } = await supabase
      .from('items')
      .select('id')
      .limit(1);

    if (!error) {
      console.log('✅ La tabla "items" ya existe');
      const { count } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true });
      console.log(`📊 Items actuales: ${count}`);
    } else {
      console.log('❌ Las tablas no existen aún');
      console.log('   Ejecuta el SQL primero usando una de las opciones arriba');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

executeSQL();



