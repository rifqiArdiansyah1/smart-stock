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

  let userId = (session.user as any).id;
  if (!userId && session.user.email) {
    const dbUser = await db.user.findUnique({ where: { email: session.user.email } });
    if (dbUser) {
      userId = dbUser.id;
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'User ID is missing from session' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { locationId, items, cashGiven, changeGiven } = body as {
      locationId: string;
      items: { productId: string; quantity: number; price: number; name: string }[];
      cashGiven?: number;
      changeGiven?: number;
    };

    if (!locationId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Data transaksi tidak lengkap' }, { status: 400 });
    }

    // Validate quantity for each item
    for (const item of items) {
      if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        return NextResponse.json(
          { error: `Jumlah produk (${item.name || 'item'}) tidak valid` },
          { status: 400 }
        );
      }
    }

    const referenceId = randomUUID();
    const notesDetail = cashGiven != null
      ? `Penjualan kasir (Tunai: Rp ${cashGiven.toLocaleString('id-ID')}, Kembalian: Rp ${(changeGiven || 0).toLocaleString('id-ID')})`
      : `Penjualan kasir`;

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
            notes: notesDetail,
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
          { quantity: currentQty, productId: item.productId },
          { quantity: newQty, productId: item.productId, cashGiven, changeGiven },
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
