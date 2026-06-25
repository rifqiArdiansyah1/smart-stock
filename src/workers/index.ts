/**
 * SmartStock — Worker Entry Point
 *
 * File ini adalah entry point untuk menjalankan semua workers.
 * Dijalankan sebagai proses Node.js terpisah (bukan Next.js).
 *
 * Development:
 *   npm run worker
 *
 * Production (Railway/Fly.io):
 *   node --require ts-node/register src/workers/index.ts
 *
 * ⚠️  PENTING: Workers TIDAK berjalan di dalam Next.js API routes.
 *     Worker adalah proses long-running yang perlu dihosting terpisah.
 *     Di Vercel (serverless), gunakan Vercel Cron Jobs untuk trigger jobs.
 */

import { createNotificationWorker } from './notification.worker';
import { createStockSyncWorker } from './stock-sync.worker';

// ── Graceful shutdown ──────────────────────────────────────────
async function shutdown(
  workers: Array<{ close: () => Promise<void>; name: string }>,
): Promise<void> {
  console.log('\n[Worker] ⏳ Graceful shutdown dimulai...');

  await Promise.allSettled(
    workers.map(async (w) => {
      await w.close();
      console.log(`[Worker] ✅ ${w.name} berhenti`);
    }),
  );

  console.log('[Worker] ✅ Semua workers berhenti. Bye!');
  process.exit(0);
}

// ── Main ───────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('===========================================');
  console.log('  SmartStock — Background Worker Process  ');
  console.log('===========================================\n');

  // Cek env vars
  if (!process.env.UPSTASH_REDIS_URL && !process.env.UPSTASH_REDIS_REST_URL) {
    console.error('❌ UPSTASH_REDIS_URL tidak diset. Worker tidak bisa berjalan.');
    process.exit(1);
  }

  // Start semua workers
  const notificationWorker = createNotificationWorker();
  const stockSyncWorker = createStockSyncWorker();

  const workers = [notificationWorker, stockSyncWorker];

  console.log(`✅ ${workers.length} workers aktif:`);
  workers.forEach((w) => console.log(`   - ${w.name}`));
  console.log('\n⏳ Menunggu jobs... (Ctrl+C untuk berhenti)\n');

  // Handle graceful shutdown
  process.on('SIGTERM', () => shutdown(workers));
  process.on('SIGINT',  () => shutdown(workers));

  // Handle uncaught errors
  process.on('uncaughtException', (err) => {
    console.error('[Worker] ❌ Uncaught exception:', err);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[Worker] ❌ Unhandled rejection:', reason);
  });
}

main().catch((err) => {
  console.error('[Worker] ❌ Fatal error:', err);
  process.exit(1);
});
