/**
 * API Route: GET /api/stock-levels
 *
 * Menampilkan stok terkini semua produk per lokasi.
 * Data di-derive dari tabel stock_levels (ledger pattern).
 *
 * Query params:
 *  - locationId : filter per lokasi
 *  - status     : "normal" | "low" | "critical"
 *  - search     : cari nama produk / SKU
 *  - page, limit: pagination
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

function getStockStatus(quantity: number, minStock: number): 'critical' | 'low' | 'normal' {
  if (quantity === 0) return 'critical';
  if (quantity <= minStock) return 'low';
  return 'normal';
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('locationId') ?? '';
    const statusFilter = searchParams.get('status') ?? '';   // normal | low | critical
    const search = searchParams.get('search') ?? '';
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(200, Number(searchParams.get('limit') ?? '50'));
    const skip = (page - 1) * limit;

    // Build Prisma where clause
    const where: any = {
      location: { isActive: true },
      product: { isActive: true },
    };

    if (locationId) where.locationId = locationId;

    if (search) {
      where.product = {
        ...where.product,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const stockLevels = await db.stockLevel.findMany({
      where,
      orderBy: [
        { location: { name: 'asc' } },
        { product: { name: 'asc' } },
      ],
      select: {
        id: true,
        quantity: true,
        updatedAt: true,
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            category: true,
            unit: true,
            minStock: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Compute status & apply status filter in-memory
    const withStatus = stockLevels
      .map((sl) => ({
        ...sl,
        status: getStockStatus(sl.quantity, sl.product.minStock),
      }))
      .filter((sl) => !statusFilter || sl.status === statusFilter);

    const total = withStatus.length;
    const paginated = withStatus.slice(skip, skip + limit);

    // Summary counts
    const summary = {
      total,
      critical: withStatus.filter((s) => s.status === 'critical').length,
      low: withStatus.filter((s) => s.status === 'low').length,
      normal: withStatus.filter((s) => s.status === 'normal').length,
    };

    return NextResponse.json({
      data: paginated,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary,
    });
  } catch (err) {
    console.error('[GET /api/stock-levels]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
