import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Search, Filter, Eye, Edit, Trash2, Calendar, User, Package, DollarSign } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  createdAt: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Datos de ejemplo
  useEffect(() => {
    const mockOrders: Order[] = [
      {
        id: '1',
        orderNumber: 'ORD-001',
        clientName: 'Juan Pérez',
        status: 'pending',
        total: 1500.00,
        createdAt: '2024-01-15',
        items: [
          { id: '1', name: 'Producto A', quantity: 2, price: 500, total: 1000 },
          { id: '2', name: 'Producto B', quantity: 1, price: 500, total: 500 }
        ]
      },
      {
        id: '2',
        orderNumber: 'ORD-002',
        clientName: 'María García',
        status: 'processing',
        total: 2300.00,
        createdAt: '2024-01-14',
        items: [
          { id: '3', name: 'Producto C', quantity: 3, price: 400, total: 1200 },
          { id: '4', name: 'Producto D', quantity: 2, price: 550, total: 1100 }
        ]
      },
      {
        id: '3',
        orderNumber: 'ORD-003',
        clientName: 'Carlos López',
        status: 'delivered',
        total: 800.00,
        createdAt: '2024-01-13',
        items: [
          { id: '5', name: 'Producto E', quantity: 1, price: 800, total: 800 }
        ]
      }
    ];

    setTimeout(() => {
      setOrders(mockOrders);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'processing': return 'Procesando';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-text">Órdenes</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text">Órdenes</h1>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva Orden
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
              <Input
                placeholder="Buscar por número de orden o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-panel text-text focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="processing">Procesando</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de órdenes */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="w-16 h-16 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text mb-2">No hay órdenes</h3>
            <p className="text-text-secondary mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'No se encontraron órdenes con los filtros aplicados.'
                : 'Aún no tienes órdenes registradas.'
              }
            </p>
            <Button className="flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              Crear Primera Orden
            </Button>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-lg font-semibold text-text">
                      {order.orderNumber}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-text-secondary">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{order.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-medium text-text">
                        ${order.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-text-secondary">
                      {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Ver
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                  <Button variant="danger" size="sm" className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;
