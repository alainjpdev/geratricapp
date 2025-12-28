/**
 * Script para crear usuarios en Supabase Auth desde el CSV
 * Esto es necesario porque el login requiere que los usuarios existan en Supabase Auth
 * Ejecutar con: node scripts/create-users-in-supabase-auth.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Función para parsear el CSV
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  
  // Encontrar índices de las columnas
  const nameIndex = headers.findIndex(h => h.includes('Name'));
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
      grupoAsignado: grupo.trim() || null,
    });
  }

  return users;
}

async function createUsersInSupabaseAuth() {
  try {
    console.log('🚀 Iniciando creación de usuarios en Supabase Auth...\n');

    // Leer el archivo CSV
    const csvPath = join(__dirname, '../reference/Users-8.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    
    // Parsear CSV
    const users = parseCSV(csvContent);
    console.log(`📊 Usuarios encontrados en CSV: ${users.length}\n`);

    let created = 0;
    let alreadyExists = 0;
    let errors = [];

    // Procesar cada usuario
    for (const userData of users) {
      try {
        // Verificar si el usuario ya existe en Supabase Auth
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
        
        const userExists = existingUsers?.users?.some(u => u.email === userData.email);
        
        if (userExists) {
          console.log(`⏭️  Ya existe: ${userData.firstName} ${userData.lastName} (${userData.email})`);
          alreadyExists++;
          continue;
        }

        // Generar una contraseña temporal (el usuario deberá cambiarla)
        // Usar un formato: Email@2025! (puedes cambiarlo)
        const tempPassword = `${userData.email.split('@')[0]}@2025!`;
        
        // Crear usuario en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: tempPassword,
          email_confirm: true, // Confirmar email automáticamente
          user_metadata: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            grupoAsignado: userData.grupoAsignado,
          }
        });

        if (authError) {
          if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
            console.log(`⏭️  Ya existe: ${userData.firstName} ${userData.lastName} (${userData.email})`);
            alreadyExists++;
          } else {
            throw authError;
          }
        } else {
          created++;
          console.log(`✅ Creado: ${userData.firstName} ${userData.lastName} (${userData.email})`);
          console.log(`   📧 Email: ${userData.email}`);
          console.log(`   🔑 Contraseña temporal: ${tempPassword}`);
          console.log(`   👤 Rol: ${userData.role}`);
          if (userData.grupoAsignado) {
            console.log(`   👥 Grupo: ${userData.grupoAsignado}`);
          }
          console.log('');
        }
      } catch (error) {
        errors.push({
          email: userData.email,
          error: error.message
        });
        console.error(`❌ Error al crear ${userData.email}:`, error.message);
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`   ✅ Creados: ${created}`);
    console.log(`   ⏭️  Ya existían: ${alreadyExists}`);
    console.log(`   ❌ Errores: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errores detallados:');
      errors.forEach(err => {
        console.log(`   - ${err.email}: ${err.error}`);
      });
    }

    console.log('\n💡 IMPORTANTE:');
    console.log('   - Los usuarios deben cambiar su contraseña en el primer login');
    console.log('   - La contraseña temporal es: [email_sin_@]@2025!');
    console.log('   - Ejemplo: prof.emanuelrosado@2025!');
    console.log('   - Puedes cambiar esto en el código si lo deseas\n');

  } catch (error) {
    console.error('❌ Error general:', error);
    process.exit(1);
  }
}

// Ejecutar
createUsersInSupabaseAuth()
  .then(() => {
    console.log('✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });









