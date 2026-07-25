/**
 * Badge — Warehouse Signal
 * Label status kecil untuk role, aksi, dan state
 */

import React from 'react';

export type BadgeVariant = 'brand' | 'accent' | 'ok' | 'warn' | 'critical' | 'expired' | 'neutral';

interface BadgeProps {
  children:   React.ReactNode;
  variant?:   BadgeVariant;
  size?:      'sm' | 'md';
  className?: string;
}

const badgeConfig: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  brand:    { bg: 'var(--color-brand)',          text: 'var(--color-text-on-brand)',   border: 'var(--color-brand)' },
  accent:   { bg: 'var(--color-accent-surface)', text: 'var(--color-accent-dark)',     border: 'var(--color-accent)' },
  ok:       { bg: 'var(--color-ok-surface)',      text: 'var(--color-ok-text)',         border: 'var(--color-ok)' },
  warn:     { bg: 'var(--color-warn-surface)',    text: 'var(--color-warn-text)',       border: 'var(--color-warn)' },
  critical: { bg: 'var(--color-critical-surface)',text: 'var(--color-critical-text)',   border: 'var(--color-critical)' },
  expired:  { bg: 'var(--color-expired-surface)', text: 'var(--color-expired)',         border: 'var(--color-expired)' },
  neutral:  { bg: 'var(--color-surface-low)',     text: 'var(--color-text-secondary)',  border: 'var(--color-border)' },
};

const sizeConfig = {
  sm: { padding: '1px 6px',  fontSize: '0.625rem' },
  md: { padding: '2px 8px',  fontSize: '0.75rem' },
};

export function Badge({
  children,
  variant   = 'neutral',
  size      = 'md',
  className = '',
}: BadgeProps) {
  const cfg  = badgeConfig[variant];
  const sz   = sizeConfig[size];

  return (
    <span
      className={className}
      style={{
        display:         'inline-flex',
        alignItems:      'center',
        justifyContent:  'center',
        padding:         sz.padding,
        borderRadius:    'var(--radius-full)',
        backgroundColor: cfg.bg,
        color:           cfg.text,
        border:          `1px solid ${cfg.border}`,
        fontFamily:      'var(--font-body)',
        fontSize:        sz.fontSize,
        fontWeight:      500,
        whiteSpace:      'nowrap',
        lineHeight:      1.4,
        userSelect:      'none',
      }}
    >
      {children}
    </span>
  );
}

export default Badge;
