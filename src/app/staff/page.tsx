/**
 * Home Staf Gudang — Warehouse Signal (Mobile)
 * Referensi: stitch_web_application_ui_ux_design/home_staf_smartstock/screen.png & code.html
 */

import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import { StatusPill } from '@/components/ui/StatusPill';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Home Staf',
  description: 'Halaman utama staf gudang SmartStock',
};

export default async function StaffHomePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userName = session.user.name ?? 'Staf';

  // Fetch recent opname sessions
  const recentSessions = await db.stockOpnameSession.findMany({
    take: 5,
    orderBy: { startedAt: 'desc' },
    include: {
      location: { select: { name: true, type: true } },
      _count: { select: { items: true } },
    },
  });

  return (
    <div
      style={{
        padding: 'var(--space-margin-mobile)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        paddingBottom: 'calc(var(--bottomnav-height) + 24px)',
      }}
    >
      {/* Welcome & Primary CTA */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 700,
            color: 'var(--color-brand)',
            margin: 0,
          }}
        >
          Halo, {userName}.
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', margin: 0 }}>
          Siap untuk tugas opname hari ini?
        </p>

        {/* Large Amber CTA Button (min 64px height) */}
        <Link
          href="/opname/lokasi"
          style={{
            marginTop: 'var(--space-4)',
            height: '64px',
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-text-on-accent)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-3)',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(254,166,25,0.35)',
            transition: 'transform var(--duration-fast), background-color var(--duration-fast)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
            <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
            <line x1="7" y1="12" x2="17" y2="12"/>
          </svg>
          Mulai Opname Baru
        </Link>
      </section>

      {/* Summary Cards */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-brand)', margin: 0 }}>
          Ringkasan Opname
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          {/* Card 1: Active sessions */}
          <Card padding="var(--space-4)">
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
              Sesi Berjalan
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-brand)', margin: '4px 0 0' }}>
              {recentSessions.filter((s) => s.status === 'IN_PROGRESS').length}
            </p>
          </Card>

          {/* Card 2: Completed / Pending Approval */}
          <Card padding="var(--space-4)">
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
              Menunggu Review
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-brand)', margin: '4px 0 0' }}>
              {recentSessions.filter((s) => s.status === 'PENDING_APPROVAL').length}
            </p>
          </Card>
        </div>
      </section>

      {/* Recent Sessions List */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-brand)', margin: 0 }}>
            Sesi Terbaru
          </h2>
          <Link href="/opname" style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-brand)', textDecoration: 'underline' }}>
            Lihat Semua
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <Card padding="var(--space-6)" style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
              Belum ada sesi opname. Tekan tombol &quot;Mulai Opname Baru&quot; untuk memulai.
            </p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {recentSessions.map((session) => (
              <Link
                key={session.id}
                href={session.status === 'IN_PROGRESS' ? `/opname/${session.id}/scan` : `/opname/${session.id}`}
                style={{ textDecoration: 'none' }}
              >
                <Card interactive padding="var(--space-4)">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-brand)', margin: 0 }}>
                        {session.location.name}
                      </h3>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                        {session._count.items} item terhitung
                      </p>
                    </div>
                    <StatusPill
                      value={session.status === 'IN_PROGRESS' ? 'Berjalan' : session.status === 'PENDING_APPROVAL' ? 'Review' : 'Selesai'}
                      unit=""
                      status={session.status === 'IN_PROGRESS' ? 'warn' : session.status === 'APPROVED' ? 'ok' : 'neutral'}
                      size="sm"
                    />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
