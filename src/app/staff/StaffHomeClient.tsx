'use client';

/**
 * StaffHomeClient — Warehouse Signal (Mobile)
 * Referensi visual: home_staf_smartstock/screen.png
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatusPill } from '@/components/ui/StatusPill';

// ── Icons ─────────────────────────────────────────────────────────────────────
const BarcodeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 5v14M7 5v14M11 5v14M15 5v7M19 5v7M15 16v3M19 16v3M13 19h8M13 16h2M17 16h2"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const AlertTriIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const WifiOffIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
  </svg>
);

const WifiIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
  </svg>
);

const BoxIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────────
interface Session {
  id: string;
  status: string;
  startedAt: string;
  location: { name: string; type: string };
  _count: { items: number };
}

interface Props {
  userName:       string;
  recentSessions: Session[];
  todayCount:     number;
  activeSession:  Session | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'baru saja';
  if (mins < 60) return `${mins} mnt lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} jam lalu`;
  return `${Math.floor(hrs / 24)} hari lalu`;
}

function statusLabel(status: string): { label: string; color: string; bg: string } {
  switch (status) {
    case 'APPROVED': return { label: 'Sesuai',    color: 'var(--color-ok-text)',       bg: 'var(--color-ok-surface)' };
    case 'REJECTED': return { label: 'Ditolak',   color: 'var(--color-critical-text)', bg: 'var(--color-critical-surface)' };
    case 'PENDING':  return { label: 'Menunggu',  color: 'var(--color-warn-text)',     bg: 'var(--color-warn-surface)' };
    case 'IN_PROGRESS': return { label: 'Aktif',     color: 'var(--color-brand)',         bg: 'rgba(7,22,57,0.08)' };
    default:         return { label: status,      color: 'var(--color-text-secondary)', bg: 'var(--color-surface-low)' };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function StaffHomeClient({ userName, recentSessions, todayCount, activeSession }: Props) {
  const [isOnline, setIsOnline] = useState(true);
  const firstName = userName.split(' ')[0];

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  const padding = 'var(--space-margin-mobile)';

  return (
    <div style={{ padding, paddingBottom: 'var(--space-8)', animation: 'ws-fade-in var(--duration-fast) var(--ease-out)' }}>

      {/* ── Offline Banner ── */}
      {!isOnline && (
        <div
          role="alert"
          style={{
            display:         'flex',
            alignItems:      'center',
            gap:             'var(--space-2)',
            padding:         'var(--space-2) var(--space-3)',
            backgroundColor: 'var(--color-warn-surface)',
            border:          '1px solid var(--color-warn)',
            borderRadius:    'var(--radius-md)',
            marginBottom:    'var(--space-4)',
            fontFamily:      'var(--font-body)',
            fontSize:        'var(--text-xs)',
            color:           'var(--color-warn-text)',
          }}
        >
          <WifiOffIcon />
          <span>Mode offline — data akan disinkron saat online</span>
        </div>
      )}

      {/* ── Greeting ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Halo, {firstName}.
          </h1>
          {/* Online indicator */}
          <span
            title={isOnline ? 'Online' : 'Offline'}
            style={{
              display:         'inline-flex',
              alignItems:      'center',
              gap:             '4px',
              fontFamily:      'var(--font-mono)',
              fontSize:        'var(--text-xs)',
              color:           isOnline ? 'var(--color-ok-text)' : 'var(--color-warn-text)',
              backgroundColor: isOnline ? 'var(--color-ok-surface)' : 'var(--color-warn-surface)',
              padding:         '3px 8px',
              borderRadius:    'var(--radius-full)',
            }}
          >
            {isOnline ? <WifiIcon /> : <WifiOffIcon />}
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', margin: 0 }}>
          Siap untuk tugas hari ini?
        </p>
      </div>

      {/* ── CTA: Mulai Opname Baru ── */}
      <Link
        href="/opname"
        id="btn-mulai-opname"
        style={{
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          gap:             'var(--space-3)',
          width:           '100%',
          minHeight:       'var(--touch-target-lg)',   /* 64px */
          backgroundColor: 'var(--color-accent)',
          color:           'var(--color-text-on-accent)',
          borderRadius:    'var(--radius-xl)',
          textDecoration:  'none',
          fontFamily:      'var(--font-display)',
          fontSize:        'var(--text-xl)',
          fontWeight:      700,
          marginBottom:    'var(--space-6)',
          boxShadow:       '0 4px 16px rgba(254,166,25,0.4)',
          transition:      'transform var(--duration-fast), filter var(--duration-fast)',
        }}
        onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)'; }}
        onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; }}
      >
        <BarcodeIcon />
        <span>Mulai Opname Baru</span>
      </Link>

      {/* ── Opname Hari Ini ── */}
      <div
        style={{
          backgroundColor: 'var(--color-card)',
          border:          '1px solid var(--color-border)',
          borderRadius:    'var(--radius-lg)',
          padding:         'var(--space-4)',
          marginBottom:    'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Opname Hari Ini
          </span>
          <span style={{ color: 'var(--color-ok)' }}>
            <CheckCircleIcon />
          </span>
        </div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 var(--space-3)' }}>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{todayCount}</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 400, color: 'var(--color-text-secondary)', marginLeft: 'var(--space-2)' }}>
            sesi selesai hari ini
          </span>
        </p>
        {/* Progress bar */}
        <div style={{ height: '6px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div
            style={{
              height:          '100%',
              width:           `${Math.min((todayCount / 10) * 100, 100)}%`,
              backgroundColor: 'var(--color-ok)',
              borderRadius:    'var(--radius-full)',
              transition:      'width 0.6s var(--ease-out)',
            }}
          />
        </div>
      </div>

      {/* ── Akurasi Stok ── */}
      <div
        style={{
          backgroundColor: 'var(--color-card)',
          border:          '1px solid var(--color-border)',
          borderRadius:    'var(--radius-lg)',
          padding:         'var(--space-4)',
          marginBottom:    'var(--space-6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Akurasi Stok
          </span>
          <span style={{ color: 'var(--color-warn)' }}><AlertTriIcon /></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            98.5%
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--color-warn)', fontWeight: 500 }}>
            ▼ 0.2%
          </span>
        </div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
          Target: 99.0%
        </p>
      </div>

      {/* ── Aktivitas Terakhir ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Aktivitas Terakhir
          </h2>
          <Link
            href="/opname"
            style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-brand)', textDecoration: 'underline' }}
          >
            Lihat Semua
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--color-card)',
              border:          '1px solid var(--color-border)',
              borderRadius:    'var(--radius-lg)',
              padding:         'var(--space-8)',
              textAlign:       'center',
              fontFamily:      'var(--font-body)',
              fontSize:        'var(--text-sm)',
              color:           'var(--color-text-secondary)',
            }}
          >
            Belum ada aktivitas opname
          </div>
        ) : (
          <div
            style={{
              backgroundColor: 'var(--color-card)',
              border:          '1px solid var(--color-border)',
              borderRadius:    'var(--radius-lg)',
              overflow:        'hidden',
            }}
          >
            {recentSessions.map((session, i) => {
              const st = statusLabel(session.status);
              const hasSelisih = session.status === 'REJECTED';
              return (
                <div
                  key={session.id}
                  style={{
                    display:       'flex',
                    alignItems:    'center',
                    gap:           'var(--space-3)',
                    padding:       'var(--space-3) var(--space-4)',
                    borderBottom:  i < recentSessions.length - 1 ? '1px solid var(--color-border)' : 'none',
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width:           '36px',
                      height:          '36px',
                      borderRadius:    'var(--radius-md)',
                      backgroundColor: hasSelisih ? 'var(--color-critical-surface)' : 'var(--color-surface-low)',
                      display:         'flex',
                      alignItems:      'center',
                      justifyContent:  'center',
                      color:           hasSelisih ? 'var(--color-critical)' : 'var(--color-text-secondary)',
                      flexShrink:      0,
                    }}
                    aria-hidden="true"
                  >
                    {hasSelisih ? <AlertCircleIcon /> : <BoxIcon />}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {session.location.name}
                    </p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
                      {timeAgo(session.startedAt)}
                    </p>
                  </div>

                  {/* Status */}
                  <span
                    style={{
                      fontFamily:      'var(--font-body)',
                      fontSize:        'var(--text-xs)',
                      fontWeight:      500,
                      color:           st.color,
                      backgroundColor: st.bg,
                      padding:         '2px 8px',
                      borderRadius:    'var(--radius-full)',
                      whiteSpace:      'nowrap',
                      flexShrink:      0,
                    }}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
