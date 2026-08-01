/**
 * ProductFilterBar — Toolbar search + filter Manajemen Produk
 *
 * Desktop: row inline (search | kategori | status stok | CTA)
 * Mobile: dua baris (search | filter buttons)
 *
 * Menggunakan Tailwind CSS v4.
 */

'use client';

import React from 'react';

interface ProductFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  selectedCategory: string;
  onCategoryChange: (v: string) => void;
  selectedStatus: string;
  onStatusChange: (v: string) => void;
  showInactive: boolean;
  onToggleInactive: (v: boolean) => void;
  categories: string[];
  canManage: boolean;
  onAddProduct: () => void;
}

export function ProductFilterBar({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  showInactive,
  onToggleInactive,
  categories,
  canManage,
  onAddProduct,
}: ProductFilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center w-full mb-6">
      {/* Search */}
      <div className="relative w-full md:max-w-md group">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
          {/* <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg> */}
        </span>
        <input
          id="product-search"
          type="text"
          aria-label="Cari produk"
          placeholder="Cari nama produk, SKU, atau kategori..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* Kategori */}
        <div className="relative min-w-[140px]">
          <select
            id="product-category-filter"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
            aria-label="Filter kategori"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </span>
        </div>

        {/* Status Stok */}
        <div className="relative min-w-[140px]">
          <select
            id="product-status-filter"
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
            aria-label="Filter status stok"
          >
            <option value="">Semua Status</option>
            <option value="ok">Stok Aman</option>
            <option value="low">Stok Rendah</option>
            <option value="out">Habis</option>
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </span>
        </div>

        {/* Toggle nonaktif */}
        <label
          htmlFor="show-inactive"
          className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 dark:text-slate-300 select-none py-2.5 px-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => onToggleInactive(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            id="show-inactive"
          />
          Tampilkan nonaktif
        </label>

        {/* CTA */}
        {canManage && (
          <button
            id="btn-tambah-produk"
            onClick={onAddProduct}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Tambah Produk
          </button>
        )}
      </div>
    </div>
  );
}

export default ProductFilterBar;
