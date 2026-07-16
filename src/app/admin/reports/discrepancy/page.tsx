import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DiscrepancyReport from './DiscrepancyReport';

export const metadata: Metadata = {
  title: 'Laporan Selisih Stok — SmartStock',
  description: 'Analisis pola selisih stok dan estimasi nilai kerugian',
};

export default async function DiscrepancyReportPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = (session.user as any).role;
  if (role !== 'OWNER' && role !== 'ADMIN') redirect('/');

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <a href="/admin/dashboard" className="hover:text-slate-600 transition-colors">Dashboard</a>
            <span>/</span>
            <span className="text-slate-600 font-medium">Laporan Selisih Stok</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">📉 Laporan Selisih Stok</h1>
          <p className="text-slate-500 text-sm mt-1">
            Analisis produk yang paling sering mengalami selisih dan estimasi nilai kerugiannya.
          </p>
        </div>
      </header>
      <div className="max-w-screen-xl mx-auto px-6 py-6">
        <DiscrepancyReport />
      </div>
    </main>
  );
}
