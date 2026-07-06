import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import OpnameClient from './OpnameClient';

export const metadata: Metadata = {
  title: 'Stock Opname — SmartStock',
  description: 'Mulai dan kelola sesi stock opname',
};

export default async function OpnamePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [opnames, locations] = await Promise.all([
    db.stockOpnameSession.findMany({
      orderBy: { startedAt: 'desc' },
      include: {
        location: { select: { name: true, type: true } },
        startedBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
    db.location.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, type: true },
    }),
  ]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <a href="/" className="hover:text-slate-600 transition-colors">Dashboard</a>
            <span>/</span>
            <span className="text-slate-600 font-medium">Stock Opname</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Stock Opname</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola sesi perhitungan fisik stok barang.</p>
        </div>

        <OpnameClient initialOpnames={opnames as any[]} locations={locations} />

      </div>
    </main>
  );
}
