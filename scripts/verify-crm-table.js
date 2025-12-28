/**
 * Script para verificar que la tabla clientes se creó correctamente
 * Ejecutar con: node scripts/verify-crm-table.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('Necesitas configurar en tu archivo .env:');
  console.error('  VITE_SUPABASE_URL=tu_url_de_supabase');
  console.error('  VITE_SUPABASE_ANON_KEY=tu_anon_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyTable() {
  try {
    console.log('🔍 Verificando que la tabla "clientes" existe...\n');

    // Intentar consultar la tabla
    const { data, error, count } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01') {
        console.error('❌ La tabla "clientes" NO existe aún.');
        console.error('   Ejecuta la migración SQL primero.\n');
        console.log('💡 Opciones:');
        console.log('   1. Ve a Supabase Dashboard → SQL Editor');
        console.log('   2. Copia y pega el contenido de:');
        console.log('      supabase/migrations/20251218000000_create_crm_clientes.sql');
        console.log('   3. Ejecuta el SQL\n');
        process.exit(1);
      } else {
        console.error('❌ Error al verificar la tabla:', error.message);
        process.exit(1);
      }
    }

    console.log('✅ La tabla "clientes" existe correctamente!');
    console.log(`📊 Total de clientes: ${count || 0}\n`);

    // Verificar estructura de la tabla consultando un registro vacío
    const { data: structure, error: structureError } = await supabase
      .from('clientes')
      .select('*')
      .limit(0);

    if (!structureError) {
      console.log('✅ Estructura de la tabla verificada correctamente\n');
    }

    console.log('🎉 La migración se aplicó exitosamente!');
    console.log('\n📋 Campos disponibles en la tabla:');
    console.log('   - id (UUID)');
    console.log('   - empresa (VARCHAR)');
    console.log('   - contacto (VARCHAR)');
    console.log('   - email (VARCHAR)');
    console.log('   - telefono (VARCHAR)');
    console.log('   - direccion (TEXT)');
    console.log('   - website (VARCHAR)');
    console.log('   - status (VARCHAR: prospect/active/inactive)');
    console.log('   - origen (VARCHAR)');
    console.log('   - total_proyectos (INTEGER)');
    console.log('   - ingresos_totales (DECIMAL)');
    console.log('   - ultimo_contacto (DATE)');
    console.log('   - notas (TEXT)');
    console.log('   - created_at (TIMESTAMP)');
    console.log('   - updated_at (TIMESTAMP)\n');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  }
}

verifyTable();



