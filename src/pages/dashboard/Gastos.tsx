import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, DollarSign, Edit, Trash2, Eye, Search, Filter, Calendar, Users } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import { getUsuarios, Usuario } from '../../services/supabaseDbService';

interface Gasto {
  id: string;
  evento_id: string;
  evento_nombre?: string;
  tipo: string;
  descripcion: string;
  monto: number;
  responsable_id: string;
  responsable_nombre?: string;
  created_at: string;
}

interface EventoSimple {
  id: string;
  nombre: string;
}

export const Gastos: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const eventoIdFromUrl = searchParams.get('evento');

  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [eventos, setEventos] = useState<EventoSimple[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [eventoFilter, setEventoFilter] = useState<string>(eventoIdFromUrl || 'all');
  const [showAddGasto, setShowAddGasto] = useState(false);
  const [selectedGasto, setSelectedGasto] = useState<Gasto | null>(null);
  const [showViewGasto, setShowViewGasto] = useState(false);
  const [newGasto, setNewGasto] = useState({
    evento_id: '',
    tipo: 'material',
    descripcion: '',
    monto: 0,
    responsable_id: ''
  });

  // Actualizar filtro y prellenar evento cuando cambie el parámetro de URL
  useEffect(() => {
    const eventoId = searchParams.get('evento');
    if (eventoId) {
      setEventoFilter(eventoId);
      // Prellenar el evento en el formulario de nuevo gasto
      setNewGasto(prev => ({ ...prev, evento_id: eventoId }));
    } else {
      setEventoFilter('all');
    }
  }, [searchParams]);

  const tiposGasto = [
    { value: 'material', label: 'Material' },
    { value: 'combustible', label: 'Combustible' },
    { value: 'viaticos', label: 'Viáticos' },
    { value: 'hospedaje', label: 'Hospedaje' },
    { value: 'proveedor', label: 'Proveedor' }
  ];

  // Cargar eventos
  useEffect(() => {
    const loadEventos = async () => {
      try {
        const { data, error: supabaseError } = await supabase
          .from('eventos')
          .select('id, nombre')
          .order('fecha', { ascending: false });

        if (supabaseError) {
          console.error('Error cargando eventos:', supabaseError);
          return;
        }

        setEventos((data || []).map((e: any) => ({
          id: e.id,
          nombre: e.nombre
        })));
      } catch (err) {
        console.error('Error inesperado cargando eventos:', err);
      }
    };

    void loadEventos();
  }, []);

  // Cargar usuarios
  useEffect(() => {
    const loadUsuarios = async () => {
      try {
        const usuariosList = await getUsuarios();
        setUsuarios(usuariosList);
      } catch (err: any) {
        console.error('Error cargando usuarios:', err);
      }
    };

    void loadUsuarios();
  }, []);

  // Cargar gastos
  useEffect(() => {
    const loadGastos = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: supabaseError } = await supabase
          .from('gastos_evento')
          .select(`
            *,
            eventos:evento_id (nombre),
            responsables:responsable_id (nombre, apellido)
          `)
          .order('created_at', { ascending: false });

        if (supabaseError) {
          throw new Error(supabaseError.message || 'Error al cargar gastos');
        }

        const mappedGastos: Gasto[] = (data || []).map((row: any) => ({
          id: row.id,
          evento_id: row.evento_id,
          evento_nombre: row.eventos?.nombre || 'Sin evento',
          tipo: row.tipo,
          descripcion: row.descripcion || '',
          monto: parseFloat(row.monto) || 0,
          responsable_id: row.responsable_id || '',
          responsable_nombre: row.responsables
            ? `${row.responsables.nombre || ''} ${row.responsables.apellido || ''}`.trim()
            : 'Sin responsable',
          created_at: row.created_at || new Date().toISOString()
        }));

        setGastos(mappedGastos);
      } catch (err: any) {
        console.error('Error cargando gastos desde Supabase:', err);
        setError(err.message || 'Error al cargar gastos');
      } finally {
        setLoading(false);
      }
    };

    void loadGastos();
  }, []);

  const handleAddGasto = async () => {
    if (!newGasto.evento_id || !newGasto.tipo || newGasto.monto <= 0) {
      setError('Por favor completa todos los campos requeridos (evento, tipo y monto)');
      return;
    }

    try {
      setError(null);
      const { data, error: supabaseError } = await supabase
        .from('gastos_evento')
        .insert({
          evento_id: newGasto.evento_id,
          tipo: newGasto.tipo,
          descripcion: newGasto.descripcion || null,
          monto: newGasto.monto,
          responsable_id: newGasto.responsable_id || null
        })
        .select(`
          *,
          eventos:evento_id (nombre),
          responsables:responsable_id (nombre, apellido)
        `)
        .single();

      if (supabaseError) {
        throw new Error(supabaseError.message || 'Error al crear gasto');
      }

      const mappedGasto: Gasto = {
        id: data.id,
        evento_id: data.evento_id,
        evento_nombre: data.eventos?.nombre || 'Sin evento',
        tipo: data.tipo,
        descripcion: data.descripcion || '',
        monto: parseFloat(data.monto) || 0,
        responsable_id: data.responsable_id || '',
        responsable_nombre: data.responsables
          ? `${data.responsables.nombre || ''} ${data.responsables.apellido || ''}`.trim()
          : 'Sin responsable',
        created_at: data.created_at || new Date().toISOString()
      };

      setGastos([mappedGasto, ...gastos]);
      setNewGasto({
        evento_id: '',
        tipo: 'material',
        descripcion: '',
        monto: 0,
        responsable_id: ''
      });
      setShowAddGasto(false);
    } catch (err: any) {
      console.error('Error creando gasto en Supabase:', err);
      setError(err.message || 'Error al crear gasto');
    }
  };

  const handleDeleteGasto = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      return;
    }

    try {
      setError(null);
      const { error: supabaseError } = await supabase
        .from('gastos_evento')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw new Error(supabaseError.message || 'Error al eliminar gasto');
      }

      setGastos(gastos.filter(g => g.id !== id));
    } catch (err: any) {
      console.error('Error eliminando gasto de Supabase:', err);
      setError(err.message || 'Error al eliminar gasto');
    }
  };

  const getTipoLabel = (tipo: string) => {
    return tiposGasto.find(t => t.value === tipo)?.label || tipo;
  };

  const filteredGastos = gastos.filter(gasto => {
    const matchesSearch = gasto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gasto.evento_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gasto.responsable_nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === 'all' || gasto.tipo === tipoFilter;
    const matchesEvento = eventoFilter === 'all' || gasto.evento_id === eventoFilter;
    return matchesSearch && matchesTipo && matchesEvento;
  });

  return (
    <div className="dark:bg-black bg-white h-screen p-0 md:p-6 flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-none p-4 md:p-0 pb-4">
        <div className="flex flex-row justify-between items-center gap-4 mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-3xl font-bold uppercase dark:text-white text-gray-900 mb-0 md:mb-2">Gastos</h1>
            <p className="dark:text-white text-gray-900 mt-1 uppercase text-sm hidden md:block">
              {eventoFilter !== 'all'
                ? `Gastos del evento: ${eventos.find(e => e.id === eventoFilter)?.nombre || 'Evento seleccionado'}`
                : 'Gestión de gastos por evento'
              }
            </p>
          </div>
          <Button
            onClick={() => setShowAddGasto(true)}
            className="uppercase !p-2 md:!px-4 md:!py-2"
          >
            <Plus className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline">Nuevo Gasto</span>
          </Button>
        </div>
      </div>

      {/* Contenedor de Filtros y Lista */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Filtros y Búsqueda */}
        <Card className="dark:bg-black/80 bg-white/80 backdrop-blur-sm dark:border-white/20 border-gray-200 mb-4 md:mb-6 flex-shrink-0" padding="none">
          <div className="p-3 md:p-4 space-y-3 md:space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 dark:text-white text-gray-900" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 md:pl-10 pr-3 py-1.5 md:py-2 text-sm md:text-base border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase dark:placeholder-gray-400 placeholder-gray-500"
                />
              </div>
              <div className="flex gap-2 md:gap-4">
                <select
                  value={tipoFilter}
                  onChange={(e) => setTipoFilter(e.target.value)}
                  className="flex-1 px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-base border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                >
                  <option value="all">Tipo</option>
                  {tiposGasto.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
                <select
                  value={eventoFilter}
                  onChange={(e) => setEventoFilter(e.target.value)}
                  className="flex-1 px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-base border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                >
                  <option value="all">Evento</option>
                  {eventos.map(evento => (
                    <option key={evento.id} value={evento.id}>{evento.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Mensaje de Error */}
        {error && (
          <Card className="bg-red-900/20 border-red-800 mb-6 flex-shrink-0">
            <div className="p-4 flex items-center gap-3">
              <p className="text-red-400 uppercase text-sm">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">×</button>
            </div>
          </Card>
        )}

        {/* Modal Agregar Gasto */}
        {showAddGasto && (
          <div className="fixed inset-0 dark:bg-black/80 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="dark:bg-black bg-white dark:border-white/20 border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-bold uppercase dark:text-white text-gray-900">Nuevo Gasto</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 uppercase dark:text-white text-gray-900">Evento</label>
                    <select
                      value={newGasto.evento_id}
                      onChange={(e) => setNewGasto({ ...newGasto, evento_id: e.target.value })}
                      className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                    >
                      <option value="">Seleccionar evento...</option>
                      {eventos.map(evento => (
                        <option key={evento.id} value={evento.id}>{evento.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 uppercase dark:text-white text-gray-900">Tipo de Gasto</label>
                    <select
                      value={newGasto.tipo}
                      onChange={(e) => setNewGasto({ ...newGasto, tipo: e.target.value })}
                      className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                    >
                      {tiposGasto.map(tipo => (
                        <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 uppercase dark:text-white text-gray-900">Monto</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newGasto.monto || ''}
                      onChange={(e) => setNewGasto({ ...newGasto, monto: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 uppercase dark:text-white text-gray-900">Responsable</label>
                    <select
                      value={newGasto.responsable_id}
                      onChange={(e) => setNewGasto({ ...newGasto, responsable_id: e.target.value })}
                      className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                    >
                      <option value="">Seleccionar responsable...</option>
                      {usuarios.map(usuario => (
                        <option key={usuario.id} value={usuario.id}>
                          {usuario.nombre} {usuario.apellido || ''} {usuario.email ? `(${usuario.email})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 uppercase dark:text-white text-gray-900">Descripción</label>
                    <textarea
                      value={newGasto.descripcion}
                      onChange={(e) => setNewGasto({ ...newGasto, descripcion: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                      placeholder="Descripción del gasto"
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddGasto(false);
                      setNewGasto({
                        evento_id: '',
                        tipo: 'material',
                        descripcion: '',
                        monto: 0,
                        responsable_id: ''
                      });
                    }}
                    className="uppercase"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddGasto}
                    className="uppercase"
                  >
                    Crear Gasto
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Lista de Gastos */}
        {loading ? (
          <Card className="bg-black/80 backdrop-blur-sm border-gray-800">
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white uppercase text-sm">Cargando gastos...</p>
            </div>
          </Card>
        ) : filteredGastos.length === 0 ? (
          <Card className="bg-black/80 backdrop-blur-sm border-gray-800">
            <div className="p-12 text-center">
              <DollarSign className="w-16 h-16 dark:text-white text-gray-900 mx-auto mb-4" />
              <h3 className="text-xl font-semibold uppercase mb-2 dark:text-white text-gray-900">No hay gastos</h3>
              <p className="dark:text-white text-gray-900 uppercase text-sm mb-4">Crea tu primer gasto para comenzar</p>
              <Button onClick={() => setShowAddGasto(true)} className="uppercase">
                <Plus className="w-5 h-5 mr-2" />
                Crear Gasto
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 flex-1 overflow-y-auto min-h-0">
            {filteredGastos.map((gasto) => (
              <Card key={gasto.id} className="dark:bg-black/80 bg-white/80 backdrop-blur-sm dark:border-white/20 border-gray-200 dark:hover:border-white/40 hover:border-gray-300 transition-colors">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold uppercase mb-2 dark:text-white text-gray-900">
                        ${gasto.monto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h3>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium uppercase dark:bg-white/10 bg-gray-200 dark:text-white text-gray-900 dark:border border-white/20">
                        {getTipoLabel(gasto.tipo)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedGasto(gasto);
                          setShowViewGasto(true);
                        }}
                        className="p-2 dark:text-white text-gray-900 dark:hover:text-white hover:text-gray-700 dark:hover:bg-white/10 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteGasto(gasto.id)}
                        className="p-2 dark:text-white text-gray-900 hover:text-red-400 dark:hover:bg-white/10 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-2 dark:text-white text-gray-900" />
                      <span className="uppercase dark:text-white text-gray-900">{gasto.evento_nombre}</span>
                    </div>
                    {gasto.descripcion && (
                      <p className="text-sm dark:text-white text-gray-900 uppercase">{gasto.descripcion}</p>
                    )}
                    <div className="flex items-center text-sm">
                      <Users className="w-4 h-4 mr-2 dark:text-white text-gray-900" />
                      <span className="uppercase dark:text-white text-gray-900">{gasto.responsable_nombre}</span>
                    </div>
                    <p className="text-xs dark:text-white text-gray-900 uppercase">
                      {new Date(gasto.created_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Ver Gasto */}
      {showViewGasto && selectedGasto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="dark:bg-black bg-white dark:border-white/20 border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold uppercase dark:text-white text-gray-900">Detalle del Gasto</h2>
                <button
                  onClick={() => setShowViewGasto(false)}
                  className="dark:text-white text-gray-900 dark:hover:text-white hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm uppercase dark:text-white text-gray-900 mb-1">Monto</p>
                  <p className="text-2xl font-bold uppercase dark:text-white text-gray-900">
                    ${selectedGasto.monto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm uppercase dark:text-white text-gray-700 mb-1">Tipo</p>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium uppercase dark:bg-white/10 bg-gray-200 dark:text-white text-gray-900 dark:border border-white/20">
                    {getTipoLabel(selectedGasto.tipo)}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm uppercase dark:text-white text-gray-700 mb-1">Evento</p>
                  <p className="uppercase dark:text-white text-gray-900">{selectedGasto.evento_nombre}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm uppercase dark:text-white text-gray-700 mb-1">Responsable</p>
                  <p className="uppercase dark:text-white text-gray-900">{selectedGasto.responsable_nombre}</p>
                </div>
                {selectedGasto.descripcion && (
                  <div className="md:col-span-2">
                    <p className="text-sm uppercase dark:text-white text-gray-700 mb-2">Descripción</p>
                    <p className="uppercase dark:text-white text-gray-900">{selectedGasto.descripcion}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm uppercase dark:text-white text-gray-700 mb-1">Fecha de Creación</p>
                  <p className="uppercase dark:text-white text-gray-900">
                    {new Date(selectedGasto.created_at).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowViewGasto(false)}
                  className="uppercase"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

