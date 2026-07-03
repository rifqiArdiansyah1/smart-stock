import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import StockTable from './StockTable';

export const metadata: Metadata = {
  title: 'Stok Real-time — SmartStock',
  description: 'Pantau stok terkini semua produk per lokasi',
};

function getStockStatus(quantity: number, minStock: number): 'critical' | 'low' | 'normal' {
  if (quantity === 0) return 'critical';
  if (quantity <= minStock) return 'low';
  return 'normal';
}

export default async function StockPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // Fetch stock levels + locations concurrently
  const [stockLevels, locations] = await Promise.all([
    db.stockLevel.findMany({
      where: {
        location: { isActive: true },
        product: { isActive: true },
      },
      orderBy: [
        { location: { name: 'asc' } },
        { product: { name: 'asc' } },
      ],
      select: {
        id: true,
        quantity: true,
        updatedAt: true,
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            category: true,
            unit: true,
            minStock: true,
          },
        },
        location: {
          select: { id: true, name: true, type: true },
        },
      },
    }),
    db.location.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, type: true },
    }),
  ]);

  // Compute status
  const dataWithStatus = stockLevels.map((sl) => ({
    ...sl,
    updatedAt: sl.updatedAt.toISOString(),
    status: getStockStatus(sl.quantity, sl.product.minStock),
  }));

  const summary = {
    total: dataWithStatus.length,
    critical: dataWithStatus.filter((s) => s.status === 'critical').length,
    low: dataWithStatus.filter((s) => s.status === 'low').length,
    normal: dataWithStatus.filter((s) => s.status === 'normal').length,
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-10">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <a href="/" className="hover:text-slate-600 transition-colors">Dashboard</a>
            <span>/</span>
            <span className="text-slate-600 font-medium">Stok Real-time</span>
          </div>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Stok Real-time</h1>
              <p className="text-slate-500 text-sm mt-1">
                Pantau jumlah stok terkini setiap produk per lokasi. Data di-derive dari{' '}
                <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">stock_movements</code>.
              </p>
            </div>

            {/* Alert banner if ada critical */}
            {summary.critical > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium shadow-sm">
                <span className="text-lg">🚨</span>
                <span><strong>{summary.critical}</strong> produk stok habis!</span>
              </div>
            )}
          </div>
        </div>

        {/* Stock Table with Polling */}
        <StockTable
          initialData={dataWithStatus as any}
          initialSummary={summary}
          locations={locations}
        />
      </div>
    </main>
  );
}
