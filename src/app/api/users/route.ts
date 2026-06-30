/**
 * API Route: GET /api/users — Daftar semua user
 *            POST /api/users — Tambah user baru
 *
 * Hanya OWNER yang dapat mengakses endpoint ini.
 */
import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/with-role';
import { ROLES } from '@/lib/rbac';
import { db } from '@/lib/db';
import * as bcrypt from 'bcryptjs';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

// ── GET /api/users ───────────────────────────────────────────
export const GET = withRole([ROLES.OWNER], async (_req: NextRequest) => {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ data: users, total: users.length });
  } catch (err) {
    console.error('[GET /api/users]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});

// ── POST /api/users ──────────────────────────────────────────
export const POST = withRole([ROLES.OWNER], async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Field name, email, password, dan role wajib diisi.' },
        { status: 400 },
      );
    }

    const validRoles = Object.values(ROLES) as string[];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Bad Request', message: `Role '${role}' tidak valid.` },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role,
        tenantId: TENANT_ID,
      },
      select: {
        id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
      },
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Conflict', message: 'Email sudah digunakan oleh user lain.' },
        { status: 409 },
      );
    }
    console.error('[POST /api/users]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
