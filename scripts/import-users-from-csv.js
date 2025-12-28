/**
 * Script para importar usuarios desde CSV a la base de datos
 * Ejecutar con: node scripts/import-users-from-csv.js
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

// Función para parsear el CSV
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  
  // Encontrar índices de las columnas
  const nameIndex = headers.findIndex(h => h.includes('Name'));
  const photoIndex = headers.findIndex(h => h.includes('Photo'));
  const emailIndex = headers.findIndex(h => h.includes('Email'));
  const rolIndex = headers.findIndex(h => h.includes('rol'));
  const grupoIndex = headers.findIndex(h => h.includes('GrupoAsignado'));

  const users = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Manejar comillas y valores con comas
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length < emailIndex + 1) continue;

    const name = values[nameIndex] || '';
    const photo = values[photoIndex] || '';
    const email = values[emailIndex] || '';
    const rol = values[rolIndex] || '';
    const grupo = values[grupoIndex] || '';

    // Validar email
    if (!email || !email.includes('@')) {
      console.warn(`⚠️  Saltando línea ${i + 1}: email inválido (${email})`);
      continue;
    }

    // Separar nombre en firstName y lastName
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Usuario';
    const lastName = nameParts.slice(1).join(' ') || 'Sin Apellido';

    // Mapear rol
    let role = 'student';
    if (rol.toLowerCase() === 'admin') {
      role = 'admin';
    } else if (rol.toLowerCase() === 'teacher') {
      role = 'teacher';
    } else if (rol.toLowerCase() === 'student') {
      role = 'student';
    }

    users.push({
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      avatar: photo.trim() || null,
      grupoAsignado: grupo.trim() || null, // Guardamos para referencia futura
    });
  }

  return users;
}

async function importUsers() {
  try {
    console.log('🚀 Iniciando importación de usuarios desde CSV...\n');

    // Leer el archivo CSV
    const csvPath = join(__dirname, '../reference/Users-8.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    
    // Parsear CSV
    const users = parseCSV(csvContent);
    console.log(`📊 Usuarios encontrados en CSV: ${users.length}\n`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];

    // Procesar cada usuario
    for (const userData of users) {
      try {
        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email },
        });

        if (existingUser) {
          // Actualizar usuario existente
          await prisma.user.update({
            where: { email: userData.email },
            data: {
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role,
              avatar: userData.avatar,
              grupoAsignado: userData.grupoAsignado,
            },
          });
          updated++;
          console.log(`🔄 Actualizado: ${userData.firstName} ${userData.lastName} (${userData.email}) - Rol: ${userData.role} - Grupo: ${userData.grupoAsignado || 'N/A'}`);
        } else {
          // Crear nuevo usuario
          await prisma.user.create({
            data: {
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role,
              avatar: userData.avatar,
              grupoAsignado: userData.grupoAsignado,
              isActive: true,
            },
          });
          inserted++;
          console.log(`✅ Creado: ${userData.firstName} ${userData.lastName} (${userData.email}) - Rol: ${userData.role} - Grupo: ${userData.grupoAsignado || 'N/A'}`);
        }
      } catch (error) {
        skipped++;
        errors.push({ email: userData.email, error: error.message });
        console.error(`❌ Error procesando ${userData.email}:`, error.message);
      }
    }

    // Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE IMPORTACIÓN');
    console.log('='.repeat(60));
    console.log(`✅ Usuarios creados: ${inserted}`);
    console.log(`🔄 Usuarios actualizados: ${updated}`);
    console.log(`❌ Errores: ${skipped}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  Errores detallados:');
      errors.forEach(({ email, error }) => {
        console.log(`   - ${email}: ${error}`);
      });
    }

    // Estadísticas por rol
    const stats = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true,
      },
    });

    console.log('\n📈 Usuarios por rol:');
    stats.forEach((stat) => {
      console.log(`   ${stat.role}: ${stat._count.role}`);
    });

    console.log('\n🎉 Importación completada!');

  } catch (error) {
    console.error('❌ Error general:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importUsers();

