/**
 * ProductTableRow — Satu baris di tabel manajemen produk
 *
 * Menggunakan Tailwind CSS v4.
 * - Thumbnail 40x40, sticky hover → reveal edit/delete actions
 * - StatusPill dengan 3 varian
 * - Aksi: edit, toggle aktif/nonaktif
 */

'use client';

import React from 'react';
import { StatusPill, getStockStatus } from './StatusPill';
import type { Product } from './types';

interface ProductTableRowProps {
  product: Product;
  canManage: boolean;
  isPending: boolean;
  onEdit: (p: Product) => void;
  onToggle: (p: Product) => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProductTableRow({
  product,
  canManage,
  isPending,
  onEdit,
  onToggle,
}: ProductTableRowProps) {
  const stockStatus = getStockStatus(product.totalStock, product.minStock, product.isActive);

  const stockLabel =
    product.isActive
      ? `${product.totalStock} ${product.unit}`
      : 'Nonaktif';

  return (
    <tr className={`group border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!product.isActive ? 'opacity-50 grayscale' : ''}`}>
      {/* Checkbox */}
      <td className="p-4 w-12 text-center">
        <input
          type="checkbox"
          aria-label={`Pilih ${product.name}`}
          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
      </td>

      {/* SKU */}
      <td className="p-4 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
        {product.sku}
      </td>

      {/* Nama + thumbnail */}
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
            <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <span className="font-sans font-medium text-slate-800 dark:text-slate-200">{product.name}</span>
        </div>
      </td>

      {/* Kategori */}
      <td className="p-4 font-sans text-sm text-slate-600 dark:text-slate-300">
        {product.category}
      </td>

      {/* Tingkat Stok */}
      <td className="p-4 text-right">
        <StatusPill status={stockStatus} label={stockLabel} />
      </td>

      {/* Stok Min */}
      <td className="p-4 text-right font-mono text-sm text-slate-600 dark:text-slate-400">
        {product.minStock}
      </td>

      {/* Harga */}
      <td className="p-4 text-right font-sans text-sm font-medium text-slate-700 dark:text-slate-300">
        {formatCurrency(product.price)}
      </td>

      {/* Aksi */}
      <td className="p-4 text-center align-middle">
        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {canManage && (
            <>
              <button
                aria-label={`Edit ${product.name}`}
                className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={() => onEdit(product)}
                type="button"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </button>
              <button
                aria-label={product.isActive ? `Nonaktifkan ${product.name}` : `Aktifkan ${product.name}`}
                className={`p-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 ${
                  product.isActive 
                    ? 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/20 focus:ring-red-500' 
                    : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 focus:ring-emerald-500'
                }`}
                onClick={() => onToggle(product)}
                disabled={isPending}
                type="button"
              >
                {product.isActive ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                  </svg>
                )}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ──────────────────────────────────────────────────────────────
   Mobile Card — fallback untuk viewport kecil
   ────────────────────────────────────────────────────────────── */
export function ProductMobileCard({
  product,
  canManage,
  isPending,
  onEdit,
  onToggle,
}: ProductTableRowProps) {
  const stockStatus = getStockStatus(product.totalStock, product.minStock, product.isActive);
  const stockLabel  = product.isActive ? `${product.totalStock} ${product.unit}` : 'Nonaktif';

  return (
    <div className={`flex flex-col p-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700/50 ${!product.isActive ? 'opacity-50 grayscale' : ''}`}>
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600">
          <svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-sans font-medium text-slate-800 dark:text-slate-200 truncate">{product.name}</p>
          <p className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{product.sku}</p>
          <p className="font-sans text-xs text-slate-400 mt-0.5">{product.category}</p>
        </div>

        {/* Pill */}
        <div className="shrink-0">
          <StatusPill status={stockStatus} label={stockLabel} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <span className="font-sans font-bold text-indigo-600 dark:text-indigo-400 text-sm">
            {formatCurrency(product.price)}
          </span>
          <span className="font-mono text-xs text-slate-400">Min: {product.minStock}</span>
        </div>
        
        {canManage && (
          <div className="flex items-center gap-2">
            <button
              aria-label={`Edit ${product.name}`}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
              onClick={() => onEdit(product)}
              type="button"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </button>
            <button
              aria-label={product.isActive ? `Nonaktifkan ${product.name}` : `Aktifkan ${product.name}`}
              className={`p-2 rounded-lg transition-colors ${
                product.isActive 
                  ? 'bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400' 
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400'
              }`}
              onClick={() => onToggle(product)}
              disabled={isPending}
              type="button"
            >
              {product.isActive ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
