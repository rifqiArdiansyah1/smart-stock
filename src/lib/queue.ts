/**
 * SmartStock — BullMQ Queue Configuration
 *
 * Mendefinisikan semua Queue dan Job types yang digunakan
 * di background processing SmartStock.
 *
 * Arsitektur:
 * - Queue definitions → file ini (src/lib/queue.ts)
 * - Worker implementations → src/workers/*.worker.ts
 * - Job triggers → dipanggil dari service layer
 *
 * Queue yang ada:
 * 1. notifications  → low-stock alert, expiry alert, opname events
 * 2. stock-sync     → sinkronisasi stock_levels dari IndexedDB
 * 3. reports        → generate laporan berat (PDF/CSV export)
 *
 * @see https://docs.bullmq.io/
 */

import { Queue, QueueEvents, ConnectionOptions } from 'bullmq';

// ── Redis Connection untuk BullMQ ─────────────────────────────
// BullMQ membutuhkan ioredis-compatible connection (bukan REST API).
// Di production menggunakan Upstash Redis dengan TLS.
function getRedisConnection(): ConnectionOptions {
  const url = process.env.UPSTASH_REDIS_REST_URL;

  if (!url) {
    throw new Error(
      '[SmartStock/Queue] UPSTASH_REDIS_REST_URL harus diset. ' +
        'BullMQ membutuhkan koneksi Redis standard (bukan REST API).\n' +
        'Gunakan REDIS_URL format: rediss://default:TOKEN@HOST:PORT',
    );
  }

  // Parse Upstash URL ke ioredis format
  // Upstash REST URL: https://xxx.upstash.io → Redis URL: rediss://default:token@xxx.upstash.io:6379
  const redisUrl = process.env.UPSTASH_REDIS_URL ?? url.replace('https://', 'rediss://default:' + process.env.UPSTASH_REDIS_REST_TOKEN + '@');

  return {
    url: redisUrl,
    tls: process.env.NODE_ENV === 'production' ? {} : undefined,
    maxRetriesPerRequest: null, // Wajib untuk BullMQ
    enableReadyCheck: false,
  };
}

// ── Job Type Definitions ───────────────────────────────────────

/** Payload untuk notifikasi low-stock */
export interface LowStockJobData {
  productId: string;
  productName: string;
  sku: string;
  currentQty: number;
  minStock: number;
  locationId: string;
  locationName: string;
  notifyUserIds: string[]; // user IDs yang akan dinotifikasi
}

/** Payload untuk notifikasi expiry */
export interface ExpiryJobData {
  productId: string;
  productName: string;
  sku: string;
  expiryDate: string; // ISO string
  daysRemaining: number;
  currentQty: number;
  notifyUserIds: string[];
}

/** Payload untuk event opname */
export interface OpnameEventJobData {
  sessionId: string;
  locationName: string;
  submittedBy: string;
  totalItems: number;
  totalDifference: number;
  eventType: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  notifyUserIds: string[];
  reviewNotes?: string;
}

/** Payload untuk sinkronisasi stok dari offline queue */
export interface StockSyncJobData {
  opnameSessionId: string;
  items: Array<{
    productId: string;
    physicalQty: number;
    scannedAt: string;
  }>;
  actorId: string;
  locationId: string;
}

/** Payload untuk generate laporan */
export interface ReportJobData {
  type: 'DISCREPANCY' | 'STOCK_SUMMARY' | 'MOVEMENT_HISTORY';
  requestedBy: string;
  params: {
    startDate?: string;
    endDate?: string;
    locationId?: string;
    category?: string;
    format: 'CSV' | 'PDF';
  };
}

// ── Union type semua job data ──────────────────────────────────
export type NotificationJobData =
  | { type: 'LOW_STOCK'; data: LowStockJobData }
  | { type: 'EXPIRY'; data: ExpiryJobData }
  | { type: 'OPNAME_EVENT'; data: OpnameEventJobData };

// ── Queue Names ────────────────────────────────────────────────
export const QUEUE_NAMES = {
  NOTIFICATIONS: 'smartstock:notifications',
  STOCK_SYNC:    'smartstock:stock-sync',
  REPORTS:       'smartstock:reports',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// ── Default Queue Options ──────────────────────────────────────
const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000, // 2 detik, lalu 4, 8, ...
  },
  removeOnComplete: {
    count: 100,    // Simpan 100 job terakhir yang berhasil
    age: 86400,    // ... selama 24 jam
  },
  removeOnFail: {
    count: 50,     // Simpan 50 job terakhir yang gagal
    age: 604800,   // ... selama 7 hari
  },
};

// ── Singleton Queue Instances ──────────────────────────────────
const globalForQueues = globalThis as unknown as {
  notificationQueue: Queue<NotificationJobData> | undefined;
  stockSyncQueue: Queue<StockSyncJobData> | undefined;
  reportQueue: Queue<ReportJobData> | undefined;
};

let connection: ConnectionOptions;

function getConnection(): ConnectionOptions {
  if (!connection) {
    connection = getRedisConnection();
  }
  return connection;
}

/** Queue untuk in-app & email notifications */
export function getNotificationQueue(): Queue<NotificationJobData> {
  if (!globalForQueues.notificationQueue) {
    globalForQueues.notificationQueue = new Queue<NotificationJobData>(
      QUEUE_NAMES.NOTIFICATIONS,
      {
        connection: getConnection(),
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      },
    );
  }
  return globalForQueues.notificationQueue;
}

/** Queue untuk sinkronisasi stok dari offline queue (IndexedDB) */
export function getStockSyncQueue(): Queue<StockSyncJobData> {
  if (!globalForQueues.stockSyncQueue) {
    globalForQueues.stockSyncQueue = new Queue<StockSyncJobData>(
      QUEUE_NAMES.STOCK_SYNC,
      {
        connection: getConnection(),
        defaultJobOptions: {
          ...DEFAULT_JOB_OPTIONS,
          attempts: 5, // Retry lebih banyak untuk sync data penting
        },
      },
    );
  }
  return globalForQueues.stockSyncQueue;
}

/** Queue untuk generate laporan berat */
export function getReportQueue(): Queue<ReportJobData> {
  if (!globalForQueues.reportQueue) {
    globalForQueues.reportQueue = new Queue<ReportJobData>(
      QUEUE_NAMES.REPORTS,
      {
        connection: getConnection(),
        defaultJobOptions: {
          ...DEFAULT_JOB_OPTIONS,
          attempts: 2, // Laporan tidak perlu banyak retry
        },
      },
    );
  }
  return globalForQueues.reportQueue;
}

// ── Job Dispatcher Functions ───────────────────────────────────

/**
 * Kirim notifikasi low-stock ke queue.
 */
export async function dispatchLowStockAlert(data: LowStockJobData): Promise<void> {
  const queue = getNotificationQueue();
  await queue.add(
    'low-stock',
    { type: 'LOW_STOCK', data },
    {
      jobId: `low-stock:${data.productId}:${data.locationId}`,
      // Deduplicate: skip jika job sama sudah ada di queue
    },
  );
}

/**
 * Kirim notifikasi expiry ke queue.
 */
export async function dispatchExpiryAlert(data: ExpiryJobData): Promise<void> {
  const queue = getNotificationQueue();
  await queue.add(
    'expiry',
    { type: 'EXPIRY', data },
    {
      jobId: `expiry:${data.productId}:${data.daysRemaining}d`,
    },
  );
}

/**
 * Kirim event opname (submitted/approved/rejected) ke queue.
 */
export async function dispatchOpnameEvent(data: OpnameEventJobData): Promise<void> {
  const queue = getNotificationQueue();
  await queue.add('opname-event', { type: 'OPNAME_EVENT', data });
}

/**
 * Kirim job sinkronisasi stok dari offline queue.
 */
export async function dispatchStockSync(data: StockSyncJobData): Promise<void> {
  const queue = getStockSyncQueue();
  await queue.add('sync', data, {
    priority: 1, // High priority — data stok penting
  });
}

/**
 * Kirim job generate laporan.
 */
export async function dispatchReport(data: ReportJobData): Promise<void> {
  const queue = getReportQueue();
  await queue.add('generate', data);
}

// ── Queue Health Check ─────────────────────────────────────────

export interface QueueHealth {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

/**
 * Cek status semua queue. Berguna untuk health check endpoint.
 */
export async function getQueuesHealth(): Promise<QueueHealth[]> {
  const queues = [
    getNotificationQueue(),
    getStockSyncQueue(),
    getReportQueue(),
  ];

  return Promise.all(
    queues.map(async (q) => ({
      name: q.name,
      waiting:   await q.getWaitingCount(),
      active:    await q.getActiveCount(),
      completed: await q.getCompletedCount(),
      failed:    await q.getFailedCount(),
      delayed:   await q.getDelayedCount(),
    })),
  );
}

// ── Queue Events (untuk monitoring) ───────────────────────────
export function createQueueEvents(queueName: QueueName): QueueEvents {
  return new QueueEvents(queueName, { connection: getConnection() });
}
