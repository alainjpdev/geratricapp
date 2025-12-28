// Nota: Este servicio requiere que Prisma Client se ejecute en un entorno Node.js
// Para usar en el frontend, necesitarías crear un backend API que exponga estos endpoints
// Por ahora, este código está diseñado para ejecutarse en el servidor

let prisma: any = null;

// Intentar inicializar Prisma Client solo si estamos en un entorno Node.js
try {
  if (typeof window === 'undefined') {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
  }
} catch (error) {
  console.warn('Prisma Client no está disponible en el navegador. Se requiere un backend API.');
}

export interface TableInfo {
  name: string;
  count: number;
  description: string;
  size: string;
  columns: ColumnInfo[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
}

// Obtener todas las tablas de la base de datos
export async function getAllTables(): Promise<string[]> {
  if (!prisma) {
    throw new Error('Prisma Client no está disponible. Se requiere un backend API.');
  }
  
  try {
    const result = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    return result.map(row => row.tablename);
  } catch (error) {
    console.error('Error obteniendo tablas:', error);
    throw error;
  }
}

// Obtener información de una tabla específica
export async function getTableInfo(tableName: string): Promise<TableInfo | null> {
  if (!prisma) {
    throw new Error('Prisma Client no está disponible. Se requiere un backend API.');
  }
  
  try {
    // Obtener conteo de registros usando queryRawUnsafe para nombres de tabla dinámicos
    const countResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::bigint as count FROM "${tableName}"`
    ) as Array<{ count: bigint }>;
    const count = Number(countResult[0]?.count || 0);

    // Obtener tamaño de la tabla
    const sizeResult = await prisma.$queryRawUnsafe(
      `SELECT pg_size_pretty(pg_total_relation_size('${tableName}'::regclass)) as size`
    ) as Array<{ size: string }>;
    const size = sizeResult[0]?.size || '0 bytes';

    // Obtener columnas
    const columnsResult = await prisma.$queryRawUnsafe(
      `SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      ORDER BY ordinal_position`
    ) as Array<{
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
    }>;

    const columns: ColumnInfo[] = columnsResult.map(col => ({
      name: col.column_name,
      type: col.data_type,
      nullable: col.is_nullable === 'YES',
      default: col.column_default
    }));

    return {
      name: tableName,
      count,
      description: `Tabla ${tableName} con ${count} registros`,
      size,
      columns
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
    return [];
  }
}

// Obtener datos de una tabla con paginación
export async function getTableData(
  tableName: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{ data: any[]; total: number }> {
  if (!prisma) {
    throw new Error('Prisma Client no está disponible. Se requiere un backend API.');
  }
  
  try {
    // Obtener total
    const countResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::bigint as count FROM "${tableName}"`
    ) as Array<{ count: bigint }>;
    const total = Number(countResult[0]?.count || 0);

    // Obtener datos paginados
    const offset = (page - 1) * pageSize;
    const data = await prisma.$queryRawUnsafe(
      `SELECT * FROM "${tableName}" LIMIT ${pageSize} OFFSET ${offset}`
    );

    return {
      data: data as any[],
      total
    };
  } catch (error) {
    console.error(`Error obteniendo datos de tabla ${tableName}:`, error);
    return { data: [], total: 0 };
  }
}

// Obtener estadísticas generales de la base de datos
export async function getDatabaseStats(): Promise<{
  totalTables: number;
  totalRecords: number;
  totalSize: string;
  lastUpdate: Date;
}> {
  if (!prisma) {
    throw new Error('Prisma Client no está disponible. Se requiere un backend API.');
  }
  
  try {
    const tables = await getAllTables();
    let totalRecords = 0;

    for (const table of tables) {
      const info = await getTableInfo(table);
      if (info) {
        totalRecords += info.count;
      }
    }

    // Obtener tamaño total de la base de datos
    const sizeResult = await prisma.$queryRawUnsafe(
      `SELECT pg_size_pretty(pg_database_size(current_database())) as size`
    ) as Array<{ size: string }>;
    const totalSize = sizeResult[0]?.size || '0 bytes';

    return {
      totalTables: tables.length,
      totalRecords,
      totalSize,
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

