/**
 * API Route: GET /api/products  — Daftar produk (dengan search & filter)
 *            POST /api/products — Tambah produk baru (OWNER & ADMIN only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/with-role';
import { PERMISSIONS } from '@/lib/rbac';
import { db } from '@/lib/db';
import { auth } from '@/auth';

// ── GET /api/products ────────────────────────────────────────
// Semua user yang sudah login dapat mengakses
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';
    const category = searchParams.get('category') ?? '';
    const showInactive = searchParams.get('showInactive') === 'true';
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Number(searchParams.get('limit') ?? '20'));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Hanya tampilkan aktif kecuali diminta
    if (!showInactive) {
      where.isActive = true;
    }

    // Filter kategori
    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    // Search: nama, sku, atau barcode
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          sku: true,
          barcode: true,
          name: true,
          category: true,
          unit: true,
          price: true,
          minStock: true,
          expiryDate: true,
          isActive: true,
          createdAt: true,
          stockLevels: {
            select: { quantity: true },
          },
        },
      }),
      db.product.count({ where }),
    ]);

    // Hitung total stok per produk
    const productsWithStock = products.map((p) => ({
      ...p,
      totalStock: p.stockLevels.reduce((sum, s) => sum + s.quantity, 0),
      stockLevels: undefined,
    }));

    // Ambil daftar kategori unik
    const categories = await db.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return NextResponse.json({
      data: productsWithStock,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      categories: categories.map((c) => c.category),
    });
  } catch (err) {
    console.error('[GET /api/products]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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

      if (!sku || !name || !unit || price == null) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'Field sku, name, unit, dan price wajib diisi.' },
          { status: 400 },
        );
      }

      const product = await db.product.create({
        data: {
          sku: sku.trim().toUpperCase(),
          name: name.trim(),
          category: category?.trim() ?? 'Umum',
          unit: unit.trim(),
          price: Number(price),
          minStock: minStock ? Number(minStock) : 0,
          barcode: barcode?.trim() || null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
        },
      });

      return NextResponse.json({ data: product }, { status: 201 });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return NextResponse.json(
          { error: 'Conflict', message: 'SKU atau barcode sudah digunakan produk lain.' },
          { status: 409 },
        );
      }
      console.error('[POST /api/products]', err);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
);
