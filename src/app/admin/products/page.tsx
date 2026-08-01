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
    <div className="flex flex-col gap-6 w-full animate-fade-in">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">
          Manajemen Produk
        </h2>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="flex items-center gap-4 p-5 bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{totalProducts}</p>
            <p className="font-sans text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Total Produk</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="flex items-center gap-4 p-5 bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{activeCount}</p>
            <p className="font-sans text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Aktif</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="flex items-center gap-4 p-5 bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{lowStockCount}</p>
            <p className="font-sans text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Stok Rendah</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="flex items-center gap-4 p-5 bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{categoryCount}</p>
            <p className="font-sans text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Kategori</p>
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
