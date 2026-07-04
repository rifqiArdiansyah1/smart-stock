/**
 * POST /api/pos/checkout
 *
 * Proses transaksi penjualan.
 * Untuk setiap item:
 *  1. Validasi stok tersedia
 *  2. Buat StockMovement (type=SALE, quantityChange negatif)
 *  3. Upsert StockLevel (kurangi quantity)
 *
 * Semua operasi dalam satu transaksi Prisma ($transaction) agar atomic.
 * Satu checkout = satu referenceId UUID yang menghubungkan semua movements.
 *
 * Guard: KASIR, ADMIN, OWNER
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { ROLES } from '@/lib/rbac';
import { randomUUID } from 'crypto';

type CartItem = {
  productId: string;
  quantity: number;
};

const ALLOWED_ROLES = [ROLES.KASIR, ROLES.ADMIN, ROLES.OWNER];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { items: CartItem[]; locationId: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { items, locationId, notes } = body;

  if (!items?.length || !locationId) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Field items dan locationId wajib diisi.' },
      { status: 400 },
    );
  }

  // De-duplicate items (same productId → sum quantity)
  const mergedMap = new Map<string, number>();
  for (const item of items) {
    mergedMap.set(item.productId, (mergedMap.get(item.productId) ?? 0) + item.quantity);
  }
  const mergedItems = Array.from(mergedMap.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));

  const actorId = session.user.id!;
  const referenceId = randomUUID();

  try {
    // Ambil data produk + stok saat ini secara bersamaan
    const productIds = mergedItems.map((i) => i.productId);

    const [products, stockLevels] = await Promise.all([
      db.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        select: { id: true, name: true, sku: true, unit: true, price: true },
      }),
      db.stockLevel.findMany({
        where: {
          productId: { in: productIds },
          locationId,
        },
        select: { productId: true, quantity: true },
      }),
    ]);

    const productMap = new Map(products.map((p) => [p.id, p]));
    const stockMap = new Map(stockLevels.map((s) => [s.productId, s.quantity]));

    // Validasi stok sebelum transaksi
    const validationErrors: string[] = [];
    for (const item of mergedItems) {
      const product = productMap.get(item.productId);
      if (!product) {
        validationErrors.push(`Produk ID ${item.productId} tidak ditemukan atau tidak aktif.`);
        continue;
      }
      const available = stockMap.get(item.productId) ?? 0;
      if (available < item.quantity) {
        validationErrors.push(
          `Stok ${product.name} tidak cukup. Tersedia: ${available} ${product.unit}, diminta: ${item.quantity}.`,
        );
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Stok tidak mencukupi', details: validationErrors },
        { status: 422 },
      );
    }

    // Atomic transaction: insert movements + update stock levels
    const movements = await db.$transaction(async (tx) => {
      const result = [];

      for (const item of mergedItems) {
        const quantityBefore = stockMap.get(item.productId) ?? 0;
        const quantityAfter = quantityBefore - item.quantity;

        // 1. Buat StockMovement
        const movement = await tx.stockMovement.create({
          data: {
            productId: item.productId,
            locationId,
            actorId,
            type: 'SALE',
            quantityChange: -item.quantity,
            quantityBefore,
            quantityAfter,
            referenceId,
            notes: notes ?? null,
          },
        });

        // 2. Update StockLevel (upsert)
        await tx.stockLevel.upsert({
          where: { productId_locationId: { productId: item.productId, locationId } },
          create: {
            productId: item.productId,
            locationId,
            quantity: quantityAfter,
          },
          update: { quantity: quantityAfter },
        });

        result.push(movement);
      }

      return result;
    });

    // Build receipt response
    const receiptItems = mergedItems.map((item) => {
      const product = productMap.get(item.productId)!;
      return {
        productId: item.productId,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        price: product.price ? Number(product.price) : 0,
        quantity: item.quantity,
        subtotal: product.price ? Number(product.price) * item.quantity : 0,
      };
    });

    const totalAmount = receiptItems.reduce((sum, i) => sum + i.subtotal, 0);

    return NextResponse.json(
      {
        success: true,
        receipt: {
          referenceId,
          items: receiptItems,
          totalAmount,
          locationId,
          processedAt: new Date().toISOString(),
          movementsCreated: movements.length,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[POST /api/pos/checkout]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
