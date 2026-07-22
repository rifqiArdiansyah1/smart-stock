/**
 * SmartStock — Zod Validation Schemas & Helpers
 *
 * Schemas terpusat untuk validasi input di semua API routes.
 * Menggunakan Zod v4 (sudah diinstall di project).
 */

import { z } from 'zod';

// ── Shared Primitives ──────────────────────────────────────────────────────────

export const uuidSchema = z.string().uuid('ID tidak valid');
export const positiveIntSchema = z.number().int().nonnegative('Nilai tidak boleh negatif');
export const dateStringSchema = z.string().datetime().optional().nullable();

// ── Auth ───────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid').max(255),
  password: z.string().min(1, 'Password diperlukan').max(128),
});

// ── Product ───────────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: z.string().min(1, 'Nama produk diperlukan').max(255),
  sku: z
    .string()
    .min(1, 'SKU diperlukan')
    .max(100)
    .regex(/^[A-Z0-9\-_]+$/i, 'SKU hanya boleh berisi huruf, angka, - dan _'),
  barcode: z.string().max(100).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  unit: z.string().min(1).max(50).default('pcs'),
  price: z.number().nonnegative().optional().nullable(),
  minStock: z.number().int().nonnegative().default(0),
  expiryDate: z.string().datetime().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: uuidSchema,
});

// ── Stock Movement ─────────────────────────────────────────────────────────────

export const stockAdjustmentSchema = z.object({
  productId: uuidSchema,
  locationId: uuidSchema,
  quantityChange: z.number().int().refine((v) => v !== 0, 'Perubahan stok tidak boleh 0'),
  notes: z.string().max(500).optional(),
  type: z.enum(['ADJUSTMENT', 'RESTOCK', 'TRANSFER', 'RETURN']).default('ADJUSTMENT'),
});

// ── POS / Sale ─────────────────────────────────────────────────────────────────

export const saleItemSchema = z.object({
  productId: uuidSchema,
  locationId: uuidSchema,
  quantity: z.number().int().positive('Quantity harus > 0'),
  unitPrice: z.number().nonnegative(),
});

export const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, 'Minimal 1 item'),
  notes: z.string().max(500).optional(),
});

// ── Stock Opname ───────────────────────────────────────────────────────────────

export const createOpnameSessionSchema = z.object({
  locationId: uuidSchema,
});

export const opnameItemSchema = z.object({
  productId: uuidSchema,
  physicalQty: z.number().int().nonnegative('Stok fisik tidak boleh negatif'),
  notes: z.string().max(500).optional(),
  clientTimestamp: z.number().optional(), // Unix ms untuk conflict resolution
});

export const approveOpnameSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  reviewNotes: z.string().max(1000).optional(),
});

// ── Location ──────────────────────────────────────────────────────────────────

export const createLocationSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['GUDANG', 'RAK', 'AREA', 'TOKO']).default('GUDANG'),
  description: z.string().max(500).optional(),
});

// ── Upload ────────────────────────────────────────────────────────────────────

export const presignRequestSchema = z.object({
  productId: uuidSchema,
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(5 * 1024 * 1024, 'Ukuran file maksimal 5MB'),
});

// ── Helper: Parse & Validate Request Body ─────────────────────────────────────

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details: Record<string, string[]> };

/**
 * Parse JSON body dan validasi dengan Zod schema.
 * Mengembalikan data yang sudah di-parse, atau error yang siap dikembalikan ke klien.
 */
export async function parseBody<T>(
  req: Request,
  schema: z.ZodType<T>
): Promise<ValidationResult<T>> {
  let raw: unknown;

  try {
    raw = await req.json();
  } catch {
    return {
      success: false,
      error: 'Request body bukan JSON yang valid',
      details: {},
    };
  }

  const result = schema.safeParse(raw);

  if (!result.success) {
    const details: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join('.') || '_';
      if (!details[path]) details[path] = [];
      details[path].push(issue.message);
    }
    return {
      success: false,
      error: 'Validasi gagal',
      details,
    };
  }

  return { success: true, data: result.data };
}
