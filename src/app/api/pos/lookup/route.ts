/**
 * GET /api/pos/lookup?q=<barcode|sku>&locationId=<id>
 *
 * Lookup produk berdasarkan barcode atau SKU.
 * Juga mengembalikan stok tersedia di lokasi yang dipilih.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const locationId = searchParams.get('locationId') ?? '';

  if (!q) {
    return NextResponse.json({ error: 'Query parameter "q" wajib diisi.' }, { status: 400 });
  }

  try {
    const product = await db.product.findFirst({
      where: {
        isActive: true,
        OR: [
          { barcode: { equals: q, mode: 'insensitive' } },
          { sku: { equals: q.toUpperCase() } },
        ],
      },
      select: {
        id: true,
        sku: true,
        barcode: true,
        name: true,
        category: true,
        unit: true,
        price: true,
        minStock: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Not Found', message: `Produk dengan barcode/SKU "${q}" tidak ditemukan.` },
        { status: 404 },
      );
    }

    // Ambil stok di lokasi yang dipilih
    let availableStock = 0;
    if (locationId) {
      const stockLevel = await db.stockLevel.findUnique({
        where: { productId_locationId: { productId: product.id, locationId } },
        select: { quantity: true },
      });
      availableStock = stockLevel?.quantity ?? 0;
    }

    return NextResponse.json({
      data: {
        ...product,
        price: product.price ? Number(product.price) : 0,
        availableStock,
      },
    });
  } catch (err) {
    console.error('[GET /api/pos/lookup]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
