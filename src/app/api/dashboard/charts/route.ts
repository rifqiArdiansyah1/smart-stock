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

  // Top 10 produk dengan selisih terbesar (discrepancy items)
  const topDiscrepancy = await db.stockOpnameItem.groupBy({
    by: ['productId'],
    _sum: { difference: true },
    _count: { difference: true },
    orderBy: { _count: { difference: 'desc' } },
    take: 10,
    having: {
      difference: {
        _sum: { not: 0 },
      },
    },
  });

  const productIds = topDiscrepancy.map((d) => d.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const discrepancyData = topDiscrepancy.map((d) => ({
    productId: d.productId,
    productName: productMap.get(d.productId)?.name || 'Unknown',
    sku: productMap.get(d.productId)?.sku || '-',
    totalDifference: d._sum.difference || 0,
    occurrences: d._count.difference,
  }));

  // Fast-moving vs Slow-moving: berdasarkan total gerakan (SALE) per produk dalam 30 hari terakhir
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const movements = await db.stockMovement.groupBy({
    by: ['productId'],
    where: {
      type: 'SALE',
      createdAt: { gte: thirtyDaysAgo },
    },
    _sum: { quantityChange: true },
    orderBy: { _sum: { quantityChange: 'asc' } }, // negatif karena SALE mengurangi stok
  });

  const movProductIds = movements.map((m) => m.productId);
  const movProducts = await db.product.findMany({
    where: { id: { in: movProductIds } },
    select: { id: true, name: true, sku: true },
  });
  const movProductMap = new Map(movProducts.map((p) => [p.id, p]));

  const movementData = movements.map((m) => ({
    productId: m.productId,
    productName: movProductMap.get(m.productId)?.name || 'Unknown',
    sku: movProductMap.get(m.productId)?.sku || '-',
    totalSold: Math.abs(m._sum.quantityChange || 0),
  })).sort((a, b) => b.totalSold - a.totalSold);

  const fastMoving = movementData.slice(0, 10);
  const slowMoving = movementData.slice(-10).reverse();

  return NextResponse.json({ discrepancyData, fastMoving, slowMoving });
}
