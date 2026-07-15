import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== 'OWNER' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalProducts,
    stockLevels,
    opnameThisMonth,
    pendingOpname,
    recentOpname,
  ] = await Promise.all([
    // Total produk aktif
    db.product.count({ where: { isActive: true } }),

    // Semua stock levels untuk hitung nilai stok (qty * harga beli)
    db.stockLevel.findMany({
      include: {
        product: { select: { price: true } },
      },
    }),

    // Sesi opname bulan ini (berdasarkan startedAt)
    db.stockOpnameSession.count({
      where: { startedAt: { gte: startOfMonth } },
    }),

    // Sesi opname yang menunggu persetujuan
    db.stockOpnameSession.count({
      where: { status: 'PENDING_APPROVAL' },
    }),

    // 5 Sesi opname terbaru
    db.stockOpnameSession.findMany({
      take: 5,
      orderBy: { startedAt: 'desc' },
      include: {
        location: { select: { name: true } },
        startedBy: { select: { name: true } },
      },
    }),
  ]);

  // Hitung total nilai stok
  const totalStockValue = stockLevels.reduce((sum, sl) => {
    const price = sl.product.price ? Number(sl.product.price) : 0;
    return sum + sl.quantity * price;
  }, 0);

  // Hitung low-stock di level aplikasi
  const allLevels = await db.stockLevel.findMany({
    where: { product: { isActive: true, minStock: { gt: 0 } } },
    include: { product: { select: { minStock: true } } },
  });
  const actualLowStockCount = allLevels.filter((sl) => sl.quantity <= sl.product.minStock).length;

  return NextResponse.json({
    kpi: {
      totalProducts,
      totalStockValue,
      lowStockCount: actualLowStockCount,
      opnameThisMonth,
      pendingOpname,
    },
    recentOpname: recentOpname.map((s) => ({
      id: s.id,
      locationName: s.location.name,
      startedBy: s.startedBy.name,
      status: s.status,
      createdAt: s.startedAt, // expose as createdAt for client
    })),
  });
}
