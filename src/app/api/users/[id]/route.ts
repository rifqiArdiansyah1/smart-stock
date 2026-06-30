/**
 * API Route: PATCH /api/users/[id] — Edit role atau status user
 *
 * Hanya OWNER yang dapat mengakses endpoint ini.
 */
import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/with-role';
import { ROLES } from '@/lib/rbac';
import { db } from '@/lib/db';

type RouteContext = { params: Promise<{ id: string }> };

// ── PATCH /api/users/[id] ────────────────────────────────────
export const PATCH = withRole(
  [ROLES.OWNER],
  async (req: NextRequest, ctx: any) => {
    try {
      const { id } = await ctx.params;
      const body = await req.json();
      const { role, isActive } = body;

      // Setidaknya satu field harus diupdate
      if (role === undefined && isActive === undefined) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'Harus menyertakan field role atau isActive.' },
          { status: 400 },
        );
      }

      // Validasi role jika ada
      if (role !== undefined) {
        const validRoles = Object.values(ROLES) as string[];
        if (!validRoles.includes(role)) {
          return NextResponse.json(
            { error: 'Bad Request', message: `Role '${role}' tidak valid.` },
            { status: 400 },
          );
        }
      }

      const data: Record<string, unknown> = {};
      if (role !== undefined) data.role = role;
      if (isActive !== undefined) data.isActive = Boolean(isActive);

      const user = await db.user.update({
        where: { id },
        data,
        select: {
          id: true, name: true, email: true, role: true, isActive: true, updatedAt: true,
        },
      });

      return NextResponse.json({ data: user });
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return NextResponse.json(
          { error: 'Not Found', message: 'User tidak ditemukan.' },
          { status: 404 },
        );
      }
      console.error('[PATCH /api/users/[id]]', err);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
);
