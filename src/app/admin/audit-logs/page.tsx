/**
 * page.tsx — Admin Audit Log
 *
 * Server Component: auth check + fetch actors → render AuditLogClient
 * Redesign: ISSUE-029-D6
 * Design ref: stitch audit_log_smartstock_final/code.html
 */

import { Metadata } from 'next';
import { auth }     from '@/auth';
import { redirect } from 'next/navigation';
import { db }       from '@/lib/db';
import AuditLogTable from './AuditLogTable';

export const metadata: Metadata = {
  title: 'Log Audit Sistem — SmartStock',
  description: 'Catatan komprehensif tindakan pengguna dan peristiwa sistem SmartStock',
};

export default async function AuditLogPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = (session.user as any).role;
  if (role !== 'OWNER') redirect('/');

  const actors = await db.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="ss-page-audit">
      {/* ── Page Header ── */}
      <div className="ss-audit-header">
        <div>
          <h2 className="ss-audit-title">Log Audit Sistem</h2>
          <p className="ss-audit-subtitle">
            Catatan komprehensif tindakan pengguna dan peristiwa sistem.
          </p>
        </div>
      </div>

      {/* ── Client Table (filter + data + pagination) ── */}
      <AuditLogTable actors={actors} />
    </div>
  );
}
