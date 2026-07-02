/**
 * API Route: PATCH /api/locations/[id]  — Edit lokasi (OWNER & ADMIN)
 *            DELETE /api/locations/[id] — Soft delete lokasi (OWNER & ADMIN)
 */
import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/with-role';
import { ROLES } from '@/lib/rbac';
import { db } from '@/lib/db';

// ── PATCH /api/locations/[id] ────────────────────────────────
export const PATCH = withRole(
  [ROLES.OWNER, ROLES.ADMIN],
  async (req: NextRequest, ctx: any) => {
    try {
      const { id } = await ctx.params;
      const body = await req.json();
      const { name, type, description, isActive } = body;

      const data: Record<string, unknown> = {};
      if (name !== undefined) data.name = String(name).trim();
      if (type !== undefined) data.type = type;
      if (description !== undefined) data.description = description ? String(description).trim() : null;
      if (isActive !== undefined) data.isActive = Boolean(isActive);

      const location = await db.location.update({
        where: { id },
        data,
      });

      return NextResponse.json({ data: location });
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      }
      console.error('[PATCH /api/locations/[id]]', err);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
);

// ── DELETE /api/locations/[id] — Soft Delete ─────────────────
export const DELETE = withRole(
  [ROLES.OWNER, ROLES.ADMIN],
  async (_req: NextRequest, ctx: any) => {
    try {
      const { id } = await ctx.params;

      const location = await db.location.update({
        where: { id },
        data: { isActive: false },
        select: { id: true, name: true, isActive: true },
      });

      return NextResponse.json({
        data: location,
        message: `Lokasi '${location.name}' telah dinonaktifkan.`,
      });
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      }
      console.error('[DELETE /api/locations/[id]]', err);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
);
