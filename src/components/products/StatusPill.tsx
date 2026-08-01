/**
 * StatusPill — Komponen badge status stok produk
 *
 * Menggunakan kelas Tailwind CSS modern.
 * Varian: success | warning | critical | inactive
 */

import React from 'react';

export type StockStatus = 'success' | 'warning' | 'critical' | 'inactive';

interface StatusPillProps {
  status: StockStatus;
  label: string;
}

const variantStyles: Record<StockStatus, string> = {
  success:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  warning:  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  critical: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400',
};

const dotStyles: Record<StockStatus, string> = {
  success:  'bg-emerald-500 dark:bg-emerald-400',
  warning:  'bg-amber-500 dark:bg-amber-400',
  critical: 'bg-red-500 dark:bg-red-400',
  inactive: 'bg-slate-400 dark:bg-slate-500',
};

export function StatusPill({ status, label }: StatusPillProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium text-xs whitespace-nowrap transition-colors ${variantStyles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status]}`} />
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
