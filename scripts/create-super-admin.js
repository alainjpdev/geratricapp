#!/usr/bin/env node
/**
 * Script para crear un super admin en Supabase
 * Uso: node scripts/create-super-admin.js [email] [password]
 * Ejemplo: node scripts/create-super-admin.js cursoraiht@gmail.com admin123
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Cargar variables de entorno
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const databaseUrl = process.env.DATABASE_URL;

// Parámetros del usuario
const email = process.argv[2] || 'cursoraiht@gmail.com';
const password = process.argv[3] || 'admin123';
const firstName = process.argv[4] || 'Super';
const lastName = process.argv[5] || 'Admin';

console.log('🔐 Creando Super Admin...\n');
console.log(`📧 Email: ${email}`);
console.log(`🔑 Password: ${password}`);
console.log(`👤 Nombre: ${firstName} ${lastName}`);
console.log(`👑 Rol: admin\n`);

// Verificar configuración
if (!supabaseUrl || !supabasePublishableKey) {
  console.error('❌ Error: Faltan variables de entorno de Supabase');
  console.error('   Necesitas VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY (o VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

if (!databaseUrl) {
  console.warn('⚠️  DATABASE_URL no está configurado');
  console.warn('   El usuario se creará solo en Supabase Auth, no en la tabla User de Prisma');
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabasePublishableKey);

async function createSuperAdmin() {
  try {
    // Paso 1: Crear usuario en Supabase Auth
    console.log('1️⃣ Creando usuario en Supabase Auth...');
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
          lastName,
          role: 'admin'
        }
      }
    });

    if (authError) {
      // Si el usuario ya existe, intentar actualizar
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        console.log('   ⚠️  El usuario ya existe en Supabase Auth');
        console.log('   💡 Intentando actualizar el usuario...');
        
        // Intentar hacer login para verificar
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (loginError) {
          console.error('   ❌ No se pudo hacer login. El usuario existe pero la contraseña es diferente.');
          console.error(`   Error: ${loginError.message}`);
          console.log('\n💡 SOLUCIÓN:');
          console.log('   1. Ve a Supabase Dashboard → Authentication → Users');
          console.log(`   2. Busca el usuario: ${email}`);
          console.log('   3. Haz click en "Reset Password" o elimina y recrea el usuario');
          process.exit(1);
        } else {
          console.log('   ✅ El usuario ya existe y la contraseña es correcta');
          console.log('   ✅ Login exitoso');
        }
      } else {
        console.error(`   ❌ Error al crear usuario: ${authError.message}`);
        process.exit(1);
      }
    } else {
      console.log('   ✅ Usuario creado en Supabase Auth');
      
      if (authData.user) {
        console.log(`   📝 User ID: ${authData.user.id}`);
        
        if (authData.session) {
          console.log('   ✅ Sesión creada automáticamente');
        } else {
          console.log('   ⚠️  Requiere verificación de email (si está habilitada)');
        }
      }
    }

    // Paso 2: Crear/actualizar usuario en la tabla User de Prisma (si DATABASE_URL está configurado)
    if (databaseUrl) {
      console.log('\n2️⃣ Creando/actualizando usuario en tabla User (Prisma)...');
      
      try {
        const prisma = new PrismaClient();
        
        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Buscar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (existingUser) {
          // Actualizar usuario existente
          const updatedUser = await prisma.user.update({
            where: { email },
            data: {
              firstName,
              lastName,
              role: 'admin',
              password: hashedPassword
            }
          });
          console.log('   ✅ Usuario actualizado en tabla User');
          console.log(`   📝 User ID: ${updatedUser.id}`);
        } else {
          // Crear nuevo usuario
          const newUser = await prisma.user.create({
            data: {
              email,
              firstName,
              lastName,
              role: 'admin',
              password: hashedPassword
            }
          });
          console.log('   ✅ Usuario creado en tabla User');
          console.log(`   📝 User ID: ${newUser.id}`);
        }

        await prisma.$disconnect();
      } catch (prismaError) {
        console.warn('   ⚠️  Error al crear usuario en Prisma:', prismaError.message);
        console.warn('   💡 El usuario fue creado en Supabase Auth, pero no en la tabla User');
        console.warn('   💡 Esto puede ser normal si no usas Prisma para autenticación');
      }
    }

    // Resumen
    console.log('\n' + '='.repeat(50));
    console.log('✅ SUPER ADMIN CREADO EXITOSAMENTE');
    console.log('='.repeat(50));
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Nombre: ${firstName} ${lastName}`);
    console.log(`👑 Rol: admin`);
    console.log('\n🎉 Puedes hacer login ahora con estas credenciales');
    console.log(`   URL: http://localhost:5173/login`);

  } catch (error) {
    console.error('\n❌ Error inesperado:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar
createSuperAdmin();










