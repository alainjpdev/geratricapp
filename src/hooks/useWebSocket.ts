import { useState, useEffect, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

export interface WebSocketNotification {
  id: string;
  type: 'message' | 'user' | 'bot' | 'stats';
  title: string;
  data: any;
  timestamp: Date;
}

export interface WebSocketStats {
  totalUsers: number;
  totalMessages: number;
  activeUsers: number;
  botUptime: string;
}

export const useWebSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<WebSocketNotification[]>([]);
  const [realtimeStats, setRealtimeStats] = useState<WebSocketStats | null>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<any[]>([]);
  const [realtimeUsers, setRealtimeUsers] = useState<any[]>([]);

  // Conectar al WebSocket
  useEffect(() => {
    console.log('🔄 Iniciando conexión WebSocket...');
    
    // Usar directamente la URL de ngrok para WebSocket
    const socketUrl = 'https://70fecc49fcf6.ngrok-free.app';
    
    const newSocket = io(socketUrl, {
      extraHeaders: {
        'ngrok-skip-browser-warning': 'true'
      },
      timeout: 10000, // Timeout más largo
      forceNew: true,
      transports: ['polling', 'websocket'], // Intentar ambos transportes
      upgrade: true,
      rememberUpgrade: false
    });

    setSocket(newSocket);

    // Eventos de conexión
    newSocket.on('connect', () => {
      console.log('🔌 ✅ Conectado al servidor WebSocket');
      console.log('🔌 Socket ID:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 ❌ Desconectado del servidor WebSocket:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.warn('🔌 ❌ Error de conexión WebSocket:', error);
      console.warn('🔌 Error details:', error.message, error.description, error.context);
      setIsConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔌 🔄 Reconectando WebSocket, intento:', attemptNumber);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔌 🔄 Intento de reconexión WebSocket:', attemptNumber);
    });

    newSocket.on('reconnect_error', (error) => {
      console.warn('🔌 ❌ Error de reconexión WebSocket:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('🔌 ❌ Falló la reconexión WebSocket');
    });

    // Eventos de notificaciones
    newSocket.on('new_message', (data) => {
      console.log('💬 Nuevo mensaje:', data);
      
      // Actualizar mensajes en tiempo real
      setRealtimeMessages(prev => [data, ...prev.slice(0, 49)]);
      
      // Agregar notificación
      addNotification('message', '💬 Nuevo Mensaje', data);
    });

    newSocket.on('new_user', (data) => {
      console.log('👤 Nuevo usuario:', data);
      
      // Actualizar usuarios en tiempo real
      setRealtimeUsers(prev => [data, ...prev.slice(0, 49)]);
      
      // Agregar notificación
      addNotification('user', '👤 Nuevo Usuario', data);
    });

    newSocket.on('bot_status_change', (data) => {
      console.log('🤖 Estado del bot:', data);
      
      // Agregar notificación
      addNotification('bot', '🤖 Estado del Bot', data);
    });

    newSocket.on('stats_update', (data) => {
      console.log('📊 Estadísticas:', data);
      
      // Actualizar estadísticas en tiempo real
      setRealtimeStats(data.stats);
      
      // Agregar notificación
      addNotification('stats', '📊 Estadísticas Actualizadas', data);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Agregar notificación
  const addNotification = useCallback((type: WebSocketNotification['type'], title: string, data: any) => {
    const notification: WebSocketNotification = {
      id: Date.now().toString(),
      type,
      title,
      data,
      timestamp: new Date()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Máximo 50
  }, []);

  // Limpiar notificaciones
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Obtener notificaciones por tipo
  const getNotificationsByType = useCallback((type: WebSocketNotification['type']) => {
    return notifications.filter(notif => notif.type === type);
  }, [notifications]);

  // Obtener notificaciones recientes
  const getRecentNotifications = useCallback((limit: number = 10) => {
    return notifications.slice(0, limit);
  }, [notifications]);

  // Reconectar manualmente
  const reconnect = useCallback(() => {
    if (socket) {
      console.log('🔄 Reconectando WebSocket manualmente...');
      socket.disconnect();
      socket.connect();
    }
  }, [socket]);

  return {
    // Estado
    isConnected,
    notifications,
    realtimeStats,
    realtimeMessages,
    realtimeUsers,
    
    // Métodos
    clearNotifications,
    getNotificationsByType,
    getRecentNotifications,
    reconnect,
    
    // Socket (para uso avanzado)
    socket
  };
};
