import { supabase } from '../config/supabaseClient';

export interface SupabaseTableInfo {
  name: string;
  count: number;
  size: string;
  description: string;
}

export interface SupabaseTableDataResult {
  data: any[];
  total: number;
}

export interface SupabaseDbStats {
  totalTables: number;
  totalRecords: number;
  totalSize: string;
  lastUpdate: Date;
}

// Lista de tablas a explorar desde Supabase.
// Añade aquí los nombres EXACTOS de tus tablas en el schema "public".
// Nota: con la anon key del frontend no podemos listar el catálogo completo de Postgres,
// por eso necesitamos declarar explícitamente las tablas que queremos mostrar.
const SUPABASE_TABLES: string[] = [
  'eventos',       // Eventos de producción
  'gastos_evento', // Gastos asociados a eventos
  'usuarios',      // Colaboradores de la empresa
  'items',         // Catálogo de equipos, servicios y personal
  'cotizaciones',  // Cotizaciones de eventos
  'cotizacion_items', // Items en cotizaciones con días de renta
  'clientes',      // Clientes del CRM
];

export const getAllTablesInfo = async (): Promise<SupabaseTableInfo[]> => {
  const tables: SupabaseTableInfo[] = [];

  for (const tableName of SUPABASE_TABLES) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.warn(`[Supabase DB] No se pudo obtener info de la tabla "${tableName}":`, error.message);
        continue;
      }

      // Descripciones personalizadas para cada tabla
      const descriptions: Record<string, string> = {
        'eventos': 'Eventos de producción',
        'gastos_evento': 'Gastos asociados a eventos',
        'usuarios': 'Colaboradores de la empresa',
        'items': 'Catálogo de equipos, servicios y personal',
        'cotizaciones': 'Cotizaciones de eventos',
        'cotizacion_items': 'Items en cotizaciones con días de renta',
        'clientes': 'Clientes del CRM'
      };

      tables.push({
        name: tableName,
        count: count ?? 0,
        size: 'N/A',
        description: descriptions[tableName] || 'Tabla Supabase'
      });
    } catch (err: any) {
      console.error(`[Supabase DB] Error inesperado con la tabla "${tableName}":`, err);
    }
  }

  return tables;
};

export const getTableData = async (
  tableName: string,
  page: number,
  pageSize: number
): Promise<SupabaseTableDataResult> => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from(tableName)
    .select('*', { count: 'exact' })
    .range(from, to);

  if (error) {
    console.error(`[Supabase DB] Error al obtener datos de "${tableName}":`, error);
    throw new Error(error.message || `Error al cargar datos de la tabla ${tableName}`);
  }

  return {
    data: data || [],
    total: count ?? 0
  };
};

export const getDatabaseStats = async (): Promise<SupabaseDbStats> => {
  const tables = await getAllTablesInfo();
  const totalTables = tables.length;
  const totalRecords = tables.reduce((sum, t) => sum + (t.count || 0), 0);

  return {
    totalTables,
    totalRecords,
    totalSize: 'N/A',
    lastUpdate: new Date()
  };
};

// Obtener todos los usuarios/colaboradores activos
export interface Usuario {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string | null;
  telefono: string | null;
  rol: string;
  activo: boolean;
}

export const getUsuarios = async (): Promise<Usuario[]> => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (error) {
    console.error('[Supabase DB] Error al obtener usuarios:', error);
    throw new Error(error.message || 'Error al cargar usuarios');
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    nombre: row.nombre,
    apellido: row.apellido,
    email: row.email,
    telefono: row.telefono,
    rol: row.rol || 'colaborador',
    activo: row.activo !== false
  }));
};


