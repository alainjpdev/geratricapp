/**
 * Script para insertar clientes dummy en la tabla clientes del CRM
 * Ejecutar con: node scripts/insert-crm-dummy-clients.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('\nNecesitas configurar en tu archivo .env:');
  console.error('  VITE_SUPABASE_URL=tu_url_de_supabase');
  console.error('  VITE_SUPABASE_ANON_KEY=tu_anon_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertDummyClients() {
  try {
    console.log('🚀 Insertando clientes dummy en la tabla CRM...\n');

    // Clientes dummy con datos realistas
    const dummyClients = [
      {
        empresa: 'Producciones Eventos S.A.',
        contacto: 'Carlos Mendoza',
        email: 'carlos.mendoza@eventospro.com',
        telefono: '+57 300 123 4567',
        direccion: 'Calle 72 #10-45, Bogotá, Colombia',
        website: 'https://www.eventospro.com',
        status: 'active',
        origen: 'web',
        total_proyectos: 5,
        ingresos_totales: 125000.00,
        ultimo_contacto: new Date().toISOString().split('T')[0],
        notas: 'Cliente importante, siempre puntual en pagos. Interesado en servicios de iluminación y audio para eventos corporativos.'
      },
      {
        empresa: 'Festivales y Conciertos Ltda.',
        contacto: 'María González',
        email: 'maria.gonzalez@festivales.co',
        telefono: '+57 310 987 6543',
        direccion: 'Avenida El Poblado #45-67, Medellín, Colombia',
        website: 'https://www.festivales.co',
        status: 'active',
        origen: 'referido',
        total_proyectos: 8,
        ingresos_totales: 250000.00,
        ultimo_contacto: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Hace 7 días
        notas: 'Cliente frecuente para eventos musicales. Requiere equipos de alta calidad para conciertos.'
      },
      {
        empresa: 'Corporación Eventos Empresariales',
        contacto: 'Roberto Silva',
        email: 'roberto.silva@corpeventos.com',
        telefono: '+57 315 456 7890',
        direccion: 'Carrera 15 #93-75, Bogotá, Colombia',
        website: 'https://www.corpeventos.com',
        status: 'prospect',
        origen: 'evento',
        total_proyectos: 0,
        ingresos_totales: 0.00,
        ultimo_contacto: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Hace 3 días
        notas: 'Prospecto interesado en servicios completos de producción para lanzamiento de producto. Presupuesto aprobado pendiente.'
      },
      {
        empresa: 'Bodas y Celebraciones Premium',
        contacto: 'Ana Martínez',
        email: 'ana.martinez@bodaspremium.com',
        telefono: '+57 320 111 2233',
        direccion: 'Calle 50 #10-30, Cali, Colombia',
        website: 'https://www.bodaspremium.com',
        status: 'active',
        origen: 'redes_sociales',
        total_proyectos: 12,
        ingresos_totales: 180000.00,
        ultimo_contacto: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Hace 2 días
        notas: 'Especialistas en bodas de lujo. Requieren servicios de video, fotografía y escenografía. Muy satisfechos con nuestro trabajo.'
      },
      {
        empresa: 'Instituto Cultural Nacional',
        contacto: 'Luis Ramírez',
        email: 'luis.ramirez@icn.gov.co',
        telefono: '+57 1 345 6789',
        direccion: 'Carrera 7 #32-16, Bogotá, Colombia',
        website: 'https://www.icn.gov.co',
        status: 'inactive',
        origen: 'web',
        total_proyectos: 3,
        ingresos_totales: 45000.00,
        ultimo_contacto: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Hace 90 días
        notas: 'Cliente institucional. Último proyecto hace 3 meses. Presupuesto limitado, pero proyectos interesantes culturalmente.'
      }
    ];

    let inserted = 0;
    let errors = 0;

    for (const client of dummyClients) {
      try {
        const { data, error } = await supabase
          .from('clientes')
          .insert(client)
          .select();

        if (error) {
          errors++;
          console.error(`❌ Error insertando ${client.empresa}:`, error.message);
        } else {
          inserted++;
          console.log(`✅ Insertado: ${client.empresa} (${client.contacto}) - Estado: ${client.status}`);
        }
      } catch (err) {
        errors++;
        console.error(`❌ Error insertando ${client.empresa}:`, err.message);
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`   ✅ Insertados: ${inserted}`);
    console.log(`   ❌ Errores: ${errors}`);

    // Verificar total de clientes
    const { count } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true });

    console.log(`\n🎉 Total de clientes en la base de datos: ${count}`);

    // Mostrar estadísticas por estado
    const { data: stats } = await supabase
      .from('clientes')
      .select('status');

    if (stats) {
      const statusCounts = stats.reduce((acc, client) => {
        acc[client.status] = (acc[client.status] || 0) + 1;
        return acc;
      }, {});

      console.log('\n📈 Clientes por estado:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    }

  } catch (error) {
    console.error('❌ Error general:', error);
    console.log('\n💡 Asegúrate de que:');
    console.log('   1. La tabla "clientes" ya esté creada');
    console.log('   2. Las variables de entorno estén configuradas correctamente');
    console.log('   3. Tengas permisos para insertar datos');
    process.exit(1);
  }
}

insertDummyClients();

