/**
 * SmartStock — Redis Client
 *
 * Singleton Redis client menggunakan ioredis.
 * Mendukung koneksi standar ke server Redis lokal atau Upstash Redis (lewat ioredis-compatible endpoint).
 *
 * Penggunaan:
 *   import { redis } from '@/lib/redis';
 *   await redis.set('key', 'value', 'EX', 60); // TTL 60 detik
 *   const val = await redis.get('key');
 */

import Redis from 'ioredis';

// ── Singleton instance ────────────────────────────────────────
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_URL || 'redis://localhost:6379';
  return new Redis(url);
}

export const redis: Redis =
  globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// ── Helper functions ──────────────────────────────────────────

/**
 * Set value dengan TTL (detik).
 */
export async function setWithTTL(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

/**
 * Get value dan parse JSON. Return null jika tidak ada.
 */
export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

/**
 * Hapus satu atau lebih keys.
 */
export async function deleteKeys(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await redis.del(...keys);
}

/**
 * Cek apakah key ada di Redis.
 */
export async function exists(key: string): Promise<boolean> {
  const result = await redis.exists(key);
  return result === 1;
}

/**
 * Increment atomic counter. Berguna untuk rate limiting.
 */
export async function increment(key: string, ttlSeconds?: number): Promise<number> {
  const count = await redis.incr(key);
  if (ttlSeconds && count === 1) {
    await redis.expire(key, ttlSeconds);
  }
  return count;
}

export default redis;

