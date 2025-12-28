import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, User, Mail, Phone, Building, MapPin, FileText } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Contact } from '../../types/database';

interface DatabaseFormProps {
  contact?: Contact;
  onSave: (contact: Contact) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const DatabaseForm: React.FC<DatabaseFormProps> = ({
  contact,
  onSave,
  onCancel,
  isOpen
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Contact>({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'lead',
    source: '',
    notes: '',
    location: ''
  });

  useEffect(() => {
    if (contact) {
      setFormData(contact);
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        status: 'lead',
        source: '',
        notes: '',
        location: ''
      });
    }
  }, [contact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: keyof Contact, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-panel rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-text">
            {contact ? 'Editar Contacto' : 'Nuevo Contacto'}
          </h3>
          <Button variant="secondary" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <Card>
            <div className="p-4">
              <h4 className="text-lg font-medium text-text mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Información Personal
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Nombre completo *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="juan.perez@empresa.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Teléfono
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+34 600 123 456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Ubicación
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <Input
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      placeholder="Madrid, España"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Información Empresarial */}
          <Card>
            <div className="p-4">
              <h4 className="text-lg font-medium text-text mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Información Empresarial
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Empresa
                  </label>
                  <Input
                    value={formData.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    placeholder="Tech Solutions S.L."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Estado *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value as Contact['status'])}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-panel text-text focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  >
                    <option value="lead">Lead</option>
                    <option value="prospect">Prospecto</option>
                    <option value="customer">Cliente</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Origen del contacto
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => handleChange('source', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-panel text-text focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Seleccionar origen</option>
                    <option value="Website">Website</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Referral">Referral</option>
                    <option value="Email Marketing">Email Marketing</option>
                    <option value="Evento">Evento</option>
                    <option value="Redes Sociales">Redes Sociales</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Notas */}
          <Card>
            <div className="p-4">
              <h4 className="text-lg font-medium text-text mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Notas y Comentarios
              </h4>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Información adicional sobre el contacto..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-panel text-text focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  rows={4}
                />
              </div>
            </div>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              {contact ? 'Actualizar' : 'Guardar'} Contacto
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 