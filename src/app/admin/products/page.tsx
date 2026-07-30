/**
 * page.tsx — Admin Manajemen Produk
 *
 * Server Component: fetch data → render stat cards + ProductsClient
 * Design ref: stitch manajemen_produk_smartstock_final
 * Redesign: ISSUE-029-D5
 */

import { Metadata } from 'next';
import { auth }     from '@/auth';
import { redirect } from 'next/navigation';
import { ROLES }    from '@/lib/rbac';
import { db }       from '@/lib/db';
import ProductsClient from './ProductsClient';

export const metadata: Metadata = {
  title: 'Manajemen Produk — SmartStock',
  description: 'CRUD produk master inventory SmartStock',
};

export default async function ProductsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role      = (session.user as any).role as string;
  const canManage = role === ROLES.OWNER || role === ROLES.ADMIN;

  const [products, categories] = await Promise.all([
    db.product.findMany({
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
        stockLevels: { select: { quantity: true } },
      },
    }),
    db.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    }),
  ]);

  const productsWithStock = products.map((p) => ({
    ...p,
    category:    p.category  ?? 'Umum',
    price:       Number(p.price ?? 0),
    totalStock:  p.stockLevels.reduce((sum, s) => sum + s.quantity, 0),
    expiryDate:  p.expiryDate?.toISOString() ?? null,
    createdAt:   p.createdAt.toISOString(),
    stockLevels: undefined,
  }));

  const totalProducts = products.length;
  const activeCount   = products.filter((p) => p.isActive).length;
  const lowStockCount = products.filter(
    (p) => p.isActive && p.stockLevels.reduce((s, sl) => s + sl.quantity, 0) <= p.minStock,
  ).length;
  const categoryCount = categories.length;

  return (
    <div className="ss-page-products">

      {/* ── Page Header ── */}
      <div className="ss-page-header">
        <h2 className="ss-page-title">Manajemen Produk</h2>
      </div>

      {/* ── Stat Cards ── */}
      <div className="ss-stat-grid">
        <div className="ss-stat-card">
          <span className="material-symbols-outlined ss-stat-icon" style={{ color: 'var(--ss-primary)' }}>
            inventory_2
          </span>
          <div>
            <p className="ss-stat-value">{totalProducts}</p>
            <p className="ss-stat-label">Total Produk</p>
          </div>
        </div>
        <div className="ss-stat-card">
          <span className="material-symbols-outlined ss-stat-icon" style={{ color: 'var(--ss-success)' }}>
            check_circle
          </span>
          <div>
            <p className="ss-stat-value">{activeCount}</p>
            <p className="ss-stat-label">Aktif</p>
          </div>
        </div>
        <div className="ss-stat-card">
          <span className="material-symbols-outlined ss-stat-icon" style={{ color: 'var(--ss-warning)' }}>
            warning
          </span>
          <div>
            <p className="ss-stat-value">{lowStockCount}</p>
            <p className="ss-stat-label">Stok Rendah</p>
          </div>
        </div>
        <div className="ss-stat-card">
          <span className="material-symbols-outlined ss-stat-icon" style={{ color: 'var(--ss-secondary)' }}>
            category
          </span>
          <div>
            <p className="ss-stat-value">{categoryCount}</p>
            <p className="ss-stat-label">Kategori</p>
          </div>
        </div>
      </div>

      {/* ── Client Component (search, filter, table, form) ── */}
      <ProductsClient
        initialProducts={productsWithStock}
        categories={categories.map((c) => c.category ?? '').filter(Boolean)}
        canManage={canManage}
      />
    </div>
  );
}
