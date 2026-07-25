/**
 * AppShell — Warehouse Signal
 *
 * Layout wrapper utama yang memilih komponen navigasi sesuai role:
 * - OWNER / ADMIN → AppSidebar (desktop) + TopBar
 * - KASIR / STAFF_GUDANG → BottomNav (mobile-first)
 *
 * Gunakan ini sebagai wrapper di setiap halaman yang membutuhkan navigasi.
 */

'use client';

import React from 'react';
import { AppSidebar, type UserRole as SidebarRole } from './AppSidebar';
import { BottomNav, type UserRole as BottomNavRole } from './BottomNav';
import { TopBar } from './TopBar';

export type AppRole = 'OWNER' | 'ADMIN' | 'KASIR' | 'STAFF_GUDANG';

const DESKTOP_ROLES: AppRole[] = ['OWNER', 'ADMIN'];
const MOBILE_ROLES:  AppRole[] = ['KASIR', 'STAFF_GUDANG'];

interface AppShellProps {
  role:        AppRole;
  userName:    string;
  userInitial?: string;
  pageTitle:   string;
  breadcrumbs?: { label: string; href?: string }[];
  notifCount?:  number;
  pendingApprovalCount?: number;
  topBarActions?: React.ReactNode;
  onSignOut?:  () => void;
  children:    React.ReactNode;
}

export function AppShell({
  role,
  userName,
  userInitial,
  pageTitle,
  breadcrumbs,
  notifCount              = 0,
  pendingApprovalCount    = 0,
  topBarActions,
  onSignOut,
  children,
}: AppShellProps) {
  const isDesktop = DESKTOP_ROLES.includes(role);
  const isMobile  = MOBILE_ROLES.includes(role);

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-surface)' }}>
        {/* Sidebar */}
        <AppSidebar
          role={role as SidebarRole}
          userName={userName}
          userInitial={userInitial}
          pendingApprovalCount={pendingApprovalCount}
          onSignOut={onSignOut}
        />

        {/* Main content area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* TopBar */}
          <TopBar
            pageTitle={pageTitle}
            breadcrumbs={breadcrumbs}
            notifCount={notifCount}
            userName={userName}
            userInitial={userInitial}
            actions={topBarActions}
          />

          {/* Page content */}
          <main
            id="main-content"
            style={{
              flex:       1,
              padding:    'var(--space-6)',
              overflow:   'auto',
              animation:  'ws-fade-in var(--duration-fast) var(--ease-out)',
            }}
          >
            {children}
          </main>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div
        style={{
          minHeight:        '100vh',
          backgroundColor:  'var(--color-surface)',
          paddingBottom:    'calc(var(--bottomnav-height) + env(safe-area-inset-bottom))',
        }}
      >
        {/* Mobile header */}
        <header
          style={{
            position:        'sticky',
            top:             0,
            zIndex:          30,
            backgroundColor: 'var(--color-brand)',
            color:           'var(--color-text-on-brand)',
            height:          'var(--topbar-height)',
            display:         'flex',
            alignItems:      'center',
            padding:         '0 var(--space-margin-mobile)',
            gap:             'var(--space-3)',
          }}
        >
          {/* Logo mark */}
          <div
            aria-hidden="true"
            style={{
              width:           '28px',
              height:          '28px',
              borderRadius:    'var(--radius-md)',
              backgroundColor: 'var(--color-accent)',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              flexShrink:      0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-on-accent)" strokeWidth="2.5" aria-hidden="true">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize:   'var(--text-base)',
              fontWeight: 700,
              color:      'var(--color-text-on-brand)',
              flex:       1,
              margin:     0,
            }}
          >
            {pageTitle}
          </h1>

          {topBarActions}
        </header>

        {/* Page content */}
        <main
          id="main-content"
          style={{ animation: 'ws-fade-in var(--duration-fast) var(--ease-out)' }}
        >
          {children}
        </main>

        {/* Bottom nav */}
        <BottomNav role={role as BottomNavRole} />
      </div>
    );
  }

  // Fallback
  return <>{children}</>;
}

export default AppShell;
