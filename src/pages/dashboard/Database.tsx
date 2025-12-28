import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Filter, Download, Upload, Edit, Trash2, Eye, Phone, Mail, Building, User, Calendar, MapPin } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DatabaseForm } from './DatabaseForm';
import { Contact } from '../../types/database';

export const Database: React.FC = () => {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Mock data - esto se reemplazará con datos reales de Notion
  useEffect(() => {
    const mockContacts: Contact[] = [
      {
        id: '1',
        name: 'Juan Pérez',
        email: 'juan.perez@empresa.com',
        phone: '+34 600 123 456',
        company: 'Tech Solutions S.L.',
        status: 'customer',
        source: 'Website',
        notes: 'Cliente activo desde 2023',
        createdAt: '2023-01-15',
        lastContact: '2024-01-20',
        location: 'Madrid, España'
      },
      {
        id: '2',
        name: 'María García',
        email: 'maria.garcia@startup.es',
        phone: '+34 600 789 012',
        company: 'InnovateLab',
        status: 'prospect',
        source: 'LinkedIn',
        notes: 'Interesada en servicios de IA',
        createdAt: '2024-01-10',
        lastContact: '2024-01-18',
        location: 'Barcelona, España'
      },
      {
        id: '3',
        name: 'Carlos Rodríguez',
        email: 'carlos@consultoria.com',
        phone: '+34 600 345 678',
        company: 'Consultoría Digital',
        status: 'lead',
        source: 'Referral',
        notes: 'Contacto inicial realizado',
        createdAt: '2024-01-25',
        lastContact: '2024-01-25',
        location: 'Valencia, España'
      }
    ];
    
    setTimeout(() => {
      setContacts(mockContacts);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead': return 'bg-blue-100 text-blue-800';
      case 'prospect': return 'bg-yellow-100 text-yellow-800';
      case 'customer': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'lead': return 'Lead';
      case 'prospect': return 'Prospecto';
      case 'customer': return 'Cliente';
      case 'inactive': return 'Inactivo';
      default: return status;
    }
  };

  const handleSaveContact = (contact: Contact) => {
    if (editingContact) {
      // Actualizar contacto existente
      setContacts(prev => prev.map(c => c.id === editingContact.id ? { ...contact, id: c.id } : c));
    } else {
      // Agregar nuevo contacto
      const newContact = {
        ...contact,
        id: Date.now().toString(),
        createdAt: new Date().toISOString().split('T')[0],
        lastContact: new Date().toISOString().split('T')[0]
      };
      setContacts(prev => [...prev, newContact]);
    }
    setShowAddModal(false);
    setEditingContact(null);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setShowAddModal(true);
  };

  const handleCancelForm = () => {
    setShowAddModal(false);
    setEditingContact(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">CRM</h1>
          <p className="text-text-secondary">Gestiona tus contactos y clientes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Contacto
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <Input
                  placeholder="Buscar contactos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-panel text-text focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">Todos los estados</option>
                <option value="lead">Leads</option>
                <option value="prospect">Prospectos</option>
                <option value="customer">Clientes</option>
                <option value="inactive">Inactivos</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Más filtros
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-secondary">Total Contactos</p>
                <p className="text-2xl font-bold text-text">{contacts.length}</p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-secondary">Clientes</p>
                <p className="text-2xl font-bold text-text">
                  {contacts.filter(c => c.status === 'customer').length}
                </p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <User className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-secondary">Prospectos</p>
                <p className="text-2xl font-bold text-text">
                  {contacts.filter(c => c.status === 'prospect').length}
                </p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-secondary">Leads</p>
                <p className="text-2xl font-bold text-text">
                  {contacts.filter(c => c.status === 'lead').length}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Contacts Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-text-secondary">Contacto</th>
                <th className="text-left p-4 font-medium text-text-secondary">Empresa</th>
                <th className="text-left p-4 font-medium text-text-secondary">Estado</th>
                <th className="text-left p-4 font-medium text-text-secondary">Origen</th>
                <th className="text-left p-4 font-medium text-text-secondary">Último Contacto</th>
                <th className="text-left p-4 font-medium text-text-secondary">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="border-b border-border hover:bg-hover">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-text">{contact.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-3 h-3 text-text-secondary" />
                        <span className="text-sm text-text-secondary">{contact.email}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-3 h-3 text-text-secondary" />
                        <span className="text-sm text-text-secondary">{contact.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-text-secondary" />
                      <span className="text-text">{contact.company}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                      {getStatusLabel(contact.status)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-text">{contact.source}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-text-secondary" />
                      <span className="text-text">{contact.lastContact}</span>
                    </div>
                  </td>
                  <td className="p-4">
                                         <div className="flex gap-2">
                       <Button variant="secondary" size="sm" onClick={() => setSelectedContact(contact)}>
                         <Eye className="w-4 h-4" />
                       </Button>
                       <Button variant="secondary" size="sm" onClick={() => handleEditContact(contact)}>
                         <Edit className="w-4 h-4" />
                       </Button>
                       <Button variant="secondary" size="sm">
                         <Trash2 className="w-4 h-4" />
                       </Button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-panel rounded-lg p-6 max-w-md w-full mx-4">
                         <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold text-text">Detalles del Contacto</h3>
               <Button variant="secondary" size="sm" onClick={() => setSelectedContact(null)}>
                 ×
               </Button>
             </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-secondary">Nombre</label>
                <p className="text-text">{selectedContact.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">Email</label>
                <p className="text-text">{selectedContact.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">Teléfono</label>
                <p className="text-text">{selectedContact.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">Empresa</label>
                <p className="text-text">{selectedContact.company}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">Estado</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedContact.status)}`}>
                  {getStatusLabel(selectedContact.status)}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">Origen</label>
                <p className="text-text">{selectedContact.source}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">Ubicación</label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-text-secondary" />
                  <p className="text-text">{selectedContact.location}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">Notas</label>
                <p className="text-text">{selectedContact.notes}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setSelectedContact(null)}>
                Cerrar
              </Button>
              <Button>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </div>
                     </div>
         </div>
       )}

       {/* Formulario de contacto */}
       <DatabaseForm
         contact={editingContact || undefined}
         onSave={handleSaveContact}
         onCancel={handleCancelForm}
         isOpen={showAddModal}
       />
     </div>
   );
 }; 