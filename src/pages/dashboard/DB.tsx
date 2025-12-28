import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Database, Search, RefreshCw, Download, Upload, Trash2, Edit, Plus, Table, AlertCircle, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { getAllTablesInfo, getDatabaseStats, SupabaseTableInfo } from '../../services/supabaseDbService';
import { supabase } from '../../config/supabaseClient';
import { LocalUsersTable } from '../../components/dev/LocalUsersTable';
import { USE_LOCAL_DB } from '../../config/devMode';
import { localDB, LocalUser, LocalClass, LocalStreamItem, LocalAssignment, LocalQuiz, LocalMaterial, LocalAttachment, LocalClassMember, LocalAssignmentStudent, LocalQuizStudent, LocalMaterialStudent } from '../../db/localDB';

export const DB: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tables, setTables] = useState<SupabaseTableInfo[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [filteredTableData, setFilteredTableData] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Filtros para la tabla
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('');
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [filterEvento, setFilterEvento] = useState<string>('');
  const [filterResponsable, setFilterResponsable] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalTables: 0,
    totalRecords: 0,
    totalSize: '0 bytes',
    lastUpdate: new Date()
  });

  // Cargar tablas al montar el componente
  useEffect(() => {
    loadTables();
    loadStats();
  }, []);

  // Cargar datos de la tabla seleccionada
  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable);
    }
  }, [selectedTable]);

  const loadTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const tablesInfo = await getAllTablesInfo();
      setTables(tablesInfo);
    } catch (err: any) {
      console.error('Error cargando tablas desde Supabase:', err);
      const errorMessage = err.message || '';
      setError(`Error al cargar tablas desde Supabase: ${errorMessage || 'Revisa que las tablas configuradas existan en tu proyecto.'}`);
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (tableName: string) => {
    try {
      setLoading(true);
      
      // Para gastos_evento, necesitamos hacer JOINs para obtener nombres
      if (tableName === 'gastos_evento') {
        // Obtener gastos con información de eventos y usuarios
        const { data: gastosData, error: gastosError, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' });

        if (gastosError) {
          throw new Error(gastosError.message);
        }

        // Obtener todos los eventos para mapear IDs a nombres
        const { data: eventosData } = await supabase
          .from('eventos')
          .select('id, nombre');

        // Obtener todos los usuarios para mapear IDs a nombres
        const { data: usuariosData } = await supabase
          .from('usuarios')
          .select('id, nombre, apellido');

        // Crear mapas para búsqueda rápida
        const eventosMap = new Map<string, string>();
        eventosData?.forEach(evento => {
          eventosMap.set(evento.id, evento.nombre || 'Sin nombre');
        });

        const usuariosMap = new Map<string, string>();
        usuariosData?.forEach(usuario => {
          const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'Sin nombre';
          usuariosMap.set(usuario.id, nombreCompleto);
        });

        // Mapear los datos agregando nombres
        const mappedData = (gastosData || []).map(gasto => ({
          ...gasto,
          evento_nombre: gasto.evento_id ? eventosMap.get(gasto.evento_id) || `ID: ${gasto.evento_id.substring(0, 8)}...` : 'Sin evento',
          responsable_nombre: gasto.responsable_id ? usuariosMap.get(gasto.responsable_id) || `ID: ${gasto.responsable_id.substring(0, 8)}...` : 'Sin responsable',
        }));

        setTableData(mappedData);
        setFilteredTableData(mappedData);
        setTotalRecords(count || 0);
      } else {
        // Para otras tablas, obtener datos normalmente
        const { data, error: fetchError, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' });

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        setTableData(data || []);
        setFilteredTableData(data || []);
        setTotalRecords(count || 0);
      }
      
      // Resetear filtros al cargar nueva tabla
      setTableSearchTerm('');
      setFilterCategoria('');
      setFilterTipo('');
      setFilterEvento('');
      setFilterResponsable('');
    } catch (err: any) {
      console.error('Error cargando datos de tabla:', err);
      setError(`Error al cargar datos de la tabla ${tableName}`);
      setTableData([]);
      setFilteredTableData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const databaseStats = await getDatabaseStats();
      setStats(databaseStats);
    } catch (err: any) {
      console.error('Error cargando estadísticas:', err);
    }
  };

  const handleRefresh = () => {
    loadTables();
    loadStats();
    if (selectedTable) {
      loadTableData(selectedTable);
    }
  };

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedTableInfo = tables.find(t => t.name === selectedTable);

  // Obtener valores únicos para los filtros
  const getUniqueValues = (field: string): string[] => {
    const values = new Set<string>();
    tableData.forEach(row => {
      if (row[field] && row[field] !== null && row[field] !== undefined) {
        values.add(String(row[field]));
      }
    });
    return Array.from(values).sort();
  };

  const categoriasUnicas = getUniqueValues('categoria');
  const tiposUnicos = getUniqueValues('tipo');
  const eventosUnicos = getUniqueValues('evento_nombre');
  const responsablesUnicos = getUniqueValues('responsable_nombre');
  // Para gastos_evento, también obtener tipos únicos del campo 'tipo'
  const tiposGastosUnicos = selectedTable === 'gastos_evento' ? getUniqueValues('tipo') : [];

  // Filtrar datos de la tabla
  useEffect(() => {
    if (!selectedTable) return;

    let filtered = [...tableData];

    // Filtro por búsqueda (buscar en todos los campos de texto)
    if (tableSearchTerm) {
      const searchLower = tableSearchTerm.toLowerCase();
      filtered = filtered.filter(row => {
        return Object.values(row).some(value => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchLower);
        });
      });
    }

    // Filtro por categoría (para items)
    if (filterCategoria) {
      filtered = filtered.filter(row => row.categoria === filterCategoria);
    }

    // Filtro por tipo (para items)
    if (filterTipo && selectedTable === 'items') {
      filtered = filtered.filter(row => row.tipo === filterTipo);
    }

    // Filtro por tipo (para gastos_evento)
    if (filterTipo && selectedTable === 'gastos_evento') {
      filtered = filtered.filter(row => row.tipo === filterTipo);
    }

    // Filtro por evento (para gastos_evento)
    if (filterEvento && selectedTable === 'gastos_evento') {
      filtered = filtered.filter(row => row.evento_nombre === filterEvento);
    }

    // Filtro por responsable (para gastos_evento)
    if (filterResponsable && selectedTable === 'gastos_evento') {
      filtered = filtered.filter(row => row.responsable_nombre === filterResponsable);
    }

    setFilteredTableData(filtered);
  }, [tableData, tableSearchTerm, filterCategoria, filterTipo, filterEvento, filterResponsable, selectedTable]);

  const handleEdit = (row: any) => {
    setEditingRow(row);
    setEditFormData({ ...row });
    setIsCreating(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleNew = () => {
    if (!selectedTable) return;
    
    // Crear un objeto vacío con valores por defecto según la tabla
    const newRecord: Record<string, any> = {};
    
    // Obtener un registro de ejemplo para conocer la estructura
    if (tableData.length > 0) {
      const exampleRow = tableData[0];
      Object.keys(exampleRow).forEach(key => {
        // Excluir campos de sistema
        if (key !== 'id' && key !== 'created_at' && key !== 'updated_at' && 
            key !== 'evento_nombre' && key !== 'responsable_nombre') {
          // Valores por defecto según el tipo de campo
          const value = exampleRow[key];
          if (typeof value === 'boolean') {
            newRecord[key] = false;
          } else if (typeof value === 'number') {
            newRecord[key] = 0;
          } else {
            newRecord[key] = '';
          }
        }
      });
    }
    
    setEditingRow({});
    setEditFormData(newRecord);
    setIsCreating(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditFormData({});
    setIsCreating(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedTable) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Preparar los datos (excluir campos que no se deben guardar)
      const saveData: Record<string, any> = {};
      Object.keys(editFormData).forEach(key => {
        // Excluir campos de sistema y de visualización
        if (key !== 'id' && 
            key !== 'created_at' && 
            key !== 'updated_at' &&
            key !== 'evento_nombre' &&
            key !== 'responsable_nombre') {
          saveData[key] = editFormData[key];
        }
      });

      if (isCreating) {
        // Crear nuevo registro
        const { error: insertError } = await supabase
          .from(selectedTable)
          .insert(saveData);

        if (insertError) {
          throw new Error(insertError.message || 'Error al crear el registro');
        }

        // Mensaje específico según el tipo de tabla
        const itemName = editFormData.nombre || editFormData.name || 'registro';
        const message = selectedTable === 'items' 
          ? `✅ Item "${itemName}" creado correctamente`
          : `✅ Registro creado correctamente`;
        
        setSuccessMessage(message);
        setIsCreating(false);
      } else {
        // Actualizar registro existente
        const idField = 'id';
        const recordId = editingRow[idField];

        if (!recordId) {
          throw new Error('No se pudo identificar el ID del registro');
        }

        // Solo actualizar campos que cambiaron
        const updateData: Record<string, any> = {};
        Object.keys(saveData).forEach(key => {
          if (saveData[key] !== editingRow[key]) {
            updateData[key] = saveData[key];
          }
        });

        if (Object.keys(updateData).length === 0) {
          setSuccessMessage('No hay cambios para guardar');
          setSaving(false);
          return;
        }

        const { error: updateError } = await supabase
          .from(selectedTable)
          .update(updateData)
          .eq(idField, recordId);

        if (updateError) {
          throw new Error(updateError.message || 'Error al actualizar el registro');
        }

        // Mensaje específico según el tipo de tabla
        const itemName = editFormData.nombre || editFormData.name || 'registro';
        const message = selectedTable === 'items' 
          ? `✅ Item "${itemName}" editado correctamente`
          : `✅ Registro actualizado correctamente`;
        
        setSuccessMessage(message);
      }

      setEditingRow(null);
      setEditFormData({});
      setIsCreating(false);
      
      // Recargar los datos de la tabla
      await loadTableData(selectedTable);
      
      // Auto-cerrar el mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error al guardar registro:', err);
      setError(err.message || `Error al ${isCreating ? 'crear' : 'actualizar'} el registro`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: any) => {
    if (!selectedTable) return;

    // Obtener el ID del registro
    const idField = 'id';
    const recordId = row[idField];

    if (!recordId) {
      setError('No se pudo identificar el ID del registro');
      return;
    }

    // Confirmar eliminación
    const confirmMessage = `¿Estás seguro de que quieres eliminar este registro?\n\nEsta acción no se puede deshacer.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const { error: deleteError } = await supabase
        .from(selectedTable)
        .delete()
        .eq(idField, recordId);

      if (deleteError) {
        throw new Error(deleteError.message || 'Error al eliminar el registro');
      }

      setSuccessMessage('Registro eliminado correctamente');
      
      // Recargar los datos de la tabla
      await loadTableData(selectedTable);
    } catch (err: any) {
      console.error('Error al eliminar registro:', err);
      setError(err.message || 'Error al eliminar el registro');
    } finally {
      setSaving(false);
    }
  };

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="space-y-6 dark:bg-black bg-white min-h-screen p-6 overflow-y-auto">
      {/* Tabla de Usuarios Locales - Solo en modo desarrollo */}
      {USE_LOCAL_DB && (
        <div className="mb-6">
          <LocalUsersTable />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold uppercase dark:text-white text-gray-900 mb-0 md:mb-2">BASE DE DATOS</h1>
          <p className="dark:text-white text-gray-900 uppercase text-sm">GESTIÓN Y ADMINISTRACIÓN DE BASE DE DATOS</p>
        </div>
        <div className="flex gap-3">
          {USE_LOCAL_DB && (
            <Button 
              className="uppercase bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={syncFromSupabase} 
              disabled={syncing}
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'SINCRONIZANDO...' : 'SINCRONIZAR DESDE SUPABASE'}
            </Button>
          )}
          <Button className="uppercase" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            ACTUALIZAR
          </Button>
          <Button className="uppercase">
            <Download className="w-5 h-5 mr-2" />
            EXPORTAR
          </Button>
        </div>
      </div>

      {/* Mensaje de sincronización */}
      {syncMessage && (
        <div className={`p-4 rounded-lg ${syncMessage.includes('✅') ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
          {syncMessage}
        </div>
      )}

      {/* Búsqueda y Filtros */}
      {/* <Card className="bg-black/80 backdrop-blur-sm border-gray-800">
        <div className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 dark:text-white text-gray-900" />
              <input
                type="text"
                placeholder="BUSCAR TABLA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-700 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase placeholder-gray-500"
              />
            </div>
          </div>
        </div>
      </Card> */}

      {/* Mensaje de Error */}
      {error && !editingRow && (
        <Card className="bg-red-900/20 border-red-800">
          <div className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400 uppercase text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        </Card>
      )}

      {/* Mensaje de Éxito */}
      {successMessage && !editingRow && (
        <Card className="bg-green-900/30 border-green-600 border-2 animate-pulse">
          <div className="p-4 flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-green-300 uppercase text-sm font-semibold flex-1">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-green-400 hover:text-green-300 text-xl font-bold"
              title="Cerrar"
            >
              ×
            </button>
          </div>
        </Card>
      )}

      {/* Lista de Tablas */}
      {loading && tables.length === 0 ? (
        <Card className="dark:bg-black/80 bg-white/80 backdrop-blur-sm dark:border-white/20 border-gray-200">
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 dark:text-white text-gray-900 animate-spin mx-auto mb-4" />
            <p className="dark:text-white text-gray-900 uppercase">CARGANDO TABLAS...</p>
          </div>
        </Card>
      ) : filteredTables.length === 0 ? (
        <Card className="dark:bg-black/80 bg-white/80 backdrop-blur-sm dark:border-white/20 border-gray-200">
          <div className="p-8 text-center">
            <Database className="w-12 h-12 dark:text-white text-gray-900 mx-auto mb-4" />
            <p className="dark:text-white text-gray-900 uppercase text-lg mb-2">NO HAY TABLAS DISPONIBLES</p>
            <p className="dark:text-white text-gray-900 uppercase text-sm">
              {searchTerm ? 'NO SE ENCONTRARON TABLAS CON ESE NOMBRE' : 'LA BASE DE DATOS ESTÁ VACÍA'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
            {filteredTables.map((table) => (
              <div
                key={table.name}
                onClick={() => setSelectedTable(table.name)}
                className="cursor-pointer flex-shrink-0"
                style={{ width: '280px' }}
              >
                <Card padding="none" className="dark:bg-black/80 bg-white/80 backdrop-blur-sm dark:border-white/20 border-gray-200 dark:hover:border-white/40 hover:border-gray-300 transition-colors h-full flex flex-col min-h-[180px]">
                  <div className="p-4 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 dark:bg-black bg-gray-100 rounded-lg dark:border border-white/20 flex-shrink-0">
                          <Table className="w-5 h-5 dark:text-white text-gray-900" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold dark:text-white text-gray-900 uppercase truncate">{table.name}</h3>
                          <p className="text-xs dark:text-white text-gray-900 uppercase">{table.count} REGISTROS</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs dark:text-white text-gray-900 mb-4 uppercase flex-1">{table.description}</p>
                    <div className="flex gap-2 mt-auto">
                      <Button
                        size="sm"
                        className="flex-1 uppercase"
                        onClick={(e?: React.MouseEvent) => {
                          e?.stopPropagation();
                          setSelectedTable(table.name);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        VER
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="uppercase"
                        onClick={(e?: React.MouseEvent) => {
                          e?.stopPropagation();
                          // Acción de exportar
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vista de Tabla Seleccionada */}
      {selectedTable && (
        <Card padding="none" className="dark:bg-black/80 bg-white/80 backdrop-blur-sm dark:border-gray-800 border-gray-200">
          <div>
            <div className="flex items-center justify-between mb-3 px-4 pt-4">
              <div>
                <h2 className="text-base font-semibold dark:text-white text-gray-900 uppercase">
                  {selectedTable.toUpperCase()}
                </h2>
                <p className="dark:text-white text-gray-900 uppercase text-xs mt-0.5">
                  {filteredTableData.length} DE {totalRecords} REGISTROS
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="uppercase"
                  onClick={() => setSelectedTable(null)}
                >
                  CERRAR
                </Button>
                <Button 
                  size="sm" 
                  className="uppercase"
                  onClick={handleNew}
                >
                  <Plus className="w-3 h-3 mr-1.5" />
                  NUEVO
                </Button>
              </div>
            </div>

            {/* Filtros y Búsqueda */}
            {(selectedTable === 'items' || selectedTable === 'gastos_evento') && (
              <div className="px-4 pb-4 border-b dark:border-white/20 border-gray-200">
                <div className="flex flex-col md:flex-row gap-3">
                  {/* Barra de búsqueda */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 dark:text-white text-gray-900" />
                    <input
                      type="text"
                      placeholder="BUSCAR..."
                      value={tableSearchTerm}
                      onChange={(e) => setTableSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-xs border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors uppercase placeholder-gray-500"
                    />
                  </div>

                  {/* Filtro por tipo (para items) */}
                  {selectedTable === 'items' && tiposUnicos.length > 0 && (
                    <select
                      value={filterTipo}
                      onChange={(e) => setFilterTipo(e.target.value)}
                      className="px-3 py-2 text-xs border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors uppercase"
                    >
                      <option value="">TODOS LOS TIPOS</option>
                      {tiposUnicos.map((tipo: string) => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  )}

                  {/* Filtro por tipo (para gastos_evento) */}
                  {selectedTable === 'gastos_evento' && tiposGastosUnicos.length > 0 && (
                    <select
                      value={filterTipo}
                      onChange={(e) => setFilterTipo(e.target.value)}
                      className="px-3 py-2 text-xs border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors uppercase"
                    >
                      <option value="">TODOS LOS TIPOS</option>
                      {tiposGastosUnicos.map((tipo: string) => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  )}

                  {/* Filtro por categoría (para items) */}
                  {selectedTable === 'items' && categoriasUnicas.length > 0 && (
                    <select
                      value={filterCategoria}
                      onChange={(e) => setFilterCategoria(e.target.value)}
                      className="px-3 py-2 text-xs border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors uppercase"
                    >
                      <option value="">TODAS LAS CATEGORÍAS</option>
                      {categoriasUnicas.map((categoria: string) => (
                        <option key={categoria} value={categoria}>{categoria}</option>
                      ))}
                    </select>
                  )}

                  {/* Filtro por evento (para gastos_evento) */}
                  {selectedTable === 'gastos_evento' && eventosUnicos.length > 0 && (
                    <select
                      value={filterEvento}
                      onChange={(e) => setFilterEvento(e.target.value)}
                      className="px-3 py-2 text-xs border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors uppercase"
                    >
                      <option value="">TODOS LOS EVENTOS</option>
                      {eventosUnicos.map((evento: string) => (
                        <option key={evento} value={evento}>{evento}</option>
                      ))}
                    </select>
                  )}

                  {/* Filtro por responsable (para gastos_evento) */}
                  {selectedTable === 'gastos_evento' && responsablesUnicos.length > 0 && (
                    <select
                      value={filterResponsable}
                      onChange={(e) => setFilterResponsable(e.target.value)}
                      className="px-3 py-2 text-xs border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors uppercase"
                    >
                      <option value="">TODOS LOS RESPONSABLES</option>
                      {responsablesUnicos.map((responsable: string) => (
                        <option key={responsable} value={responsable}>{responsable}</option>
                      ))}
                    </select>
                  )}

                  {/* Botón para limpiar filtros */}
                  {(tableSearchTerm || filterCategoria || filterTipo || filterEvento || filterResponsable) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="uppercase"
                      onClick={() => {
                        setTableSearchTerm('');
                        setFilterCategoria('');
                        setFilterTipo('');
                        setFilterEvento('');
                        setFilterResponsable('');
                      }}
                    >
                      LIMPIAR
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Tabla de Datos */}
            {loading ? (
              <div className="p-6 text-center">
                <RefreshCw className="w-6 h-6 dark:text-white text-gray-900 animate-spin mx-auto mb-2" />
                <p className="dark:text-white text-gray-900 uppercase text-xs">CARGANDO DATOS...</p>
              </div>
            ) : filteredTableData.length === 0 ? (
              <div className="p-6 text-center">
                <Table className="w-8 h-8 dark:text-white text-gray-900 mx-auto mb-2" />
                <p className="dark:text-white text-gray-900 uppercase text-sm">
                  {tableData.length === 0 
                    ? 'NO HAY DATOS EN ESTA TABLA' 
                    : 'NO SE ENCONTRARON REGISTROS CON LOS FILTROS APLICADOS'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[calc(100vh-500px)] overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b dark:border-white/20 border-gray-200">
                      {filteredTableData.length > 0 && Object.keys(filteredTableData[0])
                        .filter(key => {
                          // Para gastos_evento, ocultar evento_id y responsable_id, mostrar evento_nombre y responsable_nombre
                          if (selectedTable === 'gastos_evento') {
                            return key !== 'evento_id' && key !== 'responsable_id';
                          }
                          return true;
                        })
                        .map((key) => {
                          // Renombrar columnas para mejor legibilidad
                          let displayKey = key;
                          if (selectedTable === 'gastos_evento') {
                            if (key === 'evento_nombre') displayKey = 'evento';
                            if (key === 'responsable_nombre') displayKey = 'responsable';
                          }
                          return (
                            <th key={key} className="px-3 py-2 text-left text-xs font-semibold dark:text-white text-gray-900 uppercase">
                              {displayKey.replace(/_/g, ' ')}
                            </th>
                          );
                        })}
                      <th className="px-3 py-2 text-left text-xs font-semibold dark:text-white text-gray-900 uppercase">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTableData.map((row, index) => (
                      <tr key={index} className="border-b dark:border-white/20 border-gray-200 dark:hover:bg-white/5 hover:bg-gray-100/50">
                        {Object.entries(row)
                          .filter(([key]) => {
                            // Para gastos_evento, ocultar evento_id y responsable_id
                            if (selectedTable === 'gastos_evento') {
                              return key !== 'evento_id' && key !== 'responsable_id';
                            }
                            return true;
                          })
                          .map(([key, value]) => (
                            <td key={key} className="px-3 py-2 text-xs dark:text-white text-gray-900">
                              {value !== null && value !== undefined 
                                ? String(value).length > 50 
                                  ? String(value).substring(0, 50) + '...' 
                                  : String(value)
                                : '-'}
                            </td>
                          ))}
                        <td className="px-3 py-2 text-xs">
                          <div className="flex gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(row);
                              }}
                              className="p-1 dark:text-white text-gray-900 dark:hover:text-gray-300 hover:text-gray-700 dark:hover:bg-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Editar registro"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(row);
                              }}
                              className="p-1 dark:text-white text-gray-900 hover:text-red-400 dark:hover:bg-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Eliminar registro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Información de registros */}
            <div className="mt-3 px-4 pb-4 flex items-center justify-between">
              <p className="text-xs dark:text-white text-gray-900 uppercase">
                {filteredTableData.length === totalRecords 
                  ? `MOSTRANDO TODOS LOS ${totalRecords} REGISTROS`
                  : `MOSTRANDO ${filteredTableData.length} DE ${totalRecords} REGISTROS`}
              </p>
            </div>

          </div>
        </Card>
      )}

      {/* Modal de Edición */}
      {editingRow && selectedTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="dark:bg-black/95 bg-white/95 backdrop-blur-sm dark:border-white/20 border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold dark:text-white text-gray-900 uppercase">
                  {isCreating ? 'CREAR NUEVO REGISTRO' : 'EDITAR REGISTRO'}
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 dark:text-white text-gray-900 dark:hover:bg-white/10 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                  <p className="text-red-400 text-sm uppercase">{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-4 bg-green-900/30 border-2 border-green-600 rounded-lg animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-green-300 text-sm uppercase font-semibold">{successMessage}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {Object.keys(editFormData).map((key) => {
                  // No mostrar campos de sistema como id, created_at, updated_at en el formulario
                  // Tampoco mostrar campos de visualización como evento_nombre y responsable_nombre
                  if (key === 'id' || 
                      key === 'created_at' || 
                      key === 'updated_at' ||
                      key === 'evento_nombre' ||
                      key === 'responsable_nombre') {
                    return null;
                  }

                  const value = editFormData[key];
                  const isReadOnly = key === 'id';
                  const isUUID = typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
                  const isDate = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value);

                  // Opciones para campos específicos
                  const getDropdownOptions = (fieldName: string): string[] => {
                    if (fieldName === 'tipo') {
                      return ['equipo', 'servicio', 'personal'];
                    }
                    if (fieldName === 'categoria') {
                      return ['audio', 'iluminacion', 'video', 'escenografia', 'personal', 'produccion', 'fotografia'];
                    }
                    if (fieldName === 'unidad') {
                      return ['dia', 'hora', 'unidad', 'evento'];
                    }
                    if (fieldName === 'status') {
                      return ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
                    }
                    return [];
                  };

                  const dropdownOptions = getDropdownOptions(key);
                  const isDropdown = dropdownOptions.length > 0;

                  return (
                    <div key={key}>
                      <label className="block text-sm font-medium dark:text-white text-gray-900 uppercase mb-2">
                        {key.replace(/_/g, ' ')}
                      </label>
                      {typeof value === 'boolean' ? (
                        <select
                          value={value ? 'true' : 'false'}
                          onChange={(e) => setEditFormData({ ...editFormData, [key]: e.target.value === 'true' })}
                          disabled={isReadOnly || saving}
                          className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:opacity-50"
                        >
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      ) : isDropdown ? (
                        <select
                          value={value ?? ''}
                          onChange={(e) => setEditFormData({ ...editFormData, [key]: e.target.value })}
                          disabled={isReadOnly || saving}
                          className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:opacity-50 uppercase"
                        >
                          <option value="">Seleccionar...</option>
                          {dropdownOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : typeof value === 'number' ? (
                        <input
                          type="number"
                          step="any"
                          value={value ?? ''}
                          onChange={(e) => setEditFormData({ ...editFormData, [key]: e.target.value ? parseFloat(e.target.value) : null })}
                          disabled={isReadOnly || saving}
                          className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:opacity-50"
                        />
                      ) : isDate ? (
                        <input
                          type="datetime-local"
                          value={value ? new Date(value).toISOString().slice(0, 16) : ''}
                          onChange={(e) => setEditFormData({ ...editFormData, [key]: e.target.value ? new Date(e.target.value).toISOString() : null })}
                          disabled={isReadOnly || saving}
                          className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:opacity-50"
                        />
                      ) : isUUID ? (
                        <input
                          type="text"
                          value={value ?? ''}
                          disabled={true}
                          className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg opacity-50 cursor-not-allowed"
                        />
                      ) : (
                        <textarea
                          value={value ?? ''}
                          onChange={(e) => setEditFormData({ ...editFormData, [key]: e.target.value })}
                          disabled={isReadOnly || saving}
                          rows={typeof value === 'string' && value.length > 100 ? 4 : 2}
                          className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:opacity-50 resize-y"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 uppercase"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      GUARDANDO...
                    </>
                  ) : (
                    'GUARDAR'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="uppercase"
                >
                  CANCELAR
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Estadísticas - Ocultado */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:bg-black/80 bg-white/80 backdrop-blur-sm dark:border-white/20 border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm dark:text-white text-gray-900 uppercase">TOTAL TABLAS</p>
              <Database className="w-5 h-5 dark:text-white text-gray-900" />
            </div>
            <p className="text-2xl font-bold dark:text-white text-gray-900">{stats.totalTables}</p>
          </div>
        </Card>
        <Card className="dark:bg-black/80 bg-white/80 backdrop-blur-sm dark:border-white/20 border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm dark:text-white text-gray-900 uppercase">TOTAL REGISTROS</p>
              <Table className="w-5 h-5 dark:text-white text-gray-900" />
            </div>
            <p className="text-2xl font-bold dark:text-white text-gray-900">
              {stats.totalRecords}
            </p>
          </div>
        </Card>
        <Card className="dark:bg-black/80 bg-white/80 backdrop-blur-sm dark:border-white/20 border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm dark:text-white text-gray-900 uppercase">TAMAÑO TOTAL</p>
              <Database className="w-5 h-5 dark:text-white text-gray-900" />
            </div>
            <p className="text-2xl font-bold dark:text-white text-gray-900">{stats.totalSize}</p>
          </div>
        </Card>
        <Card className="dark:bg-black/80 bg-white/80 backdrop-blur-sm dark:border-white/20 border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm dark:text-white text-gray-900 uppercase">ÚLTIMA ACTUALIZACIÓN</p>
              <RefreshCw className="w-5 h-5 dark:text-white text-gray-900" />
            </div>
            <p className="text-sm font-semibold dark:text-white text-gray-900 uppercase">
              {stats.lastUpdate.toLocaleDateString()}
            </p>
          </div>
        </Card>
      </div> */}
    </div>
  );
};

