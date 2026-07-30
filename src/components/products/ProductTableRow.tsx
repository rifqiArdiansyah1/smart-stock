/**
 * ProductTableRow — Satu baris di tabel manajemen produk
 *
 * Design ref: stitch manajemen_produk_smartstock_final
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
    <tr className={`ss-table-row group ${!product.isActive ? 'ss-table-row--inactive' : ''}`}>
      {/* Checkbox */}
      <td className="ss-table-td ss-table-td--check">
        <input
          type="checkbox"
          aria-label={`Pilih ${product.name}`}
          className="ss-table-checkbox"
        />
      </td>

      {/* SKU */}
      <td className="ss-table-td ss-table-td--sku">
        {product.sku}
      </td>

      {/* Nama + thumbnail */}
      <td className="ss-table-td ss-table-td--name">
        <div className="ss-product-cell">
          <div className="ss-product-thumb">
            <span className="material-symbols-outlined ss-product-thumb-icon">inventory_2</span>
          </div>
          <span className="ss-product-name">{product.name}</span>
        </div>
      </td>

      {/* Kategori */}
      <td className="ss-table-td ss-table-td--cat">
        {product.category}
      </td>

      {/* Tingkat Stok */}
      <td className="ss-table-td ss-table-td--stock">
        <StatusPill status={stockStatus} label={stockLabel} />
      </td>

      {/* Stok Min */}
      <td className="ss-table-td ss-table-td--minstock">
        {product.minStock}
      </td>

      {/* Harga */}
      <td className="ss-table-td ss-table-td--price">
        {formatCurrency(product.price)}
      </td>

      {/* Aksi */}
      <td className="ss-table-td ss-table-td--actions">
        <div className="ss-table-actions">
          {canManage && (
            <>
              <button
                aria-label={`Edit ${product.name}`}
                className="ss-table-action-btn"
                onClick={() => onEdit(product)}
                type="button"
              >
                <span className="material-symbols-outlined">edit</span>
              </button>
              <button
                aria-label={product.isActive ? `Nonaktifkan ${product.name}` : `Aktifkan ${product.name}`}
                className={`ss-table-action-btn ${product.isActive ? 'ss-table-action-btn--danger' : 'ss-table-action-btn--success'}`}
                onClick={() => onToggle(product)}
                disabled={isPending}
                type="button"
              >
                <span className="material-symbols-outlined">
                  {product.isActive ? 'delete' : 'restore'}
                </span>
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
    <div className={`ss-product-card ${!product.isActive ? 'ss-product-card--inactive' : ''}`}>
      <div className="ss-product-card-header">
        {/* Thumbnail */}
        <div className="ss-product-thumb ss-product-thumb--lg">
          <span className="material-symbols-outlined ss-product-thumb-icon">inventory_2</span>
        </div>

        {/* Info */}
        <div className="ss-product-card-info">
          <p className="ss-product-name">{product.name}</p>
          <p className="ss-product-sku">{product.sku}</p>
          <p className="ss-product-cat">{product.category}</p>
        </div>

        {/* Pill */}
        <StatusPill status={stockStatus} label={stockLabel} />
      </div>

      <div className="ss-product-card-footer">
        <span className="ss-product-price">
          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.price)}
        </span>
        <span className="ss-product-minstock">Min: {product.minStock}</span>
        {canManage && (
          <div className="ss-product-card-actions">
            <button
              aria-label={`Edit ${product.name}`}
              className="ss-table-action-btn"
              onClick={() => onEdit(product)}
              type="button"
            >
              <span className="material-symbols-outlined">edit</span>
            </button>
            <button
              aria-label={product.isActive ? `Nonaktifkan ${product.name}` : `Aktifkan ${product.name}`}
              className={`ss-table-action-btn ${product.isActive ? 'ss-table-action-btn--danger' : 'ss-table-action-btn--success'}`}
              onClick={() => onToggle(product)}
              disabled={isPending}
              type="button"
            >
              <span className="material-symbols-outlined">
                {product.isActive ? 'delete' : 'restore'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
