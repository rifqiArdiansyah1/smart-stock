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
    const rawQuery = searchParams.get('q'); // barcode, sku, or product name
    const locationId = searchParams.get('locationId');

    if (!rawQuery || !locationId) {
      return NextResponse.json(
        { error: 'Missing barcode/sku/name or locationId' },
        { status: 400 }
      );
    }

    const cleanQuery = rawQuery.trim();
    if (!cleanQuery) {
      return NextResponse.json(
        { error: 'Query tidak boleh kosong' },
        { status: 400 }
      );
    }

    // First try exact match on barcode or SKU
    const exactProduct = await db.product.findFirst({
      where: {
        OR: [
          { barcode: { equals: cleanQuery, mode: 'insensitive' } },
          { sku: { equals: cleanQuery, mode: 'insensitive' } },
        ],
        isActive: true,
      },
    });

    if (exactProduct) {
      const stockLevel = await db.stockLevel.findUnique({
        where: {
          productId_locationId: {
            productId: exactProduct.id,
            locationId: locationId,
          },
        },
      });
      const quantity = stockLevel?.quantity || 0;

      const formattedProduct = {
        id: exactProduct.id,
        name: exactProduct.name,
        sku: exactProduct.sku,
        barcode: exactProduct.barcode,
        price: exactProduct.price ? Number(exactProduct.price) : 0,
        unit: exactProduct.unit,
      };

      return NextResponse.json({
        product: formattedProduct,
        stockAvailable: quantity,
        results: [{ product: formattedProduct, stockAvailable: quantity }],
      });
    }

    // Otherwise find products matching name, sku, or barcode partial match
    const products = await db.product.findMany({
      where: {
        OR: [
          { barcode: { contains: cleanQuery, mode: 'insensitive' } },
          { sku: { contains: cleanQuery, mode: 'insensitive' } },
          { name: { contains: cleanQuery, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      take: 10,
      orderBy: { name: 'asc' },
    });

    if (products.length === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    // Fetch stock levels for all matched products at this location
    const productIds = products.map((p) => p.id);
    const stockLevels = await db.stockLevel.findMany({
      where: {
        locationId: locationId,
        productId: { in: productIds },
      },
    });

    const stockMap = new Map<string, number>();
    stockLevels.forEach((sl) => stockMap.set(sl.productId, sl.quantity));

    const results = products.map((p) => ({
      product: {
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        price: p.price ? Number(p.price) : 0,
        unit: p.unit,
      },
      stockAvailable: stockMap.get(p.id) || 0,
    }));

    if (results.length === 1) {
      return NextResponse.json({
        product: results[0].product,
        stockAvailable: results[0].stockAvailable,
        results,
      });
    }

    return NextResponse.json({
      results,
    });
  } catch (err) {
    console.error('[GET /api/pos/lookup]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
