import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Phone, Mail, MapPin, Calendar, User, Building, RefreshCw, CheckCircle, AlertCircle, X, Save } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';

// Importar el logo para el PDF
import logoImage from '../../assets/logohappy.png';

// Interfaz que coincide con la tabla clientes en Supabase
interface Client {
  id: string;
  empresa: string; // name -> empresa
  contacto: string; // contactPerson -> contacto
  email: string;
  telefono: string; // phone -> telefono
  direccion: string; // address -> direccion
  website?: string;
  status: 'prospect' | 'active' | 'inactive';
  origen?: string; // origin -> origen
  total_proyectos: number; // totalProjects -> total_proyectos
  ingresos_totales: number; // totalRevenue -> ingresos_totales
  ultimo_contacto: string; // lastContact -> ultimo_contacto (DATE)
  notas?: string; // notes -> notas
  created_at?: string;
  updated_at?: string;
  // Campos de compatibilidad para el mapeo
  name?: string; // Alias para empresa
  contactPerson?: string; // Alias para contacto
  phone?: string; // Alias para telefono
  address?: string; // Alias para direccion
  totalProjects?: number; // Alias para total_proyectos
  totalRevenue?: number; // Alias para ingresos_totales
  lastContact?: string; // Alias para ultimo_contacto
  notes?: string; // Alias para notas
  isUpdating?: boolean; // Para mostrar indicador de carga
}

export const CRM: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddClient, setShowAddClient] = useState(true);
  const [showViewClient, setShowViewClient] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newClient, setNewClient] = useState({
    empresa: '',
    contacto: '',
    email: '',
    telefono: '',
    direccion: '',
    website: '',
    status: 'prospect' as 'prospect' | 'active' | 'inactive',
    origen: '',
    notas: ''
  });


  // Función para obtener clientes desde Supabase
  const fetchClients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error al obtener clientes: ${error.message}`);
      }

      // Mapear los datos de Supabase a la interfaz Client
      const mappedClients: Client[] = (data || []).map((client: any) => ({
        id: client.id,
        empresa: client.empresa || '',
        contacto: client.contacto || '',
        email: client.email || '',
        telefono: client.telefono || '',
        direccion: client.direccion || '',
        website: client.website || '',
        status: client.status || 'prospect',
        origen: client.origen || '',
        total_proyectos: client.total_proyectos || 0,
        ingresos_totales: client.ingresos_totales || 0,
        ultimo_contacto: client.ultimo_contacto || new Date().toISOString().split('T')[0],
        notas: client.notas || '',
        created_at: client.created_at,
        updated_at: client.updated_at,
        // Campos de compatibilidad para el render
        name: client.empresa,
        contactPerson: client.contacto,
        phone: client.telefono,
        address: client.direccion,
        totalProjects: client.total_proyectos,
        totalRevenue: client.ingresos_totales,
        lastContact: client.ultimo_contacto
      }));

      setClients(mappedClients);
    } catch (err) {
      console.error('Error al obtener clientes:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para agregar nuevo cliente a Supabase
  const addClient = async () => {
    try {
      if (!newClient.empresa.trim()) {
        setError('El nombre de la empresa es requerido');
        return;
      }

      const { data, error } = await supabase
        .from('clientes')
        .insert({
          empresa: newClient.empresa,
          contacto: newClient.contacto,
          email: newClient.email || null,
          telefono: newClient.telefono || null,
          direccion: newClient.direccion || null,
          website: newClient.website || null,
          status: newClient.status,
          origen: newClient.origen || null,
          total_proyectos: 0,
          ingresos_totales: 0,
          ultimo_contacto: new Date().toISOString().split('T')[0],
          notas: newClient.notas || null
        })
        .select();

      if (error) {
        throw new Error(`Error al agregar cliente: ${error.message}`);
      }

      // Limpiar formulario
      setNewClient({
        empresa: '',
        contacto: '',
        email: '',
        telefono: '',
        direccion: '',
        website: '',
        status: 'prospect',
        origen: '',
        notas: ''
      });

      // Recargar datos
      await fetchClients();
      setSuccessMessage('✅ Cliente agregado exitosamente');
      setError(null);
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
    } catch (err) {
      console.error('Error al agregar cliente:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  // Función para actualizar cliente en Supabase
  const updateClient = async (client: Client) => {
    try {
      if (!client.id) {
        throw new Error('ID del cliente no válido');
      }

      const { error } = await supabase
        .from('clientes')
        .update({
          empresa: client.empresa || client.name,
          contacto: client.contacto || client.contactPerson,
          email: client.email || null,
          telefono: client.telefono || client.phone || null,
          direccion: client.direccion || client.address || null,
          website: client.website || null,
          status: client.status,
          origen: client.origen || null,
          total_proyectos: client.total_proyectos || client.totalProjects || 0,
          ingresos_totales: client.ingresos_totales || client.totalRevenue || 0,
          ultimo_contacto: client.ultimo_contacto || client.lastContact || new Date().toISOString().split('T')[0],
          notas: client.notas || client.notes || null
        })
        .eq('id', client.id);

      if (error) {
        throw new Error(`Error al actualizar cliente: ${error.message}`);
      }

      // Recargar datos
      await fetchClients();
      
    } catch (err) {
      console.error('Error al actualizar cliente:', err);
      throw err; // Re-lanzar el error para manejarlo en handleSaveEdit
    }
  };

  // Función para eliminar cliente de Supabase
  const deleteClient = async (client: Client) => {
    if (!client.id) {
      setError('ID del cliente no válido');
      return;
    }

    // Confirmar antes de eliminar
    const clientName = client.empresa || client.name || 'este cliente';
    if (!confirm(`¿Estás seguro de que quieres eliminar el cliente "${clientName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', client.id);

      if (error) {
        throw new Error(`Error al eliminar cliente: ${error.message}`);
      }

      await fetchClients();
      setSuccessMessage('✅ Cliente eliminado exitosamente');
      setError(null);
      
    } catch (err) {
      console.error('Error al eliminar cliente:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  // Función para abrir modal de ver cliente
  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setShowViewClient(true);
    // Limpiar mensajes al abrir modal
    setError(null);
    setSuccessMessage(null);
  };

  // Función para abrir modal de editar cliente
  const handleEditClient = (client: Client) => {
    setEditingClient({ ...client });
    setShowEditClient(true);
    // Limpiar mensajes al abrir modal
    setError(null);
    setSuccessMessage(null);
  };

  // Función para guardar cambios del cliente editado
  const handleSaveEdit = async () => {
    if (!editingClient) return;
    
    try {
      await updateClient(editingClient);
      
      // Actualizar el cliente en el estado local inmediatamente
      const updatedClient = {
        ...editingClient,
        lastModified: new Date().toISOString()
      };
      
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === editingClient.id ? updatedClient : client
        )
      );
      
      setShowEditClient(false);
      setEditingClient(null);
      setSuccessMessage('✅ Cliente actualizado exitosamente');
      setError(null);
      
      // Recargar datos para asegurar sincronización
      setTimeout(() => {
        fetchClients();
      }, 1000);
      
    } catch (err) {
      console.error('Error al actualizar cliente:', err);
      setError('Error al actualizar el cliente');
    }
  };

  // Función para cerrar modal de edición
  const handleCloseEdit = () => {
    setShowEditClient(false);
    setEditingClient(null);
    setError(null);
    setSuccessMessage(null);
  };

  // Función para cerrar modal de vista
  const handleCloseView = () => {
    setShowViewClient(false);
    setSelectedClient(null);
    setError(null);
    setSuccessMessage(null);
  };

  // Función para actualizar estado inline
  const handleStatusChange = async (client: Client, newStatus: string) => {
    if (newStatus === client.status) return; // No hacer nada si no cambió
    
    console.log('🔄 Cambiando estado del cliente:', {
      clientName: client.empresa || client.name,
      oldStatus: client.status,
      newStatus: newStatus
    });
    
    try {
      // Mostrar indicador de carga
      const loadingClient = { ...client, status: newStatus as 'prospect' | 'active' | 'inactive', isUpdating: true };
      setClients(prevClients => 
        prevClients.map(c => 
          c.id === client.id ? loadingClient : c
        )
      );
      
      const updatedClient = { ...client, status: newStatus as 'prospect' | 'active' | 'inactive' };
      await updateClient(updatedClient);
      
      // Actualizar el cliente en el estado local inmediatamente
      const clientWithTimestamp = {
        ...updatedClient,
        lastModified: new Date().toISOString()
      };
      
      setClients(prevClients => 
        prevClients.map(c => 
          c.id === client.id ? clientWithTimestamp : c
        )
      );
      
      setSuccessMessage('✅ Estado actualizado exitosamente');
      setError(null);
      
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      setError('Error al actualizar el estado');
      
      // Revertir el cambio en caso de error
      setClients(prevClients => 
        prevClients.map(c => 
          c.id === client.id ? client : c
        )
      );
    }
  };



  // Función para convertir imagen a base64
  const convertImageToBase64 = (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        try {
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = imageUrl;
    });
  };

  // Función para exportar clientes a PDF
  const exportToPDF = async () => {
    try {
      // Convertir logo a base64
      let logoBase64 = '';
      try {
        logoBase64 = await convertImageToBase64(logoImage);
        console.log('✅ Logo convertido a base64 exitosamente');
      } catch (err) {
        console.warn('⚠️ No se pudo convertir el logo, usando logo por defecto:', err);
        // Logo por defecto si falla la conversión
        logoBase64 = 'data:image/svg+xml;base64,' + btoa(`
          <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="40" fill="url(#gradient)"/>
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea"/>
                <stop offset="100%" style="stop-color:#764ba2"/>
              </linearGradient>
            </defs>
            <text x="40" y="48" text-anchor="middle" fill="white" font-size="24" font-weight="bold">CL</text>
          </svg>
        `);
      }

      // Crear contenido HTML para el PDF
      const createPDFContent = () => {
        const activeClients = clients.filter(c => c.status === 'active').length;
        const prospectClients = clients.filter(c => c.status === 'prospect').length;
        const inactiveClients = clients.filter(c => c.status === 'inactive').length;
        const totalRevenue = clients.reduce((sum, c) => sum + c.totalRevenue, 0);
        
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>CRM - Reporte de Clientes</title>
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 30px; 
                line-height: 1.6; 
                color: #2c3e50;
                background-color: #ffffff;
              }
              .header { 
                margin-bottom: 40px; 
                padding-bottom: 20px;
                border-bottom: 3px solid #3498db;
              }
              .header-content { 
                display: flex; 
                align-items: center; 
                gap: 25px; 
              }
              .logo { 
                width: 90px; 
                height: auto; 
                flex-shrink: 0;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .company-info { 
                flex-grow: 1; 
              }
              .report-title { 
                font-size: 28px; 
                font-weight: 700; 
                color: #2c3e50; 
                margin-bottom: 10px;
                letter-spacing: -0.5px;
              }
              .generated-date { 
                color: #7f8c8d; 
                font-size: 15px;
                font-style: italic;
              }
              .stats { 
                margin-bottom: 40px; 
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                padding: 25px;
                border-radius: 12px;
                border-left: 5px solid #3498db;
              }
              .stats h3 { 
                color: #2c3e50; 
                border-bottom: 2px solid #3498db; 
                padding-bottom: 10px;
                margin-bottom: 20px;
                font-size: 20px;
              }
              .stat-item { 
                margin: 15px 0; 
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .stat-label { 
                font-weight: 600; 
                color: #5a6c7d; 
                font-size: 15px;
              }
              .stat-value { 
                color: #2c3e50; 
                font-weight: 700;
                font-size: 16px;
                background: white;
                padding: 8px 16px;
                border-radius: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              h3 { 
                color: #2c3e50; 
                font-size: 22px;
                margin: 30px 0 20px 0;
                padding-bottom: 8px;
                border-bottom: 2px solid #ecf0f1;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 25px;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              }
              th, td { 
                border: 1px solid #e1e8ed; 
                padding: 12px; 
                text-align: left; 
              }
              th { 
                background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); 
                color: white; 
                font-weight: 600;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              tr:nth-child(even) { 
                background-color: #f8f9fa; 
              }
              tr:hover { 
                background-color: #e3f2fd; 
                transition: background-color 0.2s ease;
              }
              .status-active { 
                color: #27ae60; 
                font-weight: 600;
                background: #d1fae5;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
              }
              .status-prospect { 
                color: #d97706; 
                font-weight: 600;
                background: #fef3c7;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
              }
              .status-inactive { 
                color: #dc2626; 
                font-weight: 600;
                background: #fee2e2;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
              }
              .footer { 
                margin-top: 40px; 
                text-align: center; 
                color: #7f8c8d; 
                font-size: 13px;
                background: #f8f9fa;
                padding: 25px;
                border-radius: 8px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-content">
                <img src="${logoBase64}" alt="Logo" class="logo">
                <div class="company-info">
                  <div class="report-title">CRM - Reporte de Clientes</div>
                  <div class="generated-date">Generado el: ${new Date().toLocaleDateString('es-CO')}</div>
                </div>
              </div>
            </div>
            
            <div class="stats">
              <h3>Resumen General</h3>
              <div class="stat-item">
                <span class="stat-label">Total de clientes:</span>
                <span class="stat-value">${clients.length}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Clientes activos:</span>
                <span class="stat-value">${activeClients}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Prospectos:</span>
                <span class="stat-value">${prospectClients}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Clientes inactivos:</span>
                <span class="stat-value">${inactiveClients}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Ingresos totales:</span>
                <span class="stat-value">${formatCurrency(totalRevenue)}</span>
              </div>
            </div>
            
            <h3>Lista de Clientes</h3>
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Contacto</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th>Proyectos</th>
                  <th>Ingresos</th>
                  <th>Último Contacto</th>
                </tr>
              </thead>
              <tbody>
                ${clients.map(client => `
                  <tr>
                    <td>${client.name}</td>
                    <td>${client.contactPerson}</td>
                    <td>${client.email}</td>
                    <td>${client.phone}</td>
                    <td class="status-${client.status}">${getStatusText(client.status)}</td>
                    <td>${client.totalProjects}</td>
                    <td>${formatCurrency(client.totalRevenue)}</td>
                    <td>${client.lastContact}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              <div style="border-top: 2px solid #ecf0f1; padding-top: 20px; margin-top: 30px;">
                <p style="margin-bottom: 10px;">Reporte generado automáticamente por el sistema CRM</p>
                <p style="margin-bottom: 5px;">Total de registros: ${clients.length}</p>
                <p style="font-size: 11px; color: #95a5a6;">© ${new Date().getFullYear()} - Todos los derechos reservados</p>
              </div>
            </div>
          </body>
          </html>
        `;
      };
      
      // Crear el contenido HTML
      const htmlContent = createPDFContent();
      
      // Crear un blob con el contenido HTML
      const blob = new Blob([htmlContent], { type: 'text/html' });
      
      // Crear URL del blob
      const url = URL.createObjectURL(blob);
      
      // Abrir en nueva ventana para imprimir/guardar como PDF
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      // Limpiar URL después de un tiempo
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      setSuccessMessage('✅ Reporte con logo generado - Imprime o guarda como PDF');
      setError(null);
      
    } catch (err) {
      console.error('Error al exportar reporte:', err);
      setError('Error al generar el reporte');
    }
  };

  // Efecto para limpiar mensajes de éxito automáticamente
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000); // Limpiar después de 5 segundos

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Efecto para cargar datos automáticamente desde Supabase
  useEffect(() => {
    const loadData = async () => {
      console.log('🔄 Cargando datos de CRM desde Supabase...');
      await fetchClients();
    };

    loadData();
  }, []);





  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'prospect':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'prospect':
        return 'Prospecto';
      case 'inactive':
        return 'Inactivo';
      default:
        return 'Desconocido';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Función para cargar datos de ejemplo
  const loadSampleData = () => {
    setClients([
        {
          id: '1',
          name: 'Cliente Ejemplo 1',
          contactPerson: 'Juan Pérez',
          email: 'juan@ejemplo.com',
          phone: '+1234567890',
          address: 'Calle Principal 123',
          status: 'active',
          totalProjects: 3,
          totalRevenue: 15000,
          lastContact: new Date().toISOString().split('T')[0],
          notes: 'Cliente importante con buen historial'
        },
        {
          id: '2',
          name: 'Cliente Ejemplo 2',
          contactPerson: 'María García',
          email: 'maria@ejemplo.com',
          phone: '+0987654321',
          address: 'Avenida Central 456',
          status: 'prospect',
          totalProjects: 0,
          totalRevenue: 0,
          lastContact: new Date().toISOString().split('T')[0],
          notes: 'Prospecto interesado en nuestros servicios'
        }
      ]);
      setIsLoading(false);
    };

  const filteredClients = clients.filter(client => {
    const clientName = client.empresa || client.name || '';
    const contactPerson = client.contacto || client.contactPerson || '';
    const clientEmail = client.email || '';
    
    const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clientEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="dark:text-white text-gray-900 uppercase">CARGANDO CLIENTES DESDE SUPABASE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold uppercase dark:text-white text-gray-900 mb-0 md:mb-2">CRM - GESTIÓN DE CLIENTES</h1>
          <p className="dark:text-white text-gray-900 uppercase text-sm">
            GESTIONA TUS CLIENTES, PROSPECTOS Y OPORTUNIDADES DE VENTA
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => fetchClients()} variant="outline" className="uppercase">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            ACTUALIZAR
          </Button>
          <Button onClick={() => setShowAddClient(!showAddClient)} className="uppercase">
            <Plus className="w-5 h-5 mr-2" />
            {showAddClient ? 'OCULTAR FORMULARIO' : 'NUEVO CLIENTE'}
          </Button>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <Card className="bg-red-900/20 border-red-800">
          <div className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400 text-sm uppercase">ERROR: {error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </Card>
      )}

      {successMessage && (
        <Card className="bg-green-900/30 border-2 border-green-600 rounded-lg animate-pulse">
          <div className="p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-300 text-sm uppercase font-semibold">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-green-400 hover:text-green-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </Card>
      )}

      {/* Add Client Form - Inline */}
      {showAddClient && (
        <Card className="mb-6 dark:bg-black/80 bg-white/80 backdrop-blur-sm dark:border-white/20 border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold dark:text-white text-gray-900 uppercase mb-4">AGREGAR NUEVO CLIENTE</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium dark:text-white text-gray-900 mb-1 uppercase">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  value={newClient.empresa}
                  onChange={(e) => setNewClient({...newClient, empresa: e.target.value})}
                  className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors uppercase"
                  placeholder="Nombre de la empresa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-white text-gray-900 mb-1 uppercase">
                  Persona de Contacto
                </label>
                <input
                  type="text"
                  value={newClient.contacto}
                  onChange={(e) => setNewClient({...newClient, contacto: e.target.value})}
                  className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors uppercase"
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-white text-gray-900 mb-1 uppercase">
                  Email
                </label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder="email@empresa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-white text-gray-900 mb-1 uppercase">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={newClient.telefono}
                  onChange={(e) => setNewClient({...newClient, telefono: e.target.value})}
                  className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder="984 197 94 69"
                  pattern="[0-9\s\-\(\)]+"
                  title="Ingresa solo números, espacios, -, ( y )"
                />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-white text-gray-900 mb-1 uppercase">
                  Dirección
                </label>
                <input
                  type="text"
                  value={newClient.direccion}
                  onChange={(e) => setNewClient({...newClient, direccion: e.target.value})}
                  className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors uppercase"
                  placeholder="Dirección completa de la empresa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-white text-gray-900 mb-1 uppercase">
                  Website
                </label>
                <input
                  type="url"
                  value={newClient.website}
                  onChange={(e) => setNewClient({...newClient, website: e.target.value})}
                  className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder="https://www.empresa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-white text-gray-900 mb-1 uppercase">
                  Estado
                </label>
                <select 
                  value={newClient.status}
                  onChange={(e) => setNewClient({...newClient, status: e.target.value as 'prospect' | 'active' | 'inactive'})}
                  className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors uppercase"
                >
                  <option value="prospect">PROSPECTO</option>
                  <option value="active">ACTIVO</option>
                  <option value="inactive">INACTIVO</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-white text-gray-900 mb-1 uppercase">
                  Origen
                </label>
                <input
                  type="text"
                  value={newClient.origen}
                  onChange={(e) => setNewClient({...newClient, origen: e.target.value})}
                  className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors uppercase"
                  placeholder="web, referido, evento, etc."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium dark:text-white text-gray-900 mb-1 uppercase">
                  Notas
                </label>
                <textarea
                  rows={3}
                  value={newClient.notas}
                  onChange={(e) => setNewClient({...newClient, notas: e.target.value})}
                  className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-y uppercase"
                  placeholder="Información adicional del cliente..."
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={addClient} className="uppercase">
                <Plus className="w-4 h-4 mr-2" />
                AGREGAR CLIENTE
              </Button>
              <Button variant="outline" onClick={() => setShowAddClient(false)} className="uppercase">
                CANCELAR
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center">
          <h3 className="text-2xl font-bold text-text">{clients.length}</h3>
          <p className="text-gray-600">Total Clientes</p>
        </Card>
        <Card className="text-center">
          <h3 className="text-2xl font-bold text-text">
            {clients.filter(c => c.status === 'active').length}
          </h3>
          <p className="dark:text-white text-gray-900 uppercase text-sm">CLIENTES ACTIVOS</p>
        </Card>
        <Card className="text-center dark:bg-black/80 bg-white/80 backdrop-blur-sm dark:border-white/20 border-gray-200">
          <h3 className="text-2xl font-bold dark:text-white text-gray-900">
            {clients.filter(c => c.status === 'prospect').length}
          </h3>
          <p className="dark:text-white text-gray-900 uppercase text-sm">PROSPECTOS</p>
        </Card>
        <Card className="text-center dark:bg-black/80 bg-white/80 backdrop-blur-sm dark:border-white/20 border-gray-200 hidden">
          <h3 className="text-2xl font-bold dark:text-white text-gray-900">
            {formatCurrency(clients.reduce((sum, c) => sum + (c.ingresos_totales || c.totalRevenue || 0), 0))}
          </h3>
          <p className="dark:text-white text-gray-900 uppercase text-sm">INGRESOS TOTALES</p>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="dark:bg-black/80 bg-white/80 backdrop-blur-sm dark:border-white/20 border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 dark:text-white text-gray-900" />
              <input
                type="text"
                placeholder="BUSCAR CLIENTES..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors uppercase placeholder-gray-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors uppercase"
            >
              <option value="all">TODOS LOS ESTADOS</option>
              <option value="active">ACTIVOS</option>
              <option value="prospect">PROSPECTOS</option>
              <option value="inactive">INACTIVOS</option>
            </select>
          </div>
          <Button variant="outline" onClick={exportToPDF} className="uppercase">
            <Download className="w-4 h-4 mr-2" />
            EXPORTAR PDF
          </Button>
        </div>
      </Card>

      {/* Clients Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="max-h-[calc(100vh-400px)] overflow-y-auto overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-white dark:bg-black shadow-sm">
              <tr className="border-b border-gray-200 dark:border-white/20">
                <th className="text-left py-3 px-4 font-medium dark:text-white text-gray-900 uppercase text-xs bg-white dark:bg-black">CLIENTE</th>
                <th className="text-left py-3 px-4 font-medium dark:text-white text-gray-900 uppercase text-xs bg-white dark:bg-black">CONTACTO</th>
                <th className="text-left py-3 px-4 font-medium dark:text-white text-gray-900 uppercase text-xs bg-white dark:bg-black">ESTADO</th>
                <th className="text-left py-3 px-4 font-medium dark:text-white text-gray-900 uppercase text-xs bg-white dark:bg-black">PROYECTOS</th>
                <th className="text-left py-3 px-4 font-medium dark:text-white text-gray-900 uppercase text-xs bg-white dark:bg-black">INGRESOS</th>
                <th className="text-left py-3 px-4 font-medium dark:text-white text-gray-900 uppercase text-xs bg-white dark:bg-black">ÚLTIMO CONTACTO</th>
                <th className="text-left py-3 px-4 font-medium dark:text-white text-gray-900 uppercase text-xs bg-white dark:bg-black">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id} className="border-b dark:border-white/20 border-gray-200 dark:hover:bg-white/5 hover:bg-gray-100/50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium dark:text-white text-gray-900">{client.empresa || client.name}</p>
                      <p className="text-sm dark:text-white text-gray-600">{client.direccion || client.address}</p>
                      {client.updated_at && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          ✏️ Editado: {new Date(client.updated_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium dark:text-white text-gray-900">{client.contacto || client.contactPerson}</p>
                      <div className="flex items-center gap-2 text-xs dark:text-white text-gray-600">
                        <Mail className="w-3 h-3" />
                        {client.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs dark:text-white text-gray-600">
                        <Phone className="w-3 h-3" />
                        {client.telefono || client.phone}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="relative">
                      <select
                        value={client.status}
                        onChange={(e) => handleStatusChange(client, e.target.value)}
                        disabled={client.isUpdating}
                        className={`px-3 py-1 text-xs font-medium rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105 ${getStatusColor(client.status)} ${client.isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{ 
                          backgroundColor: 'transparent',
                          color: 'inherit',
                          appearance: 'none',
                          paddingRight: '20px'
                        }}
                      >
                        <option value="prospect" className="bg-amber-100 text-amber-700">Prospecto</option>
                        <option value="active" className="bg-emerald-100 text-emerald-700">Activo</option>
                        <option value="inactive" className="bg-red-100 text-red-700">Inactivo</option>
                      </select>
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        {client.isUpdating ? (
                          <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full"></div>
                        ) : (
                          <svg className="w-3 h-3 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm dark:text-white text-gray-700">{client.total_proyectos || client.totalProjects || 0} proyectos</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium dark:text-white text-gray-900">{formatCurrency(client.ingresos_totales || client.totalRevenue || 0)}</p>
                  </td>
                  <td className="py-3 px-4 text-sm dark:text-white text-gray-600">{client.ultimo_contacto || client.lastContact}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleViewClient(client)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditClient(client)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => deleteClient(client)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="h-4"></div>
        </div>
      </Card>


      {/* View Client Modal */}
      {showViewClient && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-text">Detalles del Cliente</h3>
              <Button variant="outline" onClick={handleCloseView}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Empresa</label>
                <p className="text-gray-900 font-medium">{selectedClient.empresa || selectedClient.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Contacto</label>
                <p className="text-gray-900">{selectedClient.contacto || selectedClient.contactPerson}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                <p className="text-gray-900">{selectedClient.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Teléfono</label>
                <p className="text-gray-900">{selectedClient.telefono || selectedClient.phone || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">Dirección</label>
                <p className="text-gray-900">{selectedClient.direccion || selectedClient.address || 'N/A'}</p>
              </div>
              {selectedClient.website && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Website</label>
                  <p className="text-gray-900">
                    <a href={selectedClient.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {selectedClient.website}
                    </a>
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Estado</label>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedClient.status)}`}>
                  {getStatusText(selectedClient.status)}
                </span>
              </div>
              {selectedClient.origen && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Origen</label>
                  <p className="text-gray-900">{selectedClient.origen}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Proyectos</label>
                <p className="text-gray-900">{selectedClient.total_proyectos || selectedClient.totalProjects || 0} proyectos</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Ingresos</label>
                <p className="text-gray-900 font-medium">{formatCurrency(selectedClient.ingresos_totales || selectedClient.totalRevenue || 0)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Último Contacto</label>
                <p className="text-gray-900">{selectedClient.ultimo_contacto || selectedClient.lastContact || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">Notas</label>
                <p className="text-gray-900">{selectedClient.notas || selectedClient.notes || 'Sin notas'}</p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={() => {
                setShowViewClient(false);
                handleEditClient(selectedClient);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Editar Cliente
              </Button>
              <Button variant="outline" onClick={handleCloseView}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditClient && editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-text">Editar Cliente</h3>
              <Button variant="outline" onClick={handleCloseEdit}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  value={editingClient.empresa || editingClient.name || ''}
                  onChange={(e) => setEditingClient({...editingClient, empresa: e.target.value, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nombre de la empresa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Persona de Contacto
                </label>
                <input
                  type="text"
                  value={editingClient.contacto || editingClient.contactPerson || ''}
                  onChange={(e) => setEditingClient({...editingClient, contacto: e.target.value, contactPerson: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editingClient.email}
                  onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="email@empresa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={editingClient.telefono || editingClient.phone || ''}
                  onChange={(e) => setEditingClient({...editingClient, telefono: e.target.value, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="300 123 4567"
                  pattern="[0-9\s\-\(\)]+"
                  title="Ingresa solo números, espacios, -, ( y )"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={editingClient.direccion || editingClient.address || ''}
                  onChange={(e) => setEditingClient({...editingClient, direccion: e.target.value, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Dirección completa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select 
                  value={editingClient.status}
                  onChange={(e) => setEditingClient({...editingClient, status: e.target.value as 'prospect' | 'active' | 'inactive'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="prospect">Prospecto</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proyectos
                </label>
                <input
                  type="number"
                  value={editingClient.total_proyectos || editingClient.totalProjects || 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setEditingClient({...editingClient, total_proyectos: value, totalProjects: value});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingresos
                </label>
                <input
                  type="number"
                  value={editingClient.ingresos_totales || editingClient.totalRevenue || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setEditingClient({...editingClient, ingresos_totales: value, totalRevenue: value});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Último Contacto
                </label>
                <input
                  type="date"
                  value={editingClient.ultimo_contacto || editingClient.lastContact || ''}
                  onChange={(e) => setEditingClient({...editingClient, ultimo_contacto: e.target.value, lastContact: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  rows={3}
                  value={editingClient.notas || editingClient.notes || ''}
                  onChange={(e) => setEditingClient({...editingClient, notas: e.target.value, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Información adicional del cliente..."
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={handleSaveEdit}>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
              <Button variant="outline" onClick={handleCloseEdit}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
