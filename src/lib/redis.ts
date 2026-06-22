/**
 * SmartStock — Redis Client (Upstash)
 *
 * Placeholder untuk Redis client.
 * Akan diimplementasikan di ISSUE-004 setelah install:
 *   npm install @upstash/redis bullmq
 */

// TODO: Implement after ISSUE-004
// import { Redis } from '@upstash/redis';
//
// export const redis = new Redis({
//   url: process.env.UPSTASH_REDIS_REST_URL!,
//   token: process.env.UPSTASH_REDIS_REST_TOKEN!,
// });

export const redis = null as unknown as {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown, opts?: { ex?: number }) => Promise<void>;
  del: (key: string) => Promise<void>;
};

export default redis;
