/**
 * Configuración para modo desarrollo
 * Determina si usar base de datos local o Supabase
 * 
 * IMPORTANTE: Durante el desarrollo, puedes usar:
 * - JSON en memoria (USE_JSON_DB=true) - Más rápido y fácil
 * - IndexedDB local (USE_LOCAL_DB=true) - Persistente
 * - Supabase (ambos false) - Producción
 */

// Modo JSON: usa solo JSON en memoria (más rápido para desarrollo)
// Por defecto en desarrollo, usar JSON (a menos que se especifique explícitamente false)
// Modo JSON: usa solo JSON en memoria (más rápido para desarrollo)
// Por defecto en desarrollo, usar JSON (a menos que se especifique explícitamente false)
export const USE_JSON_DB = false;

// Modo IndexedDB: usa base local persistente
export const USE_LOCAL_DB = false;

export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// Log para debugging
if (USE_JSON_DB) {
  console.log('📄 Modo desarrollo: usando JSON en memoria (dummy-data.json)');
} else if (USE_LOCAL_DB) {
  console.log('🔧 Modo desarrollo: usando base de datos local (IndexedDB)');
} else {
  console.log('☁️ Modo producción: usando Supabase');
}

