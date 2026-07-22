/**
 * SmartStock — Rate Limiter (Sliding Window via Redis)
 *
 * Menggunakan Upstash Redis untuk menyimpan request count per IP.
 * Strategi: sliding window dengan TTL = window duration.
 *
 * Penggunaan:
 *   const result = await rateLimit(ip, 'login', { limit: 5, windowSecs: 60 });
 *   if (!result.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 */

import { redis } from './redis';

export interface RateLimitOptions {
  /** Jumlah request maksimal dalam window */
  limit: number;
  /** Durasi window dalam detik */
  windowSecs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Berapa request yang tersisa dalam window ini */
  remaining: number;
  /** Unix timestamp (ms) kapan window reset */
  resetAt: number;
}

/**
 * Periksa dan catat satu request untuk identifier tertentu.
 *
 * @param identifier - Biasanya IP address klien
 * @param action     - Nama aksi (digunakan sebagai prefix key Redis)
 * @param options    - Limit dan window duration
 */
export async function rateLimit(
  identifier: string,
  action: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { limit, windowSecs } = options;
  const key = `rl:${action}:${identifier}`;
  const now = Date.now();
  const resetAt = now + windowSecs * 1000;

  try {
    // INCR + EXPIRE dalam satu pipeline untuk atomicity
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, windowSecs, 'NX'); // hanya set TTL jika belum ada
    const results = await pipeline.exec();

    const currentCount = ((results?.[0] as unknown) as number) ?? 1;
    const remaining = Math.max(0, limit - currentCount);
    const allowed = currentCount <= limit;

    return { allowed, remaining, resetAt };
  } catch (err: any) {
    // Jika Redis tidak tersedia, izinkan request (fail open)
    console.warn(`[rate-limit] Redis error, failing open: ${err.message}`);
    return { allowed: true, remaining: limit, resetAt };
  }
}

/**
 * Helper: extract IP dari Next.js request (mendukung berbagai header proxy)
 */
export function getClientIp(req: Request): string {
  const headers = new Headers((req as any).headers);
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') || // Cloudflare
    '127.0.0.1'
  );
}
