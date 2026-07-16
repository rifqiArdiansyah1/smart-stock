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

  const sessionWhere: any = { status: 'APPROVED' };
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

  const opnameItems = await db.stockOpnameItem.findMany({
    where: {
      session: sessionWhere,
      difference: { not: 0 },
      ...(category ? { product: { category } } : {}),
    },
    include: {
      product: { select: { name: true, sku: true, category: true, price: true } },
      session: {
        select: {
          approvedAt: true,
          location: { select: { name: true } },
        },
      },
    },
    orderBy: { session: { approvedAt: 'desc' } },
  });

  const header = [
    'Produk', 'SKU', 'Kategori', 'Lokasi', 'Stok Sistem', 'Stok Fisik',
    'Selisih', 'Harga (Rp)', 'Nilai Kerugian (Rp)', 'Tanggal Opname'
  ];

  const rows = opnameItems.map((item) => [
    item.product.name,
    item.product.sku,
    item.product.category || '-',
    item.session.location.name,
    item.systemQty,
    item.physicalQty,
    item.difference,
    item.product.price ? Number(item.product.price) : 0,
    item.product.price ? Math.abs(item.difference) * Number(item.product.price) : 0,
    item.session.approvedAt ? new Date(item.session.approvedAt).toISOString().split('T')[0] : '-',
  ]);

  const csvContent = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="laporan-selisih-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
