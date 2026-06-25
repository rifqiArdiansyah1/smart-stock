/**
 * SmartStock — Redis Client (Upstash)
 *
 * Singleton Redis client menggunakan Upstash Redis REST API.
 * Upstash dipilih karena:
 * - Serverless-friendly (billing per request, bukan per waktu)
 * - Compatible dengan Vercel Edge/Serverless Functions
 * - Tidak butuh koneksi persisten seperti Redis biasa
 *
 * Penggunaan:
 *   import { redis } from '@/lib/redis';
 *   await redis.set('key', 'value', { ex: 60 }); // TTL 60 detik
 *   const val = await redis.get('key');
 *
 * @see https://upstash.com/docs/redis/sdks/ts/overview
 */

import { Redis } from '@upstash/redis';

// ── Singleton instance ────────────────────────────────────────
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      '[SmartStock/Redis] UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN ' +
        'harus diset di environment variables. ' +
        'Lihat .env.example untuk format yang benar.',
    );
  }

  return new Redis({ url, token });
}

export const redis: Redis =
  globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// ── Helper functions ──────────────────────────────────────────

/**
 * Set value dengan TTL (detik). Shorthand untuk redis.set dengan ex.
 */
export async function setWithTTL(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
}

/**
 * Get value dan parse JSON. Return null jika tidak ada.
 */
export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await redis.get<string>(key);
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? (JSON.parse(raw) as T) : (raw as T);
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
