/**
 * StatusPill — Komponen badge status stok produk
 *
 * Menggunakan CSS vars dari Design System (issue #30).
 * Varian: success | warning | critical | inactive
 */

import React from 'react';

export type StockStatus = 'success' | 'warning' | 'critical' | 'inactive';

interface StatusPillProps {
  status: StockStatus;
  label: string;
}

const variantStyles: Record<StockStatus, string> = {
  success:  'ss-pill-success',
  warning:  'ss-pill-warning',
  critical: 'ss-pill-critical',
  inactive: 'ss-pill-inactive',
};

export function StatusPill({ status, label }: StatusPillProps) {
  return (
    <span className={`ss-pill ${variantStyles[status]}`}>
      <span className="ss-pill-dot" />
      {label}
    </span>
  );
}

export function getStockStatus(totalStock: number, minStock: number, isActive: boolean): StockStatus {
  if (!isActive) return 'inactive';
  if (totalStock === 0) return 'critical';
  if (totalStock <= minStock) return 'warning';
  return 'success';
}
