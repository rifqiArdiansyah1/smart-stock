/**
 * types.ts — Shared Product types untuk komponen Manajemen Produk
 */

export type Product = {
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

/** Tipe untuk form (edit/create) — tanpa totalStock */
export type ProductFormData = {
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
