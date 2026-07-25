/**
 * BottomNav — Warehouse Signal (Mobile)
 *
 * 4-tab bottom navigation untuk STAF_GUDANG dan KASIR
 * - Tab aktif: amber indicator + label visible
 * - Safe area inset untuk notch/home indicator
 * - Touch target min 48px
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ── Icons ─────────────────────────────────────────────────────────────────────
const tabIcons = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  opname: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  history: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/>
    </svg>
  ),
  profile: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  kasir: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
    </svg>
  ),
  products: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  ),
};

export type UserRole = 'KASIR' | 'STAFF_GUDANG';

interface TabItem {
  label: string;
  href:  string;
  icon:  React.ReactNode;
}

const tabsByRole: Record<UserRole, TabItem[]> = {
  STAFF_GUDANG: [
    { label: 'Home',     href: '/staff',   icon: tabIcons.home },
    { label: 'Opname',   href: '/opname',  icon: tabIcons.opname },
    { label: 'Riwayat',  href: '/riwayat', icon: tabIcons.history },
    { label: 'Profil',   href: '/profil',  icon: tabIcons.profile },
  ],
  KASIR: [
    { label: 'Kasir',    href: '/kasir',           icon: tabIcons.kasir },
    { label: 'Produk',   href: '/admin/products',   icon: tabIcons.products },
    { label: 'Riwayat',  href: '/riwayat',          icon: tabIcons.history },
    { label: 'Profil',   href: '/profil',           icon: tabIcons.profile },
  ],
};

interface BottomNavProps {
  role: UserRole;
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const tabs     = tabsByRole[role];

  return (
    <nav
      aria-label="Navigasi bawah"
      style={{
        position:           'fixed',
        bottom:             0,
        left:               0,
        right:              0,
        height:             'var(--bottomnav-height)',
        backgroundColor:    'var(--color-card)',
        borderTop:          '1px solid var(--color-border)',
        display:            'flex',
        alignItems:         'stretch',
        paddingBottom:      'env(safe-area-inset-bottom)',
        zIndex:             50,
        boxShadow:          '0 -2px 8px rgb(0 0 0 / 0.08)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            aria-label={tab.label}
            style={{
              flex:            1,
              display:         'flex',
              flexDirection:   'column',
              alignItems:      'center',
              justifyContent:  'center',
              gap:             '2px',
              color:           isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              textDecoration:  'none',
              fontFamily:      'var(--font-body)',
              fontSize:        '0.625rem',
              fontWeight:      isActive ? 500 : 400,
              transition:      'color var(--duration-fast)',
              minHeight:       'var(--touch-target)',
              position:        'relative',
            }}
          >
            {/* Active top indicator */}
            {isActive && (
              <span
                aria-hidden="true"
                style={{
                  position:        'absolute',
                  top:             0,
                  left:            '50%',
                  transform:       'translateX(-50%)',
                  width:           '24px',
                  height:          '2px',
                  borderRadius:    '0 0 var(--radius-sm) var(--radius-sm)',
                  backgroundColor: 'var(--color-accent)',
                }}
              />
            )}

            {/* Icon */}
            <span style={{ display: 'flex' }}>{tab.icon}</span>

            {/* Label — selalu ditampilkan */}
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default BottomNav;
