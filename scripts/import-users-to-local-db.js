/**
 * Script para importar usuarios desde CSV a la base de datos local
 * Ejecutar con: node scripts/import-users-to-local-db.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { LocalDatabase } from '../src/db/localDB.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Crear instancia de la base de datos local
const db = new LocalDatabase();

// Función para parsear el CSV
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  
  const emailIndex = headers.findIndex(h => h.includes('Email'));
  const nameIndex = headers.findIndex(h => h.includes('Name'));
  const rolIndex = headers.findIndex(h => h.includes('rol'));
  const grupoIndex = headers.findIndex(h => h.includes('GrupoAsignado'));

  const users = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

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

    const email = values[emailIndex] || '';
    const name = values[nameIndex] || '';
    const rol = values[rolIndex] || '';
    const grupo = values[grupoIndex] || '';

    if (!email || !email.includes('@')) {
      console.warn(`⚠️  Saltando línea ${i + 1}: email inválido (${email})`);
      continue;
    }

    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Usuario';
    const lastName = nameParts.slice(1).join(' ') || 'Sin Apellido';

    let role = 'student';
    if (rol.toLowerCase() === 'admin') {
      role = 'admin';
    } else if (rol.toLowerCase() === 'teacher') {
      role = 'teacher';
    } else if (rol.toLowerCase() === 'student') {
      role = 'student';
    } else if (rol.toLowerCase() === 'parent') {
      role = 'parent';
    }

    users.push({
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      grupoAsignado: grupo.trim() || null,
    });
  }

  return users;
}

async function importUsers() {
  try {
    console.log('🚀 Iniciando importación de usuarios a base de datos local...\n');

    // Leer CSV
    const csvPath = join(__dirname, '../reference/Users-8.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    
    const usersFromCsv = parseCSV(csvContent);
    console.log(`📊 Usuarios encontrados en CSV: ${usersFromCsv.length}\n`);

    let imported = 0;
    let updated = 0;
    let errors = 0;

    // Abrir base de datos
    await db.open();

    // Procesar cada usuario
    for (const userData of usersFromCsv) {
      try {
        // Generar contraseña: [email_sin_@]@2025!
        const emailPrefix = userData.email.split('@')[0];
        const password = `${emailPrefix}@2025!`;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Verificar si el usuario ya existe
        const existingUser = await db.users.where('email').equals(userData.email).first();

        const userRecord = {
          id: existingUser?.id || uuidv4(),
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          passwordHash: hashedPassword,
          grupoAsignado: userData.grupoAsignado,
          isActive: true,
          createdAt: existingUser?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (existingUser) {
          await db.users.put(userRecord);
          updated++;
          console.log(`✅ Actualizado: ${userData.email} (Contraseña: ${password})`);
        } else {
          await db.users.add(userRecord);
          imported++;
          console.log(`✅ Importado: ${userData.email} (Contraseña: ${password})`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error procesando ${userData.email}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✨ IMPORTACIÓN COMPLETADA');
    console.log('='.repeat(50));
    console.log(`✅ Usuarios importados: ${imported}`);
    console.log(`🔄 Usuarios actualizados: ${updated}`);
    console.log(`❌ Errores: ${errors}`);
    console.log('\n💡 Los usuarios ahora pueden hacer login en modo desarrollo');
    console.log('   Contraseña temporal: [email_sin_@]@2025!\n');

  } catch (error) {
    console.error('❌ Error general:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

importUsers();

