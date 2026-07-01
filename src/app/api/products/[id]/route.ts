/**
 * API Route: GET /api/products/[id]   — Detail satu produk
 *            PATCH /api/products/[id] — Edit produk (OWNER & ADMIN only)
 *            DELETE /api/products/[id] — Soft delete produk (OWNER & ADMIN only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/with-role';
import { PERMISSIONS } from '@/lib/rbac';
import { db } from '@/lib/db';
import { auth } from '@/auth';

// ── GET /api/products/[id] ───────────────────────────────────
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
    const product = await db.product.findUnique({
      where: { id },
      include: {
        stockLevels: {
          include: { location: { select: { id: true, name: true, type: true } } },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    return NextResponse.json({ data: product });
  } catch (err) {
    console.error('[GET /api/products/[id]]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ── PATCH /api/products/[id] ─────────────────────────────────
export const PATCH = withPermission(
  PERMISSIONS.MANAGE_PRODUCTS,
  async (req: NextRequest, ctx: any) => {
    try {
      const { id } = await ctx.params;
      const body = await req.json();
      const { name, category, unit, price, minStock, barcode, expiryDate, isActive } = body;

      const data: Record<string, unknown> = {};
      if (name !== undefined) data.name = String(name).trim();
      if (category !== undefined) data.category = String(category).trim();
      if (unit !== undefined) data.unit = String(unit).trim();
      if (price !== undefined) data.price = Number(price);
      if (minStock !== undefined) data.minStock = Number(minStock);
      if (barcode !== undefined) data.barcode = barcode ? String(barcode).trim() : null;
      if (expiryDate !== undefined) data.expiryDate = expiryDate ? new Date(expiryDate) : null;
      if (isActive !== undefined) data.isActive = Boolean(isActive);

      const product = await db.product.update({
        where: { id },
        data,
      });

      return NextResponse.json({ data: product });
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      }
      if (err?.code === 'P2002') {
        return NextResponse.json(
          { error: 'Conflict', message: 'Barcode sudah digunakan produk lain.' },
          { status: 409 },
        );
      }
      console.error('[PATCH /api/products/[id]]', err);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
);

// ── DELETE /api/products/[id] — Soft Delete ──────────────────
export const DELETE = withPermission(
  PERMISSIONS.MANAGE_PRODUCTS,
  async (_req: NextRequest, ctx: any) => {
    try {
      const { id } = await ctx.params;

      // Soft delete: set isActive = false
      const product = await db.product.update({
        where: { id },
        data: { isActive: false },
        select: { id: true, name: true, isActive: true },
      });

      return NextResponse.json({
        data: product,
        message: `Produk '${product.name}' telah dinonaktifkan.`,
      });
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      }
      console.error('[DELETE /api/products/[id]]', err);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
);
