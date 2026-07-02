/**
 * API Route: GET /api/locations/[id]/stock
 * Stok per produk di lokasi tertentu.
 * Berguna untuk tampilan detail lokasi dan pilihan sesi opname.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';

    const location = await db.location.findUnique({
      where: { id },
      select: { id: true, name: true, type: true, isActive: true },
    });

    if (!location) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const stockLevels = await db.stockLevel.findMany({
      where: {
        locationId: id,
        ...(search
          ? {
              product: {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { sku: { contains: search, mode: 'insensitive' } },
                ],
              },
            }
          : {}),
      },
      orderBy: { product: { name: 'asc' } },
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
      },
    });

    const lowStockCount = stockLevels.filter(
      (s) => s.quantity <= s.product.minStock,
    ).length;

    return NextResponse.json({
      location,
      data: stockLevels,
      meta: {
        total: stockLevels.length,
        lowStockCount,
      },
    });
  } catch (err) {
    console.error('[GET /api/locations/[id]/stock]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
