/**
 * LoadingSpinner — Warehouse Signal
 * Spinner untuk loading state dengan varian ukuran
 */

import React from 'react';

interface LoadingSpinnerProps {
  size?:  'sm' | 'md' | 'lg';
  color?: string;
  label?: string;
}

const sizeMap = { sm: 16, md: 24, lg: 40 };

export function LoadingSpinner({
  size  = 'md',
  color = 'var(--color-accent)',
  label = 'Memuat...',
}: LoadingSpinnerProps) {
  const px = sizeMap[size];

  return (
    <span
      role="status"
      aria-label={label}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg
        width={px} height={px}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        style={{ animation: 'spin 0.75s linear infinite' }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.2" strokeWidth="2.5"/>
        <path d="M12 3a9 9 0 0 1 9 9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Full-page loading overlay */
export function PageLoader({ label = 'Memuat halaman...' }: { label?: string }) {
  return (
    <div
      style={{
        position:        'fixed',
        inset:           0,
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             'var(--space-4)',
        backgroundColor: 'var(--color-surface)',
        zIndex:          9999,
      }}
    >
      <LoadingSpinner size="lg" />
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
    </div>
  );
}

export default LoadingSpinner;
