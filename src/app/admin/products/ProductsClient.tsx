/**
 * ProductsClient — Client component utama halaman Manajemen Produk
 *
 * Menggunakan Tailwind CSS v4.
 * - Tabel desktop dengan sticky header, hover effects, dan card style.
 * - Mobile: card list dengan swipe-like action buttons
 * - Komponen dipisah: ProductFilterBar, ProductTableRow/Mobile, ProductFormModal
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
    <div className="flex flex-col gap-4 animate-fade-in">
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
      <div className="hidden md:flex flex-col bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table aria-label="Tabel Inventaris Produk" className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4 w-12 text-center">
                  <input type="checkbox" aria-label="Pilih semua" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                </th>
                <th className="p-4 font-sans font-semibold text-slate-600 dark:text-slate-300" scope="col">SKU</th>
                <th className="p-4 font-sans font-semibold text-slate-600 dark:text-slate-300" scope="col">Nama Produk</th>
                <th className="p-4 font-sans font-semibold text-slate-600 dark:text-slate-300" scope="col">Kategori</th>
                <th className="p-4 font-sans font-semibold text-slate-600 dark:text-slate-300 text-right" scope="col">Tingkat Stok</th>
                <th className="p-4 font-sans font-semibold text-slate-600 dark:text-slate-300 text-right" scope="col">Stok Min.</th>
                <th className="p-4 font-sans font-semibold text-slate-600 dark:text-slate-300 text-right" scope="col">Harga</th>
                <th className="p-4 font-sans font-semibold text-slate-600 dark:text-slate-300 text-center" scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
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
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <p className="font-sans font-bold text-slate-700 dark:text-slate-300 text-lg m-0 mb-1">Tidak ada produk ditemukan</p>
              <p className="font-sans text-slate-500 dark:text-slate-400 text-sm m-0">Coba ubah kata kunci pencarian atau filter Anda.</p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 text-sm">
          <span aria-live="polite" className="text-slate-500 dark:text-slate-400 font-medium">
            Menampilkan <span className="font-bold text-slate-800 dark:text-slate-200">{filtered.length}</span> dari {initialProducts.length} produk
          </span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 cursor-not-allowed text-xs font-medium" disabled aria-label="Halaman Sebelumnya">
              Seb.
            </button>
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors text-xs font-medium" aria-label="Halaman Selanjutnya">
              Lanjut
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Card List ── */}
      <div className="flex md:hidden flex-col gap-4">
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
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <p className="font-sans font-bold text-slate-700 dark:text-slate-300 m-0">Tidak ada produk ditemukan</p>
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
    </div>
  );
}
