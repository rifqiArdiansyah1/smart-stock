'use client';

/**
 * SmartStock — useRealtimeUpdates Hook
 *
 * React hook untuk subscribe ke WebSocket events dari ws-server.
 * Mengelola koneksi Socket.io lifecycle (connect, disconnect, reconnect).
 *
 * Penggunaan:
 *   const { isConnected, stockUpdates, notifications } = useRealtimeUpdates({
 *     userId: session.user.id,
 *     locationId: '...',
 *   });
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  StockUpdatePayload,
  LowStockAlertPayload,
  OpnameStatusPayload,
  NotificationPayload,
} from '@/server/ws-server';

export type { StockUpdatePayload, LowStockAlertPayload, OpnameStatusPayload, NotificationPayload };

interface UseRealtimeUpdatesOptions {
  userId: string;
  /** Opsional: join room untuk satu lokasi tertentu */
  locationId?: string;
  onStockUpdate?: (payload: StockUpdatePayload) => void;
  onLowStockAlert?: (payload: LowStockAlertPayload) => void;
  onOpnameStatus?: (payload: OpnameStatusPayload) => void;
  onNotification?: (payload: NotificationPayload) => void;
}

interface UseRealtimeUpdatesReturn {
  isConnected: boolean;
  connectionError: string | null;
  lastStockUpdate: StockUpdatePayload | null;
  lastNotification: NotificationPayload | null;
  unreadNotificationCount: number;
  clearNotificationCount: () => void;
}

export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions): UseRealtimeUpdatesReturn {
  const {
    userId,
    locationId,
    onStockUpdate,
    onLowStockAlert,
    onOpnameStatus,
    onNotification,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastStockUpdate, setLastStockUpdate] = useState<StockUpdatePayload | null>(null);
  const [lastNotification, setLastNotification] = useState<NotificationPayload | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const clearNotificationCount = useCallback(() => setUnreadNotificationCount(0), []);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl || !userId) return;

    const socket = io(wsUrl, {
      auth: { userId },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log('[ws] Connected:', socket.id);

      // Join lokasi room jika ada
      if (locationId) {
        socket.emit('join_location', locationId);
      }
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('[ws] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      setConnectionError(err.message);
      console.warn('[ws] Connection error:', err.message);
    });

    socket.on('stock_update', (payload: StockUpdatePayload) => {
      setLastStockUpdate(payload);
      onStockUpdate?.(payload);
    });

    socket.on('low_stock_alert', (payload: LowStockAlertPayload) => {
      onLowStockAlert?.(payload);
    });

    socket.on('opname_status', (payload: OpnameStatusPayload) => {
      onOpnameStatus?.(payload);
    });

    socket.on('notification', (payload: NotificationPayload) => {
      setLastNotification(payload);
      setUnreadNotificationCount((c) => c + 1);
      onNotification?.(payload);
    });

    return () => {
      if (locationId) socket.emit('leave_location', locationId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, locationId]); // Intentionally exclude callbacks to avoid reconnect on re-render

  return {
    isConnected,
    connectionError,
    lastStockUpdate,
    lastNotification,
    unreadNotificationCount,
    clearNotificationCount,
  };
}
