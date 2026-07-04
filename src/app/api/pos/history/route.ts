/**
 * GET /api/pos/history
 *
 * Riwayat transaksi penjualan — dikelompokkan per referenceId.
 * Hanya menampilkan StockMovement dengan type=SALE.
 *
 * Query params:
 *  - date     : filter tanggal (YYYY-MM-DD)
 *  - actorId  : filter per kasir
 *  - page, limit
 *
 * Guard: ADMIN, OWNER
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { ROLES } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  const allowedRoles = [ROLES.OWNER, ROLES.ADMIN];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date') ?? '';
  const actorId = searchParams.get('actorId') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Number(searchParams.get('limit') ?? '20'));

  try {
    const where: any = { type: 'SALE', referenceId: { not: null } };

    if (actorId) where.actorId = actorId;

    if (dateStr) {
      const start = new Date(dateStr);
      const end = new Date(dateStr);
      end.setDate(end.getDate() + 1);
      where.createdAt = { gte: start, lt: end };
    }

    // Ambil semua movements SALE
    const allMovements = await db.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        referenceId: true,
        quantityChange: true,
        quantityBefore: true,
        quantityAfter: true,
        notes: true,
        createdAt: true,
        product: { select: { id: true, name: true, sku: true, unit: true, price: true } },
        location: { select: { id: true, name: true, type: true } },
        actor: { select: { id: true, name: true, email: true } },
      },
    });

    // Group by referenceId
    const grouped = new Map<
      string,
      {
        referenceId: string;
        processedAt: string;
        actor: { id: string; name: string; email: string };
        location: { id: string; name: string; type: string } | null;
        items: typeof allMovements;
        totalAmount: number;
      }
    >();

    for (const m of allMovements) {
      const refId = m.referenceId!;
      if (!grouped.has(refId)) {
        grouped.set(refId, {
          referenceId: refId,
          processedAt: m.createdAt.toISOString(),
          actor: m.actor,
          location: m.location,
          items: [],
          totalAmount: 0,
        });
      }
      const group = grouped.get(refId)!;
      group.items.push(m);
      const price = m.product.price ? Number(m.product.price) : 0;
      group.totalAmount += price * Math.abs(m.quantityChange);
    }

    const transactions = Array.from(grouped.values());
    const total = transactions.length;
    const paginated = transactions.slice((page - 1) * limit, page * limit);

    // Format items
    const formatted = paginated.map((t) => ({
      ...t,
      items: t.items.map((m) => ({
        productId: m.product.id,
        name: m.product.name,
        sku: m.product.sku,
        unit: m.product.unit,
        price: m.product.price ? Number(m.product.price) : 0,
        quantity: Math.abs(m.quantityChange),
        subtotal: m.product.price ? Number(m.product.price) * Math.abs(m.quantityChange) : 0,
      })),
    }));

    return NextResponse.json({
      data: formatted,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[GET /api/pos/history]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
