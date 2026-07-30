/**
 * ProductsClient — Client component utama halaman Manajemen Produk
 *
 * Redesign per ISSUE-029-D5:
 * - Tabel desktop dengan sticky header, StatusPill, hover-reveal actions
 * - Mobile: card list dengan swipe-like action buttons
 * - Komponen dipisah: ProductFilterBar, ProductTableRow/Mobile, ProductFormModal
 *
 * Design ref: stitch_web_application_ui_ux_design/manajemen_produk_smartstock_final
 */

'use client';

import { useState, useMemo, useTransition } from 'react';
import { softDeleteProduct, restoreProduct } from './actions';
import { ProductFilterBar }   from '@/components/products/ProductFilterBar';
import { ProductTableRow, ProductMobileCard } from '@/components/products/ProductTableRow';
import { ProductFormModal }   from '@/components/products/ProductFormModal';
import type { Product } from '@/components/products/types';


interface ProductsClientProps {
  initialProducts: Product[];
  categories: string[];
  canManage: boolean;
}

export default function ProductsClient({
  initialProducts,
  categories,
  canManage,
}: ProductsClientProps) {
  const [search, setSearch]                   = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus]   = useState('');
  const [showInactive, setShowInactive]       = useState(false);
  const [formProduct, setFormProduct]         = useState<Product | null | 'new'>(null);
  const [isPending, startTransition]          = useTransition();

  /* ── Filtering ── */
  const filtered = useMemo(() => {
    return initialProducts.filter((p) => {
      if (!showInactive && !p.isActive) return false;

      if (selectedCategory && p.category !== selectedCategory) return false;

      if (selectedStatus) {
        const isOut = p.totalStock === 0;
        const isLow = !isOut && p.totalStock <= p.minStock;
        const isOk  = !isOut && !isLow;
        if (selectedStatus === 'ok'  && !isOk)  return false;
        if (selectedStatus === 'low' && !isLow) return false;
        if (selectedStatus === 'out' && !isOut) return false;
      }

      if (search) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q)    ||
          p.sku.toLowerCase().includes(q)     ||
          p.category.toLowerCase().includes(q)||
          (p.barcode ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [initialProducts, search, selectedCategory, selectedStatus, showInactive]);

  /* ── Actions ── */
  const handleToggle = (p: Product) => {
    startTransition(async () => {
      if (p.isActive) await softDeleteProduct(p.id);
      else             await restoreProduct(p.id);
    });
  };

  return (
    <>
      {/* ── Filter Bar ── */}
      <ProductFilterBar
        search={search}
        onSearchChange={setSearch}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        showInactive={showInactive}
        onToggleInactive={setShowInactive}
        categories={categories}
        canManage={canManage}
        onAddProduct={() => setFormProduct('new')}
      />

      {/* ── Desktop Table ── */}
      <div className="ss-table-container">
        <div className="ss-table-scroll">
          <table aria-label="Tabel Inventaris Produk" className="ss-table">
            <thead className="ss-table-head">
              <tr>
                <th className="ss-table-th ss-table-th--check">
                  <input type="checkbox" aria-label="Pilih semua" className="ss-table-checkbox" />
                </th>
                <th className="ss-table-th" scope="col">SKU</th>
                <th className="ss-table-th ss-table-th--name" scope="col">Nama Produk</th>
                <th className="ss-table-th" scope="col">Kategori</th>
                <th className="ss-table-th ss-table-th--right" scope="col">Tingkat Stok</th>
                <th className="ss-table-th ss-table-th--right" scope="col">Stok Min.</th>
                <th className="ss-table-th ss-table-th--right" scope="col">Harga</th>
                <th className="ss-table-th ss-table-th--center" scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody className="ss-table-body">
              {filtered.map((product) => (
                <ProductTableRow
                  key={product.id}
                  product={product}
                  canManage={canManage}
                  isPending={isPending}
                  onEdit={(p) => setFormProduct(p)}
                  onToggle={handleToggle}
                />
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="ss-table-empty">
              <span className="material-symbols-outlined ss-table-empty-icon">inventory_2</span>
              <p className="ss-table-empty-title">Tidak ada produk ditemukan</p>
              <p className="ss-table-empty-desc">Coba ubah kata kunci pencarian atau filter Anda.</p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="ss-table-footer">
          <span aria-live="polite" className="ss-table-footer-count">
            Menampilkan {filtered.length} dari {initialProducts.length} produk
          </span>
          <div className="ss-table-footer-nav">
            <button
              className="ss-table-page-btn"
              disabled
              aria-label="Halaman Sebelumnya"
            >
              Seb.
            </button>
            <button
              className="ss-table-page-btn"
              aria-label="Halaman Selanjutnya"
            >
              Lanjut
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Card List ── */}
      <div className="ss-product-card-list">
        {filtered.map((product) => (
          <ProductMobileCard
            key={product.id}
            product={product}
            canManage={canManage}
            isPending={isPending}
            onEdit={(p) => setFormProduct(p)}
            onToggle={handleToggle}
          />
        ))}
        {filtered.length === 0 && (
          <div className="ss-table-empty">
            <span className="material-symbols-outlined ss-table-empty-icon">inventory_2</span>
            <p className="ss-table-empty-title">Tidak ada produk ditemukan</p>
          </div>
        )}
      </div>

      {/* ── Modal Form ── */}
      {formProduct !== null && (
        <ProductFormModal
          product={formProduct === 'new' ? undefined : formProduct}
          onClose={() => setFormProduct(null)}
        />
      )}
    </>
  );
}
