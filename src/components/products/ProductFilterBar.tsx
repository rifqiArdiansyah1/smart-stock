/**
 * ProductFilterBar — Toolbar search + filter Manajemen Produk
 *
 * Desktop: row inline (search | kategori | status stok | CTA)
 * Mobile: dua baris (search | filter buttons)
 *
 * Design ref: stitch_web_application_ui_ux_design/manajemen_produk_smartstock_final
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
    <div className="ss-filter-bar">
      {/* Search */}
      <div className="ss-filter-search-wrap">
        <span className="material-symbols-outlined ss-filter-search-icon">search</span>
        <input
          id="product-search"
          type="text"
          aria-label="Cari produk"
          placeholder="Cari nama produk, SKU, atau kategori..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="ss-filter-search-input"
        />
      </div>

      {/* Filters row */}
      <div className="ss-filter-actions">
        {/* Kategori */}
        <div className="ss-filter-select-wrap">
          <span className="material-symbols-outlined ss-filter-select-icon">filter_list</span>
          <select
            id="product-category-filter"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="ss-filter-select"
            aria-label="Filter kategori"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Status Stok */}
        <div className="ss-filter-select-wrap">
          <span className="material-symbols-outlined ss-filter-select-icon">inventory</span>
          <select
            id="product-status-filter"
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="ss-filter-select"
            aria-label="Filter status stok"
          >
            <option value="">Semua Status</option>
            <option value="ok">Stok Aman</option>
            <option value="low">Stok Rendah</option>
            <option value="out">Habis</option>
          </select>
        </div>

        {/* Toggle nonaktif */}
        <label className="ss-filter-toggle-label">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => onToggleInactive(e.target.checked)}
            className="ss-filter-toggle-check"
            id="show-inactive"
          />
          Tampilkan nonaktif
        </label>

        {/* CTA */}
        {canManage && (
          <button
            id="btn-tambah-produk"
            onClick={onAddProduct}
            className="ss-btn-primary"
            type="button"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            Tambah Produk
          </button>
        )}
      </div>
    </div>
  );
}
