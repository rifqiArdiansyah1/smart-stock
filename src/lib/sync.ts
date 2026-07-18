/**
 * SmartStock — Sync Manager
 *
 * Mengelola sinkronisasi antrian offline (opname_queue) ke server,
 * dan sinkronisasi produk dari server ke products_cache.
 *
 * Strategi konflik: last-write-wins per item (berdasarkan scannedAt timestamp).
 * Jika server sudah punya data lebih baru, item lokal diabaikan.
 */

import {
  getPendingItems,
  updateQueueItemStatus,
  removeQueueItem,
  cacheProducts,
  clearProductsCache,
  CachedProduct,
} from './offline-db';

// ── Sync opname_queue → Server ─────────────────────────────────────────────────

export interface SyncResult {
  synced: number;
  failed: number;
  skipped: number;
}

/**
 * Flush semua item PENDING/FAILED dari opname_queue ke server.
 * Dipanggil saat koneksi kembali online atau manual trigger.
 */
export async function flushOpnameQueue(): Promise<SyncResult> {
  const pendingItems = await getPendingItems();

  if (pendingItems.length === 0) {
    return { synced: 0, failed: 0, skipped: 0 };
  }

  let synced = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of pendingItems) {
    try {
      // Mark sebagai SYNCING
      await updateQueueItemStatus(item.localId, 'SYNCING');

      const res = await fetch(`/api/opname/${item.sessionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          physicalQty: item.physicalQty,
          scannedAt: new Date(item.scannedAt).toISOString(),
          // Kirim timestamp untuk last-write-wins conflict resolution
          clientTimestamp: item.scannedAt,
        }),
      });

      if (res.ok) {
        // Berhasil: hapus dari queue
        await removeQueueItem(item.localId);
        synced++;
      } else if (res.status === 409) {
        // Konflik: server punya data lebih baru → skip (last-write-wins)
        await removeQueueItem(item.localId);
        skipped++;
        console.warn(`[sync] Conflict skipped: ${item.localId} (server data is newer)`);
      } else if (res.status === 404) {
        // Sesi tidak ditemukan → tidak bisa sync, hapus dari queue
        await removeQueueItem(item.localId);
        skipped++;
        console.warn(`[sync] Session not found: ${item.sessionId}, dropping item`);
      } else {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
    } catch (err: any) {
      await updateQueueItemStatus(item.localId, 'FAILED', err.message);
      failed++;
      console.error(`[sync] Failed to sync item ${item.localId}:`, err.message);
    }
  }

  console.log(`[sync] Flush complete: ${synced} synced, ${failed} failed, ${skipped} skipped`);
  return { synced, failed, skipped };
}

// ── Sync products_cache ← Server ──────────────────────────────────────────────

/**
 * Fetch daftar produk aktif dari server dan simpan ke IndexedDB.
 * Dipanggil saat app pertama kali online atau manual refresh.
 */
export async function syncProductsCache(): Promise<number> {
  try {
    const res = await fetch('/api/products/cache');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const products: CachedProduct[] = await res.json();
    await cacheProducts(products);
    console.log(`[sync] Product cache updated: ${products.length} products`);
    return products.length;
  } catch (err: any) {
    console.error('[sync] Failed to sync products cache:', err.message);
    return 0;
  }
}

/**
 * Hapus seluruh product cache dan refresh dari server.
 */
export async function refreshProductsCache(): Promise<number> {
  await clearProductsCache();
  return syncProductsCache();
}
