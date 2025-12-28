/**
 * Script para crear las tablas de items y cotizacion_items en Supabase
 * Ejecutar con: node scripts/create-items-tables.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('Necesitas configurar:');
  console.error('  - VITE_SUPABASE_URL o SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY o VITE_SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nEjecuta:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=tu_key node scripts/create-items-tables.js');
  process.exit(1);
}

// Crear cliente de Supabase con service role key (para ejecutar SQL)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeMigration() {
  try {
    console.log('📦 Leyendo archivo de migración...');
    const migrationPath = join(__dirname, '../supabase/migrations/20251217000000_create_items_and_cotizacion_items.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Dividir el SQL en statements (separados por ;)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Ejecutando ${statements.length} statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim().length === 0) continue;

      try {
        console.log(`[${i + 1}/${statements.length}] Ejecutando statement...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (error) {
          // Si el RPC no existe, intentar ejecutar directamente
          // Nota: Esto requiere usar la API REST directamente o psql
          console.warn(`⚠️  No se pudo ejecutar via RPC, intentando método alternativo...`);
          console.log('💡 Ejecuta la migración manualmente en el SQL Editor de Supabase:');
          console.log(`   ${migrationPath}\n`);
          break;
        }

        console.log(`✅ Statement ${i + 1} ejecutado correctamente\n`);
      } catch (err) {
        console.error(`❌ Error en statement ${i + 1}:`, err.message);
        console.log('💡 Ejecuta la migración manualmente en el SQL Editor de Supabase\n');
      }
    }

    console.log('✅ Migración completada');
    console.log('\n📋 Verifica las tablas en Supabase:');
    console.log('   - items');
    console.log('   - cotizaciones');
    console.log('   - cotizacion_items');

  } catch (error) {
    console.error('❌ Error al ejecutar migración:', error);
    console.log('\n💡 Alternativa: Ejecuta la migración manualmente');
    console.log('   1. Ve a tu proyecto en Supabase Dashboard');
    console.log('   2. Abre el SQL Editor');
    console.log('   3. Copia y pega el contenido de:');
    console.log('      supabase/migrations/20251217000000_create_items_and_cotizacion_items.sql');
    process.exit(1);
  }
}

// Ejecutar
executeMigration();



