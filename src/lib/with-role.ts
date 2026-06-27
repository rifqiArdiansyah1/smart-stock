/**
 * SmartStock — Route Protection Middleware Helpers
 *
 * Menyediakan dua cara proteksi API Route:
 *
 * 1. `withRole(allowedRoles, handler)` — HOF berbasis daftar role.
 *    Digunakan ketika endpoint memerlukan satu atau lebih role tertentu.
 *
 * 2. `withPermission(permission, handler)` — HOF berbasis aksi/permission.
 *    Digunakan ketika endpoint dikaitkan dengan aksi spesifik dari matriks permission.
 *
 * Keduanya akan mengembalikan:
 *  - 401 Unauthorized → jika tidak ada session / token tidak valid
 *  - 403 Forbidden    → jika role user tidak memiliki akses
 *
 * @example
 * // Hanya OWNER dan ADMIN yang bisa POST produk
 * export const POST = withRole([ROLES.OWNER, ROLES.ADMIN], async (req) => {
 *   ...
 * });
 *
 * // Menggunakan permission matrix
 * export const POST = withPermission(PERMISSIONS.MANAGE_PRODUCTS, async (req) => {
 *   ...
 * });
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { type Role, type Permission, isAllowedRole, hasPermission } from './rbac';

// ── Types ─────────────────────────────────────────────────────

type RouteContext = {
  params?: Record<string, string | string[]>;
};

type RouteHandler = (
  req: NextRequest,
  ctx: RouteContext,
) => Promise<NextResponse | Response>;

// ══════════════════════════════════════════════════════════════
// withRole — Proteksi berdasarkan daftar Role
// ══════════════════════════════════════════════════════════════

/**
 * Higher-order function yang melindungi API Route berdasarkan daftar role.
 * Jika user tidak memiliki salah satu role yang diizinkan, mengembalikan 403.
 *
 * @param allowedRoles - Daftar role yang boleh mengakses endpoint ini.
 * @param handler      - API Route handler asli.
 */
export function withRole(allowedRoles: Role[], handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, ctx: RouteContext) => {
    // 1. Ambil session dari NextAuth
    const session = await auth();

    // 2. Cek apakah user sudah login
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Anda harus login untuk mengakses endpoint ini.' },
        { status: 401 },
      );
    }

    const userRole = (session.user as { role?: string }).role;

    // 3. Cek apakah role user ada dalam daftar yang diizinkan
    if (!userRole || !isAllowedRole(userRole, allowedRoles)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: `Role '${userRole ?? 'unknown'}' tidak memiliki akses ke endpoint ini.`,
          requiredRoles: allowedRoles,
        },
        { status: 403 },
      );
    }

    // 4. Role valid — teruskan ke handler
    return handler(req, ctx);
  };
}

// ══════════════════════════════════════════════════════════════
// withPermission — Proteksi berdasarkan Permission Matrix
// ══════════════════════════════════════════════════════════════

/**
 * Higher-order function yang melindungi API Route berdasarkan matriks permission.
 * Gunakan ini ketika ingin mengaitkan proteksi dengan aksi spesifik yang sudah didefinisikan.
 *
 * @param permission - Aksi yang ingin dilindungi (dari PERMISSIONS constant).
 * @param handler    - API Route handler asli.
 */
export function withPermission(permission: Permission, handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, ctx: RouteContext) => {
    // 1. Ambil session dari NextAuth
    const session = await auth();

    // 2. Cek apakah user sudah login
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Anda harus login untuk mengakses endpoint ini.' },
        { status: 401 },
      );
    }

    const userRole = (session.user as { role?: string }).role;

    // 3. Cek permission via matriks
    if (!userRole || !hasPermission(permission, userRole as Role)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: `Role '${userRole ?? 'unknown'}' tidak memiliki permission '${permission}'.`,
          permission,
        },
        { status: 403 },
      );
    }

    // 4. Permission valid — teruskan ke handler
    return handler(req, ctx);
  };
}

// ══════════════════════════════════════════════════════════════
// getSessionOrUnauthorized — Utilitas untuk Server Components
// ══════════════════════════════════════════════════════════════

/**
 * Ambil session dari NextAuth. Jika tidak ada, kembalikan response 401.
 * Berguna untuk dipakai secara langsung di dalam handler tanpa HOF.
 *
 * @returns { session } jika login, atau { error: NextResponse } jika belum.
 *
 * @example
 * const result = await getSessionOrUnauthorized();
 * if ('error' in result) return result.error;
 * const { session } = result;
 */
export async function getSessionOrUnauthorized() {
  const session = await auth();
  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized', message: 'Anda harus login.' },
        { status: 401 },
      ),
    };
  }
  return { session };
}
