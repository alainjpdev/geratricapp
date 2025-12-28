/**
 * Script para obtener credenciales de un estudiante de la base de datos local
 * 
 * NOTA: Este script necesita ejecutarse en el navegador o usar una herramienta diferente.
 * 
 * FORMATO DE CONTRASEÑA:
 * Si el email es: estudiante@ejemplo.com
 * La contraseña es: estudiante@2025!
 * 
 * Para obtener un estudiante:
 * 1. Abre la consola del navegador (F12)
 * 2. Ejecuta este código:
 */

const getStudentCredentials = `
// Código para ejecutar en la consola del navegador
(async () => {
  const { localDB } = await import('/src/db/localDB.ts');
  
  const student = await localDB.users
    .where('role')
    .equals('student')
    .and(u => u.isActive)
    .first();
  
  if (student) {
    const emailPrefix = student.email.split('@')[0];
    const password = \`\${emailPrefix}@2025!\`;
    
    console.log('✅ ESTUDIANTE ENCONTRADO:');
    console.log('📧 Email:', student.email);
    console.log('🔑 Password:', password);
    console.log('👤 Nombre:', student.firstName, student.lastName);
    console.log('👥 Grupo:', student.grupoAsignado || 'Sin grupo');
  } else {
    console.log('❌ No se encontraron estudiantes');
  }
})();
`;

console.log('📋 INSTRUCCIONES PARA OBTENER CREDENCIALES DE ESTUDIANTE:\n');
console.log('='.repeat(60));
console.log('\n1. Abre la aplicación en el navegador');
console.log('2. Abre la consola del navegador (F12 o Cmd+Option+I)');
console.log('3. Ejecuta el siguiente código:\n');
console.log(getStudentCredentials);
console.log('\n' + '='.repeat(60));
console.log('\n💡 FORMATO DE CONTRASEÑA:');
console.log('   Si el email es: estudiante@ejemplo.com');
console.log('   La contraseña es: estudiante@2025!');
console.log('\n📝 Alternativamente, puedes:');
console.log('   - Usar el botón "Sincronizar desde Supabase" en la app');
console.log('   - O importar desde CSV usando el botón "Importar CSV"');
