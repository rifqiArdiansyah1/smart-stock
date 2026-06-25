/**
 * SmartStock — Stock Sync Worker
 *
 * Worker BullMQ untuk memproses sinkronisasi stok dari offline queue.
 *
 * Skenario:
 * 1. Staff gudang scan barcode di gudang dengan sinyal lemah (offline)
 * 2. Data tersimpan di IndexedDB browser
 * 3. Saat koneksi pulih, data dikirim ke /api/v1/opname/sync
 * 4. API route dispatch job ke queue ini
 * 5. Worker ini memproses data dan update database
 *
 * Ini adalah prinsip "offline-first" SmartStock:
 * Data tidak hilang meski internet mati saat opname.
 */

import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import type { StockSyncJobData } from '@/lib/queue';
import { QUEUE_NAMES } from '@/lib/queue';

const prisma = new PrismaClient();

function getConnection() {
  return {
    url: process.env.UPSTASH_REDIS_URL ?? '',
    tls: process.env.NODE_ENV === 'production' ? {} : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}

async function processStockSync(job: Job<StockSyncJobData>): Promise<void> {
  const { opnameSessionId, items, actorId, locationId } = job.data;

  console.log(
    `[StockSync] Session: ${opnameSessionId} | ` +
    `Items: ${items.length} | Actor: ${actorId}`,
  );

  // Validasi session masih IN_PROGRESS
  const session = await prisma.stockOpnameSession.findUnique({
    where: { id: opnameSessionId },
  });

  if (!session) {
    throw new Error(`[StockSync] Session ${opnameSessionId} tidak ditemukan`);
  }

  if (session.status !== 'IN_PROGRESS') {
    console.warn(
      `[StockSync] Session ${opnameSessionId} sudah ${session.status}, skip sync`,
    );
    return;
  }

  // Upsert setiap item opname
  let syncedCount = 0;
  for (const item of items) {
    // Ambil stok sistem saat ini
    const stockLevel = await prisma.stockLevel.findUnique({
      where: {
        productId_locationId: {
          productId: item.productId,
          locationId,
        },
      },
    });

    const systemQty = stockLevel?.quantity ?? 0;
    const difference = item.physicalQty - systemQty;

    await prisma.stockOpnameItem.upsert({
      where: {
        sessionId_productId: {
          sessionId: opnameSessionId,
          productId: item.productId,
        },
      },
      update: {
        physicalQty: item.physicalQty,
        difference,
      },
      create: {
        sessionId: opnameSessionId,
        productId: item.productId,
        systemQty,
        physicalQty: item.physicalQty,
        difference,
      },
    });

    syncedCount++;
    await job.updateProgress(Math.round((syncedCount / items.length) * 100));
  }

  console.log(
    `[StockSync] ✅ ${syncedCount}/${items.length} item berhasil disinkronkan`,
  );
}

export function createStockSyncWorker(): Worker<StockSyncJobData> {
  const worker = new Worker<StockSyncJobData>(
    QUEUE_NAMES.STOCK_SYNC,
    processStockSync,
    {
      connection: getConnection(),
      concurrency: 2, // Sync tidak boleh terlalu paralel — risiko race condition
    },
  );

  worker.on('completed', (job) => {
    console.log(`[StockSync Worker] ✅ Job ${job.id} selesai`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[StockSync Worker] ❌ Job ${job?.id} gagal:`, err.message);
  });

  worker.on('progress', (job, progress) => {
    console.log(`[StockSync Worker] Job ${job.id}: ${progress}%`);
  });

  return worker;
}
