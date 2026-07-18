import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { CachedProduct } from '@/lib/offline-db';

/**
 * GET /api/products/cache
 *
 * Mengembalikan daftar semua produk aktif untuk disinkronisasi
 * ke IndexedDB (products_cache) di browser untuk kebutuhan offline.
 *
 * Hanya memerlukan autentikasi (semua role bisa akses).
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        sku: true,
        barcode: true,
        name: true,
        unit: true,
        price: true,
        minStock: true,
        category: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    const payload: CachedProduct[] = products.map((p) => ({
      id: p.id,
      sku: p.sku,
      barcode: p.barcode,
      name: p.name,
      unit: p.unit,
      price: p.price ? Number(p.price) : null,
      minStock: p.minStock,
      category: p.category,
      isActive: p.isActive,
      cachedAt: Date.now(),
    }));

    return NextResponse.json(payload, {
      headers: {
        // Cache selama 5 menit di browser untuk performa
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (err) {
    console.error('[GET /api/products/cache]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
