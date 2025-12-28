/**
 * Script para ejecutar la migración SQL directamente en Supabase
 * Ejecutar con: node scripts/run-sql-migration.js
 */

import { createClient } from '@supabase/supabase-js';
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
  console.error('\n💡 La service_role_key la encuentras en:');
  console.error('   Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function executeSQL(sql) {
  try {
    // Intentar ejecutar usando la función exec_sql si existe
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sql 
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    // Si la función RPC no existe, intentar método alternativo
    throw new Error(`No se puede ejecutar SQL directamente: ${error.message}`);
  }
}

async function runMigration() {
  try {
    console.log('🚀 Ejecutando migración SQL en Supabase...\n');

    const migrationPath = join(__dirname, '../supabase/migrations/20251217000000_create_items_and_cotizacion_items.sql');
    console.log('📖 Leyendo migración:', migrationPath);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Dividir el SQL en statements ejecutables
    // Necesitamos dividir por punto y coma, pero respetar funciones y bloques
    const statements = [];
    let currentStatement = '';
    let inFunction = false;
    let dollarQuote = null;

    for (let i = 0; i < migrationSQL.length; i++) {
      const char = migrationSQL[i];
      const nextChars = migrationSQL.substring(i, i + 2);

      // Detectar inicio de función con $$
      if (nextChars === '$$' && !dollarQuote) {
        dollarQuote = '$$';
        inFunction = true;
        currentStatement += char;
        i++; // Saltar el siguiente $
        currentStatement += migrationSQL[i];
        continue;
      }

      // Detectar fin de función con $$
      if (nextChars === '$$' && dollarQuote === '$$') {
        dollarQuote = null;
        inFunction = false;
        currentStatement += char;
        i++; // Saltar el siguiente $
        currentStatement += migrationSQL[i];
        continue;
      }

      currentStatement += char;

      // Si encontramos un punto y coma y no estamos en una función, es el fin de un statement
      if (char === ';' && !inFunction) {
        const trimmed = currentStatement.trim();
        // Ignorar comentarios y líneas vacías
        if (trimmed && !trimmed.startsWith('--') && trimmed.length > 5) {
          statements.push(trimmed);
        }
        currentStatement = '';
      }
    }

    // Agregar el último statement si existe
    if (currentStatement.trim() && !currentStatement.trim().startsWith('--')) {
      statements.push(currentStatement.trim());
    }

    console.log(`📝 Encontrados ${statements.length} statements para ejecutar\n`);

    // Intentar ejecutar cada statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Saltar comentarios
      if (statement.trim().startsWith('--') || statement.trim().length < 10) {
        continue;
      }

      try {
        console.log(`[${i + 1}/${statements.length}] Ejecutando...`);
        
        // Intentar ejecutar usando RPC
        await executeSQL(statement);
        
        successCount++;
        console.log(`✅ Statement ${i + 1} ejecutado\n`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error en statement ${i + 1}:`, error.message);
        
        // Si el primer statement falla, probablemente no existe la función RPC
        if (i === 0) {
          console.log('\n⚠️  No se puede ejecutar SQL directamente desde el cliente');
          console.log('💡 Ejecuta el SQL manualmente en Supabase SQL Editor\n');
          break;
        }
      }
    }

    if (errorCount > 0 && successCount === 0) {
      console.log('\n📋 INSTRUCCIONES PARA EJECUTAR MANUALMENTE:\n');
      console.log('1. Ve a: https://supabase.com/dashboard');
      console.log('2. Selecciona tu proyecto');
      console.log('3. Ve a: SQL Editor (en el menú lateral)');
      console.log('4. Copia y pega el contenido completo de:');
      console.log(`   ${migrationPath}`);
      console.log('5. Haz clic en "Run" o presiona Cmd+Enter (Mac) / Ctrl+Enter (Windows)\n');
      console.log('✅ Después de ejecutar el SQL, puedes verificar con:');
      console.log('   npm run setup-items\n');
    } else if (successCount > 0) {
      console.log(`\n✅ Migración completada: ${successCount} statements ejecutados`);
      console.log(`❌ Errores: ${errorCount}`);
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.log('\n💡 Ejecuta el SQL manualmente en el SQL Editor de Supabase');
    console.log(`   Archivo: supabase/migrations/20251217000000_create_items_and_cotizacion_items.sql`);
  }
}

runMigration();

