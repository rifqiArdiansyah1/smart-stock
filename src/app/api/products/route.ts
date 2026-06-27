/**
 * API Route: /api/products
 *
 * GET  → Semua role yang sudah login bisa melihat daftar produk.
 * POST → Hanya OWNER & ADMIN yang bisa menambah produk baru.
 *
 * Contoh demonstrasi penggunaan RBAC via withPermission().
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/with-role';
import { PERMISSIONS } from '@/lib/rbac';
import { db } from '@/lib/db';
import { auth } from '@/auth';

// ── GET /api/products ────────────────────────────────────────
// Semua user yang sudah login dapat mengakses
export async function GET(req: NextRequest) {
  // Cek auth manual (tanpa HOF, untuk fleksibilitas)
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Anda harus login.' },
      { status: 401 },
    );
  }

  try {
    const products = await db.product.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        sku: true,
        name: true,
        category: true,
        unit: true,
        price: true,
        minStock: true,
        expiryDate: true,
      },
    });

    return NextResponse.json({ data: products, total: products.length });
  } catch (err) {
    console.error('[GET /api/products]', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

// ── POST /api/products ───────────────────────────────────────
// Hanya OWNER & ADMIN (MANAGE_PRODUCTS permission)
export const POST = withPermission(
  PERMISSIONS.MANAGE_PRODUCTS,
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const { sku, name, category, unit, price, minStock, barcode, expiryDate } = body;

      // Validasi field wajib
      if (!sku || !name || !unit || price == null) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'Field sku, name, unit, dan price wajib diisi.' },
          { status: 400 },
        );
      }

      const product = await db.product.create({
        data: {
          sku,
          name,
          category: category ?? 'Umum',
          unit,
          price: Number(price),
          minStock: minStock ? Number(minStock) : 0,
          barcode: barcode ?? null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
        },
      });

      return NextResponse.json({ data: product }, { status: 201 });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return NextResponse.json(
          { error: 'Conflict', message: 'SKU sudah digunakan oleh produk lain.' },
          { status: 409 },
        );
      }
      console.error('[POST /api/products]', err);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
);
