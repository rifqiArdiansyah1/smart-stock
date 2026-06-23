/**
 * SmartStock — Stock Service
 *
 * Service untuk mengelola pergerakan stok.
 * PENTING: Semua perubahan stok WAJIB melalui fungsi ini.
 * Tidak ada jalur lain yang diizinkan untuk mengubah stok.
 *
 * stock_levels akan diupdate otomatis via PostgreSQL trigger
 * setelah INSERT ke stock_movements.
 */

import { db } from '@/lib/db';
import { writeAuditLog } from '@/lib/audit';
import type { StockMovementType } from '@prisma/client';

export interface CreateMovementInput {
  productId: string;
  locationId: string;
  actorId: string;
  type: StockMovementType;
  quantityChange: number; // positif = masuk, negatif = keluar
  referenceId?: string;
  notes?: string;
}

/**
 * Mencatat pergerakan stok dan mengupdate cache stock_levels.
 * Ini satu-satunya fungsi yang boleh mengubah jumlah stok.
 */
export async function createStockMovement(input: CreateMovementInput) {
  // 1. Ambil stok terkini
  const currentLevel = await db.stockLevel.findUnique({
    where: {
      productId_locationId: {
        productId: input.productId,
        locationId: input.locationId,
      },
    },
  });

  const quantityBefore = currentLevel?.quantity ?? 0;
  const quantityAfter = quantityBefore + input.quantityChange;

  // 2. Validasi: stok tidak boleh negatif
  if (quantityAfter < 0) {
    throw new Error(
      `Stok tidak cukup. Tersedia: ${quantityBefore}, diminta: ${Math.abs(input.quantityChange)}`,
    );
  }

  // 3. Catat di ledger (append-only)
  const movement = await db.stockMovement.create({
    data: {
      productId: input.productId,
      locationId: input.locationId,
      actorId: input.actorId,
      type: input.type,
      quantityChange: input.quantityChange,
      quantityBefore,
      quantityAfter,
      referenceId: input.referenceId,
      notes: input.notes,
    },
  });

  // 4. Update cache stock_levels (di production via trigger, di dev via upsert)
  await db.stockLevel.upsert({
    where: {
      productId_locationId: {
        productId: input.productId,
        locationId: input.locationId,
      },
    },
    update: { quantity: quantityAfter },
    create: {
      productId: input.productId,
      locationId: input.locationId,
      quantity: quantityAfter,
    },
  });

  // 5. Tulis audit log
  await writeAuditLog({
    actorId: input.actorId,
    action: 'STOCK_ADJUSTMENT',
    entityType: 'StockMovement',
    entityId: movement.id,
    oldValue: { quantity: quantityBefore },
    newValue: { quantity: quantityAfter, type: input.type },
  });

  return movement;
}

/**
 * Ambil stok terkini untuk satu produk di semua lokasi.
 */
export async function getStockByProduct(productId: string) {
  return db.stockLevel.findMany({
    where: { productId },
    include: { location: true },
    orderBy: { location: { name: 'asc' } },
  });
}

/**
 * Ambil semua produk dengan stok di bawah min_stock.
 */
export async function getLowStockProducts() {
  const levels = await db.stockLevel.findMany({
    include: { product: true, location: true },
  });

  return levels.filter((l) => l.quantity <= l.product.minStock && l.product.isActive);
}

/**
 * Hitung total stok suatu produk di semua lokasi.
 */
export async function getTotalStock(productId: string): Promise<number> {
  const result = await db.stockLevel.aggregate({
    where: { productId },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}
