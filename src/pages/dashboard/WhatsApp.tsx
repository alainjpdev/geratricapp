import React, { useState, useEffect } from 'react';
// import { useTranslation } from 'react-i18next'; // Comentado temporalmente
import { MessageCircle, Send, Phone, Mail, User, Clock, CheckCircle, AlertCircle, Settings, Download, Upload, RefreshCw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  type: 'text' | 'image' | 'document' | 'audio';
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  status: 'online' | 'offline' | 'away';
}

export const WhatsApp: React.FC = () => {
  // const { t } = useTranslation(); // Comentado temporalmente para evitar errores
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - esto se reemplazará con datos reales de Wappi
  useEffect(() => {
    const mockContacts: Contact[] = [
      {
        id: '1',
        name: 'Juan Pérez',
        phone: '+34 600 123 456',
        lastMessage: 'Hola, ¿cómo va el curso?',
        lastMessageTime: '10:30',
        unreadCount: 2,
        status: 'online'
      },
      {
        id: '2',
        name: 'María García',
        phone: '+34 600 789 012',
        lastMessage: 'Necesito información sobre el módulo de IA',
        lastMessageTime: '09:15',
        unreadCount: 0,
        status: 'away'
      },
      {
        id: '3',
        name: 'Carlos Rodríguez',
        phone: '+34 600 345 678',
        lastMessage: 'Perfecto, gracias por la ayuda',
        lastMessageTime: 'Ayer',
        unreadCount: 0,
        status: 'offline'
      }
    ];

    const mockMessages: Message[] = [
      {
        id: '1',
        from: '+34 600 123 456',
        to: 'admin',
        content: 'Hola, ¿cómo va el curso de programación?',
        timestamp: '10:30',
        status: 'read',
        type: 'text'
      },
      {
        id: '2',
        from: 'admin',
        to: '+34 600 123 456',
        content: '¡Hola Juan! El curso va muy bien. ¿En qué puedo ayudarte?',
        timestamp: '10:32',
        status: 'delivered',
        type: 'text'
      },
      {
        id: '3',
        from: '+34 600 123 456',
        to: 'admin',
        content: 'Tengo una duda sobre el ejercicio de arrays',
        timestamp: '10:35',
        status: 'read',
        type: 'text'
      }
    ];

    setTimeout(() => {
      setContacts(mockContacts);
      setMessages(mockMessages);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    // Aquí se integraría con Wappi API
    setTimeout(() => {
      setIsConnected(true);
      setIsLoading(false);
    }, 2000);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;

    const message: Message = {
      id: Date.now().toString(),
      from: 'admin',
      to: selectedContact.phone,
      content: newMessage,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'En línea';
      case 'away': return 'Ausente';
      case 'offline': return 'Desconectado';
      default: return 'Desconectado';
    }
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-text">WhatsApp Web</h1>
          <p className="text-text-secondary">Gestiona mensajes y contactos de WhatsApp</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar Chat
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configuración
          </Button>
          {!isConnected && (
            <Button onClick={handleConnect}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Conectar WhatsApp
            </Button>
          )}
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <Card>
          <div className="p-6 text-center">
            <MessageCircle className="w-16 h-16 text-accent mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">Conectar WhatsApp</h3>
            <p className="text-text-secondary mb-4">
              Escanea el código QR para conectar tu WhatsApp Web
            </p>
            {qrCode && (
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
            )}
            <Button onClick={handleConnect} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Conectando...' : 'Generar QR'}
            </Button>
          </div>
        </Card>
      )}

      {isConnected && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contacts List */}
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-text mb-4">Contactos</h3>
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedContact?.id === contact.id
                        ? 'bg-accent/10 border border-accent'
                        : 'hover:bg-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-accent" />
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(contact.status)}`}></div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-text">{contact.name}</p>
                          <p className="text-sm text-text-secondary">{contact.lastMessage}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-secondary">{contact.lastMessageTime}</p>
                        {contact.unreadCount > 0 && (
                          <div className="bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-1">
                            {contact.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex flex-col h-96">
                {/* Chat Header */}
                {selectedContact && (
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-accent" />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(selectedContact.status)}`}></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-text">{selectedContact.name}</p>
                        <p className="text-sm text-text-secondary">{getStatusText(selectedContact.status)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="secondary" size="sm">
                          <Mail className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {selectedContact ? (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.from === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                            message.from === 'admin'
                              ? 'bg-accent text-white'
                              : 'bg-panel text-text'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs opacity-70">{message.timestamp}</span>
                            {message.from === 'admin' && (
                              <div className="flex items-center gap-1">
                                {message.status === 'sent' && <CheckCircle className="w-3 h-3" />}
                                {message.status === 'delivered' && <CheckCircle className="w-3 h-3" />}
                                {message.status === 'read' && <CheckCircle className="w-3 h-3" />}
                                {message.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-text-secondary py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Selecciona un contacto para comenzar a chatear</p>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                {selectedContact && (
                  <div className="p-4 border-t border-border">
                    <div className="flex gap-2">
                      <div className="flex-1" onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}>
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Escribe un mensaje..."
                          className="mb-0"
                        />
                      </div>
                      <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Stats */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-text-secondary">Mensajes Enviados</p>
                  <p className="text-2xl font-bold text-text">{messages.filter(m => m.from === 'admin').length}</p>
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
                  <p className="text-sm font-medium text-text-secondary">Contactos Activos</p>
                  <p className="text-2xl font-bold text-text">{contacts.length}</p>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-text-secondary">Tiempo Conectado</p>
                  <p className="text-2xl font-bold text-text">2h 30m</p>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-text-secondary">Mensajes Leídos</p>
                  <p className="text-2xl font-bold text-text">{messages.filter(m => m.status === 'read').length}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}; 