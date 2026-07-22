/**
 * SmartStock — Next.js Middleware
 *
 * Menggabungkan:
 * 1. NextAuth session guard (proteksi halaman)
 * 2. HTTP Security Headers (CSP, X-Frame-Options, dll)
 * 3. Rate Limiting pada endpoint sensitif (login, presign, dll)
 * 4. CORS guard untuk API routes
 */

import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextRequest, NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

// ── Allowed Origins untuk CORS ────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim());

// ── Rate Limit Config (in-memory sliding window — edge compatible) ─────────────
// Catatan: Untuk production multi-instance, gunakan Upstash Redis.
// Middleware Edge Runtime tidak bisa import ioredis, jadi pakai in-memory Map.
// Untuk rate limit yang persisten, gunakan middleware route-level (lihat rate-limit.ts).
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function edgeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  entry.count++;
  const allowed = entry.count <= limit;
  return { allowed, remaining: Math.max(0, limit - entry.count) };
}

// ── Security Headers ──────────────────────────────────────────────────────────
function addSecurityHeaders(response: NextResponse, isApi: boolean): NextResponse {
  // Content Security Policy — hanya untuk halaman HTML (bukan API)
  if (!isApi) {
    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval diperlukan Next.js dev
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        `img-src 'self' data: blob: ${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''}`,
        `connect-src 'self' ${process.env.NEXT_PUBLIC_WS_URL || ''} https://vitals.vercel-insights.com`,
        "frame-ancestors 'none'",
        "form-action 'self'",
        "base-uri 'self'",
      ].join('; ')
    );
  }

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  return response;
}

// ── CORS Headers ──────────────────────────────────────────────────────────────
function addCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  const allowed =
    origin && ALLOWED_ORIGINS.some((o) => o === origin || o === '*');

  if (allowed) {
    response.headers.set('Access-Control-Allow-Origin', origin!);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );
    response.headers.set('Access-Control-Max-Age', '86400');
    response.headers.set('Vary', 'Origin');
  }

  return response;
}

// ── Main Middleware ───────────────────────────────────────────────────────────
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get('origin');
  const isApiRoute = pathname.startsWith('/api/');
  const isAuthRoute = pathname.startsWith('/api/auth/');

  // Handle CORS preflight
  if (req.method === 'OPTIONS' && isApiRoute) {
    const preflightResponse = new NextResponse(null, { status: 204 });
    return addCorsHeaders(preflightResponse, origin);
  }

  // ── Rate Limiting pada endpoint sensitif ──────────────────────────────────
  const sensitiveRoutes: { pattern: RegExp; limit: number; windowMs: number }[] = [
    { pattern: /^\/api\/auth\/signin/, limit: 5, windowMs: 60_000 },    // Login: 5/menit
    { pattern: /^\/api\/upload\/presign/, limit: 20, windowMs: 60_000 }, // Upload: 20/menit
    { pattern: /^\/api\/auth\/callback/, limit: 10, windowMs: 60_000 },  // Callback: 10/menit
  ];

  for (const route of sensitiveRoutes) {
    if (route.pattern.test(pathname)) {
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        req.headers.get('cf-connecting-ip') ||
        '127.0.0.1';

      const rlKey = `${pathname}:${ip}`;
      const { allowed, remaining } = edgeRateLimit(rlKey, route.limit, route.windowMs);

      if (!allowed) {
        const tooManyResponse = NextResponse.json(
          { error: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' },
          { status: 429 }
        );
        tooManyResponse.headers.set('Retry-After', '60');
        tooManyResponse.headers.set('X-RateLimit-Limit', String(route.limit));
        tooManyResponse.headers.set('X-RateLimit-Remaining', '0');
        return addSecurityHeaders(tooManyResponse, isApiRoute);
      }
    }
  }

  // ── NextAuth Session Guard (untuk halaman, bukan API) ─────────────────────
  // Jalankan auth guard hanya untuk non-API routes
  if (!isApiRoute) {
    const authResponse = await (auth as any)(req);
    if (authResponse) {
      return addSecurityHeaders(authResponse, false);
    }
  }

  // ── Pass through dengan security headers ──────────────────────────────────
  const response = NextResponse.next();
  addSecurityHeaders(response, isApiRoute);
  if (isApiRoute) addCorsHeaders(response, origin);

  return response;
}

export const config = {
  matcher: [
    // Semua route kecuali file statis
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|apple-touch-icon.png|.*\\.png$|.*\\.svg$).*)',
  ],
};
