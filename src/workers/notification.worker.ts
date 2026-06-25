/**
 * SmartStock — Notification Worker
 *
 * Worker BullMQ untuk memproses background jobs notifikasi:
 * - LOW_STOCK: Simpan in-app notification ke database
 * - EXPIRY: Simpan in-app notification untuk produk mau expired
 * - OPNAME_EVENT: Notifikasi saat opname disubmit/disetujui/ditolak
 *
 * Cara menjalankan worker (development):
 *   npm run worker
 *
 * Di production: dijalankan sebagai proses terpisah di Railway/Fly.io
 */

import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import type { NotificationJobData } from '@/lib/queue';
import { QUEUE_NAMES } from '@/lib/queue';

const prisma = new PrismaClient();

// ── Redis Connection ───────────────────────────────────────────
function getConnection() {
  return {
    url: process.env.UPSTASH_REDIS_URL ?? '',
    tls: process.env.NODE_ENV === 'production' ? {} : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}

// ── Job Handlers ──────────────────────────────────────────────

async function handleLowStock(
  job: Job<NotificationJobData>,
): Promise<void> {
  if (job.data.type !== 'LOW_STOCK') return;
  const { data } = job.data;

  console.log(
    `[LowStock] Produk: ${data.productName} (${data.sku}) | ` +
    `Qty: ${data.currentQty}/${data.minStock} | ` +
    `Lokasi: ${data.locationName}`,
  );

  // Buat notifikasi in-app untuk setiap user yang perlu dinotifikasi
  const notifications = data.notifyUserIds.map((userId) => ({
    userId,
    type: 'LOW_STOCK' as const,
    title: `⚠️ Stok Rendah: ${data.productName}`,
    message:
      `Stok ${data.productName} (${data.sku}) di ${data.locationName} ` +
      `tinggal ${data.currentQty} ${data.currentQty <= 0 ? '(habis!)' : `(min: ${data.minStock})`}.`,
    data: {
      productId: data.productId,
      locationId: data.locationId,
      currentQty: data.currentQty,
      minStock: data.minStock,
    },
  }));

  await prisma.notification.createMany({ data: notifications });
  console.log(`[LowStock] ✅ ${notifications.length} notifikasi dibuat`);
}

async function handleExpiry(
  job: Job<NotificationJobData>,
): Promise<void> {
  if (job.data.type !== 'EXPIRY') return;
  const { data } = job.data;

  const urgency = data.daysRemaining <= 7 ? '🚨' : data.daysRemaining <= 14 ? '⚠️' : '📅';
  console.log(
    `[Expiry] Produk: ${data.productName} | ` +
    `Expired dalam: ${data.daysRemaining} hari | ` +
    `Qty: ${data.currentQty}`,
  );

  const expiryDate = new Date(data.expiryDate).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const notifications = data.notifyUserIds.map((userId) => ({
    userId,
    type: 'EXPIRY' as const,
    title: `${urgency} Produk Hampir Expired: ${data.productName}`,
    message:
      `${data.productName} (${data.sku}) akan expired pada ${expiryDate} ` +
      `(${data.daysRemaining} hari lagi). Qty tersisa: ${data.currentQty}.`,
    data: {
      productId: data.productId,
      expiryDate: data.expiryDate,
      daysRemaining: data.daysRemaining,
      currentQty: data.currentQty,
    },
  }));

  await prisma.notification.createMany({ data: notifications });
  console.log(`[Expiry] ✅ ${notifications.length} notifikasi dibuat`);
}

async function handleOpnameEvent(
  job: Job<NotificationJobData>,
): Promise<void> {
  if (job.data.type !== 'OPNAME_EVENT') return;
  const { data } = job.data;

  const eventLabels = {
    SUBMITTED: { icon: '📋', title: 'Opname Disubmit', verb: 'disubmit oleh' },
    APPROVED:  { icon: '✅', title: 'Opname Disetujui', verb: 'disetujui' },
    REJECTED:  { icon: '❌', title: 'Opname Ditolak', verb: 'ditolak' },
  };

  const { icon, title, verb } = eventLabels[data.eventType];
  console.log(`[Opname] Session: ${data.sessionId} | Event: ${data.eventType}`);

  const notifications = data.notifyUserIds.map((userId) => ({
    userId,
    type: `OPNAME_${data.eventType}` as 'OPNAME_SUBMITTED' | 'OPNAME_APPROVED' | 'OPNAME_REJECTED',
    title: `${icon} ${title}: ${data.locationName}`,
    message:
      `Sesi opname di ${data.locationName} telah ${verb} ${data.submittedBy}. ` +
      `${data.totalItems} produk diperiksa` +
      (data.totalDifference !== 0 ? `, ${Math.abs(data.totalDifference)} selisih ditemukan.` : ', tidak ada selisih.') +
      (data.reviewNotes ? `\nCatatan: ${data.reviewNotes}` : ''),
    data: {
      sessionId: data.sessionId,
      totalItems: data.totalItems,
      totalDifference: data.totalDifference,
    },
  }));

  await prisma.notification.createMany({ data: notifications });
  console.log(`[Opname] ✅ ${notifications.length} notifikasi dibuat`);
}

// ── Worker Instance ───────────────────────────────────────────

export function createNotificationWorker(): Worker<NotificationJobData> {
  const worker = new Worker<NotificationJobData>(
    QUEUE_NAMES.NOTIFICATIONS,
    async (job) => {
      switch (job.data.type) {
        case 'LOW_STOCK':
          await handleLowStock(job);
          break;
        case 'EXPIRY':
          await handleExpiry(job);
          break;
        case 'OPNAME_EVENT':
          await handleOpnameEvent(job);
          break;
        default:
          console.warn(`[Notification Worker] Unknown job type`);
      }
    },
    {
      connection: getConnection(),
      concurrency: 5, // Proses 5 job sekaligus
      limiter: {
        max: 100,      // Max 100 job per
        duration: 60000, // ... per menit
      },
    },
  );

  worker.on('completed', (job) => {
    console.log(`[Notification Worker] ✅ Job ${job.id} selesai`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Notification Worker] ❌ Job ${job?.id} gagal:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[Notification Worker] Error:', err);
  });

  return worker;
}
