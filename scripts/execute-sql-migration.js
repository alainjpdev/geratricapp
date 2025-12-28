/**
 * Script para ejecutar la migración SQL directamente en Supabase
 * Ejecutar con: node scripts/execute-sql-migration.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('\nNecesitas configurar en tu archivo .env:');
  console.error('  VITE_SUPABASE_URL=tu_url_de_supabase');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key');
  process.exit(1);
}

async function executeSQL(sql) {
  // Usar la API REST de Supabase directamente
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({ sql_query: sql })
  });

  if (!response.ok) {
    // Si la función RPC no existe, intentar método alternativo
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json();
}

async function executeMigration() {
  try {
    console.log('🚀 Ejecutando migración SQL...\n');

    const migrationPath = join(__dirname, '../supabase/migrations/20251217000000_create_items_and_cotizacion_items.sql');
    console.log('📖 Leyendo migración:', migrationPath);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Dividir el SQL en statements individuales
    // Remover comentarios y dividir por punto y coma
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        const trimmed = s.trim();
        return trimmed.length > 0 && 
               !trimmed.startsWith('--') && 
               !trimmed.startsWith('COMMENT');
      });

    console.log(`📝 Encontrados ${statements.length} statements para ejecutar\n`);

    // Intentar ejecutar usando la API REST directamente
    // Nota: Supabase no tiene un endpoint directo para ejecutar SQL arbitrario
    // Necesitamos usar psql o el SQL Editor
    
    console.log('⚠️  Supabase no permite ejecutar SQL arbitrario desde la API REST');
    console.log('💡 Ejecuta el SQL manualmente:\n');
    console.log('OPCIÓN 1: SQL Editor de Supabase');
    console.log('   1. Ve a: https://supabase.com/dashboard');
    console.log('   2. Selecciona tu proyecto');
    console.log('   3. Ve a: SQL Editor');
    console.log('   4. Copia y pega el contenido de:');
    console.log(`      ${migrationPath}\n`);
    
    console.log('OPCIÓN 2: CLI de Supabase (si está instalado)');
    console.log('   supabase db push\n');

    // Intentar método alternativo: usar psql si está disponible
    console.log('🔍 Intentando método alternativo con psql...\n');
    
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    // Extraer la conexión de la URL de Supabase
    const dbUrl = process.env.DATABASE_URL;
    
    if (dbUrl) {
      console.log('📡 Intentando ejecutar con psql...');
      try {
        // Ejecutar psql con el SQL
        const { stdout, stderr } = await execAsync(
          `psql "${dbUrl}" -f "${migrationPath}"`
        );
        
        if (stderr && !stderr.includes('NOTICE')) {
          console.error('❌ Error:', stderr);
        } else {
          console.log('✅ SQL ejecutado correctamente con psql');
          console.log(stdout);
          return;
        }
      } catch (error) {
        console.log('⚠️  psql no disponible o error al ejecutar');
        console.log('   Error:', error.message);
      }
    }

    // Si llegamos aquí, mostrar instrucciones manuales
    console.log('\n📋 INSTRUCCIONES MANUALES:\n');
    console.log('1. Abre el archivo de migración:');
    console.log(`   ${migrationPath}\n`);
    console.log('2. Copia TODO el contenido del archivo');
    console.log('3. Ve al SQL Editor de Supabase');
    console.log('4. Pega y ejecuta el SQL\n');
    
    console.log('✅ Después de ejecutar el SQL, puedes insertar items con:');
    console.log('   npm run setup-items\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Ejecuta el SQL manualmente en el SQL Editor de Supabase');
  }
}

executeMigration();

