/**
 * SmartStock — System Health Check API
 *
 * GET /api/health
 *
 * Mengecek status semua sistem:
 * - Database (PostgreSQL via Prisma)
 * - Redis (Upstash)
 * - Queue (BullMQ)
 *
 * Berguna untuk:
 * - Monitoring & uptime checks
 * - Load balancer health probe
 * - Debugging masalah koneksi
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // BullMQ tidak bisa di Edge runtime

interface HealthStatus {
  status: 'ok' | 'error' | 'degraded';
  latency?: number;
  error?: string;
}

interface HealthCheckResponse {
  status: 'ok' | 'error' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: HealthStatus;
    redis: HealthStatus;
    queues?: HealthStatus & { details?: unknown };
  };
}

async function checkDatabase(): Promise<HealthStatus> {
  const start = Date.now();
  try {
    const { db } = await import('@/lib/db');
    await db.$queryRaw`SELECT 1`;
    return { status: 'ok', latency: Date.now() - start };
  } catch (err) {
    return {
      status: 'error',
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

async function checkRedis(): Promise<HealthStatus> {
  const start = Date.now();
  try {
    const { redis } = await import('@/lib/redis');
    const pong = await redis.ping();
    if (pong !== 'PONG') throw new Error(`Unexpected ping response: ${pong}`);
    return { status: 'ok', latency: Date.now() - start };
  } catch (err) {
    return {
      status: 'error',
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

async function checkQueues(): Promise<HealthStatus & { details?: unknown }> {
  try {
    const { getQueuesHealth } = await import('@/lib/queue');
    const health = await getQueuesHealth();
    return { status: 'ok', details: health };
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function GET() {
  const [dbStatus, redisStatus, queueStatus] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkQueues(),
  ]);

  const allOk =
    dbStatus.status === 'ok' &&
    redisStatus.status === 'ok';

  const anyError =
    dbStatus.status === 'error' ||
    redisStatus.status === 'error';

  const overallStatus = anyError ? 'error' : allOk ? 'ok' : 'degraded';

  const response: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.1.0',
    uptime: Math.floor(process.uptime()),
    services: {
      database: dbStatus,
      redis: redisStatus,
      queues: queueStatus,
    },
  };

  return NextResponse.json(response, {
    status: overallStatus === 'ok' ? 200 : overallStatus === 'degraded' ? 207 : 503,
  });
}
