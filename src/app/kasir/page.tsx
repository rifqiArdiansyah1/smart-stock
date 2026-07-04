import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ROLES } from '@/lib/rbac';
import { db } from '@/lib/db';
import POSInterface from './POSInterface';

export const metadata: Metadata = {
  title: 'Kasir — SmartStock',
  description: 'Interface kasir untuk proses penjualan SmartStock',
};

const ALLOWED_ROLES = [ROLES.KASIR, ROLES.ADMIN, ROLES.OWNER];

export default async function KasirPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = (session.user as any).role as string;
  if (!ALLOWED_ROLES.includes(role as any)) redirect('/');

  const locations = await db.location.findMany({
    where: { isActive: true },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, type: true },
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <a href="/" className="hover:text-slate-600 transition-colors">Dashboard</a>
              <span>/</span>
              <span className="text-slate-600 font-medium">Kasir</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Modul Kasir</h1>
            <p className="text-slate-500 text-sm mt-1">
              Scan barcode atau ketik SKU untuk menambah produk ke keranjang.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-emerald-700">
              {session.user.name ?? session.user.email}
            </span>
          </div>
        </div>

        {/* POS Interface */}
        <POSInterface locations={locations} />
      </div>
    </main>
  );
}
