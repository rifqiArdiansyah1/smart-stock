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
    <div className="ss-page-audit">
      {/* ── Page Header ── */}
      <div className="ss-audit-header">
        <div>
          <h2 className="ss-audit-title">Laporan Selisih Stok</h2>
          <p className="ss-audit-subtitle">
            Analisis produk yang paling sering mengalami selisih dan estimasi nilai kerugiannya.
          </p>
        </div>
      </div>

      {/* ── Report Client Component ── */}
      <DiscrepancyReport />
    </div>
  );
}
