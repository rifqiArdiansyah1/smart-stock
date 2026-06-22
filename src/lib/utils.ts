/**
 * SmartStock — Utility Functions
 *
 * Kumpulan utility functions yang digunakan di seluruh aplikasi.
 */

import { type ClassValue, clsx } from 'clsx';

/**
 * Menggabungkan class names dengan dukungan kondisional.
 * Wrapper dari clsx untuk dipakai bersama Tailwind.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format angka ke format rupiah Indonesia.
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format tanggal ke format Indonesia.
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(d);
}

/**
 * Format tanggal + waktu ke format Indonesia.
 */
export function formatDateTime(date: Date | string): string {
  return formatDate(date, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format jumlah stok dengan satuan.
 */
export function formatStock(quantity: number, unit = 'pcs'): string {
  return `${quantity.toLocaleString('id-ID')} ${unit}`;
}

/**
 * Menghitung selisih stok.
 * @returns positif = kelebihan fisik, negatif = kekurangan fisik
 */
export function calculateDifference(systemQty: number, physicalQty: number): number {
  return physicalQty - systemQty;
}

/**
 * Menghasilkan warna badge berdasarkan status stok.
 */
export function getStockStatusColor(quantity: number, minStock: number): string {
  if (quantity === 0) return 'text-danger-600 bg-danger-50';
  if (quantity <= minStock * 0.5) return 'text-danger-600 bg-danger-50';
  if (quantity <= minStock) return 'text-warning-600 bg-warning-50';
  return 'text-success-600 bg-success-50';
}

/**
 * Menghasilkan label status stok dalam Bahasa Indonesia.
 */
export function getStockStatusLabel(quantity: number, minStock: number): string {
  if (quantity === 0) return 'Habis';
  if (quantity <= minStock * 0.5) return 'Kritis';
  if (quantity <= minStock) return 'Rendah';
  return 'Normal';
}

/**
 * Delay utility untuk async/await.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Truncate string dengan ellipsis.
 */
export function truncate(str: string, maxLength = 50): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Generate ID unik sederhana (untuk keperluan UI, bukan DB).
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Debounce function untuk search input.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
