import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export const metadata: Metadata = {
  title: 'Dashboard — SmartStock',
  description: 'Ringkasan kondisi bisnis dan stok secara real-time',
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = (session.user as any).role;
  if (role !== 'OWNER' && role !== 'ADMIN') redirect('/');

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Ringkasan kondisi bisnis dan stok secara menyeluruh.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Data Terkini
          </div>
        </div>
      </header>
      <div className="max-w-screen-xl mx-auto px-6 py-6">
        <DashboardClient />
      </div>
    </main>
  );
}
