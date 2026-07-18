/**
 * SmartStock — IndexedDB Schema & Client
 *
 * Mendefinisikan dua object store:
 * 1. products_cache  — Snapshot produk aktif untuk lookup barcode offline
 * 2. opname_queue    — Antrian item opname yang belum tersinkronisasi ke server
 *
 * Digunakan oleh:
 * - OpnameWorkspace  → menulis ke opname_queue
 * - useOfflineSync   → membaca & flush opname_queue ke server
 * - ProductSync      → menulis ke products_cache saat online
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// ── Schema Types ───────────────────────────────────────────────────────────────

/** Satu produk di cache lokal untuk keperluan lookup barcode offline */
export interface CachedProduct {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  unit: string;
  price: number | null;
  minStock: number;
  category: string | null;
  isActive: boolean;
  cachedAt: number; // Unix timestamp ms
}

/** Status sinkronisasi satu item opname di antrian */
export type SyncStatus = 'PENDING' | 'SYNCING' | 'FAILED' | 'DONE';

/** Satu baris input opname yang disimpan lokal sebelum dikirim ke server */
export interface OpnameQueueItem {
  /** UUID lokal (sementara, bukan dari server) */
  localId: string;
  /** ID sesi opname (dari server setelah sesi dibuat) */
  sessionId: string;
  productId: string;
  physicalQty: number;
  scannedAt: number; // Unix timestamp ms
  syncStatus: SyncStatus;
  /** Jumlah percobaan sync yang sudah dilakukan */
  retryCount: number;
  /** Pesan error terakhir jika FAILED */
  lastError: string | null;
  updatedAt: number; // Unix timestamp ms
}

// ── Database Schema ────────────────────────────────────────────────────────────

interface SmartStockDB extends DBSchema {
  products_cache: {
    key: string; // productId
    value: CachedProduct;
    indexes: {
      by_barcode: string;
      by_sku: string;
    };
  };
  opname_queue: {
    key: string; // localId
    value: OpnameQueueItem;
    indexes: {
      by_session: string;
      by_status: string;
    };
  };
}

// ── Database Singleton ─────────────────────────────────────────────────────────

const DB_NAME = 'smartstock-offline';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SmartStockDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<SmartStockDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SmartStockDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // products_cache store
        if (!db.objectStoreNames.contains('products_cache')) {
          const productStore = db.createObjectStore('products_cache', { keyPath: 'id' });
          productStore.createIndex('by_barcode', 'barcode');
          productStore.createIndex('by_sku', 'sku');
        }

        // opname_queue store
        if (!db.objectStoreNames.contains('opname_queue')) {
          const queueStore = db.createObjectStore('opname_queue', { keyPath: 'localId' });
          queueStore.createIndex('by_session', 'sessionId');
          queueStore.createIndex('by_status', 'syncStatus');
        }
      },
      blocked() {
        console.warn('[SmartStock/IDB] Database upgrade blocked by an older connection');
      },
      blocking() {
        dbPromise = null; // Reset so next call gets a fresh DB
      },
    });
  }
  return dbPromise;
}

// ── products_cache Operations ──────────────────────────────────────────────────

/** Simpan / update daftar produk ke cache lokal (upsert) */
export async function cacheProducts(products: CachedProduct[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('products_cache', 'readwrite');
  const now = Date.now();
  await Promise.all([
    ...products.map((p) => tx.store.put({ ...p, cachedAt: now })),
    tx.done,
  ]);
}

/** Cari produk berdasarkan barcode (untuk scan offline) */
export async function findProductByBarcode(barcode: string): Promise<CachedProduct | undefined> {
  const db = await getDB();
  return db.getFromIndex('products_cache', 'by_barcode', barcode);
}

/** Cari produk berdasarkan SKU */
export async function findProductBySku(sku: string): Promise<CachedProduct | undefined> {
  const db = await getDB();
  return db.getFromIndex('products_cache', 'by_sku', sku);
}

/** Ambil semua produk yang sudah di-cache */
export async function getAllCachedProducts(): Promise<CachedProduct[]> {
  const db = await getDB();
  return db.getAll('products_cache');
}

/** Hapus seluruh cache produk */
export async function clearProductsCache(): Promise<void> {
  const db = await getDB();
  await db.clear('products_cache');
}

// ── opname_queue Operations ────────────────────────────────────────────────────

/** Tambahkan atau update satu item di antrian opname */
export async function enqueueOpnameItem(item: Omit<OpnameQueueItem, 'syncStatus' | 'retryCount' | 'lastError' | 'updatedAt'>): Promise<void> {
  const db = await getDB();
  await db.put('opname_queue', {
    ...item,
    syncStatus: 'PENDING',
    retryCount: 0,
    lastError: null,
    updatedAt: Date.now(),
  });
}

/** Ambil semua item dalam antrian untuk satu sesi opname */
export async function getQueueBySession(sessionId: string): Promise<OpnameQueueItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('opname_queue', 'by_session', sessionId);
}

/** Ambil semua item yang belum tersinkronisasi (PENDING atau FAILED) */
export async function getPendingItems(): Promise<OpnameQueueItem[]> {
  const db = await getDB();
  const pending = await db.getAllFromIndex('opname_queue', 'by_status', 'PENDING');
  const failed = await db.getAllFromIndex('opname_queue', 'by_status', 'FAILED');
  // Hanya retry item yang gagal maksimal 3 kali
  return [...pending, ...failed.filter((i) => i.retryCount < 3)];
}

/** Update status sinkronisasi satu item */
export async function updateQueueItemStatus(
  localId: string,
  syncStatus: SyncStatus,
  errorMsg?: string
): Promise<void> {
  const db = await getDB();
  const item = await db.get('opname_queue', localId);
  if (!item) return;
  await db.put('opname_queue', {
    ...item,
    syncStatus,
    retryCount: syncStatus === 'FAILED' ? item.retryCount + 1 : item.retryCount,
    lastError: errorMsg ?? null,
    updatedAt: Date.now(),
  });
}

/** Hapus item yang sudah berhasil tersinkronisasi */
export async function removeQueueItem(localId: string): Promise<void> {
  const db = await getDB();
  await db.delete('opname_queue', localId);
}

/** Hapus seluruh antrian untuk satu sesi (setelah sesi opname selesai disubmit) */
export async function clearQueueBySession(sessionId: string): Promise<void> {
  const db = await getDB();
  const items = await db.getAllFromIndex('opname_queue', 'by_session', sessionId);
  const tx = db.transaction('opname_queue', 'readwrite');
  await Promise.all([
    ...items.map((i) => tx.store.delete(i.localId)),
    tx.done,
  ]);
}
