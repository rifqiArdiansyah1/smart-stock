/**
 * StatusPill — Warehouse Signal Signature Element
 *
 * Menampilkan status stok sebagai pill: [● 245 pcs]
 * Menggunakan JetBrains Mono untuk angka agar presisi dan terbaca seketika.
 *
 * @example
 * <StatusPill value={245} unit="pcs" status="ok" />
 * <StatusPill value={5} unit="pcs" status="critical" />
 */

import React from 'react';

export type StockStatus = 'ok' | 'warn' | 'critical' | 'expired' | 'neutral';

interface StatusPillProps {
  /** Angka stok atau nilai yang ditampilkan */
  value: number | string;
  /** Satuan (pcs, kg, box, dll) */
  unit?: string;
  /** Status yang menentukan warna pill */
  status: StockStatus;
  /** Ukuran pill */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<StockStatus, { bg: string; text: string; dot: string; label: string }> = {
  ok: {
    bg:    'var(--color-ok-surface)',
    text:  'var(--color-ok-text)',
    dot:   'var(--color-ok)',
    label: 'Stok Aman',
  },
  warn: {
    bg:    'var(--color-warn-surface)',
    text:  'var(--color-warn-text)',
    dot:   'var(--color-warn)',
    label: 'Stok Menipis',
  },
  critical: {
    bg:    'var(--color-critical-surface)',
    text:  'var(--color-critical-text)',
    dot:   'var(--color-critical)',
    label: 'Stok Kritis',
  },
  expired: {
    bg:    'var(--color-expired-surface)',
    text:  'var(--color-expired)',
    dot:   'var(--color-expired)',
    label: 'Kedaluwarsa',
  },
  neutral: {
    bg:    'var(--color-surface-low)',
    text:  'var(--color-text-secondary)',
    dot:   'var(--color-text-disabled)',
    label: 'Tidak diketahui',
  },
};

const sizeConfig = {
  sm: { padding: '2px 8px',  fontSize: '0.6875rem', gap: '4px',  dotSize: '6px'  },
  md: { padding: '3px 10px', fontSize: '0.75rem',   gap: '5px',  dotSize: '7px'  },
  lg: { padding: '4px 12px', fontSize: '0.875rem',  gap: '6px',  dotSize: '8px'  },
};

export function StatusPill({
  value,
  unit = 'pcs',
  status,
  size = 'md',
  className = '',
}: StatusPillProps) {
  const cfg  = statusConfig[status];
  const szCfg = sizeConfig[size];

  return (
    <span
      className={className}
      role="status"
      aria-label={`${cfg.label}: ${value} ${unit}`}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            szCfg.gap,
        padding:        szCfg.padding,
        borderRadius:   'var(--radius-full)',
        backgroundColor: cfg.bg,
        color:          cfg.text,
        fontFamily:     'var(--font-mono)',
        fontSize:       szCfg.fontSize,
        fontWeight:     500,
        letterSpacing:  '0.02em',
        whiteSpace:     'nowrap',
        userSelect:     'none',
      }}
    >
      {/* Dot indicator */}
      <span
        aria-hidden="true"
        style={{
          display:         'inline-block',
          width:           szCfg.dotSize,
          height:          szCfg.dotSize,
          borderRadius:    '50%',
          backgroundColor: cfg.dot,
          flexShrink:      0,
        }}
      />
      <span>
        {value} {unit}
      </span>
    </span>
  );
}

/**
 * Helper: tentukan status stok berdasarkan jumlah dan minimum stok
 */
export function getStockStatus(current: number, minStock: number): StockStatus {
  if (current <= 0)              return 'critical';
  if (current <= minStock)       return 'critical';
  if (current <= minStock * 1.5) return 'warn';
  return 'ok';
}

export default StatusPill;
