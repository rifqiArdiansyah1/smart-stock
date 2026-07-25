/**
 * TopBar — Warehouse Signal
 * Header bar untuk desktop/tablet: breadcrumb, notif bell, avatar
 */

'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';

const BellIcon = ({ count = 0 }: { count?: number }) => (
  <button
    aria-label={count > 0 ? `${count} notifikasi belum dibaca` : 'Notifikasi'}
    style={{
      position:        'relative',
      background:      'none',
      border:          'none',
      cursor:          'pointer',
      color:           'var(--color-text-secondary)',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      width:           '36px',
      height:          '36px',
      borderRadius:    'var(--radius-md)',
      transition:      'background-color var(--duration-fast)',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-low)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
    {count > 0 && (
      <span
        aria-hidden="true"
        style={{
          position:        'absolute',
          top:             '4px',
          right:           '4px',
          width:           '8px',
          height:          '8px',
          borderRadius:    '50%',
          backgroundColor: 'var(--color-critical)',
          border:          '1.5px solid var(--color-card)',
        }}
      />
    )}
  </button>
);

interface TopBarProps {
  pageTitle:   string;
  breadcrumbs?: { label: string; href?: string }[];
  notifCount?:  number;
  userName?:    string;
  userInitial?: string;
  onNotifClick?: () => void;
  actions?:    React.ReactNode;
}

export function TopBar({
  pageTitle,
  breadcrumbs,
  notifCount  = 0,
  userName,
  userInitial,
  actions,
}: TopBarProps) {
  const initial = userInitial ?? (userName?.charAt(0).toUpperCase() ?? '?');

  return (
    <header
      style={{
        height:          'var(--topbar-height)',
        backgroundColor: 'var(--color-card)',
        borderBottom:    '1px solid var(--color-border)',
        display:         'flex',
        alignItems:      'center',
        padding:         '0 var(--space-6)',
        gap:             'var(--space-4)',
        position:        'sticky',
        top:             0,
        zIndex:          30,
        boxShadow:       'var(--shadow-sm)',
      }}
    >
      {/* Breadcrumb / Title */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {breadcrumbs && breadcrumbs.length > 1 ? (
          <nav aria-label="Breadcrumb">
            <ol style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', listStyle: 'none', margin: 0, padding: 0 }}>
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  {i > 0 && (
                    <li aria-hidden="true" style={{ color: 'var(--color-text-disabled)', fontSize: 'var(--text-xs)' }}>/</li>
                  )}
                  <li>
                    {crumb.href && i < breadcrumbs.length - 1 ? (
                      <a
                        href={crumb.href}
                        style={{
                          fontFamily:     'var(--font-body)',
                          fontSize:       'var(--text-sm)',
                          color:          'var(--color-text-secondary)',
                          textDecoration: 'none',
                        }}
                      >
                        {crumb.label}
                      </a>
                    ) : (
                      <span
                        aria-current={i === breadcrumbs.length - 1 ? 'page' : undefined}
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize:   'var(--text-sm)',
                          fontWeight: 700,
                          color:      'var(--color-text-primary)',
                        }}
                      >
                        {crumb.label}
                      </span>
                    )}
                  </li>
                </React.Fragment>
              ))}
            </ol>
          </nav>
        ) : (
          <h1
            style={{
              fontFamily:   'var(--font-display)',
              fontSize:     'var(--text-lg)',
              fontWeight:   700,
              color:        'var(--color-text-primary)',
              margin:       0,
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
            }}
          >
            {pageTitle}
          </h1>
        )}
      </div>

      {/* Right side: actions + notif + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
        {actions}
        <BellIcon count={notifCount} />

        {/* Avatar */}
        {userName && (
          <button
            aria-label={`Profil ${userName}`}
            style={{
              width:           '32px',
              height:          '32px',
              borderRadius:    '50%',
              backgroundColor: 'var(--color-brand-container)',
              border:          '2px solid var(--color-border)',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              cursor:          'pointer',
              color:           'var(--color-text-on-brand)',
              fontFamily:      'var(--font-display)',
              fontSize:        'var(--text-sm)',
              fontWeight:      700,
              background:      'var(--color-brand)',
            }}
          >
            {initial}
          </button>
        )}
      </div>
    </header>
  );
}

export default TopBar;
