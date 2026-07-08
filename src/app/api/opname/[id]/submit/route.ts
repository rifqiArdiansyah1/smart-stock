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

    // Ambil data StockLevel riil dari server untuk mencegah manipulasi
    const realStockLevels = await db.stockLevel.findMany({
      where: { locationId: opnameSession.locationId },
    });

    const stockMap = new Map();
    for (const st of realStockLevels) {
      stockMap.set(st.productId, st.quantity);
    }

    let hasDifference = false;
    const preparedItems = items.map((item: any) => {
      // Ambil systemQty dari database (jika belum ada, berarti 0)
      const systemQty = stockMap.get(item.productId) || 0;
      const physicalQty = typeof item.physicalQty === 'number' ? item.physicalQty : systemQty;
      const difference = physicalQty - systemQty;
      
      if (difference !== 0) {
        hasDifference = true;
      }

      return {
        sessionId: id,
        productId: item.productId,
        systemQty: systemQty,
        physicalQty: physicalQty,
        difference: difference,
        notes: item.notes || null,
      };
    });

    // Jika tidak ada selisih sama sekali, otomatis APPROVED
    const nextStatus = hasDifference ? 'PENDING_APPROVAL' : 'APPROVED';
    const approvedAt = hasDifference ? null : new Date();

    // Use transaction to insert items and update session status
    await db.$transaction(async (tx) => {
      // Create all items
      if (preparedItems.length > 0) {
        await tx.stockOpnameItem.createMany({
          data: preparedItems,
        });
      }

      // Update session
      await tx.stockOpnameSession.update({
        where: { id },
        data: {
          status: nextStatus,
          submittedAt: new Date(),
          approvedAt: approvedAt,
          // If auto-approved, mark system as approver or null (we use null for auto logic, or we can leave it empty)
        },
      });
    });

    return NextResponse.json({ success: true, status: nextStatus });
  } catch (err: any) {
    if (err.code === 'P2002') {
        return NextResponse.json({ error: 'Terdapat produk ganda dalam sesi opname ini.' }, { status: 400 });
    }
    console.error('[POST /api/opname/[id]/submit]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
