import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest, ctx: any) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await ctx.params;
    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items data' }, { status: 400 });
    }

    // Verify session is IN_PROGRESS
    const opnameSession = await db.stockOpnameSession.findUnique({
      where: { id },
    });

    if (!opnameSession) {
      return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 });
    }

    if (opnameSession.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Sesi ini tidak dapat disubmit lagi.' }, { status: 400 });
    }

    // Use transaction to insert items and update session status
    await db.$transaction(async (tx) => {
      // Create all items
      if (items.length > 0) {
        await tx.stockOpnameItem.createMany({
          data: items.map((item: any) => ({
            sessionId: id,
            productId: item.productId,
            systemQty: item.systemQty,
            physicalQty: item.physicalQty,
            difference: item.physicalQty - item.systemQty,
            notes: item.notes || null,
          })),
        });
      }

      // Update session
      await tx.stockOpnameSession.update({
        where: { id },
        data: {
          status: 'PENDING_APPROVAL',
          submittedAt: new Date(),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.code === 'P2002') {
        return NextResponse.json({ error: 'Terdapat produk ganda dalam sesi opname ini.' }, { status: 400 });
    }
    console.error('[POST /api/opname/[id]/submit]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
