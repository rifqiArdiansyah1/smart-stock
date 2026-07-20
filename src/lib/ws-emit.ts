/**
 * SmartStock — WebSocket Emit Helper
 *
 * Digunakan oleh API routes di Next.js untuk mengirim events
 * ke WebSocket server via Redis pub/sub.
 *
 * Arsitektur:
 *   Next.js API route → redis.publish(WS_CHANNEL, event) → ws-server.ts → Socket.io clients
 */

import { redis } from './redis';
import type {
  WsEventType,
  StockUpdatePayload,
  LowStockAlertPayload,
  OpnameStatusPayload,
  NotificationPayload,
} from '@/server/ws-server';

export { WS_CHANNEL } from '@/server/ws-server';

const WS_CHANNEL = 'smartstock:ws:events';

async function publishEvent(type: WsEventType, payload: object): Promise<void> {
  try {
    await redis.publish(WS_CHANNEL, JSON.stringify({ type, payload }));
  } catch (err: any) {
    // WebSocket adalah fitur opsional — jangan sampai error di sini
    // menyebabkan API route gagal
    console.warn(`[ws-emit] Failed to publish ${type} event:`, err.message);
  }
}

/** Broadcast update stok ke semua klien di room lokasi */
export function emitStockUpdate(payload: StockUpdatePayload): Promise<void> {
  return publishEvent('stock_update', payload);
}

/** Broadcast low-stock alert ke semua klien (admin/owner) */
export function emitLowStockAlert(payload: LowStockAlertPayload): Promise<void> {
  return publishEvent('low_stock_alert', payload);
}

/** Broadcast perubahan status opname ke room lokasi */
export function emitOpnameStatus(payload: OpnameStatusPayload): Promise<void> {
  return publishEvent('opname_status', payload);
}

/** Kirim notifikasi personal ke satu user */
export function emitNotification(payload: NotificationPayload): Promise<void> {
  return publishEvent('notification', payload);
}
