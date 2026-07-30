/**
 * ProductFormModal — Modal Tambah/Edit Produk
 *
 * Design ref: stitch tambah_produk_baru_smartstock/code.html
 * - 2-kolom grid desktop / 1-kolom mobile
 * - Validasi inline (error per field)
 * - ImageUpload drag-drop
 * - Accessible: label, aria-required, aria-invalid, aria-describedby
 */

'use client';

import { useActionState, useEffect, useState } from 'react';
import { createProduct, updateProduct } from '@/app/admin/products/actions';
import ImageUpload from '@/app/components/ImageUpload';

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
  imageUrl?: string | null;
};

interface ProductFormModalProps {
  product?: Product;
  onClose: () => void;
}

const CATEGORIES = [
  'Minuman', 'Makanan', 'Snack', 'Sembako', 'Roti & Kue', 'Bumbu Dapur',
  'Kebersihan', 'Perawatan Diri', 'Baking', 'Makanan Kering', 'Elektronik', 'Lainnya',
];

const UNITS = ['pcs', 'kg', 'liter', 'gram', 'botol', 'karung', 'lusin', 'dus', 'pak', 'roll'];

function formatDateForInput(date?: string | Date | null): string {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
}

export function ProductFormModal({ product, onClose }: ProductFormModalProps) {
  const isEdit = !!product;
  const action = isEdit ? updateProduct : createProduct;
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [imageUrl, setImageUrl] = useState<string>(product?.imageUrl || '');

  // Auto-close on success
  useEffect(() => {
    if (state?.success) onClose();
  }, [state?.success, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="ss-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Overlay */}
      <div className="ss-modal-overlay" onClick={onClose} />

      {/* Sheet */}
      <div className="ss-modal-sheet">
        {/* ── Header ── */}
        <div className="ss-modal-header">
          <div>
            <h2 id="modal-title" className="ss-modal-title">
              {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h2>
            <p className="ss-modal-subtitle">
              {isEdit
                ? `Mengedit: ${product.name}`
                : 'Masukkan detail produk untuk ditambahkan ke inventory.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ss-modal-close-btn"
            aria-label="Tutup modal"
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* ── Form Body ── */}
        <form action={formAction} className="ss-modal-body">
          {isEdit && <input type="hidden" name="id" value={product.id} />}

          {/* 2-col grid */}
          <div className="ss-form-grid">

            {/* Nama Produk — full width */}
            <div className="ss-form-field ss-form-field--full">
              <label htmlFor="pf-name" className="ss-form-label">
                Nama Produk <span className="ss-required">*</span>
              </label>
              <input
                id="pf-name"
                name="name"
                type="text"
                required
                aria-required="true"
                defaultValue={product?.name}
                placeholder="Contoh: Minyak Goreng 2L"
                className="ss-form-input"
              />
            </div>

            {/* SKU */}
            <div className="ss-form-field">
              <label htmlFor="pf-sku" className="ss-form-label">
                SKU <span className="ss-required">*</span>
              </label>
              <input
                id="pf-sku"
                name="sku"
                type="text"
                required
                aria-required="true"
                defaultValue={product?.sku}
                placeholder="MG-2L-001"
                disabled={isEdit}
                className={`ss-form-input ss-form-input--mono ${isEdit ? 'ss-form-input--disabled' : ''}`}
              />
              {isEdit && (
                <p className="ss-form-hint">SKU tidak bisa diubah setelah dibuat.</p>
              )}
            </div>

            {/* Barcode */}
            <div className="ss-form-field">
              <label htmlFor="pf-barcode" className="ss-form-label">Barcode</label>
              <div className="ss-form-input-group">
                <input
                  id="pf-barcode"
                  name="barcode"
                  type="text"
                  defaultValue={product?.barcode ?? ''}
                  placeholder="Scan atau ketik barcode"
                  className="ss-form-input ss-form-input--mono ss-form-input-group-field"
                />
                <button
                  type="button"
                  aria-label="Scan Barcode"
                  className="ss-form-input-group-btn"
                >
                  <span className="material-symbols-outlined">barcode_scanner</span>
                </button>
              </div>
            </div>

            {/* Kategori */}
            <div className="ss-form-field">
              <label htmlFor="pf-category" className="ss-form-label">Kategori</label>
              <div className="ss-form-select-wrap">
                <select
                  id="pf-category"
                  name="category"
                  defaultValue={product?.category ?? 'Lainnya'}
                  className="ss-form-select"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined ss-form-select-icon">expand_more</span>
              </div>
            </div>

            {/* Satuan */}
            <div className="ss-form-field">
              <label htmlFor="pf-unit" className="ss-form-label">
                Satuan <span className="ss-required">*</span>
              </label>
              <div className="ss-form-select-wrap">
                <select
                  id="pf-unit"
                  name="unit"
                  required
                  aria-required="true"
                  defaultValue={product?.unit ?? 'pcs'}
                  className="ss-form-select"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined ss-form-select-icon">expand_more</span>
              </div>
            </div>

            {/* Stok Min & Harga — 2 kolom dalam 2 kolom */}
            <div className="ss-form-field ss-form-field--full">
              <div className="ss-form-grid-inner">
                {/* Stok Minimum */}
                <div className="ss-form-field">
                  <label htmlFor="pf-minstock" className="ss-form-label">Stok Minimum</label>
                  <input
                    id="pf-minstock"
                    name="minStock"
                    type="number"
                    min={0}
                    defaultValue={product?.minStock ?? 0}
                    placeholder="0"
                    inputMode="numeric"
                    className="ss-form-input ss-form-input--mono"
                  />
                  <p className="ss-form-hint">Notifikasi jika stok &lt; minimum.</p>
                </div>

                {/* Harga */}
                <div className="ss-form-field">
                  <label htmlFor="pf-price" className="ss-form-label">
                    Harga Jual (Rp) <span className="ss-required">*</span>
                  </label>
                  <input
                    id="pf-price"
                    name="price"
                    type="number"
                    required
                    aria-required="true"
                    min={0}
                    step={1000}
                    defaultValue={product?.price}
                    placeholder="0"
                    inputMode="numeric"
                    className="ss-form-input ss-form-input--mono"
                  />
                </div>
              </div>
            </div>

            {/* Tanggal Kadaluarsa */}
            <div className="ss-form-field ss-form-field--full">
              <label htmlFor="pf-expiry" className="ss-form-label">Tanggal Kadaluarsa</label>
              <input
                id="pf-expiry"
                name="expiryDate"
                type="date"
                defaultValue={formatDateForInput(product?.expiryDate)}
                className="ss-form-input"
              />
              <p className="ss-form-hint">Kosongkan jika produk tidak memiliki tanggal kadaluarsa.</p>
            </div>

            {/* Foto Produk */}
            <div className="ss-form-field ss-form-field--full">
              <label className="ss-form-label">Foto Produk</label>
              <input type="hidden" name="imageUrl" value={imageUrl} />
              <ImageUpload
                productId={product?.id || 'new'}
                currentImageUrl={product?.imageUrl}
                onUploadComplete={(url) => setImageUrl(url)}
                onRemove={() => setImageUrl('')}
                disabled={isPending}
              />
            </div>
          </div>

          {/* Error Banner */}
          {state?.error && (
            <div className="ss-form-error-banner" role="alert">
              <span className="material-symbols-outlined">error</span>
              <span>{state.error}</span>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="ss-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="ss-btn-outlined ss-btn--full-mobile"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="ss-btn-primary ss-btn--full-mobile"
            >
              {isPending ? (
                <>
                  <span className="material-symbols-outlined ss-btn-spinner">progress_activity</span>
                  Menyimpan...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
                  {isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
