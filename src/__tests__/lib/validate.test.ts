/**
 * @jest-environment node
 */
/**
 * Unit Tests: src/lib/validate.ts
 * Menguji Zod schemas dan helper parseBody
 */

import { z } from 'zod';
import {
  loginSchema,
  createProductSchema,
  updateProductSchema,
  opnameItemSchema,
  approveOpnameSchema,
  stockAdjustmentSchema,
  presignRequestSchema,
  parseBody,
} from '@/lib/validate';

// ── loginSchema ───────────────────────────────────────────────────────────────
describe('loginSchema', () => {
  it('valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'admin@test.com', password: 'secret123' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'bukan-email', password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'admin@test.com', password: '' });
    expect(result.success).toBe(false);
  });

  it('rejects password exceeding max length', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: 'x'.repeat(129) });
    expect(result.success).toBe(false);
  });
});

// ── createProductSchema ───────────────────────────────────────────────────────
describe('createProductSchema', () => {
  const validProduct = {
    name: 'Aqua 600ml',
    sku: 'AQU-600ML',
    unit: 'pcs',
    price: 3000,
    minStock: 10,
  };

  it('accepts valid product', () => {
    expect(createProductSchema.safeParse(validProduct).success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(createProductSchema.safeParse({ ...validProduct, name: '' }).success).toBe(false);
  });

  it('rejects invalid SKU characters', () => {
    const result = createProductSchema.safeParse({ ...validProduct, sku: 'sku with spaces!' });
    expect(result.success).toBe(false);
  });

  it('rejects negative price', () => {
    expect(createProductSchema.safeParse({ ...validProduct, price: -100 }).success).toBe(false);
  });

  it('rejects negative minStock', () => {
    expect(createProductSchema.safeParse({ ...validProduct, minStock: -1 }).success).toBe(false);
  });

  it('allows null imageUrl and expiryDate', () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      imageUrl: null,
      expiryDate: null,
    });
    expect(result.success).toBe(true);
  });
});

// ── updateProductSchema ───────────────────────────────────────────────────────
describe('updateProductSchema', () => {
  it('requires id', () => {
    const result = updateProductSchema.safeParse({ name: 'Updated' });
    expect(result.success).toBe(false);
  });

  it('accepts partial update with valid uuid id', () => {
    const result = updateProductSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Updated Name',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-uuid id', () => {
    const result = updateProductSchema.safeParse({ id: 'not-a-uuid', name: 'X' });
    expect(result.success).toBe(false);
  });
});

// ── opnameItemSchema ──────────────────────────────────────────────────────────
describe('opnameItemSchema', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts valid opname item', () => {
    const result = opnameItemSchema.safeParse({ productId: validUuid, physicalQty: 50 });
    expect(result.success).toBe(true);
  });

  it('rejects negative physicalQty', () => {
    const result = opnameItemSchema.safeParse({ productId: validUuid, physicalQty: -1 });
    expect(result.success).toBe(false);
  });

  it('accepts physicalQty of 0 (semua habis)', () => {
    const result = opnameItemSchema.safeParse({ productId: validUuid, physicalQty: 0 });
    expect(result.success).toBe(true);
  });
});

// ── approveOpnameSchema ───────────────────────────────────────────────────────
describe('approveOpnameSchema', () => {
  it('accepts APPROVE action', () => {
    expect(approveOpnameSchema.safeParse({ action: 'APPROVE' }).success).toBe(true);
  });

  it('accepts REJECT with notes', () => {
    expect(
      approveOpnameSchema.safeParse({ action: 'REJECT', reviewNotes: 'Stok tidak cocok' }).success
    ).toBe(true);
  });

  it('rejects invalid action', () => {
    expect(approveOpnameSchema.safeParse({ action: 'DELETE' }).success).toBe(false);
  });
});

// ── stockAdjustmentSchema ─────────────────────────────────────────────────────
describe('stockAdjustmentSchema', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts valid adjustment', () => {
    const result = stockAdjustmentSchema.safeParse({
      productId: validUuid,
      locationId: validUuid,
      quantityChange: -5,
      type: 'ADJUSTMENT',
    });
    expect(result.success).toBe(true);
  });

  it('rejects zero quantityChange', () => {
    const result = stockAdjustmentSchema.safeParse({
      productId: validUuid,
      locationId: validUuid,
      quantityChange: 0,
    });
    expect(result.success).toBe(false);
  });
});

// ── presignRequestSchema ──────────────────────────────────────────────────────
describe('presignRequestSchema', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts valid presign request', () => {
    const result = presignRequestSchema.safeParse({
      productId: validUuid,
      mimeType: 'image/jpeg',
      fileSize: 1024 * 1024, // 1MB
    });
    expect(result.success).toBe(true);
  });

  it('rejects unsupported mimeType', () => {
    const result = presignRequestSchema.safeParse({
      productId: validUuid,
      mimeType: 'image/gif',
      fileSize: 1000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects file size exceeding 5MB', () => {
    const result = presignRequestSchema.safeParse({
      productId: validUuid,
      mimeType: 'image/png',
      fileSize: 6 * 1024 * 1024,
    });
    expect(result.success).toBe(false);
  });
});

// ── parseBody helper ──────────────────────────────────────────────────────────
describe('parseBody', () => {
  function makeRequest(body: unknown): Request {
    return new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('returns success with valid body', async () => {
    const schema = z.object({ name: z.string() });
    const req = makeRequest({ name: 'Test' });
    const result = await parseBody(req, schema);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe('Test');
  });

  it('returns error with invalid body', async () => {
    const schema = z.object({ name: z.string().min(3) });
    const req = makeRequest({ name: '' });
    const result = await parseBody(req, schema);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.details).toHaveProperty('name');
  });

  it('returns error with malformed JSON', async () => {
    const req = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });
    const schema = z.object({ name: z.string() });
    const result = await parseBody(req, schema);
    expect(result.success).toBe(false);
  });
});
