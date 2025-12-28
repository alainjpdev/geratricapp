/**
 * Script para sincronizar datos de la base de datos local a Supabase
 * Ejecutar cuando estés listo para aplicar cambios a producción
 * 
 * Uso: node scripts/sync-local-to-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Función para sincronizar una tabla
 */
async function syncTable(tableName, data, options = {}) {
  const { clearFirst = false, uniqueKey = 'id' } = options;
  
  console.log(`\n📦 Sincronizando tabla: ${tableName}`);
  console.log(`   Registros a sincronizar: ${data.length}`);

  if (data.length === 0) {
    console.log(`   ⏭️  Sin datos para sincronizar`);
    return;
  }

  try {
    // Si se especifica, limpiar primero
    if (clearFirst) {
      console.log(`   🗑️  Limpiando tabla existente...`);
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .neq(uniqueKey, '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (deleteError) {
        console.warn(`   ⚠️  Error al limpiar: ${deleteError.message}`);
      }
    }

    // Insertar datos
    const { data: inserted, error: insertError } = await supabase
      .from(tableName)
      .upsert(data, { onConflict: uniqueKey });

    if (insertError) {
      console.error(`   ❌ Error al insertar: ${insertError.message}`);
      throw insertError;
    }

    console.log(`   ✅ Sincronizados ${data.length} registros`);
  } catch (error) {
    console.error(`   ❌ Error sincronizando ${tableName}:`, error);
    throw error;
  }
}

/**
 * Función principal
 */
async function syncLocalToSupabase() {
  try {
    console.log('🚀 Iniciando sincronización de base local a Supabase...\n');

    // Leer datos exportados de la base local
    // Nota: Primero debes exportar los datos desde la aplicación
    const exportPath = join(__dirname, '../local-db-export.json');
    
    let localData;
    try {
      const exportContent = readFileSync(exportPath, 'utf-8');
      localData = JSON.parse(exportContent);
      console.log('✅ Datos locales cargados desde export');
    } catch (error) {
      console.error('❌ Error: No se encontró el archivo de exportación local');
      console.error('   💡 Primero exporta los datos desde la aplicación usando la función exportLocalDB()');
      console.error(`   📁 Buscando en: ${exportPath}`);
      process.exit(1);
    }

    // Sincronizar tablas en orden (respetando dependencias)
    await syncTable('users', localData.users || [], { uniqueKey: 'id' });
    await syncTable('classes', localData.classes || [], { uniqueKey: 'id' });
    await syncTable('class_members', localData.classMembers || [], { uniqueKey: 'id' });
    await syncTable('topics', localData.topics || [], { uniqueKey: 'id' });
    await syncTable('stream_items', localData.streamItems || [], { uniqueKey: 'id' });
    await syncTable('assignments', localData.assignments || [], { uniqueKey: 'id' });
    await syncTable('assignment_students', localData.assignmentStudents || [], { uniqueKey: 'id' });
    await syncTable('assignment_submissions', localData.assignmentSubmissions || [], { uniqueKey: 'id' });
    await syncTable('quizzes', localData.quizzes || [], { uniqueKey: 'id' });
    await syncTable('quiz_questions', localData.quizQuestions || [], { uniqueKey: 'id' });
    await syncTable('quiz_students', localData.quizStudents || [], { uniqueKey: 'id' });
    await syncTable('materials', localData.materials || [], { uniqueKey: 'id' });
    await syncTable('material_students', localData.materialStudents || [], { uniqueKey: 'id' });
    await syncTable('attachments', localData.attachments || [], { uniqueKey: 'id' });
    await syncTable('grades', localData.grades || [], { uniqueKey: 'id' });

    console.log('\n' + '='.repeat(50));
    console.log('✅ SINCRONIZACIÓN COMPLETADA');
    console.log('='.repeat(50));
    console.log('\n💡 Los datos de la base local han sido sincronizados a Supabase');
    console.log('   Verifica los datos en el dashboard de Supabase\n');

  } catch (error) {
    console.error('\n❌ Error durante la sincronización:', error);
    process.exit(1);
  }
}

// Ejecutar
syncLocalToSupabase();









