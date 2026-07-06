import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('locationId');
    const status = searchParams.get('status');

    const where: any = {};
    if (locationId) where.locationId = locationId;
    if (status) where.status = status;

    const opnames = await db.stockOpnameSession.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      include: {
        location: { select: { name: true, type: true } },
        startedBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
        _count: { select: { items: true } }
      },
    });

    return NextResponse.json({ data: opnames });
  } catch (err) {
    console.error('[GET /api/opname]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  try {
    const { locationId } = await req.json();
    if (!locationId) return NextResponse.json({ error: 'Location ID required' }, { status: 400 });

    // Check for active sessions at this location
    const activeSession = await db.stockOpnameSession.findFirst({
      where: {
        locationId,
        status: { in: ['IN_PROGRESS', 'PENDING_APPROVAL'] },
      },
    });

    if (activeSession) {
      return NextResponse.json(
        { error: 'Lokasi ini sedang memiliki sesi opname yang aktif atau menunggu persetujuan.' },
        { status: 400 }
      );
    }

    const newSession = await db.stockOpnameSession.create({
      data: {
        locationId,
        startedById: userId,
        status: 'IN_PROGRESS',
      },
    });

    return NextResponse.json({ data: newSession }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/opname]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
