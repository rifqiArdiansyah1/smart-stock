import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import AuditLogTable from './AuditLogTable';

export const metadata: Metadata = {
  title: 'Audit Log — SmartStock',
  description: 'Riwayat seluruh aktivitas sistem SmartStock',
};

export default async function AuditLogPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = (session.user as any).role;
  if (role !== 'OWNER') redirect('/');

  // Fetch all unique actors for filter dropdown
  const actors = await db.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <a href="/" className="hover:text-slate-600 transition-colors">Dashboard</a>
            <span>/</span>
            <span className="text-slate-600 font-medium">Audit Log</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Audit Log Sistem</h1>
              <p className="text-slate-500 text-sm mt-1">
                Seluruh riwayat aktivitas dan perubahan data yang terjadi di sistem.
              </p>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-screen-2xl mx-auto px-6 py-6">
        <AuditLogTable actors={actors} />
      </div>
    </main>
  );
}
