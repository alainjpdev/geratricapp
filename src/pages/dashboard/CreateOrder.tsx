import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Minus, Save, ArrowLeft, User, Package, DollarSign, Calendar } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

const CreateOrder: React.FC = () => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    deliveryAddress: '',
    notes: '',
    deliveryDate: ''
  });

  const [items, setItems] = useState<OrderItem[]>([]);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    price: 0
  });

  const addItem = () => {
    if (newItem.name && newItem.quantity > 0 && newItem.price > 0) {
      const item: OrderItem = {
        id: Date.now().toString(),
        name: newItem.name,
        quantity: newItem.quantity,
        price: newItem.price,
        total: newItem.quantity * newItem.price
      };
      setItems([...items, item]);
      setNewItem({ name: '', quantity: 1, price: 0 });
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItemQuantity = (id: string, quantity: number) => {
    if (quantity > 0) {
      setItems(items.map(item => 
        item.id === id 
          ? { ...item, quantity, total: quantity * item.price }
          : item
      ));
    }
  };

  const updateItemPrice = (id: string, price: number) => {
    if (price >= 0) {
      setItems(items.map(item => 
        item.id === id 
          ? { ...item, price, total: item.quantity * price }
          : item
      ));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.16; // 16% IVA
  const total = subtotal + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar la orden
    console.log('Guardando orden:', { formData, items, subtotal, tax, total });
    alert('Orden creada exitosamente');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold text-text">Crear Nueva Orden</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información del Cliente */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Información del Cliente
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Nombre del Cliente *
                </label>
                <Input
                  value={formData.clientName}
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                  placeholder="Nombre completo del cliente"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Teléfono
                </label>
                <Input
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                  placeholder="+52 55 1234 5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Dirección de Entrega
                </label>
                <textarea
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
                  placeholder="Dirección completa de entrega"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-panel text-text focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Fecha de Entrega
                </label>
                <Input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                />
              </div>
            </div>
          </Card>

          {/* Productos */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Productos
            </h2>
            
            {/* Agregar Producto */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Producto
                  </label>
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    placeholder="Nombre del producto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Cantidad
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Precio
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.price}
                    onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2"
                disabled={!newItem.name || newItem.quantity <= 0 || newItem.price <= 0}
              >
                <Plus className="w-4 h-4" />
                Agregar Producto
              </Button>
            </div>

            {/* Lista de Productos */}
            {items.length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-medium text-text">Productos Agregados</h3>
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-panel rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-text">{item.name}</p>
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-border rounded"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-border rounded"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-border rounded bg-panel text-text text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text">
                        ${item.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </span>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="p-1"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay productos agregados</p>
              </div>
            )}
          </Card>
        </div>

        {/* Resumen y Total */}
        {items.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Resumen de la Orden
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-text">
                <span>Subtotal:</span>
                <span>${subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-text">
                <span>IVA (16%):</span>
                <span>${tax.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-text border-t border-border pt-2">
                <span>Total:</span>
                <span>${total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Notas */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-text mb-4">Notas Adicionales</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Instrucciones especiales, comentarios, etc."
            className="w-full px-3 py-2 border border-border rounded-lg bg-panel text-text focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
            rows={3}
          />
        </Card>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="flex items-center gap-2"
            disabled={!formData.clientName || items.length === 0}
          >
            <Save className="w-4 h-4" />
            Crear Orden
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrder;
