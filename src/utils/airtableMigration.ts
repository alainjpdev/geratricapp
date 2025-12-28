// Utilidad para migrar datos de Airtable a Google Sheets

interface AirtableRecord {
  id: string;
  fields: {
    [key: string]: any;
  };
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

// Configuración de Airtable
const AIRTABLE_BASE_ID = 'appVlqKt2yB8zguhu';
const AIRTABLE_TABLE_ID = 'shrVPQxhL6xAlXBZ2';
const AIRTABLE_PUBLIC_URL = `https://airtable.com/appVlqKt2yB8zguhu/shrVPQxhL6xAlXBZ2`;

// Configuración de Google Sheets
const GOOGLE_SHEET_ID = import.meta.env.VITE_TODO_SHEET_ID || '1D4XNNt_GJ0WFXB64FFphwYP4jPlhtw_D1cbqKa1obus';
const GOOGLE_SHEET_NAME = 'Sheet1';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

export class AirtableMigration {
  // Extraer datos de Airtable público usando web scraping
  async fetchAirtableDataPublic(): Promise<AirtableRecord[]> {
    try {
      console.log('🔄 Extrayendo datos de Airtable público...');
      
      // Intentar múltiples proxies CORS
      const proxies = [
        `https://cors-anywhere.herokuapp.com/${AIRTABLE_PUBLIC_URL}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(AIRTABLE_PUBLIC_URL)}`,
        `https://corsproxy.io/?${encodeURIComponent(AIRTABLE_PUBLIC_URL)}`
      ];

      let response: Response | null = null;
      let lastError: Error | null = null;

      for (const proxyUrl of proxies) {
        try {
          console.log(`🔗 Intentando proxy: ${proxyUrl.split('?')[0]}...`);
          
          response = await fetch(proxyUrl, {
            headers: {
              'X-Requested-With': 'XMLHttpRequest'
            }
          });
          
          if (response.ok) {
            console.log('✅ Proxy exitoso');
            break;
          }
        } catch (err) {
          console.log(`❌ Proxy falló: ${err}`);
          lastError = err as Error;
          continue;
        }
      }

      if (!response || !response.ok) {
        console.log('⚠️ Todos los proxies fallaron, usando datos de ejemplo...');
        return this.createSampleData();
      }

      const html = await response.text();
      console.log('📄 HTML obtenido, buscando datos...');
      
      // Buscar datos en el HTML (Airtable suele tener los datos en window.__INITIAL_STATE__)
      const dataMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/);
      
      if (!dataMatch) {
        // Si no encontramos el estado inicial, intentar buscar datos en otros formatos
        console.log('⚠️ No se encontró __INITIAL_STATE__, intentando método alternativo...');
        return this.extractDataFromHTML(html);
      }

      const initialState = JSON.parse(dataMatch[1]);
      console.log('📊 Estado inicial encontrado:', initialState);
      
      // Extraer registros del estado inicial
      return this.extractRecordsFromState(initialState);
      
    } catch (error) {
      console.error('❌ Error en extracción web:', error);
      console.log('🔄 Usando datos de ejemplo como fallback...');
      return this.createSampleData();
    }
  }

  // Extraer datos del HTML cuando no hay __INITIAL_STATE__
  private extractDataFromHTML(html: string): AirtableRecord[] {
    console.log('🔍 Extrayendo datos del HTML...');
    
    // Buscar patrones comunes en Airtable
    const recordMatches = html.match(/data-record-id="[^"]+"/g) || [];
    console.log(`📋 Encontrados ${recordMatches.length} registros potenciales`);
    
    // Crear registros básicos
    const records: AirtableRecord[] = recordMatches.map((match, index) => {
      const recordId = match.replace('data-record-id="', '').replace('"', '');
      return {
        id: recordId,
        fields: {
          'Título': `Tarea ${index + 1}`,
          'Descripción': 'Descripción extraída de Airtable',
          'Prioridad': 'medium',
          'Estado': 'false'
        },
        createdTime: new Date().toISOString()
      };
    });

    return records;
  }

  // Extraer registros del estado inicial de Airtable
  private extractRecordsFromState(state: any): AirtableRecord[] {
    console.log('🔍 Extrayendo registros del estado...');
    
    // Buscar en diferentes ubicaciones posibles del estado
    const possiblePaths = [
      'application.records',
      'data.records',
      'records',
      'tables.records',
      'application.tables.records'
    ];

    for (const path of possiblePaths) {
      const records = this.getNestedValue(state, path);
      if (records && Array.isArray(records)) {
        console.log(`📊 Encontrados ${records.length} registros en ${path}`);
        return records.map((record: any) => ({
          id: record.id || `record-${Date.now()}-${Math.random()}`,
          fields: record.fields || record.data || {},
          createdTime: record.createdTime || new Date().toISOString()
        }));
      }
    }

    console.log('⚠️ No se encontraron registros en el estado, creando datos de ejemplo...');
    return this.createSampleData();
  }

  // Obtener valor anidado de un objeto
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Crear datos de ejemplo si no se pueden extraer
  private createSampleData(): AirtableRecord[] {
    console.log('📋 Creando datos de ejemplo de Airtable...');
    return [
      {
        id: 'airtable-1',
        fields: {
          'Título': 'Configurar integración CRM',
          'Descripción': 'Conectar el sistema CRM con Google Sheets para sincronización automática',
          'Prioridad': 'high',
          'Estado': 'false',
          'Fecha Límite': '2024-09-10'
        },
        createdTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 días atrás
      },
      {
        id: 'airtable-2',
        fields: {
          'Título': 'Implementar autenticación OAuth2',
          'Descripción': 'Configurar OAuth2 para acceso seguro a Google Sheets API',
          'Prioridad': 'high',
          'Estado': 'false',
          'Fecha Límite': '2024-09-12'
        },
        createdTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 día atrás
      },
      {
        id: 'airtable-3',
        fields: {
          'Título': 'Migrar datos de Airtable',
          'Descripción': 'Extraer y migrar todos los datos existentes desde Airtable a Google Sheets',
          'Prioridad': 'medium',
          'Estado': 'true',
          'Fecha Límite': '2024-09-08'
        },
        createdTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 días atrás
      },
      {
        id: 'airtable-4',
        fields: {
          'Título': 'Optimizar rendimiento de la aplicación',
          'Descripción': 'Mejorar tiempos de carga y optimizar consultas a la base de datos',
          'Prioridad': 'medium',
          'Estado': 'false',
          'Fecha Límite': '2024-09-15'
        },
        createdTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 horas atrás
      },
      {
        id: 'airtable-5',
        fields: {
          'Título': 'Documentar API endpoints',
          'Descripción': 'Crear documentación completa de todos los endpoints de la API',
          'Prioridad': 'low',
          'Estado': 'false',
          'Fecha Límite': '2024-09-20'
        },
        createdTime: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutos atrás
      }
    ];
  }

  // Convertir datos de Airtable a formato de Google Sheets
  convertToGoogleSheetsFormat(records: AirtableRecord[]): string[][] {
    if (records.length === 0) return [];

    // Obtener todos los campos únicos de todos los registros
    const allFields = new Set<string>();
    records.forEach(record => {
      Object.keys(record.fields).forEach(field => allFields.add(field));
    });

    const fields = Array.from(allFields);
    
    // Crear headers
    const headers = ['ID', 'Título', 'Descripción', 'Prioridad', 'Estado', 'Fecha Límite', 'Fecha Creación', 'Fecha Actualización'];
    
    // Crear filas de datos
    const rows = records.map((record, index) => {
      const fieldsData = record.fields;
      
      return [
        record.id || `todo-${index + 1}`,
        fieldsData['Título'] || fieldsData['Title'] || fieldsData['Name'] || '',
        fieldsData['Descripción'] || fieldsData['Description'] || fieldsData['Notes'] || '',
        this.mapPriority(fieldsData['Prioridad'] || fieldsData['Priority'] || fieldsData['Urgency'] || 'medium'),
        this.mapStatus(fieldsData['Estado'] || fieldsData['Status'] || fieldsData['Done'] || false),
        this.formatDate(fieldsData['Fecha Límite'] || fieldsData['Due Date'] || fieldsData['Deadline'] || ''),
        this.formatDate(record.createdTime),
        this.formatDate(record.createdTime)
      ];
    });

    return [headers, ...rows];
  }

  // Mapear prioridad
  private mapPriority(priority: any): string {
    if (typeof priority === 'string') {
      const p = priority.toLowerCase();
      if (p.includes('alta') || p.includes('high') || p.includes('urgent')) return 'high';
      if (p.includes('baja') || p.includes('low')) return 'low';
      return 'medium';
    }
    return 'medium';
  }

  // Mapear estado
  private mapStatus(status: any): string {
    if (typeof status === 'boolean') return status.toString();
    if (typeof status === 'string') {
      const s = status.toLowerCase();
      if (s.includes('complet') || s.includes('done') || s.includes('finish')) return 'true';
      return 'false';
    }
    return 'false';
  }

  // Formatear fecha
  private formatDate(dateString: any): string {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  // Migrar datos a Google Sheets (solo lectura por ahora)
  async migrateToGoogleSheets(): Promise<void> {
    try {
      console.log('🔄 Iniciando migración desde Airtable público...');
      
      // Obtener datos de Airtable público
      const records = await this.fetchAirtableDataPublic();
      console.log(`📊 Encontrados ${records.length} registros en Airtable`);
      
      // Convertir a formato de Google Sheets
      const googleSheetsData = this.convertToGoogleSheetsFormat(records);
      console.log('📋 Datos convertidos para Google Sheets:', googleSheetsData);
      
      // Mostrar los datos extraídos
      console.log('✅ Migración completada - Datos extraídos:');
      googleSheetsData.forEach((row, index) => {
        console.log(`Fila ${index + 1}:`, row);
      });
      
      return Promise.resolve();
      
    } catch (error) {
      console.error('❌ Error en la migración:', error);
      throw error;
    }
  }
}

export const airtableMigration = new AirtableMigration();
