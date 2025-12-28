/**
 * Inicializar la base de datos JSON al inicio de la aplicación
 */

import { jsonDB } from './jsonDatabase';
import { USE_JSON_DB } from '../config/devMode';

/**
 * Inicializar JSON DB si está habilitado
 */
export const initJsonDB = async (): Promise<void> => {
  if (USE_JSON_DB) {
    try {
      await jsonDB.initialize();
      console.log('✅ Base de datos JSON inicializada');
    } catch (error) {
      console.error('❌ Error inicializando base de datos JSON:', error);
    }
  }
};








