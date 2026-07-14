import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import ExpiryProductList from './ExpiryProductList';

export const metadata: Metadata = {
  title: 'Monitor Expiry Produk — SmartStock',
  description: 'Daftar produk yang akan atau telah kedaluwarsa',
};

export default async function ExpiryPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = (session.user as any).role;
  if (role !== 'OWNER' && role !== 'ADMIN') redirect('/');

  const now = new Date();
  const thirtyDaysLater = new Date(now);
  thirtyDaysLater.setDate(now.getDate() + 30);

  // Ambil semua produk dengan expiryDate <= 30 hari ke depan (termasuk yang sudah expired)
  const products = await db.product.findMany({
    where: {
      isActive: true,
      expiryDate: {
        not: null,
        lte: thirtyDaysLater,
      },
    },
    select: {
      id: true,
      name: true,
      sku: true,
      barcode: true,
      unit: true,
      expiryDate: true,
      category: true,
      stockLevels: {
        select: {
          quantity: true,
          location: { select: { name: true } },
        },
      },
    },
    orderBy: { expiryDate: 'asc' },
  });

  const now_ts = now.getTime();
  const enriched = products.map((p) => {
    const expiryDate = p.expiryDate!;
    const diffMs = new Date(expiryDate).getTime() - now_ts;
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const totalQty = p.stockLevels.reduce((s, sl) => s + sl.quantity, 0);
    return { ...p, daysRemaining, totalQty };
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <a href="/" className="hover:text-slate-600 transition-colors">Dashboard</a>
            <span>/</span>
            <span className="text-slate-600 font-medium">Monitor Expiry</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            🗓️ Monitor Produk Kedaluwarsa
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Produk yang akan kedaluwarsa dalam 30 hari ke depan atau sudah melewati tanggal kedaluwarsa.
          </p>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-6 py-6">
        <ExpiryProductList products={enriched as any} />
      </div>
    </main>
  );
}
