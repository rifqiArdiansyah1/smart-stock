/**
 * SmartStock — Cloudflare R2 Client (S3-compatible)
 *
 * Cloudflare R2 menggunakan S3 API yang kompatibel dengan AWS SDK v3.
 * Endpoint: https://{accountId}.r2.cloudflarestorage.com
 */

import { S3Client } from '@aws-sdk/client-s3';

if (!process.env.R2_ACCOUNT_ID) {
  console.warn('[r2] R2_ACCOUNT_ID not set — file upload will not work');
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME || 'smartstock-assets';
export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';

/** Kategori sub-folder di dalam bucket */
export const R2_FOLDERS = {
  PRODUCTS: 'products',
} as const;

/** Batas ukuran file upload: 5MB */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Tipe MIME yang diizinkan untuk foto produk */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * Bangun URL publik CDN dari object key.
 * Contoh key: "products/prod-123-1721000000.jpg"
 */
export function buildPublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Generate object key unik untuk foto produk.
 * Format: products/{productId}-{timestamp}.{ext}
 */
export function generateProductImageKey(productId: string, mimeType: string): string {
  const ext = mimeType.split('/')[1] || 'jpg';
  const timestamp = Date.now();
  return `${R2_FOLDERS.PRODUCTS}/${productId}-${timestamp}.${ext}`;
}
