/**
 * ProgressCounter — Warehouse Signal
 * Indicator progres langkah opname atau hitung item (e.g. "Langkah 1 dari 3" atau "12/45 Item")
 */

import React from 'react';

interface ProgressCounterProps {
  current: number;
  total: number;
  label?: string;
  stepLabel?: string;
  className?: string;
}

export function ProgressCounter({
  current,
  total,
  label = 'Pilih Lokasi',
  stepLabel = 'Langkah',
  className = '',
}: ProgressCounterProps) {
  const percent = total > 0 ? Math.min(100, Math.max(0, Math.round((current / total) * 100))) : 0;

  return (
    <div className={className} aria-label="Progres langkah opname">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-brand)' }}>
          {stepLabel} {current} dari {total}
        </span>
        {label && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            {label}
          </span>
        )}
      </div>
      <div
        style={{
          width: '100%',
          backgroundColor: 'var(--color-surface-low)',
          height: '8px',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
        }}
      >
        <div
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={label}
          style={{
            height: '100%',
            width: `${percent}%`,
            backgroundColor: 'var(--color-accent)',
            borderRadius: 'var(--radius-full)',
            transition: 'width var(--duration-normal) var(--ease-out)',
          }}
        />
      </div>
    </div>
  );
}

export default ProgressCounter;
