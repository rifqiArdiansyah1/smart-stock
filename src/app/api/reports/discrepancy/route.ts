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

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const locationId = searchParams.get('locationId') || undefined;
  const category = searchParams.get('category') || undefined;

  // Build date filter for opname sessions (by approvedAt)
  const sessionWhere: any = {
    status: 'APPROVED',
  };
  if (locationId) sessionWhere.locationId = locationId;
  if (dateFrom || dateTo) {
    sessionWhere.approvedAt = {};
    if (dateFrom) sessionWhere.approvedAt.gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      sessionWhere.approvedAt.lte = to;
    }
  }

  // Fetch all approved opname items with non-zero difference
  const opnameItems = await db.stockOpnameItem.findMany({
    where: {
      session: sessionWhere,
      difference: { not: 0 },
      ...(category ? { product: { category } } : {}),
    },
    include: {
      product: { select: { id: true, name: true, sku: true, category: true, price: true } },
      session: { select: { approvedAt: true, location: { select: { id: true, name: true } } } },
    },
    orderBy: { session: { approvedAt: 'desc' } },
  });

  // Aggregate per product
  const productMap = new Map<string, {
    productId: string;
    productName: string;
    sku: string;
    category: string | null;
    price: number;
    totalDifference: number;
    absTotal: number;
    occurrences: number;
    lastOccurrence: Date;
    lossValue: number;
  }>();

  for (const item of opnameItems) {
    const pid = item.productId;
    const price = item.product.price ? Number(item.product.price) : 0;
    const diff = item.difference;
    const loss = Math.abs(diff) * price;

    if (!productMap.has(pid)) {
      productMap.set(pid, {
        productId: pid,
        productName: item.product.name,
        sku: item.product.sku,
        category: item.product.category,
        price,
        totalDifference: 0,
        absTotal: 0,
        occurrences: 0,
        lastOccurrence: item.session.approvedAt || new Date(0),
        lossValue: 0,
      });
    }

    const entry = productMap.get(pid)!;
    entry.totalDifference += diff;
    entry.absTotal += Math.abs(diff);
    entry.occurrences += 1;
    entry.lossValue += loss;
    if (item.session.approvedAt && item.session.approvedAt > entry.lastOccurrence) {
      entry.lastOccurrence = item.session.approvedAt;
    }
  }

  const tableData = Array.from(productMap.values()).sort((a, b) => b.absTotal - a.absTotal);

  // Trend per month: group opname sessions by month
  const trendMap = new Map<string, number>(); // key: 'YYYY-MM', value: abs total difference
  for (const item of opnameItems) {
    if (!item.session.approvedAt) continue;
    const d = item.session.approvedAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    trendMap.set(key, (trendMap.get(key) || 0) + Math.abs(item.difference));
  }

  const trendData = Array.from(trendMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, totalAbsDiff]) => ({ month, totalAbsDiff }));

  // Fetch filter options
  const [locations, categories] = await Promise.all([
    db.location.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    db.product.findMany({
      where: { isActive: true, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    }),
  ]);

  return NextResponse.json({
    tableData,
    trendData,
    filterOptions: {
      locations,
      categories: categories.map((p) => p.category).filter(Boolean),
    },
  });
}
