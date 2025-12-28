import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Calendar, MapPin, Clock, Users, Edit, Trash2, Eye, Search, Filter } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { getUsuarios, Usuario } from '../../services/supabaseDbService';

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  type: 'corporate' | 'concert' | 'social' | 'wedding' | 'festival';
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  attendees: number;
  description: string;
  createdAt: string;
  productor_id?: string;
  coordinador_id?: string;
}

export const Evento: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showViewEvent, setShowViewEvent] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  // Obtener fecha actual en formato YYYY-MM-DD para el input type="date"
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [newEvent, setNewEvent] = useState({
    name: '',
    date: getTodayDate(), // Fecha por defecto: hoy
    time: '',
    location: '',
    type: 'corporate' as Event['type'],
    status: 'planned' as Event['status'],
    attendees: 0,
    description: '',
    productor_id: '',
    coordinador_id: ''
  });

  const { user: authUser } = useAuthStore();

  // Mapear estado del componente a estado de Supabase
  const mapStatusToSupabase = (status: Event['status']): string => {
    const mapping: Record<Event['status'], string> = {
      'planned': 'programado',
      'in-progress': 'en_progreso',
      'completed': 'completado',
      'cancelled': 'cancelado'
    };
    return mapping[status] || 'programado';
  };

  const mapStatusFromSupabase = (status: string): Event['status'] => {
    const mapping: Record<string, Event['status']> = {
      'programado': 'planned',
      'en_progreso': 'in-progress',
      'completado': 'completed',
      'cancelado': 'cancelled'
    };
    return mapping[status] || 'planned';
  };

  // Cargar eventos desde Supabase
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error: supabaseError } = await supabase
          .from('eventos')
          .select('*')
          .order('fecha', { ascending: false });

        if (supabaseError) {
          throw new Error(supabaseError.message || 'Error al cargar eventos');
        }

        // Mapear datos de Supabase al formato del componente
        const mappedEvents: Event[] = (data || []).map((row: any) => ({
          id: row.id,
          name: row.nombre,
          date: row.fecha ? new Date(row.fecha).toISOString().split('T')[0] : '',
          time: row.hora || '',
          location: row.ubicacion || '',
          type: (row.tipo || 'corporate') as Event['type'],
          status: mapStatusFromSupabase(row.estado || 'programado'),
          attendees: row.asistentes || 0,
          description: row.descripcion || '',
          createdAt: row.created_at || new Date().toISOString(),
          productor_id: row.productor_id || '',
          coordinador_id: row.coordinador_id || ''
        }));

        setEvents(mappedEvents);
      } catch (err: any) {
        console.error('Error cargando eventos desde Supabase:', err);
        setError(err.message || 'Error al cargar eventos');
      } finally {
        setLoading(false);
      }
    };

    void loadEvents();
  }, []);

  // Cargar usuarios/colaboradores
  useEffect(() => {
    const loadUsuarios = async () => {
      try {
        setLoadingUsuarios(true);
        const usuariosList = await getUsuarios();
        setUsuarios(usuariosList);
      } catch (err: any) {
        console.error('Error cargando usuarios:', err);
        setError('Error al cargar lista de colaboradores');
      } finally {
        setLoadingUsuarios(false);
      }
    };

    void loadUsuarios();
  }, []);

  // Ocultar mensaje de éxito después de 5 segundos
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const eventTypes = [
    { value: 'corporate', label: 'Corporativo' },
    { value: 'concert', label: 'Concierto' },
    { value: 'social', label: 'Social' },
    { value: 'wedding', label: 'Boda' },
    { value: 'festival', label: 'Festival' }
  ];

  const statusOptions = [
    { value: 'planned', label: 'Planificado' },
    { value: 'in-progress', label: 'En Progreso' },
    { value: 'completed', label: 'Completado' },
    { value: 'cancelled', label: 'Cancelado' }
  ];

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'planned': return 'text-white bg-gray-900';
      case 'in-progress': return 'text-white bg-gray-800';
      case 'completed': return 'text-white bg-gray-800';
      case 'cancelled': return 'text-white bg-gray-900';
      default: return 'text-white bg-gray-900';
    }
  };

  const getTypeLabel = (type: Event['type']) => {
    return eventTypes.find(t => t.value === type)?.label || type;
  };

  const getStatusLabel = (status: Event['status']) => {
    return statusOptions.find(s => s.value === status)?.label || status;
  };

  const handleAddEvent = async () => {
    // Modified validation: only name is strictly required for UI, but DB might need others.
    // We will provide defaults if missing.
    if (!newEvent.name) {
      setError('Por favor el nombre es requerido');
      return;
    }

    // Default values for hidden fields if empty
    const eventToCreate = {
      ...newEvent,
      date: newEvent.date || getTodayDate(),
      location: newEvent.location || 'Pendiente',
    };

    try {
      setError(null);
      // Combinar fecha y hora en un timestamp válido para PostgreSQL
      // El input type="time" devuelve formato HH:MM, necesitamos HH:MM:SS
      let fechaHora: string;
      if (eventToCreate.time) {
        // Normalizar el formato de hora: puede venir como HH:MM o HH:MM:SS
        const timeParts = eventToCreate.time.split(':');
        const hora = timeParts[0]?.padStart(2, '0') || '00';
        const minutos = timeParts[1]?.padStart(2, '0') || '00';
        // Ignorar segundos si vienen, siempre usar :00
        fechaHora = `${eventToCreate.date}T${hora}:${minutos}:00`;
      } else {
        fechaHora = `${eventToCreate.date}T00:00:00`;
      }

      const { data, error: supabaseError } = await supabase
        .from('eventos')
        .insert({
          nombre: eventToCreate.name,
          descripcion: eventToCreate.description || null,
          fecha: fechaHora,
          hora: eventToCreate.time || null,
          ubicacion: eventToCreate.location,
          tipo: eventToCreate.type,
          estado: mapStatusToSupabase(eventToCreate.status),
          asistentes: eventToCreate.attendees || 0,
          productor_id: eventToCreate.productor_id || null,
          coordinador_id: eventToCreate.coordinador_id || null
        })
        .select()
        .single();

      if (supabaseError) {
        throw new Error(supabaseError.message || 'Error al crear evento');
      }

      // Mapear el evento creado al formato del componente
      const mappedEvent: Event = {
        id: data.id,
        name: data.nombre,
        date: data.fecha ? new Date(data.fecha).toISOString().split('T')[0] : '',
        time: data.hora || '',
        location: data.ubicacion || '',
        type: (data.tipo || 'corporate') as Event['type'],
        status: mapStatusFromSupabase(data.estado || 'programado'),
        attendees: data.asistentes || 0,
        description: data.descripcion || '',
        createdAt: data.created_at || new Date().toISOString()
      };

      setEvents([mappedEvent, ...events]);
      setNewEvent({
        name: '',
        date: getTodayDate(), // Resetear a fecha de hoy
        time: '',
        location: '',
        type: 'corporate',
        status: 'planned',
        attendees: 0,
        description: '',
        productor_id: '',
        coordinador_id: ''
      });
      setShowAddEvent(false);
      setSuccessMessage('Evento creado correctamente');
      setError(null);
    } catch (err: any) {
      console.error('Error creando evento en Supabase:', err);
      setError(err.message || 'Error al crear evento');
      setSuccessMessage(null);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    // Normalizar el formato de hora para el input type="time" (necesita HH:MM)
    let timeForInput = event.time || '';
    if (timeForInput && timeForInput.includes(':')) {
      const timeParts = timeForInput.split(':');
      // Si tiene formato HH:MM:SS, tomar solo HH:MM
      if (timeParts.length > 2) {
        timeForInput = `${timeParts[0]}:${timeParts[1]}`;
      }
    }
    setNewEvent({
      name: event.name,
      date: event.date,
      time: timeForInput,
      location: event.location,
      type: event.type,
      status: event.status,
      attendees: event.attendees,
      description: event.description,
      productor_id: event.productor_id || '',
      coordinador_id: event.coordinador_id || ''
    });
    setShowEditEvent(true);
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !newEvent.name) {
      setError('Por favor ingresa el nombre del evento');
      return;
    }

    try {
      setError(null);
      // Solo actualizar el nombre, mantener todos los demás valores del evento existente
      const { data, error: supabaseError } = await supabase
        .from('eventos')
        .update({
          nombre: newEvent.name
        })
        .eq('id', editingEvent.id)
        .select()
        .single();

      if (supabaseError) {
        throw new Error(supabaseError.message || 'Error al actualizar evento');
      }

      // Mapear el evento actualizado al formato del componente
      const mappedEvent: Event = {
        id: data.id,
        name: data.nombre,
        date: data.fecha ? new Date(data.fecha).toISOString().split('T')[0] : '',
        time: data.hora || '',
        location: data.ubicacion || '',
        type: (data.tipo || 'corporate') as Event['type'],
        status: mapStatusFromSupabase(data.estado || 'programado'),
        attendees: data.asistentes || 0,
        description: data.descripcion || '',
        createdAt: data.created_at || new Date().toISOString(),
        productor_id: data.productor_id || '',
        coordinador_id: data.coordinador_id || ''
      };

      setEvents(events.map(e => e.id === editingEvent.id ? mappedEvent : e));
      setShowEditEvent(false);
      setEditingEvent(null);
      setNewEvent({
        name: '',
        date: getTodayDate(), // Resetear a fecha de hoy
        time: '',
        location: '',
        type: 'corporate',
        status: 'planned',
        attendees: 0,
        description: '',
        productor_id: '',
        coordinador_id: ''
      });
      setSuccessMessage('Cambios guardados correctamente');
      setError(null);
    } catch (err: any) {
      console.error('Error actualizando evento en Supabase:', err);
      setError(err.message || 'Error al actualizar evento');
      setSuccessMessage(null);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      return;
    }

    try {
      setError(null);
      const { error: supabaseError } = await supabase
        .from('eventos')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw new Error(supabaseError.message || 'Error al eliminar evento');
      }

      setEvents(events.filter(e => e.id !== id));
    } catch (err: any) {
      console.error('Error eliminando evento de Supabase:', err);
      setError(err.message || 'Error al eliminar evento');
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] overflow-hidden">
      {/* Header and Filters Wrapper */}
      <div className="flex-none p-4 md:p-0 pb-4 space-y-4">
        {/* Header */}
        <div className="flex flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold uppercase dark:text-white text-gray-900 mb-0 md:mb-2">Eventos</h1>
            <p className="text-white mt-1 uppercase text-sm hidden md:block">Gestiona todos tus eventos</p>
          </div>
          <Button
            onClick={() => setShowAddEvent(true)}
            className="uppercase !p-2 md:!px-4 md:!py-2"
          >
            <Plus className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline">Nuevo Evento</span>
          </Button>
        </div>

        {/* Filtros y Búsqueda */}
        <Card className="bg-black/80 backdrop-blur-sm border-gray-800" padding="none">
          <div className="p-3 md:p-4 space-y-3 md:space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 dark:text-white text-gray-900" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 md:pl-10 pr-3 py-1.5 md:py-2 text-sm md:text-base border dark:border-gray-700 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase dark:placeholder-gray-500 placeholder-gray-400"
                />
              </div>
              {/* Filters removed for simplification
              <div className="flex gap-2 md:gap-4">
                <select ... />
                <select ... />
              </div>
              */}
            </div>
          </div>
        </Card>

        {/* Mensaje de Error */}
        {error && (
          <Card className="bg-red-900/20 border-red-800">
            <div className="p-4 flex items-center gap-3">
              <p className="text-red-400 uppercase text-sm">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">×</button>
            </div>
          </Card>
        )}

        {/* Mensaje de Éxito */}
        {successMessage && (
          <Card className="bg-green-900/20 border-green-800">
            <div className="p-4 flex items-center gap-3">
              <p className="text-green-400 uppercase text-sm">{successMessage}</p>
              <button onClick={() => setSuccessMessage(null)} className="text-green-400 hover:text-green-300">×</button>
            </div>
          </Card>
        )}
      </div>

      {/* Lista de Eventos Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <Card className="bg-black/80 backdrop-blur-sm border-gray-800">
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white uppercase text-sm">Cargando eventos...</p>
            </div>
          </Card>
        ) : filteredEvents.length === 0 ? (
          <Card className="dark:bg-black/80 bg-white/80 backdrop-blur-sm dark:border-white/20 border-gray-200">
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 dark:text-white text-gray-900 mx-auto mb-4" />
              <h3 className="text-xl font-semibold uppercase mb-2 dark:text-white text-gray-900">No hay eventos</h3>
              <p className="dark:text-white text-gray-900 uppercase text-sm mb-4">Crea tu primer evento para comenzar</p>
              <Button onClick={() => setShowAddEvent(true)} className="uppercase">
                <Plus className="w-5 h-5 mr-2" />
                Crear Evento
              </Button>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-2 pb-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="dark:bg-black/80 bg-white/80 backdrop-blur-sm dark:border-white/20 border-gray-200 dark:hover:border-white/40 hover:border-gray-300 transition-colors">
                <div className="p-4 flex items-center justify-between">
                  <span className="text-lg font-bold uppercase dark:text-white text-gray-900">{event.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowViewEvent(true);
                      }}
                      className="p-2 dark:text-white text-gray-900 dark:hover:text-white hover:text-gray-700 dark:hover:bg-white/10 hover:bg-gray-100 rounded-lg transition-colors hidden"
                      title="Ver detalles"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEditEvent(event)}
                      className="p-2 text-white hover:text-blue-400 hover:bg-gray-900 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-2 text-white hover:text-red-400 hover:bg-gray-900 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Agregar Evento */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4">
          <Card className="bg-black border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-2 md:p-6 space-y-4 md:space-y-6">
              <h2 className="text-xl md:text-2xl font-bold uppercase text-white">Nuevo Evento</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase dark:text-white text-gray-900">Nombre del Evento</label>
                  <input
                    type="text"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-700 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                    placeholder="Nombre del evento"
                  />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 hidden">
                  <div>
                    <label className="block text-sm font-medium mb-2 uppercase text-white">Productor Encargado</label>
                    <select
                      value={newEvent.productor_id}
                      onChange={(e) => setNewEvent({ ...newEvent, productor_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-700 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                      disabled={loadingUsuarios}
                    >
                      <option value="">Seleccionar productor...</option>
                      {usuarios
                        .filter(u => u.rol === 'productor' || u.rol === 'admin')
                        .map(usuario => (
                          <option key={usuario.id} value={usuario.id}>
                            {usuario.nombre} {usuario.apellido || ''} {usuario.email ? `(${usuario.email})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 uppercase text-white">Coordinador Encargado</label>
                    <select
                      value={newEvent.coordinador_id}
                      onChange={(e) => setNewEvent({ ...newEvent, coordinador_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-700 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                      disabled={loadingUsuarios}
                    >
                      <option value="">Seleccionar coordinador...</option>
                      {usuarios
                        .filter(u => u.rol === 'coordinador' || u.rol === 'admin')
                        .map(usuario => (
                          <option key={usuario.id} value={usuario.id}>
                            {usuario.nombre} {usuario.apellido || ''} {usuario.email ? `(${usuario.email})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="hidden">
                  <label className="block text-sm font-medium mb-2 uppercase text-white">Tipo</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as Event['type'] })}
                    className="w-full px-3 py-2 border border-gray-700 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                  >
                    {eventTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="hidden">
                  <label className="block text-sm font-medium mb-2 uppercase text-white">Fecha</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-700 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600"
                  />
                </div>
                <div className="hidden">
                  <label className="block text-sm font-medium mb-2 uppercase text-white">Hora</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-700 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600"
                  />
                </div>
                <div className="hidden">
                  <label className="block text-sm font-medium mb-2 uppercase text-white">Ubicación</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-700 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                    placeholder="Ubicación"
                  />
                </div>
                <div className="hidden">
                  <label className="block text-sm font-medium mb-2 uppercase text-white">Asistentes</label>
                  <input
                    type="number"
                    value={newEvent.attendees}
                    onChange={(e) => setNewEvent({ ...newEvent, attendees: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-700 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600"
                    placeholder="0"
                  />
                </div>
                <div className="hidden">
                  <label className="block text-sm font-medium mb-2 uppercase text-white">Estado</label>
                  <select
                    value={newEvent.status}
                    onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value as Event['status'] })}
                    className="w-full px-3 py-2 border border-gray-700 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="hidden">
                <label className="block text-sm font-medium mb-2 uppercase text-white">Descripción</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-700 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                  placeholder="Descripción del evento"
                />
              </div>

              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddEvent(false);
                    setNewEvent({
                      name: '',
                      date: getTodayDate(), // Resetear a fecha de hoy
                      time: '',
                      location: '',
                      type: 'corporate',
                      status: 'planned',
                      attendees: 0,
                      description: '',
                      productor_id: '',
                      coordinador_id: ''
                    });
                  }}
                  className="uppercase"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddEvent}
                  className="uppercase"
                >
                  Crear Evento
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Editar Evento */}
      {showEditEvent && editingEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4">
          <Card className="bg-black border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-2 md:p-6 space-y-4 md:space-y-6">
              <h2 className="text-xl md:text-2xl font-bold uppercase text-white">Editar Evento</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase dark:text-white text-gray-900">Nombre del Evento</label>
                  <input
                    type="text"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-700 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                    placeholder="Nombre del evento"
                  />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 hidden">
                  <div>
                    <label className="block text-sm font-medium mb-2 uppercase text-white">Productor Encargado</label>
                    <select
                      value={newEvent.productor_id}
                      onChange={(e) => setNewEvent({ ...newEvent, productor_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-700 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                      disabled={loadingUsuarios}
                    >
                      <option value="">Seleccionar productor...</option>
                      {usuarios
                        .filter(u => u.rol === 'productor' || u.rol === 'admin')
                        .map(usuario => (
                          <option key={usuario.id} value={usuario.id}>
                            {usuario.nombre} {usuario.apellido || ''} {usuario.email ? `(${usuario.email})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 uppercase text-white">Coordinador Encargado</label>
                    <select
                      value={newEvent.coordinador_id}
                      onChange={(e) => setNewEvent({ ...newEvent, coordinador_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-700 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                      disabled={loadingUsuarios}
                    >
                      <option value="">Seleccionar coordinador...</option>
                      {usuarios
                        .filter(u => u.rol === 'coordinador' || u.rol === 'admin')
                        .map(usuario => (
                          <option key={usuario.id} value={usuario.id}>
                            {usuario.nombre} {usuario.apellido || ''} {usuario.email ? `(${usuario.email})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="hidden">
                  <label className="block text-sm font-medium mb-2 uppercase text-white">Tipo</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as Event['type'] })}
                    className="w-full px-3 py-2 border border-gray-700 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                  >
                    {eventTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="hidden">
                  <label className="block text-sm font-medium mb-2 uppercase text-white">Fecha</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-700 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600"
                  />
                </div>
                <div className="hidden">
                  <label className="block text-sm font-medium mb-2 uppercase text-white">Hora</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-700 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600"
                  />
                </div>
                <div className="hidden">
                  <label className="block text-sm font-medium mb-2 uppercase text-white">Ubicación</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-700 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                    placeholder="Ubicación"
                  />
                </div>
                <div className="hidden">
                  <label className="block text-sm font-medium mb-2 uppercase text-white">Asistentes</label>
                  <input
                    type="number"
                    value={newEvent.attendees}
                    onChange={(e) => setNewEvent({ ...newEvent, attendees: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-700 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600"
                    placeholder="0"
                  />
                </div>
                <div className="hidden">
                  <label className="block text-sm font-medium mb-2 uppercase text-white">Estado</label>
                  <select
                    value={newEvent.status}
                    onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value as Event['status'] })}
                    className="w-full px-3 py-2 border border-gray-700 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="hidden">
                <label className="block text-sm font-medium mb-2 uppercase text-white">Descripción</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-700 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                  placeholder="Descripción del evento"
                />
              </div>

              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditEvent(false);
                    setEditingEvent(null);
                    setNewEvent({
                      name: '',
                      date: getTodayDate(), // Resetear a fecha de hoy
                      time: '',
                      location: '',
                      type: 'corporate',
                      status: 'planned',
                      attendees: 0,
                      description: '',
                      productor_id: '',
                      coordinador_id: ''
                    });
                  }}
                  className="uppercase"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateEvent}
                  className="uppercase"
                >
                  Guardar Cambios
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Ver Evento */}
      {showViewEvent && selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-black border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold uppercase text-white">{selectedEvent.name}</h2>
                <button
                  onClick={() => setShowViewEvent(false)}
                  className="dark:text-white text-gray-900 dark:hover:text-white hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-3 dark:text-white text-gray-900" />
                  <div>
                    <p className="text-sm uppercase dark:text-white text-gray-900">Fecha y Hora</p>
                    <p className="uppercase dark:text-white text-gray-900">{selectedEvent.date} {selectedEvent.time && `- ${selectedEvent.time}`}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-3 dark:text-white text-gray-900" />
                  <div>
                    <p className="text-sm uppercase dark:text-white text-gray-900">Ubicación</p>
                    <p className="uppercase dark:text-white text-gray-900">{selectedEvent.location}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-3 dark:text-white text-gray-900" />
                  <div>
                    <p className="text-sm uppercase dark:text-white text-gray-900">Asistentes</p>
                    <p className="uppercase dark:text-white text-gray-900">{selectedEvent.attendees}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm uppercase dark:text-white text-gray-900 mb-1">Tipo</p>
                  <p className="uppercase dark:text-white text-gray-900">{getTypeLabel(selectedEvent.type)}</p>
                </div>
                <div>
                  <p className="text-sm uppercase dark:text-white text-gray-900 mb-1">Estado</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(selectedEvent.status)}`}>
                    {getStatusLabel(selectedEvent.status)}
                  </span>
                </div>
              </div>

              {selectedEvent.description && (
                <div>
                  <p className="text-sm uppercase dark:text-white text-gray-900 mb-2">Descripción</p>
                  <p className="uppercase dark:text-white text-gray-900">{selectedEvent.description}</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowViewEvent(false)}
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
