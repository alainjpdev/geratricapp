import React from 'react';
import { WebSocketNotification } from '../../hooks/useWebSocket';
import { X, MessageSquare, User, Bot, BarChart3, Bell } from 'lucide-react';

interface NotificationPanelProps {
  notifications: WebSocketNotification[];
  onClear: () => void;
  isConnected: boolean;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onClear,
  isConnected
}) => {
  const getIcon = (type: WebSocketNotification['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'user':
        return <User className="w-4 h-4" />;
      case 'bot':
        return <Bot className="w-4 h-4" />;
      case 'stats':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: WebSocketNotification['type']) => {
    switch (type) {
      case 'message':
        return 'border-green-500 bg-green-50';
      case 'user':
        return 'border-yellow-500 bg-yellow-50';
      case 'bot':
        return 'border-red-500 bg-red-50';
      case 'stats':
        return 'border-purple-500 bg-purple-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="dark:bg-black bg-white rounded-lg shadow-md p-6 mb-6 dark:border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold dark:text-white text-gray-900">🔔 Notificaciones en Tiempo Real</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-sm dark:text-white text-gray-900">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm dark:text-white text-gray-900">
            {notifications.length} notificaciones
          </span>
          {notifications.length > 0 && (
            <button
              onClick={onClear}
              className="dark:text-white text-gray-900 dark:hover:text-white hover:text-gray-700 text-sm px-2 py-1 rounded dark:hover:bg-white/10 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8 dark:text-white text-gray-900">
          <Bell className="w-12 h-12 mx-auto mb-2 dark:text-white text-gray-900" />
          <p>Esperando notificaciones en tiempo real...</p>
          <p className="text-sm">Los mensajes y eventos aparecerán aquí automáticamente</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border-l-4 ${getTypeColor(notification.type)} animate-slideIn dark:bg-black/50 dark:border-white/20`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium dark:text-white text-gray-900">
                      {notification.title}
                    </h3>
                    <p className="text-xs dark:text-white text-gray-700 mt-1">
                      {notification.timestamp.toLocaleString()}
                    </p>
                    <div className="mt-2">
                      <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                        {JSON.stringify(notification.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
