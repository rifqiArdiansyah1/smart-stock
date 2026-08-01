/**
 * page.tsx — Kasir / POS
 *
 * Server Component: auth check + fetch locations → render POSInterface
 * Redesign: ISSUE-029-D6
 */

import { Metadata } from 'next';
import { auth }     from '@/auth';
import { redirect } from 'next/navigation';
import { db }       from '@/lib/db';
import POSInterface from './POSInterface';

export const metadata: Metadata = {
  title: 'Kasir / POS — SmartStock',
  description: 'Modul Penjualan dan Kasir SmartStock',
};

export default async function KasirPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const locations = await db.location.findMany({
    where:   { isActive: true },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    select:  { id: true, name: true, type: true },
  });

  return (
    <div className="ss-pos-root" style={{ height: '100%' }}>
      {/* ── Header Kasir ── */}
      <header
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        'var(--space-4) var(--space-6)',
          background:     'var(--color-card)',
          borderBottom:   '1px solid var(--color-border)',
          flexShrink:     0,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily:    'var(--font-display)',
              fontSize:      'var(--text-xl)',
              fontWeight:    700,
              color:         'var(--color-brand)',
              display:       'flex',
              alignItems:    'center',
              gap:           'var(--space-2)',
              letterSpacing: '-0.01em',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '24px', color: 'var(--color-accent)', fontVariationSettings: "'FILL' 1" }}
            >
              point_of_sale
            </span>
            SmartStock POS
          </h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Sistem Point of Sale &amp; Kasir
          </p>
        </div>

        <a
          href="/"
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          'var(--space-2)',
            fontSize:     'var(--text-sm)',
            fontWeight:   500,
            color:        'var(--color-text-secondary)',
            padding:      'var(--space-2) var(--space-4)',
            background:   'var(--color-surface-low)',
            border:       '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            transition:   'background-color var(--duration-fast)',
          }}
        >
          {/* <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span> */}
          Kembali ke Dashboard
        </a>
      </header>

      {/* ── Main POS Interface ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <POSInterface locations={locations} />
      </div>
    </div>
  );
}
