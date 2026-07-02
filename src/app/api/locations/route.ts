/**
 * API Route: GET /api/locations  — Daftar semua lokasi
 *            POST /api/locations — Tambah lokasi baru (OWNER & ADMIN only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/with-role';
import { ROLES } from '@/lib/rbac';
import { db } from '@/lib/db';
import { auth } from '@/auth';

// ── GET /api/locations ───────────────────────────────────────
// Semua user login bisa melihat daftar lokasi (untuk dropdown opname)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const showInactive = searchParams.get('showInactive') === 'true';
    const type = searchParams.get('type');

    const where: any = {};
    if (!showInactive) where.isActive = true;
    if (type) where.type = type;

    const locations = await db.location.findMany({
      where,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { stockLevels: true, opnameSessions: true },
        },
      },
    });

    return NextResponse.json({ data: locations, total: locations.length });
  } catch (err) {
    console.error('[GET /api/locations]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ── POST /api/locations ──────────────────────────────────────
// Hanya OWNER & ADMIN
export const POST = withRole(
  [ROLES.OWNER, ROLES.ADMIN],
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const { name, type, description } = body;

      if (!name || !type) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'Field name dan type wajib diisi.' },
          { status: 400 },
        );
      }

      const validTypes = ['GUDANG', 'RAK', 'AREA', 'TOKO'];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: 'Bad Request', message: `Type '${type}' tidak valid.` },
          { status: 400 },
        );
      }

      const location = await db.location.create({
        data: {
          name: name.trim(),
          type,
          description: description?.trim() || null,
        },
      });

      return NextResponse.json({ data: location }, { status: 201 });
    } catch (err) {
      console.error('[POST /api/locations]', err);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
);
