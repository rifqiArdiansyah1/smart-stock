import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import POSInterface from './POSInterface';

export const metadata: Metadata = {
  title: 'Kasir / POS — SmartStock',
  description: 'Modul Penjualan dan Kasir SmartStock',
};

export default async function KasirPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const locations = await db.location.findMany({
    where: { isActive: true },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, type: true },
  });

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col h-screen">
      {/* Header Kasir */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span className="text-primary-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
            SmartStock POS
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Sistem Point of Sale & Kasir</p>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <a href="/" className="hover:text-primary-600 transition-colors bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Kembali ke Dashboard
          </a>
        </div>
      </header>

      {/* Main POS Interface (Client) */}
      <div className="flex-1 overflow-hidden">
        <POSInterface locations={locations} />
      </div>
    </main>
  );
}
