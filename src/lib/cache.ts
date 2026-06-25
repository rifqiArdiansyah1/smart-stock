/**
 * SmartStock — Redis Cache Layer
 *
 * Helper untuk caching pattern yang sering dipakai:
 * - Cache-aside pattern untuk stock levels
 * - Deduplication lock untuk low-stock alerts
 * - Opname session lock (cegah 2 sesi di lokasi yang sama)
 * - Rate limiter berbasis Redis untuk API protection
 */

import { redis } from '@/lib/redis';
import { REDIS_KEYS, LOW_STOCK_ALERT_TTL_HOURS } from '@/types/constants';

// ═══════════════════════════════════════════════════════════════
// STOCK LEVEL CACHE
// ═══════════════════════════════════════════════════════════════

const STOCK_CACHE_TTL = 300; // 5 menit

/**
 * Ambil stok dari cache Redis. Return null jika tidak ada.
 */
export async function getCachedStock(
  productId: string,
  locationId: string,
): Promise<number | null> {
  const key = REDIS_KEYS.STOCK_LEVEL(productId, locationId);
  const cached = await redis.get<number>(key);
  return cached ?? null;
}

/**
 * Simpan stok ke cache Redis dengan TTL 5 menit.
 */
export async function setCachedStock(
  productId: string,
  locationId: string,
  quantity: number,
): Promise<void> {
  const key = REDIS_KEYS.STOCK_LEVEL(productId, locationId);
  await redis.set(key, quantity, { ex: STOCK_CACHE_TTL });
}

/**
 * Invalidate cache stok setelah ada stock movement.
 */
export async function invalidateStockCache(
  productId: string,
  locationId: string,
): Promise<void> {
  const key = REDIS_KEYS.STOCK_LEVEL(productId, locationId);
  await redis.del(key);
}

// ═══════════════════════════════════════════════════════════════
// LOW-STOCK ALERT DEDUPLICATION
// ═══════════════════════════════════════════════════════════════

/**
 * Cek apakah low-stock alert sudah dikirim dalam window 24 jam.
 * Mencegah spam notifikasi yang sama berulang-ulang.
 */
export async function isLowStockAlertSent(productId: string): Promise<boolean> {
  const key = REDIS_KEYS.LOW_STOCK_ALERT(productId);
  const val = await redis.get(key);
  return val !== null;
}

/**
 * Mark bahwa low-stock alert sudah dikirim.
 * TTL = LOW_STOCK_ALERT_TTL_HOURS (24 jam by default).
 */
export async function markLowStockAlertSent(productId: string): Promise<void> {
  const key = REDIS_KEYS.LOW_STOCK_ALERT(productId);
  const ttlSeconds = LOW_STOCK_ALERT_TTL_HOURS * 3600;
  await redis.set(key, '1', { ex: ttlSeconds });
}

/**
 * Reset dedup flag (dipakai setelah restock — boleh alert lagi).
 */
export async function resetLowStockAlert(productId: string): Promise<void> {
  const key = REDIS_KEYS.LOW_STOCK_ALERT(productId);
  await redis.del(key);
}

// ═══════════════════════════════════════════════════════════════
// OPNAME SESSION LOCK
// ═══════════════════════════════════════════════════════════════

const OPNAME_LOCK_TTL = 8 * 3600; // 8 jam — durasi maksimal opname

/**
 * Kunci lokasi agar tidak bisa ada 2 sesi opname bersamaan.
 * Return true jika berhasil, false jika lokasi sudah dikunci.
 */
export async function acquireOpnameLock(
  locationId: string,
  sessionId: string,
): Promise<boolean> {
  const key = REDIS_KEYS.OPNAME_LOCK(locationId);
  // NX = only set if not exists, EX = TTL
  const result = await redis.set(key, sessionId, {
    nx: true,
    ex: OPNAME_LOCK_TTL,
  });
  return result === 'OK';
}

/**
 * Lepas lock opname (dipanggil saat sesi selesai/dicancel).
 */
export async function releaseOpnameLock(locationId: string): Promise<void> {
  const key = REDIS_KEYS.OPNAME_LOCK(locationId);
  await redis.del(key);
}

/**
 * Cek apakah lokasi sedang dalam sesi opname aktif.
 * Return session ID jika ada, null jika tidak.
 */
export async function getActiveOpnameSession(
  locationId: string,
): Promise<string | null> {
  const key = REDIS_KEYS.OPNAME_LOCK(locationId);
  return redis.get<string>(key);
}

// ═══════════════════════════════════════════════════════════════
// RATE LIMITER
// ═══════════════════════════════════════════════════════════════

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Rate limiter berbasis Redis sliding counter.
 * Cocok untuk melindungi API endpoints dari abuse.
 *
 * @param identifier - Unique key (misal: `api:login:${ip}`)
 * @param maxRequests - Maksimum request dalam window
 * @param windowSeconds - Ukuran window dalam detik
 */
export async function rateLimit(
  identifier: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;
  const count = await redis.incr(key);

  if (count === 1) {
    // Set TTL hanya saat counter baru dibuat
    await redis.expire(key, windowSeconds);
  }

  const ttl = await redis.ttl(key);
  const resetAt = new Date(Date.now() + ttl * 1000);

  if (count > maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt,
    };
  }

  return {
    success: true,
    remaining: maxRequests - count,
    resetAt,
  };
}

// ═══════════════════════════════════════════════════════════════
// USER SESSION CACHE
// ═══════════════════════════════════════════════════════════════

const SESSION_TTL = 24 * 3600; // 24 jam

export interface CachedUserSession {
  id: string;
  role: string;
  tenantId: string;
  name: string;
  email: string;
}

/**
 * Cache session user untuk menghindari query DB berulang.
 */
export async function cacheUserSession(
  userId: string,
  session: CachedUserSession,
): Promise<void> {
  const key = REDIS_KEYS.USER_SESSION(userId);
  await redis.set(key, JSON.stringify(session), { ex: SESSION_TTL });
}

/**
 * Ambil session user dari cache.
 */
export async function getCachedUserSession(
  userId: string,
): Promise<CachedUserSession | null> {
  const key = REDIS_KEYS.USER_SESSION(userId);
  const raw = await redis.get<string>(key);
  if (!raw) return null;
  try {
    return typeof raw === 'string'
      ? (JSON.parse(raw) as CachedUserSession)
      : (raw as CachedUserSession);
  } catch {
    return null;
  }
}

/**
 * Hapus cache session (saat logout atau role berubah).
 */
export async function invalidateUserSession(userId: string): Promise<void> {
  const key = REDIS_KEYS.USER_SESSION(userId);
  await redis.del(key);
}
