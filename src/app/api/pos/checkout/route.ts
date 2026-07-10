import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    const { locationId, items } = body as {
      locationId: string;
      items: { productId: string; quantity: number; price: number; name: string }[];
    };

    if (!locationId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
    }

    const referenceId = randomUUID();

    // Jalankan transaksi database
    await db.$transaction(async (tx) => {
      for (const item of items) {
        // Ambil stok saat ini
        const stockLevel = await tx.stockLevel.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: locationId,
            },
          },
        });

        const currentQty = stockLevel?.quantity || 0;

        if (currentQty < item.quantity) {
          throw new Error(`Stok tidak mencukupi untuk ${item.name}. Tersedia: ${currentQty}`);
        }

        const newQty = currentQty - item.quantity;

        // 1. Catat StockMovement (SALE)
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            locationId: locationId,
            actorId: userId,
            type: 'SALE',
            quantityChange: -item.quantity,
            quantityBefore: currentQty,
            quantityAfter: newQty,
            referenceId: referenceId,
            notes: `Penjualan kasir`,
          },
        });

        // 2. Update StockLevel
        await tx.stockLevel.update({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: locationId,
            },
          },
          data: {
            quantity: newQty,
          },
        });

        // 3. Log Audit
        await logAudit(
          userId,
          'CHECKOUT',
          'StockMovement',
          referenceId,
          { quantity: currentQty },
          { quantity: newQty },
          tx
        );
      }
    });

    return NextResponse.json({ success: true, referenceId });
  } catch (err: any) {
    console.error('[POST /api/pos/checkout]', err);
    return NextResponse.json(
      { error: err.message || 'Gagal memproses transaksi' },
      { status: 400 }
    );
  }
}
