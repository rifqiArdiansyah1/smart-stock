# SmartStock — WebSocket Server Guide

Dokumentasi untuk WebSocket server yang berjalan terpisah dari Next.js (Vercel) di Railway atau Fly.io.

---

## Arsitektur

```
Browser (Socket.io client)
        │
        │  WebSocket (ws://)
        ▼
┌─────────────────────────────────┐
│  ws-server.ts (Railway/Fly.io)  │
│  Port: 3001                     │
│  Socket.io + ioredis subscriber │
└──────────────┬──────────────────┘
               │ Redis SUBSCRIBE
               │ (channel: smartstock:ws:events)
               ▼
        Upstash Redis
               ▲
               │ Redis PUBLISH
               │
┌──────────────┴──────────────────┐
│  Next.js API Routes (Vercel)    │
│  src/lib/ws-emit.ts             │
└─────────────────────────────────┘
```

**Kenapa dipisah?** Vercel adalah serverless — setiap request berjalan di isolasi dan tidak bisa mempertahankan koneksi TCP persisten yang dibutuhkan WebSocket.

---

## Events

### `stock_update`
Dikirim saat ada perubahan stok di suatu lokasi.

```typescript
interface StockUpdatePayload {
  productId: string;
  locationId: string;
  quantityBefore: number;
  quantityAfter: number;
  type: 'SALE' | 'ADJUSTMENT' | 'OPNAME_ADJUST' | 'RESTOCK';
}
```

**Room:** `location:{locationId}` — hanya klien yang join room lokasi tersebut yang menerima.

---

### `low_stock_alert`
Dikirim saat cron job mendeteksi stok di bawah minimum.

```typescript
interface LowStockAlertPayload {
  productId: string;
  productName: string;
  locationId: string;
  locationName: string;
  currentQty: number;
  minStock: number;
}
```

**Room:** Semua klien (broadcast global).

---

### `opname_status`
Dikirim saat status sesi opname berubah (submit/approve/reject).

```typescript
interface OpnameStatusPayload {
  sessionId: string;
  locationId: string;
  locationName: string;
  status: 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  actorName: string;
}
```

**Room:** `location:{locationId}`

---

### `notification`
Dikirim ke satu user tertentu (personal notification).

```typescript
interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: string;
}
```

**Room:** `user:{userId}`

---

## Deploy ke Railway

### 1. Buat Service Baru

1. Masuk ke [railway.app](https://railway.app)
2. **New Project → Deploy from GitHub repo**
3. Pilih repository `smart-stock`
4. Di service settings, set **Start Command:**
   ```
   npx tsx src/server/ws-server.ts
   ```

### 2. Environment Variables di Railway

| Variable | Nilai |
|----------|-------|
| `PORT` | `3001` (Railway set otomatis) |
| `UPSTASH_REDIS_URL` | `rediss://default:TOKEN@HOST:6379` |
| `ALLOWED_ORIGINS` | `https://smartstock.vercel.app` |
| `NODE_ENV` | `production` |

### 3. Update Vercel

Setelah Railway memberikan URL publik (contoh: `https://smartstock-ws.railway.app`), set di Vercel:

```
NEXT_PUBLIC_WS_URL=wss://smartstock-ws.railway.app
```

---

## Deploy ke Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Launch (dari root directory)
flyctl launch --dockerfile Dockerfile.ws --name smartstock-ws

# Set secrets
flyctl secrets set \
  UPSTASH_REDIS_URL="rediss://..." \
  ALLOWED_ORIGINS="https://smartstock.vercel.app"

# Deploy
flyctl deploy
```

---

## Menggunakan `useRealtimeUpdates` Hook

```tsx
'use client';
import { useSession } from 'next-auth/react';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

export default function StockPage({ locationId }: { locationId: string }) {
  const { data: session } = useSession();

  const { isConnected, lastStockUpdate, unreadNotificationCount } = useRealtimeUpdates({
    userId: session?.user?.id ?? '',
    locationId,
    onStockUpdate: (payload) => {
      console.log('Stock changed:', payload);
      // Refetch atau update state lokal
    },
    onLowStockAlert: (payload) => {
      alert(`Stok rendah: ${payload.productName}!`);
    },
  });

  return (
    <div>
      <span>{isConnected ? '🟢 Live' : '🔴 Offline'}</span>
      {unreadNotificationCount > 0 && <span>🔔 {unreadNotificationCount}</span>}
    </div>
  );
}
```

---

## Emitting Events dari API Routes

```typescript
// Dalam API route Next.js
import { emitStockUpdate } from '@/lib/ws-emit';

await emitStockUpdate({
  productId: 'xxx',
  locationId: 'yyy',
  quantityBefore: 100,
  quantityAfter: 95,
  type: 'SALE',
});
```

> **Catatan:** Jika Redis tidak tersedia, emit akan gagal secara diam-diam (tidak throw error) agar tidak mengganggu respons API.
