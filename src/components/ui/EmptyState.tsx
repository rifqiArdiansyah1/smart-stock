/**
 * EmptyState — Warehouse Signal
 * Ilustrasi + teks untuk tabel/list kosong
 */

import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?:        React.ReactNode;
  title:        string;
  description?: string;
  action?:      { label: string; onClick: () => void };
}

const DefaultIcon = () => (
  <svg
    width="48" height="48"
    viewBox="0 0 48 48"
    fill="none"
    aria-hidden="true"
    style={{ color: 'var(--color-border-muted)' }}
  >
    <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2"/>
    <path d="M20 24h8M24 20v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-label={title}
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        'var(--space-16) var(--space-8)',
        gap:            'var(--space-4)',
        textAlign:      'center',
        animation:      'ws-fade-in var(--duration-fast) var(--ease-out)',
      }}
    >
      {/* Icon */}
      <div style={{ opacity: 0.5 }}>
        {icon ?? <DefaultIcon />}
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize:   'var(--text-base)',
          fontWeight: 700,
          color:      'var(--color-text-primary)',
          margin:     0,
        }}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize:   'var(--text-sm)',
            color:      'var(--color-text-secondary)',
            maxWidth:   '360px',
            margin:     0,
            lineHeight: 'var(--leading-relaxed)',
          }}
        >
          {description}
        </p>
      )}

      {/* Action */}
      {action && (
        <Button
          variant="primary"
          size="md"
          onClick={action.onClick}
          style={{ marginTop: 'var(--space-2)' }}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
