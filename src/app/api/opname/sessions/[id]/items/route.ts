/**
 * /api/opname/sessions/[id]/items — POST: simpan hasil scan satu item
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { productId, physicalQty } = await req.json();

  if (!productId || physicalQty === undefined) {
    return NextResponse.json({ error: 'productId dan physicalQty wajib diisi' }, { status: 400 });
  }

  try {
    // Ambil sesi untuk mendapatkan locationId
    const opnameSession = await db.stockOpnameSession.findUnique({
      where: { id },
      select: { locationId: true },
    });
    if (!opnameSession) return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 });

    // Ambil system qty dari stock_levels
    const stockLevel = await db.stockLevel.findFirst({
      where: { productId, locationId: opnameSession.locationId },
      select: { quantity: true },
    });
    const systemQty = stockLevel?.quantity ?? 0;
    const physical  = Number(physicalQty);
    const difference = physical - systemQty;

    // Upsert item
    const item = await db.stockOpnameItem.upsert({
      where:  { sessionId_productId: { sessionId: id, productId } },
      update: { physicalQty: physical, difference },
      create: { sessionId: id, productId, systemQty, physicalQty: physical, difference },
    });

    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/opname/sessions/[id]/items]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
