#!/usr/bin/env node

/**
 * Script para configurar Google Service Account
 * Este script ayuda a configurar las variables de entorno necesarias
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupServiceAccount() {
  console.log('🔧 Configuración de Google Service Account para ColorLand\n');
  
  console.log('Este script te ayudará a configurar las variables de entorno necesarias para la conexión automática con Google Sheets.\n');
  
  console.log('📋 Pasos previos requeridos:');
  console.log('1. Crear un proyecto en Google Cloud Console');
  console.log('2. Habilitar Google Sheets API');
  console.log('3. Crear un Service Account');
  console.log('4. Descargar el archivo JSON de credenciales');
  console.log('5. Compartir tu Google Sheet con el email del Service Account\n');
  
  const continueSetup = await question('¿Has completado estos pasos? (y/n): ');
  
  if (continueSetup.toLowerCase() !== 'y') {
    console.log('\n📖 Por favor, sigue la guía en GOOGLE_SERVICE_ACCOUNT_SETUP.md y vuelve a ejecutar este script.');
    rl.close();
    return;
  }
  
  console.log('\n🔑 Configuración de variables de entorno:\n');
  
  // Solicitar Service Account Email
  const serviceAccountEmail = await question('Email del Service Account (ej: mi-servicio@mi-proyecto.iam.gserviceaccount.com): ');
  
  if (!serviceAccountEmail.includes('@') || !serviceAccountEmail.includes('.iam.gserviceaccount.com')) {
    console.log('❌ Email del Service Account inválido. Debe ser un email de Service Account válido.');
    rl.close();
    return;
  }
  
  // Solicitar Private Key
  console.log('\n📄 Clave privada del Service Account:');
  console.log('Pega la clave privada completa (incluyendo -----BEGIN PRIVATE KEY----- y -----END PRIVATE KEY-----):');
  const privateKey = await question('');
  
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
    console.log('❌ Clave privada inválida. Debe incluir los marcadores BEGIN y END.');
    rl.close();
    return;
  }
  
  // Solicitar Sheet ID
  const sheetId = await question('ID del Google Sheet (de la URL: https://docs.google.com/spreadsheets/d/SHEET_ID/edit): ');
  
  if (!sheetId || sheetId.length < 10) {
    console.log('❌ ID del Google Sheet inválido.');
    rl.close();
    return;
  }
  
  // Crear archivo .env
  const envContent = `# Google Service Account Configuration
VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL=${serviceAccountEmail}
VITE_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"
VITE_TODO_SHEET_ID=${sheetId}

# Otras configuraciones existentes
VITE_API_URL=https://colorland-app-ff3fdd79ac35.herokuapp.com
VITE_GOOGLE_API_KEY=your_google_api_key_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
`;

  try {
    fs.writeFileSync('.env', envContent);
    console.log('\n✅ Archivo .env creado exitosamente!');
    
    console.log('\n📋 Próximos pasos:');
    console.log('1. Verifica que el archivo .env esté en la raíz del proyecto');
    console.log('2. Reinicia el servidor de desarrollo (npm run dev)');
    console.log('3. Ve a /dashboard/todo-service para probar la conexión');
    console.log('4. Si todo funciona, puedes actualizar el menú para usar la nueva ruta');
    
    console.log('\n🔒 Importante:');
    console.log('- Nunca subas el archivo .env a Git');
    console.log('- Asegúrate de que .env esté en .gitignore');
    console.log('- Para producción, configura estas variables en tu plataforma de hosting');
    
  } catch (error) {
    console.error('❌ Error al crear el archivo .env:', error.message);
  }
  
  rl.close();
}

// Verificar si ya existe un archivo .env
if (fs.existsSync('.env')) {
  console.log('⚠️  Ya existe un archivo .env en el proyecto.');
  const overwrite = await question('¿Deseas sobrescribirlo? (y/n): ');
  
  if (overwrite.toLowerCase() !== 'y') {
    console.log('Configuración cancelada.');
    rl.close();
    process.exit(0);
  }
}

setupServiceAccount().catch(console.error);
