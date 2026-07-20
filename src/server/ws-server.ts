/**
 * SmartStock — Standalone WebSocket Server (Socket.io)
 *
 * Dijalankan sebagai proses terpisah di Railway/Fly.io.
 * Menerima event dari API routes via Redis pub/sub, lalu
 * broadcast ke klien yang terhubung.
 *
 * Start: npx tsx src/server/ws-server.ts
 *
 * Environment Variables yang diperlukan:
 *   PORT              — port server (default: 3001)
 *   ALLOWED_ORIGINS   — comma-separated origins (contoh: https://smartstock.vercel.app)
 *   UPSTASH_REDIS_URL — Redis URL untuk sub channel
 */

import 'dotenv/config';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import Redis from 'ioredis';

// ── Config ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001', 10);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim());

const REDIS_URL = process.env.UPSTASH_REDIS_URL || 'redis://localhost:6379';

// ── Redis pub/sub client ──────────────────────────────────────────────────────
const subscriber = new Redis(REDIS_URL);

// ── Event Types ───────────────────────────────────────────────────────────────
export type WsEventType =
  | 'stock_update'
  | 'low_stock_alert'
  | 'opname_status'
  | 'notification';

export interface StockUpdatePayload {
  productId: string;
  locationId: string;
  quantityBefore: number;
  quantityAfter: number;
  type: string; // SALE, ADJUSTMENT, OPNAME_ADJUST, etc.
}

export interface LowStockAlertPayload {
  productId: string;
  productName: string;
  locationId: string;
  locationName: string;
  currentQty: number;
  minStock: number;
}

export interface OpnameStatusPayload {
  sessionId: string;
  locationId: string;
  locationName: string;
  status: string; // IN_PROGRESS, PENDING_APPROVAL, APPROVED, REJECTED
  actorName: string;
}

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: string;
}

export interface WsEvent {
  type: WsEventType;
  payload: StockUpdatePayload | LowStockAlertPayload | OpnameStatusPayload | NotificationPayload;
}

// Redis pub/sub channel
export const WS_CHANNEL = 'smartstock:ws:events';

// ── HTTP + Socket.io Server ───────────────────────────────────────────────────
const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', connections: io?.engine?.clientsCount || 0 }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ── Authentication Middleware ─────────────────────────────────────────────────
// Klien harus kirim userId saat connect
io.use((socket: Socket, next) => {
  const userId = socket.handshake.auth?.userId;
  if (!userId || typeof userId !== 'string') {
    return next(new Error('Authentication required: userId missing'));
  }
  (socket as any).userId = userId;
  next();
});

// ── Connection Handler ────────────────────────────────────────────────────────
io.on('connection', (socket: Socket) => {
  const userId = (socket as any).userId as string;
  console.log(`[ws] Client connected: ${socket.id} (user: ${userId})`);

  // Gabungkan ke room personal user (untuk notifikasi targeted)
  socket.join(`user:${userId}`);

  // Klien bisa gabung ke room lokasi tertentu untuk update stok real-time
  socket.on('join_location', (locationId: string) => {
    if (typeof locationId === 'string' && locationId.length > 0) {
      socket.join(`location:${locationId}`);
      console.log(`[ws] ${socket.id} joined room: location:${locationId}`);
    }
  });

  socket.on('leave_location', (locationId: string) => {
    socket.leave(`location:${locationId}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[ws] Client disconnected: ${socket.id} — ${reason}`);
  });

  socket.on('error', (err) => {
    console.error(`[ws] Socket error (${socket.id}):`, err.message);
  });
});

// ── Redis Subscriber ──────────────────────────────────────────────────────────
subscriber.subscribe(WS_CHANNEL, (err) => {
  if (err) {
    console.error('[ws] Redis subscribe error:', err.message);
    process.exit(1);
  }
  console.log(`[ws] Subscribed to Redis channel: ${WS_CHANNEL}`);
});

subscriber.on('message', (_channel: string, message: string) => {
  try {
    const event: WsEvent & { room?: string } = JSON.parse(message);

    switch (event.type) {
      case 'stock_update': {
        const p = event.payload as StockUpdatePayload;
        // Broadcast ke semua klien di room lokasi tersebut
        io.to(`location:${p.locationId}`).emit('stock_update', p);
        break;
      }
      case 'low_stock_alert': {
        const p = event.payload as LowStockAlertPayload;
        // Broadcast ke semua (admin/owner)
        io.emit('low_stock_alert', p);
        break;
      }
      case 'opname_status': {
        const p = event.payload as OpnameStatusPayload;
        io.to(`location:${p.locationId}`).emit('opname_status', p);
        break;
      }
      case 'notification': {
        const p = event.payload as NotificationPayload;
        // Kirim hanya ke user yang bersangkutan
        io.to(`user:${p.userId}`).emit('notification', p);
        break;
      }
      default:
        console.warn(`[ws] Unknown event type: ${(event as any).type}`);
    }
  } catch (err: any) {
    console.error('[ws] Failed to parse Redis message:', err.message);
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`[ws] SmartStock WebSocket server running on port ${PORT}`);
  console.log(`[ws] Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[ws] SIGTERM received, shutting down...');
  await subscriber.quit();
  httpServer.close(() => process.exit(0));
});
