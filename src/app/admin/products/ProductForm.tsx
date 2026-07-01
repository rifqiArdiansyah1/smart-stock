'use client';

import { useActionState, useEffect } from 'react';
import { createProduct, updateProduct } from './actions';

type Product = {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  category: string;
  unit: string;
  price: number;
  minStock: number;
  expiryDate?: string | Date | null;
};

interface ProductFormProps {
  product?: Product;       // Jika ada → mode Edit, jika tidak → mode Create
  onClose: () => void;
}

const CATEGORIES = [
  'Minuman', 'Makanan', 'Snack', 'Sembako', 'Roti & Kue', 'Bumbu Dapur',
  'Kebersihan', 'Perawatan Diri', 'Alat Tulis', 'Elektronik', 'Lainnya',
];

const UNITS = ['pcs', 'kg', 'liter', 'gram', 'botol', 'karung', 'lusin', 'dus', 'pak', 'roll'];

function formatDateForInput(date?: string | Date | null): string {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
}

export default function ProductForm({ product, onClose }: ProductFormProps) {
  const isEdit = !!product;
  const action = isEdit ? updateProduct : createProduct;
  const [state, formAction, isPending] = useActionState(action, undefined);

  // Auto-close on success
  useEffect(() => {
    if (state?.success) onClose();
  }, [state?.success, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/80 my-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {isEdit ? `Mengedit: ${product.name}` : 'Isi detail produk baru di bawah ini.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form action={formAction} className="px-6 py-5 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Hidden ID for edit mode */}
          {isEdit && <input type="hidden" name="id" value={product.id} />}

          <div className="grid grid-cols-2 gap-4">
            {/* Nama */}
            <div className="col-span-2">
              <label htmlFor="p-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                Nama Produk <span className="text-red-500">*</span>
              </label>
              <input
                id="p-name"
                name="name"
                type="text"
                required
                defaultValue={product?.name}
                placeholder="Aqua Botol 600ml"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
              />
            </div>

            {/* SKU */}
            <div>
              <label htmlFor="p-sku" className="block text-sm font-medium text-slate-700 mb-1.5">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                id="p-sku"
                name="sku"
                type="text"
                required
                defaultValue={product?.sku}
                placeholder="AQU-600ML"
                disabled={isEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm disabled:bg-slate-50 disabled:text-slate-400 uppercase"
              />
              {isEdit && <p className="text-xs text-slate-400 mt-1">SKU tidak bisa diubah.</p>}
            </div>

            {/* Barcode */}
            <div>
              <label htmlFor="p-barcode" className="block text-sm font-medium text-slate-700 mb-1.5">
                Barcode
              </label>
              <input
                id="p-barcode"
                name="barcode"
                type="text"
                defaultValue={product?.barcode ?? ''}
                placeholder="8995566778800"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
              />
            </div>

            {/* Kategori */}
            <div>
              <label htmlFor="p-category" className="block text-sm font-medium text-slate-700 mb-1.5">
                Kategori
              </label>
              <select
                id="p-category"
                name="category"
                defaultValue={product?.category ?? 'Umum'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div>
              <label htmlFor="p-unit" className="block text-sm font-medium text-slate-700 mb-1.5">
                Satuan <span className="text-red-500">*</span>
              </label>
              <select
                id="p-unit"
                name="unit"
                required
                defaultValue={product?.unit ?? 'pcs'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm bg-white"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* Harga */}
            <div>
              <label htmlFor="p-price" className="block text-sm font-medium text-slate-700 mb-1.5">
                Harga (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                id="p-price"
                name="price"
                type="number"
                required
                min={0}
                defaultValue={product?.price}
                placeholder="5000"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
              />
            </div>

            {/* Min Stock */}
            <div>
              <label htmlFor="p-minstock" className="block text-sm font-medium text-slate-700 mb-1.5">
                Min. Stok Alert
              </label>
              <input
                id="p-minstock"
                name="minStock"
                type="number"
                min={0}
                defaultValue={product?.minStock ?? 0}
                placeholder="10"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">Notifikasi saat stok di bawah nilai ini.</p>
            </div>

            {/* Expiry Date */}
            <div className="col-span-2">
              <label htmlFor="p-expiry" className="block text-sm font-medium text-slate-700 mb-1.5">
                Tanggal Kadaluarsa
              </label>
              <input
                id="p-expiry"
                name="expiryDate"
                type="date"
                defaultValue={formatDateForInput(product?.expiryDate)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">Kosongkan jika produk tidak memiliki tanggal kadaluarsa.</p>
            </div>
          </div>

          {/* Error Message */}
          {state?.error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {state.error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold disabled:opacity-60 shadow-sm transition-all"
            >
              {isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
