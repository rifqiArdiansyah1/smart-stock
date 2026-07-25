/**
 * AppSidebar — Warehouse Signal
 *
 * Desktop sidebar: background indigo gelap #071639
 * - Collapsible: 240px (expanded) ↔ 64px (icon-only)
 * - Nav items dengan Lucide icons
 * - Active state: amber left-border + background #1E2B4F
 * - Footer: avatar + nama + role badge
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import type { BadgeVariant } from '@/components/ui/Badge';

// ── Icons (inline SVG, Lucide style) ─────────────────────────────────────────
const icons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  opname: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  products: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  ),
  approval: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  auditLog: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  reports: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  kasir: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  locations: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  chevronLeft: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  chevronRight: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

// ── Nav Items per Role ────────────────────────────────────────────────────────
export type UserRole = 'OWNER' | 'ADMIN' | 'KASIR' | 'STAFF_GUDANG';

interface NavItem {
  label: string;
  href:  string;
  icon:  React.ReactNode;
  badge?: number;
}

const navItemsByRole: Record<UserRole, NavItem[]> = {
  OWNER: [
    { label: 'Dashboard',   href: '/admin/dashboard', icon: icons.dashboard },
    { label: 'Approval',    href: '/admin/approval',  icon: icons.approval },
    { label: 'Produk',      href: '/admin/products',  icon: icons.products },
    { label: 'Laporan',     href: '/admin/reports/discrepancy', icon: icons.reports },
    { label: 'Audit Log',   href: '/admin/audit-logs', icon: icons.auditLog },
    { label: 'Pengguna',    href: '/admin/users',     icon: icons.users },
  ],
  ADMIN: [
    { label: 'Dashboard',   href: '/admin/dashboard', icon: icons.dashboard },
    { label: 'Approval',    href: '/admin/approval',  icon: icons.approval },
    { label: 'Produk',      href: '/admin/products',  icon: icons.products },
    { label: 'Lokasi',      href: '/admin/locations', icon: icons.locations },
    { label: 'Laporan',     href: '/admin/reports/discrepancy', icon: icons.reports },
    { label: 'Audit Log',   href: '/admin/audit-logs', icon: icons.auditLog },
  ],
  KASIR: [
    { label: 'Kasir (POS)', href: '/kasir',           icon: icons.kasir },
    { label: 'Produk',      href: '/admin/products',  icon: icons.products },
  ],
  STAFF_GUDANG: [
    { label: 'Home',        href: '/staff',           icon: icons.dashboard },
    { label: 'Stock Opname', href: '/opname',          icon: icons.opname },
  ],
};

const roleBadgeVariant: Record<UserRole, BadgeVariant> = {
  OWNER: 'accent',
  ADMIN: 'brand',
  KASIR: 'ok',
  STAFF_GUDANG: 'neutral',
};

const roleLabel: Record<UserRole, string> = {
  OWNER:        'Owner',
  ADMIN:        'Admin',
  KASIR:        'Kasir',
  STAFF_GUDANG: 'Staf Gudang',
};

// ── Component ─────────────────────────────────────────────────────────────────
interface AppSidebarProps {
  role:     UserRole;
  userName: string;
  userInitial?: string;
  pendingApprovalCount?: number;
  onSignOut?: () => void;
}

export function AppSidebar({
  role,
  userName,
  userInitial,
  pendingApprovalCount = 0,
  onSignOut,
}: AppSidebarProps) {
  const [collapsed, setCollapsed]  = useState(false);
  const pathname                    = usePathname();
  const navItems                    = navItemsByRole[role] ?? [];
  const initial                     = userInitial ?? userName.charAt(0).toUpperCase();

  const sidebarWidth = collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)';

  return (
    <aside
      aria-label="Navigasi utama"
      style={{
        width:           sidebarWidth,
        minHeight:       '100vh',
        backgroundColor: 'var(--color-brand)',
        display:         'flex',
        flexDirection:   'column',
        transition:      `width var(--duration-normal) var(--ease-out)`,
        boxShadow:       'var(--shadow-sidebar)',
        flexShrink:      0,
        overflow:        'hidden',
        position:        'relative',
        zIndex:          40,
      }}
    >
      {/* ── Logo ── */}
      <div
        style={{
          height:         'var(--topbar-height)',
          display:        'flex',
          alignItems:     'center',
          padding:        collapsed ? '0 1rem' : '0 1.25rem',
          borderBottom:   '1px solid var(--color-brand-muted)',
          overflow:       'hidden',
          flexShrink:     0,
        }}
      >
        {/* Icon mark */}
        <div
          aria-hidden="true"
          style={{
            width:           '32px',
            height:          '32px',
            borderRadius:    'var(--radius-md)',
            backgroundColor: 'var(--color-accent)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            flexShrink:      0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-on-accent)" strokeWidth="2.5" aria-hidden="true">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
        </div>

        {!collapsed && (
          <span
            style={{
              fontFamily:   'var(--font-display)',
              fontSize:     'var(--text-lg)',
              fontWeight:   700,
              color:        'var(--color-text-on-brand)',
              marginLeft:   '0.625rem',
              whiteSpace:   'nowrap',
              overflow:     'hidden',
            }}
          >
            SmartStock
          </span>
        )}
      </div>

      {/* ── Nav Items ── */}
      <nav
        aria-label="Menu navigasi"
        style={{ flex: 1, padding: '0.75rem 0', overflow: 'auto' }}
      >
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const itemBadge = item.label === 'Approval' ? pendingApprovalCount : 0;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display:         'flex',
                    alignItems:      'center',
                    gap:             '0.75rem',
                    padding:         collapsed ? '0.625rem 1rem' : '0.625rem 1.25rem',
                    color:           isActive ? 'var(--color-accent)' : 'rgba(255,255,255,0.75)',
                    backgroundColor: isActive ? 'var(--color-brand-container)' : 'transparent',
                    borderLeft:      isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
                    borderRadius:    '0 var(--radius-md) var(--radius-md) 0',
                    textDecoration:  'none',
                    fontFamily:      'var(--font-body)',
                    fontSize:        'var(--text-sm)',
                    fontWeight:      isActive ? 500 : 400,
                    whiteSpace:      'nowrap',
                    transition:      'background-color var(--duration-fast), color var(--duration-fast), border-color var(--duration-fast)',
                    overflow:        'hidden',
                    position:        'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--color-brand-hover)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.95)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
                    }
                  }}
                >
                  {/* Icon */}
                  <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>

                  {/* Label + badge */}
                  {!collapsed && (
                    <>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {itemBadge > 0 && (
                        <span style={{
                          backgroundColor: 'var(--color-critical)',
                          color:           '#fff',
                          fontFamily:      'var(--font-mono)',
                          fontSize:        '0.625rem',
                          fontWeight:      500,
                          padding:         '1px 5px',
                          borderRadius:    'var(--radius-full)',
                          minWidth:        '18px',
                          textAlign:       'center',
                        }}>
                          {itemBadge > 99 ? '99+' : itemBadge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Footer: User + Logout ── */}
      <div style={{
        borderTop:   '1px solid var(--color-brand-muted)',
        padding:     collapsed ? '0.75rem 1rem' : '0.75rem 1.25rem',
        display:     'flex',
        alignItems:  'center',
        gap:         '0.625rem',
        overflow:    'hidden',
      }}>
        {/* Avatar */}
        <div
          aria-hidden="true"
          style={{
            width:           '32px',
            height:          '32px',
            borderRadius:    '50%',
            backgroundColor: 'var(--color-brand-container)',
            border:          '2px solid var(--color-brand-muted)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            flexShrink:      0,
            color:           'var(--color-accent)',
            fontFamily:      'var(--font-display)',
            fontSize:        'var(--text-sm)',
            fontWeight:      700,
          }}
        >
          {initial}
        </div>

        {!collapsed && (
          <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
            <p style={{
              fontFamily:    'var(--font-body)',
              fontSize:      'var(--text-sm)',
              fontWeight:    500,
              color:         'var(--color-text-on-brand)',
              margin:        0,
              overflow:      'hidden',
              textOverflow:  'ellipsis',
              whiteSpace:    'nowrap',
            }}>
              {userName}
            </p>
            <Badge variant={roleBadgeVariant[role]} size="sm">{roleLabel[role]}</Badge>
          </div>
        )}

        {/* Logout */}
        {!collapsed && onSignOut && (
          <button
            onClick={onSignOut}
            aria-label="Keluar"
            title="Keluar"
            style={{
              background:   'none',
              border:       'none',
              cursor:       'pointer',
              color:        'rgba(255,255,255,0.5)',
              padding:      '4px',
              display:      'flex',
              borderRadius: 'var(--radius-sm)',
              transition:   'color var(--duration-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-critical)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >
            {icons.logout}
          </button>
        )}
      </div>

      {/* ── Collapse Toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Buka sidebar' : 'Perkecil sidebar'}
        aria-expanded={!collapsed}
        style={{
          position:        'absolute',
          top:             '50%',
          right:           '-12px',
          transform:       'translateY(-50%)',
          width:           '24px',
          height:          '24px',
          borderRadius:    '50%',
          backgroundColor: 'var(--color-card)',
          border:          '1px solid var(--color-border)',
          cursor:          'pointer',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          color:           'var(--color-text-secondary)',
          boxShadow:       'var(--shadow-md)',
          zIndex:          50,
          transition:      'color var(--duration-fast)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-brand)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
      >
        {collapsed ? icons.chevronRight : icons.chevronLeft}
      </button>
    </aside>
  );
}

export default AppSidebar;
