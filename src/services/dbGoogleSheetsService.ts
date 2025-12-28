// Servicio para conectar tablas de la BD con Google Sheets públicos
// Cada tabla tiene un Google Sheet correspondiente que es público

export interface TableInfo {
  name: string;
  count: number;
  description: string;
  size: string;
  columns: ColumnInfo[];
  googleSheetId?: string;
  googleSheetUrl?: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
}

import { DB_SHEETS_CONFIG, getSheetPublicUrl, updateSheetConfig as updateConfig } from '../config/dbSheetsConfig';

// Usar la configuración centralizada
const TABLE_SHEETS_CONFIG = DB_SHEETS_CONFIG;

// Función para obtener datos de un Google Sheet público usando la API de Google Sheets
async function fetchPublicGoogleSheet(sheetId: string, sheetName: string): Promise<any[]> {
  try {
    // Método 1: Intentar usar la API pública de Google Sheets (sin autenticación para sheets públicos)
    // Formato: https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet={SHEET_NAME}
    const publicUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    
    try {
      const response = await fetch(publicUrl);
      
      if (response.ok) {
        const text = await response.text();
        // Google Sheets devuelve los datos en un formato especial
        const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/);
        
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[1]);
          
          if (data.table && data.table.rows) {
            // Convertir los datos de Google Sheets a un formato de array de objetos
            const headers = data.table.cols.map((col: any) => col.label);
            const rows = data.table.rows.map((row: any) => {
              const obj: any = {};
              row.c.forEach((cell: any, index: number) => {
                obj[headers[index]] = cell ? cell.v : null;
              });
              return obj;
            });
            
            return rows;
          }
        }
      }
    } catch (publicError) {
      console.warn('No se pudo acceder al sheet como público, intentando con API Key...', publicError);
    }
    
    // Método 2: Usar API Key si está disponible (para sheets privados compartidos)
    const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
    if (GOOGLE_API_KEY) {
      const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?key=${GOOGLE_API_KEY}`;
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.values && data.values.length > 1) {
          const headers = data.values[0];
          const rows = data.values.slice(1).map((row: any[]) => {
            const obj: any = {};
            headers.forEach((header: string, index: number) => {
              obj[header] = row[index] || null;
            });
            return obj;
          });
          
          return rows;
        }
      }
    }
    
    // Si ambos métodos fallan, retornar array vacío
    console.warn(`No se pudo obtener datos del Google Sheet ${sheetId}. Asegúrate de que el sheet sea público o que tengas API Key configurada.`);
    return [];
  } catch (error) {
    console.error(`Error obteniendo datos del Google Sheet ${sheetId}:`, error);
    return [];
  }
}

// Obtener todas las tablas (basado en la configuración)
export async function getAllTables(): Promise<string[]> {
  return Object.keys(TABLE_SHEETS_CONFIG);
}

// Obtener información de una tabla específica
export async function getTableInfo(tableName: string): Promise<TableInfo | null> {
  try {
    const config = TABLE_SHEETS_CONFIG[tableName];
    
    if (!config || !config.sheetId) {
      return {
        name: tableName,
        count: 0,
        description: `Tabla ${tableName} - Google Sheet no configurado`,
        size: 'N/A',
        columns: [],
        googleSheetUrl: undefined
      };
    }
    
    // Obtener datos para contar registros
    let count = 0;
    let columns: ColumnInfo[] = [];
    
    try {
      const data = await fetchPublicGoogleSheet(config.sheetId, config.sheetName);
      count = data.length;
      
      // Obtener columnas del primer registro
      if (data.length > 0) {
        columns = Object.keys(data[0]).map(key => ({
          name: key,
          type: 'text', // Google Sheets no expone tipos directamente
          nullable: true,
          default: null
        }));
      }
    } catch (error) {
      console.warn(`No se pudo obtener información de ${tableName}:`, error);
    }
    
    const googleSheetUrl = config.sheetId ? getSheetPublicUrl(config.sheetId) : undefined;
    
    return {
      name: tableName,
      count,
      description: config.sheetId 
        ? `Tabla ${tableName} con ${count} registros desde Google Sheets`
        : `Tabla ${tableName} - Google Sheet no configurado. Configura el Sheet ID en dbSheetsConfig.ts`,
      size: 'N/A',
      columns,
      googleSheetId: config.sheetId,
      googleSheetUrl
    };
  } catch (error) {
    console.error(`Error obteniendo información de tabla ${tableName}:`, error);
    return null;
  }
}

// Obtener información de todas las tablas
export async function getAllTablesInfo(): Promise<TableInfo[]> {
  try {
    const tables = await getAllTables();
    const tablesInfo: TableInfo[] = [];

    for (const table of tables) {
      const info = await getTableInfo(table);
      if (info) {
        tablesInfo.push(info);
      }
    }

    return tablesInfo;
  } catch (error) {
    console.error('Error obteniendo información de tablas:', error);
    throw error;
  }
}

// Obtener datos de una tabla con paginación
export async function getTableData(
  tableName: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{ data: any[]; total: number }> {
  try {
    const config = TABLE_SHEETS_CONFIG[tableName];
    
    if (!config || !config.sheetId) {
      return { data: [], total: 0 };
    }
    
    // Obtener todos los datos del Google Sheet
    const allData = await fetchPublicGoogleSheet(config.sheetId, config.sheetName);
    const total = allData.length;
    
    // Aplicar paginación
    const offset = (page - 1) * pageSize;
    const data = allData.slice(offset, offset + pageSize);
    
    return {
      data,
      total
    };
  } catch (error) {
    console.error(`Error obteniendo datos de tabla ${tableName}:`, error);
    return { data: [], total: 0 };
  }
}

// Obtener estadísticas generales
export async function getDatabaseStats(): Promise<{
  totalTables: number;
  totalRecords: number;
  totalSize: string;
  lastUpdate: Date;
}> {
  try {
    const tables = await getAllTables();
    let totalRecords = 0;

    for (const table of tables) {
      const info = await getTableInfo(table);
      if (info) {
        totalRecords += info.count;
      }
    }

    return {
      totalTables: tables.length,
      totalRecords,
      totalSize: 'N/A',
      lastUpdate: new Date()
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {
      totalTables: 0,
      totalRecords: 0,
      totalSize: '0 bytes',
      lastUpdate: new Date()
    };
  }
}

// Función para actualizar la configuración de Google Sheets
export function updateTableSheetConfig(tableName: string, sheetId: string, sheetName?: string) {
  updateConfig(tableName, sheetId, sheetName);
}

// Función para obtener la configuración actual
export function getTableSheetConfig() {
  return { ...TABLE_SHEETS_CONFIG };
}

