'use client';

import { useState, useMemo, useTransition } from 'react';
import { softDeleteProduct, restoreProduct } from './actions';
import ProductForm from './ProductForm';
import BarcodeViewer from './BarcodeViewer';

type Product = {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  category: string;
  unit: string;
  price: number;
  minStock: number;
  totalStock: number;
  expiryDate?: string | null;
  isActive: boolean;
  createdAt: string;
};

interface ProductsClientProps {
  initialProducts: Product[];
  categories: string[];
  canManage: boolean;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

function isNearExpiry(expiryDate?: string | null): boolean {
  if (!expiryDate) return false;
  const days = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days > 0 && days <= 30;
}

function isExpired(expiryDate?: string | null): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}

export default function ProductsClient({ initialProducts, categories, canManage }: ProductsClientProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [formProduct, setFormProduct] = useState<Product | null | 'new'>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return initialProducts.filter((p) => {
      if (!showInactive && !p.isActive) return false;
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [initialProducts, search, selectedCategory, showInactive]);

  const handleToggle = (p: Product) => {
    startTransition(async () => {
      if (p.isActive) await softDeleteProduct(p.id);
      else await restoreProduct(p.id);
    });
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama, SKU, atau barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Show Inactive Toggle */}
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 rounded accent-primary-600"
          />
          Tampilkan nonaktif
        </label>

        {/* Add Button */}
        {canManage && (
          <button
            onClick={() => setFormProduct('new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-primary-500/20 transition-all whitespace-nowrap active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Produk
          </button>
        )}
      </div>

      {/* Product Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm bg-white">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Produk</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU / Barcode</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Harga</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stok</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((product) => {
              const isLow = product.isActive && product.totalStock <= product.minStock;
              const nearExp = isNearExpiry(product.expiryDate);
              const expired = isExpired(product.expiryDate);

              return (
                <tr key={product.id} className={`transition-colors ${!product.isActive ? 'opacity-50' : 'hover:bg-slate-50/70'}`}>
                  {/* Produk */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {/* Foto placeholder */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0 text-lg">
                        📦
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm leading-tight">{product.name}</p>
                        <p className="text-xs text-slate-400">{product.category} · {product.unit}</p>
                      </div>
                    </div>
                  </td>

                  {/* SKU / Barcode */}
                  <td className="px-5 py-4">
                    <p className="font-mono text-xs text-slate-700 font-medium">{product.sku}</p>
                    {product.barcode && (
                      <p className="text-xs text-slate-400 font-mono">{product.barcode}</p>
                    )}
                  </td>

                  {/* Harga */}
                  <td className="px-5 py-4 font-semibold text-slate-700 whitespace-nowrap">
                    {formatCurrency(product.price)}
                  </td>

                  {/* Stok */}
                  <td className="px-5 py-4">
                    <span className={`font-bold text-base ${isLow ? 'text-red-500' : 'text-slate-700'}`}>
                      {product.totalStock}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">{product.unit}</span>
                    {isLow && (
                      <p className="text-xs text-red-400 mt-0.5">⚠️ Min: {product.minStock}</p>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ring-1 w-fit ${
                        product.isActive ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-slate-100 text-slate-500 ring-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${product.isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
                        {product.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                      {expired && (
                        <span className="text-xs text-red-500 font-medium">🚫 Kadaluarsa</span>
                      )}
                      {!expired && nearExp && (
                        <span className="text-xs text-amber-500 font-medium">⏰ Segera Kadaluarsa</span>
                      )}
                    </div>
                  </td>

                  {/* Aksi */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      {/* Barcode */}
                      {product.barcode && (
                        <BarcodeViewer
                          barcode={product.barcode}
                          productName={product.name}
                          sku={product.sku}
                        />
                      )}

                      {canManage && (
                        <>
                          {/* Edit */}
                          <button
                            onClick={() => setFormProduct(product)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Edit produk"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>

                          {/* Toggle Active */}
                          <button
                            onClick={() => handleToggle(product)}
                            disabled={isPending}
                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                              product.isActive
                                ? 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                                : 'hover:bg-green-50 text-slate-400 hover:text-green-600'
                            }`}
                            title={product.isActive ? 'Nonaktifkan produk' : 'Aktifkan kembali'}
                          >
                            {product.isActive ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400">
            <p className="text-4xl mb-3">📦</p>
            <p className="font-medium text-slate-600">Tidak ada produk ditemukan</p>
            <p className="text-sm mt-1">Coba ubah kata kunci pencarian atau filter Anda.</p>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-400 pb-4">
        Menampilkan {filtered.length} dari {initialProducts.length} produk
      </p>

      {/* Product Form Modal */}
      {formProduct !== null && (
        <ProductForm
          product={formProduct === 'new' ? undefined : formProduct}
          onClose={() => setFormProduct(null)}
        />
      )}
    </>
  );
}
