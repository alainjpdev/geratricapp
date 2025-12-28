// Configuración de Google Sheets para cada tabla de la base de datos
// Cada tabla tiene un Google Sheet correspondiente que debe ser público

export interface TableSheetConfig {
  sheetId: string;
  sheetName: string;
  publicUrl: string;
}

// Configuración de Google Sheets para cada tabla
// IMPORTANTE: Los Google Sheets deben ser públicos (Anyone with the link can view)
// Para hacer un sheet público:
// 1. Abre el Google Sheet
// 2. Click en "Share" (Compartir)
// 3. Cambia a "Anyone with the link" (Cualquiera con el enlace)
// 4. Copia el Sheet ID de la URL: https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit

export const DB_SHEETS_CONFIG: Record<string, TableSheetConfig> = {
  User: {
    sheetId: '', // Reemplaza con el ID de tu Google Sheet público
    sheetName: 'Users', // Nombre de la hoja dentro del spreadsheet
    publicUrl: '' // Se genera automáticamente
  },
  Evento: {
    sheetId: '', // Reemplaza con el ID de tu Google Sheet público
    sheetName: 'Eventos',
    publicUrl: ''
  },
  Cotizacion: {
    sheetId: '', // Reemplaza con el ID de tu Google Sheet público
    sheetName: 'Cotizaciones',
    publicUrl: ''
  },
  Orden: {
    sheetId: '', // Reemplaza con el ID de tu Google Sheet público
    sheetName: 'Ordenes',
    publicUrl: ''
  },
  Producto: {
    sheetId: '', // Reemplaza con el ID de tu Google Sheet público
    sheetName: 'Productos',
    publicUrl: ''
  }
};

// Función para generar la URL pública del Google Sheet
export function getSheetPublicUrl(sheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}`;
}

// Función para actualizar la configuración
export function updateSheetConfig(tableName: string, sheetId: string, sheetName?: string) {
  if (DB_SHEETS_CONFIG[tableName]) {
    DB_SHEETS_CONFIG[tableName].sheetId = sheetId;
    DB_SHEETS_CONFIG[tableName].publicUrl = getSheetPublicUrl(sheetId);
    if (sheetName) {
      DB_SHEETS_CONFIG[tableName].sheetName = sheetName;
    }
  }
}

// Inicializar URLs públicas
Object.keys(DB_SHEETS_CONFIG).forEach(tableName => {
  const config = DB_SHEETS_CONFIG[tableName];
  if (config.sheetId) {
    config.publicUrl = getSheetPublicUrl(config.sheetId);
  }
});








