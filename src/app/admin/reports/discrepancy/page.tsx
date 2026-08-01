/**
 * page.tsx — Laporan Selisih Stok
 *
 * Server Component: auth + render DiscrepancyReport client
 * Redesign: ISSUE-029-D6
 */

import { Metadata } from 'next';
import { auth }     from '@/auth';
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
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">Laporan Selisih Stok</h2>
        <p className="font-sans text-slate-500 dark:text-slate-400 text-sm">
          Analisis produk yang paling sering mengalami selisih dan estimasi nilai kerugiannya.
        </p>
      </div>

      {/* ── Report Client Component ── */}
      <DiscrepancyReport />
    </div>
  );
}
