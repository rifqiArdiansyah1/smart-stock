import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ROLES } from '@/lib/rbac';
import { db } from '@/lib/db';
import ProductsClient from './ProductsClient';

export const metadata: Metadata = {
  title: 'Manajemen Produk — SmartStock',
  description: 'CRUD produk master inventory SmartStock',
};

export default async function ProductsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = (session.user as any).role as string;
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
    category: p.category ?? 'Umum',
    price: Number(p.price ?? 0),
    totalStock: p.stockLevels.reduce((sum, s) => sum + s.quantity, 0),
    expiryDate: p.expiryDate?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    stockLevels: undefined,
  }));

  const activeCount = products.filter((p) => p.isActive).length;
  const lowStockCount = products.filter(
    (p) => p.isActive && p.stockLevels.reduce((s, sl) => s + sl.quantity, 0) <= p.minStock,
  ).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-10">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Breadcrumb & Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <a href="/" className="hover:text-slate-600 transition-colors">Dashboard</a>
              <span>/</span>
              <span className="text-slate-600 font-medium">Produk</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Produk</h1>
            <p className="text-slate-500 text-sm mt-1">Master data produk inventory SmartStock.</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Produk', value: products.length, icon: '📦', color: 'from-blue-500/10 to-indigo-500/10 border-blue-200/60' },
            { label: 'Aktif', value: activeCount, icon: '✅', color: 'from-emerald-500/10 to-green-500/10 border-emerald-200/60' },
            { label: 'Stok Rendah', value: lowStockCount, icon: '⚠️', color: 'from-amber-500/10 to-orange-500/10 border-amber-200/60' },
            { label: 'Kategori', value: categories.length, icon: '🏷️', color: 'from-purple-500/10 to-violet-500/10 border-purple-200/60' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className={`bg-gradient-to-br ${color} border rounded-2xl px-5 py-4`}>
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-2xl font-bold text-slate-800">{value}</div>
              <div className="text-sm text-slate-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Client Component yang mengelola search, filter, dan form */}
        <ProductsClient
          initialProducts={productsWithStock}
          categories={categories.map((c) => c.category ?? '').filter(Boolean)}
          canManage={canManage}
        />
      </div>
    </main>
  );
}
