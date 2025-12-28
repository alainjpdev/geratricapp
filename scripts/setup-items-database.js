/**
 * Script para crear las tablas de items y agregar items de ejemplo
 * Ejecutar con: node scripts/setup-items-database.js
 * 
 * Requiere: VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Cargar variables de entorno
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
  }
});

async function setupDatabase() {
  try {
    console.log('🚀 Iniciando configuración de base de datos...\n');

    // Leer el archivo SQL de migración
    const migrationPath = join(__dirname, '../supabase/migrations/20251217000000_create_items_and_cotizacion_items.sql');
    console.log('📖 Leyendo migración:', migrationPath);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Ejecutar el SQL completo usando la función exec de Supabase
    // Nota: Supabase no tiene un método directo para ejecutar SQL arbitrario desde el cliente
    // Por lo tanto, vamos a crear las tablas usando la API REST directamente
    
    console.log('\n📝 Ejecutando migración SQL...');
    console.log('⚠️  Nota: Este script requiere ejecutar el SQL manualmente en Supabase SQL Editor');
    console.log('   o usar el CLI de Supabase: supabase db push\n');

    // Alternativa: Crear las tablas usando la API REST de Supabase
    // Pero esto es complejo, mejor usar el SQL directamente
    
    console.log('💡 INSTRUCCIONES PARA EJECUTAR LA MIGRACIÓN:\n');
    console.log('1. Ve a tu proyecto en Supabase Dashboard');
    console.log('2. Abre el SQL Editor');
    console.log('3. Copia y pega el contenido del archivo:');
    console.log(`   ${migrationPath}`);
    console.log('\n4. O ejecuta desde la terminal:');
    console.log('   supabase db push\n');

    // Verificar si las tablas ya existen
    console.log('🔍 Verificando si las tablas ya existen...');
    const { data: tables, error: tablesError } = await supabase
      .from('items')
      .select('id')
      .limit(1);

    if (!tablesError && tables) {
      console.log('✅ La tabla "items" ya existe');
      
      // Verificar cuántos items hay
      const { count } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true });
      
      console.log(`📊 Items existentes: ${count}`);
      
      if (count > 0) {
        console.log('⚠️  Ya hay items en la base de datos. ¿Deseas agregar más?');
        console.log('   (Los items duplicados por SKU serán ignorados)\n');
      }
    } else {
      console.log('❌ Las tablas no existen aún. Ejecuta la migración SQL primero.\n');
      return;
    }

    // Insertar items de ejemplo
    console.log('📦 Insertando items de ejemplo...\n');
    
    const items = [
      // Equipos de Audio
      { nombre: 'Bocinas JBL PRX815W', tipo: 'equipo', categoria: 'audio', descripcion: 'Bocinas activas de 15 pulgadas, 1500W', precio_unitario: 2500.00, unidad: 'dia', sku: 'AUD-001', stock_disponible: 8 },
      { nombre: 'Bocinas JBL PRX812W', tipo: 'equipo', categoria: 'audio', descripcion: 'Bocinas activas de 12 pulgadas, 1200W', precio_unitario: 2000.00, unidad: 'dia', sku: 'AUD-002', stock_disponible: 6 },
      { nombre: 'Subwoofer JBL PRX818W', tipo: 'equipo', categoria: 'audio', descripcion: 'Subwoofer activo de 18 pulgadas, 1800W', precio_unitario: 3000.00, unidad: 'dia', sku: 'AUD-003', stock_disponible: 4 },
      { nombre: 'Consola de Audio Digital Yamaha QL5', tipo: 'equipo', categoria: 'audio', descripcion: 'Consola digital de 32 canales con touchscreen', precio_unitario: 3500.00, unidad: 'dia', sku: 'AUD-004', stock_disponible: 2 },
      { nombre: 'Consola de Audio Analógica Soundcraft', tipo: 'equipo', categoria: 'audio', descripcion: 'Consola analógica de 24 canales', precio_unitario: 1800.00, unidad: 'dia', sku: 'AUD-005', stock_disponible: 3 },
      { nombre: 'Micrófonos Inalámbricos Shure SM58', tipo: 'equipo', categoria: 'audio', descripcion: 'Set de 4 micrófonos inalámbricos', precio_unitario: 1200.00, unidad: 'dia', sku: 'AUD-006', stock_disponible: 12 },
      { nombre: 'Sistema de Monitoreo In-Ear', tipo: 'equipo', categoria: 'audio', descripcion: 'Sistema completo de monitoreo in-ear para 4 personas', precio_unitario: 2500.00, unidad: 'dia', sku: 'AUD-007', stock_disponible: 2 },
      
      // Equipos de Iluminación
      { nombre: 'Cabezas Móviles LED 300W', tipo: 'equipo', categoria: 'iluminacion', descripcion: 'Cabezas móviles LED de 300W con gobos y colores RGB', precio_unitario: 800.00, unidad: 'dia', sku: 'ILU-001', stock_disponible: 16 },
      { nombre: 'Cabezas Móviles LED 150W', tipo: 'equipo', categoria: 'iluminacion', descripcion: 'Cabezas móviles LED de 150W compactas', precio_unitario: 500.00, unidad: 'dia', sku: 'ILU-002', stock_disponible: 20 },
      { nombre: 'Par LED RGB 54x3W', tipo: 'equipo', categoria: 'iluminacion', descripcion: 'Par LED RGB de 54x3W con control DMX', precio_unitario: 300.00, unidad: 'dia', sku: 'ILU-003', stock_disponible: 30 },
      { nombre: 'Láser Verde 2W', tipo: 'equipo', categoria: 'iluminacion', descripcion: 'Láser verde de 2W con efectos programables', precio_unitario: 1500.00, unidad: 'dia', sku: 'ILU-004', stock_disponible: 4 },
      { nombre: 'Máquina de Humo Antari', tipo: 'equipo', categoria: 'iluminacion', descripcion: 'Máquina de humo profesional de alto volumen', precio_unitario: 400.00, unidad: 'dia', sku: 'ILU-005', stock_disponible: 8 },
      { nombre: 'Máquina de Burbujas', tipo: 'equipo', categoria: 'iluminacion', descripcion: 'Máquina de burbujas para eventos', precio_unitario: 250.00, unidad: 'dia', sku: 'ILU-006', stock_disponible: 6 },
      { nombre: 'Consola de Iluminación GrandMA2', tipo: 'equipo', categoria: 'iluminacion', descripcion: 'Consola profesional de iluminación', precio_unitario: 4500.00, unidad: 'dia', sku: 'ILU-007', stock_disponible: 1 },
      
      // Equipos de Video
      { nombre: 'Cámara 4K Profesional Sony FX3', tipo: 'equipo', categoria: 'video', descripcion: 'Cámara de video 4K con estabilizador y lentes', precio_unitario: 4000.00, unidad: 'dia', sku: 'VID-001', stock_disponible: 3 },
      { nombre: 'Cámara 4K Canon C200', tipo: 'equipo', categoria: 'video', descripcion: 'Cámara de video 4K profesional', precio_unitario: 3500.00, unidad: 'dia', sku: 'VID-002', stock_disponible: 2 },
      { nombre: 'Cámara GoPro Hero 11', tipo: 'equipo', categoria: 'video', descripcion: 'Cámara de acción 4K', precio_unitario: 500.00, unidad: 'dia', sku: 'VID-003', stock_disponible: 8 },
      { nombre: 'Pantalla LED 3x2m', tipo: 'equipo', categoria: 'video', descripcion: 'Pantalla LED modular de 3x2 metros, pitch 2.6mm', precio_unitario: 8000.00, unidad: 'dia', sku: 'VID-004', stock_disponible: 2 },
      { nombre: 'Proyector 10,000 Lúmenes', tipo: 'equipo', categoria: 'video', descripcion: 'Proyector profesional de 10,000 lúmenes', precio_unitario: 2500.00, unidad: 'dia', sku: 'VID-005', stock_disponible: 4 },
      { nombre: 'Switcher de Video ATEM Mini Pro', tipo: 'equipo', categoria: 'video', descripcion: 'Switcher de video 4K para transmisión', precio_unitario: 1200.00, unidad: 'dia', sku: 'VID-006', stock_disponible: 2 },
      
      // Equipos de Escenografía
      { nombre: 'Escenario Modular 3x3m', tipo: 'equipo', categoria: 'escenografia', descripcion: 'Módulos de escenario de 3x3 metros, altura 60cm', precio_unitario: 1500.00, unidad: 'dia', sku: 'ESC-001', stock_disponible: 20 },
      { nombre: 'Escenario Modular 1.5x1.5m', tipo: 'equipo', categoria: 'escenografia', descripcion: 'Módulos de escenario de 1.5x1.5 metros', precio_unitario: 800.00, unidad: 'dia', sku: 'ESC-002', stock_disponible: 30 },
      { nombre: 'Barandales Metálicos', tipo: 'equipo', categoria: 'escenografia', descripcion: 'Barandales de seguridad para escenario', precio_unitario: 200.00, unidad: 'dia', sku: 'ESC-003', stock_disponible: 50 },
      { nombre: 'Gradas Modulares', tipo: 'equipo', categoria: 'escenografia', descripcion: 'Gradas modulares para público, capacidad 100 personas', precio_unitario: 3000.00, unidad: 'dia', sku: 'ESC-004', stock_disponible: 3 },
      { nombre: 'Backdrop de Tela 6x3m', tipo: 'equipo', categoria: 'escenografia', descripcion: 'Backdrop de tela negra de 6x3 metros', precio_unitario: 500.00, unidad: 'dia', sku: 'ESC-005', stock_disponible: 10 },
      { nombre: 'Cortinas Negras 3x6m', tipo: 'equipo', categoria: 'escenografia', descripcion: 'Cortinas negras para ocultar áreas', precio_unitario: 300.00, unidad: 'dia', sku: 'ESC-006', stock_disponible: 15 },
      
      // Personal Técnico
      { nombre: 'Ingeniero de Audio', tipo: 'personal', categoria: 'audio', descripcion: 'Técnico especializado en audio profesional con experiencia en consolas digitales', precio_unitario: 2500.00, unidad: 'dia', sku: 'PER-001', stock_disponible: null },
      { nombre: 'Técnico de Audio', tipo: 'personal', categoria: 'audio', descripcion: 'Técnico de audio para montaje y operación básica', precio_unitario: 1500.00, unidad: 'dia', sku: 'PER-002', stock_disponible: null },
      { nombre: 'Técnico de Iluminación', tipo: 'personal', categoria: 'iluminacion', descripcion: 'Técnico especializado en diseño y programación de iluminación', precio_unitario: 2000.00, unidad: 'dia', sku: 'PER-003', stock_disponible: null },
      { nombre: 'Operador de Iluminación', tipo: 'personal', categoria: 'iluminacion', descripcion: 'Operador de consola de iluminación', precio_unitario: 1800.00, unidad: 'dia', sku: 'PER-004', stock_disponible: null },
      { nombre: 'Camarógrafo Profesional', tipo: 'personal', categoria: 'video', descripcion: 'Camarógrafo profesional con experiencia en eventos', precio_unitario: 3000.00, unidad: 'dia', sku: 'PER-005', stock_disponible: null },
      { nombre: 'Editor de Video', tipo: 'personal', categoria: 'video', descripcion: 'Editor de video para post-producción', precio_unitario: 2500.00, unidad: 'dia', sku: 'PER-006', stock_disponible: null },
      { nombre: 'Técnico de Escenografía', tipo: 'personal', categoria: 'escenografia', descripcion: 'Técnico especializado en montaje de escenarios', precio_unitario: 1500.00, unidad: 'dia', sku: 'PER-007', stock_disponible: null },
      { nombre: 'Stage Manager', tipo: 'personal', categoria: 'produccion', descripcion: 'Stage Manager para coordinación del evento', precio_unitario: 2000.00, unidad: 'dia', sku: 'PER-008', stock_disponible: null },
      
      // Servicios
      { nombre: 'Streaming en Vivo', tipo: 'servicio', categoria: 'video', descripcion: 'Servicio completo de streaming en vivo con técnico y equipo', precio_unitario: 5000.00, unidad: 'evento', sku: 'SER-001', stock_disponible: null },
      { nombre: 'Grabación Multicámara', tipo: 'servicio', categoria: 'video', descripcion: 'Grabación profesional con múltiples cámaras y edición', precio_unitario: 8000.00, unidad: 'evento', sku: 'SER-002', stock_disponible: null },
      { nombre: 'Fotografía Profesional', tipo: 'servicio', categoria: 'fotografia', descripcion: 'Servicio de fotografía profesional con entrega de fotos editadas', precio_unitario: 4000.00, unidad: 'evento', sku: 'SER-003', stock_disponible: null },
      { nombre: 'Diseño de Iluminación', tipo: 'servicio', categoria: 'iluminacion', descripcion: 'Diseño personalizado de iluminación para el evento', precio_unitario: 3000.00, unidad: 'evento', sku: 'SER-004', stock_disponible: null },
      { nombre: 'Sonorización Completa', tipo: 'servicio', categoria: 'audio', descripcion: 'Servicio completo de sonorización con técnico incluido', precio_unitario: 6000.00, unidad: 'evento', sku: 'SER-005', stock_disponible: null },
      { nombre: 'Montaje y Desmontaje', tipo: 'servicio', categoria: 'produccion', descripcion: 'Servicio de montaje y desmontaje de equipos', precio_unitario: 2000.00, unidad: 'evento', sku: 'SER-006', stock_disponible: null },
    ];

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const item of items) {
      try {
        // Intentar insertar, ignorar si ya existe (por SKU)
        const { error: insertError } = await supabase
          .from('items')
          .insert(item)
          .select();

        if (insertError) {
          if (insertError.code === '23505') { // Violación de unique constraint (SKU duplicado)
            skipped++;
            console.log(`⏭️  SKU ${item.sku} ya existe, omitiendo...`);
          } else {
            errors++;
            console.error(`❌ Error insertando ${item.nombre}:`, insertError.message);
          }
        } else {
          inserted++;
          console.log(`✅ Insertado: ${item.nombre} (${item.sku})`);
        }
      } catch (err) {
        errors++;
        console.error(`❌ Error insertando ${item.nombre}:`, err.message);
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`   ✅ Insertados: ${inserted}`);
    console.log(`   ⏭️  Omitidos (ya existían): ${skipped}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📦 Total items en catálogo: ${inserted + skipped}`);

    // Verificar total
    const { count } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true });

    console.log(`\n🎉 Total de items en la base de datos: ${count}`);

  } catch (error) {
    console.error('❌ Error general:', error);
    console.log('\n💡 Asegúrate de que:');
    console.log('   1. Las tablas ya estén creadas (ejecuta la migración SQL primero)');
    console.log('   2. Las variables de entorno estén configuradas correctamente');
    console.log('   3. Tengas permisos de service_role_key');
    process.exit(1);
  }
}

setupDatabase();



