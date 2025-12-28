/**
 * Script para configurar contraseñas para usuarios en la tabla users
 * Ejecutar con: node scripts/setup-password-for-users.js
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
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
  
  const nameIndex = headers.findIndex(h => h.includes('Name'));
  const emailIndex = headers.findIndex(h => h.includes('Email'));
  const rolIndex = headers.findIndex(h => h.includes('rol'));

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
    if (!email || !email.includes('@')) continue;

    users.push({ email: email.trim() });
  }

  return users;
}

async function setupPasswords() {
  try {
    console.log('🚀 Configurando contraseñas para usuarios...\n');

    // Leer el archivo CSV
    const csvPath = join(__dirname, '../reference/Users-8.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    
    // Parsear CSV
    const users = parseCSV(csvContent);
    console.log(`📊 Usuarios encontrados en CSV: ${users.length}\n`);

    let updated = 0;
    let notFound = 0;
    let errors = [];

    // Procesar cada usuario
    for (const userData of users) {
      try {
        // Buscar usuario en la base de datos
        const { data: dbUser, error: findError } = await supabase
          .from('users')
          .select('id, email, password_hash')
          .eq('email', userData.email)
          .single();

        if (findError || !dbUser) {
          console.log(`⏭️  No encontrado: ${userData.email}`);
          notFound++;
          continue;
        }

        // Si ya tiene contraseña, saltar
        if (dbUser.password_hash) {
          console.log(`⏭️  Ya tiene contraseña: ${userData.email}`);
          continue;
        }

        // Generar contraseña: [email_sin_@]@2025!
        const emailPrefix = userData.email.split('@')[0];
        const password = `${emailPrefix}@2025!`;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Actualizar usuario con contraseña hasheada
        const { error: updateError } = await supabase
          .from('users')
          .update({ password_hash: hashedPassword })
          .eq('id', dbUser.id);

        if (updateError) {
          throw updateError;
        }

        updated++;
        console.log(`✅ Contraseña configurada: ${userData.email}`);
        console.log(`   🔑 Contraseña: ${password}`);
        console.log('');
      } catch (error) {
        errors.push({
          email: userData.email,
          error: error.message
        });
        console.error(`❌ Error al configurar ${userData.email}:`, error.message);
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`   ✅ Actualizados: ${updated}`);
    console.log(`   ⏭️  No encontrados: ${notFound}`);
    console.log(`   ❌ Errores: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errores detallados:');
      errors.forEach(err => {
        console.log(`   - ${err.email}: ${err.error}`);
      });
    }

    console.log('\n💡 IMPORTANTE:');
    console.log('   - Las contraseñas son: [email_sin_@]@2025!');
    console.log('   - Ejemplo: prof.emanuelrosado@2025!');
    console.log('   - Los usuarios ahora pueden hacer login directamente\n');

  } catch (error) {
    console.error('❌ Error general:', error);
    process.exit(1);
  }
}

// Ejecutar
setupPasswords()
  .then(() => {
    console.log('✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });









