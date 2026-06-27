/**
 * API Route: /api/audit-log
 *
 * GET → Hanya OWNER yang dapat melihat audit log.
 *
 * Contoh demonstrasi penggunaan RBAC via withRole().
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/with-role';
import { ROLES } from '@/lib/rbac';
import { db } from '@/lib/db';

// ── GET /api/audit-log ────────────────────────────────────────
// Hanya OWNER (role paling tinggi)
export const GET = withRole(
  [ROLES.OWNER],
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = Number(searchParams.get('page') ?? '1');
      const limit = Number(searchParams.get('limit') ?? '50');
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        db.stockMovement.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            quantityChange: true,
            quantityBefore: true,
            quantityAfter: true,
            notes: true,
            createdAt: true,
            product: { select: { name: true, sku: true } },
            location: { select: { name: true } },
            actor: { select: { name: true, email: true, role: true } },
          },
        }),
        db.stockMovement.count(),
      ]);

      return NextResponse.json({
        data: logs,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      console.error('[GET /api/audit-log]', err);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
);
