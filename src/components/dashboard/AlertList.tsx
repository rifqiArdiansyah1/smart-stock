/**
 * AlertList — Warehouse Signal
 * Daftar peringatan produk stok kritis / kedaluwarsa dengan styling Tailwind
 */

import React from 'react';
import { StatusPill } from '@/components/ui/StatusPill';

export interface AlertItemData {
  id: string;
  sku: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
  isExpired?: boolean;
}

interface AlertListProps {
  items: AlertItemData[];
  onReorderClick?: (item: AlertItemData) => void;
}

export function AlertList({ items, onReorderClick }: AlertListProps) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-500/10 border-b border-red-100 dark:border-red-500/20">
        <div className="flex items-center gap-2">
          <span className="text-red-500 dark:text-red-400 flex">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </span>
          <h3 className="font-sans text-base font-bold text-red-700 dark:text-red-400 m-0">
            Stok Kritis & Alerts
          </h3>
        </div>
        <span className="font-mono text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
          {items.length} Barang
        </span>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
            🎉 Tidak ada stok kritis saat ini.
          </div>
        ) : (
          <ul className="list-none m-0 p-0">
            {items.map((item, i) => (
              <li
                key={item.id}
                className={`flex items-center justify-between p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                  i < items.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/50' : ''
                }`}
              >
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {item.sku}
                  </span>
                  <p className="font-sans text-sm text-slate-800 dark:text-slate-200 mt-1 mb-0 font-medium">
                    {item.name}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <StatusPill
                    value={item.currentStock}
                    unit={item.unit}
                    status={item.isExpired ? 'expired' : 'critical'}
                    size="sm"
                  />

                  {onReorderClick && (
                    <button
                      type="button"
                      onClick={() => onReorderClick(item)}
                      title="Restock barang"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white border-none rounded-md font-sans text-xs font-medium cursor-pointer transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      Pesan
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default AlertList;
