import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q'); // barcode or sku
    const locationId = searchParams.get('locationId');

    if (!query || !locationId) {
      return NextResponse.json(
        { error: 'Missing barcode/sku or locationId' },
        { status: 400 }
      );
    }

    // Find product by barcode or SKU
    const product = await db.product.findFirst({
      where: {
        OR: [
          { barcode: query },
          { sku: query },
        ],
        isActive: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    // Get stock level for this location
    const stockLevel = await db.stockLevel.findUnique({
      where: {
        productId_locationId: {
          productId: product.id,
          locationId: locationId,
        },
      },
    });

    const quantity = stockLevel?.quantity || 0;

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        price: product.price ? Number(product.price) : 0,
        unit: product.unit,
      },
      stockAvailable: quantity,
    });
  } catch (err) {
    console.error('[GET /api/pos/lookup]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
