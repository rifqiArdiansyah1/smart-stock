'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { ROLES } from '@/lib/rbac';

async function assertCanManageProducts() {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  const role = (session.user as any).role;
  if (role !== ROLES.OWNER && role !== ROLES.ADMIN) throw new Error('Forbidden');
}

// ══════════════════════════════════════════════════════════════
// CREATE PRODUCT
// ══════════════════════════════════════════════════════════════
export async function createProduct(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  try {
    await assertCanManageProducts();

    const name = (formData.get('name') as string)?.trim();
    const sku = (formData.get('sku') as string)?.trim().toUpperCase();
    const barcodeRaw = (formData.get('barcode') as string)?.trim();
    const barcode = barcodeRaw || undefined;
    const category = (formData.get('category') as string)?.trim() || 'Umum';
    const unit = (formData.get('unit') as string)?.trim();
    const price = Number(formData.get('price'));
    const minStock = Number(formData.get('minStock') ?? 0);
    const expiryDateRaw = formData.get('expiryDate') as string;
    const expiryDate = expiryDateRaw ? new Date(expiryDateRaw) : null;

    if (!name || !sku || !unit || isNaN(price)) {
      return { error: 'Field nama, SKU, unit, dan harga wajib diisi.' };
    }

    const createData: any = { name, sku, category, unit, price, minStock, expiryDate };
    if (barcode) createData.barcode = barcode;

    await db.product.create({ data: createData });

    revalidatePath('/admin/products');
    return { success: true };
  } catch (err: any) {
    if (err?.code === 'P2002') return { error: 'SKU atau barcode sudah digunakan produk lain.' };
    if (err?.message === 'Forbidden') return { error: 'Hanya Owner/Admin yang bisa menambah produk.' };
    return { error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

// ══════════════════════════════════════════════════════════════
// UPDATE PRODUCT
// ══════════════════════════════════════════════════════════════
export async function updateProduct(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  try {
    await assertCanManageProducts();

    const id = formData.get('id') as string;
    const name = (formData.get('name') as string)?.trim();
    const barcodeRaw = (formData.get('barcode') as string)?.trim();
    const barcode = barcodeRaw !== undefined ? (barcodeRaw || null) : undefined;
    const category = (formData.get('category') as string)?.trim() || 'Umum';
    const unit = (formData.get('unit') as string)?.trim();
    const price = Number(formData.get('price'));
    const minStock = Number(formData.get('minStock') ?? 0);
    const expiryDateRaw = formData.get('expiryDate') as string;
    const expiryDate = expiryDateRaw ? new Date(expiryDateRaw) : null;

    if (!id || !name || !unit || isNaN(price)) {
      return { error: 'Field nama, unit, dan harga wajib diisi.' };
    }

    const updateData: any = { name, category, unit, price, minStock, expiryDate };
    if (barcodeRaw !== undefined) updateData.barcode = barcodeRaw || undefined;

    await db.product.update({ where: { id }, data: updateData });

    revalidatePath('/admin/products');
    return { success: true };
  } catch (err: any) {
    if (err?.code === 'P2002') return { error: 'Barcode sudah digunakan produk lain.' };
    if (err?.message === 'Forbidden') return { error: 'Hanya Owner/Admin yang bisa mengedit produk.' };
    return { error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

// ══════════════════════════════════════════════════════════════
// SOFT DELETE & RESTORE
// ══════════════════════════════════════════════════════════════
export async function softDeleteProduct(id: string) {
  try {
    await assertCanManageProducts();
    await db.product.update({ where: { id }, data: { isActive: false } });
    revalidatePath('/admin/products');
    return { success: true };
  } catch (err: any) {
    if (err?.message === 'Forbidden') return { error: 'Akses ditolak.' };
    return { error: 'Gagal menonaktifkan produk.' };
  }
}

export async function restoreProduct(id: string) {
  try {
    await assertCanManageProducts();
    await db.product.update({ where: { id }, data: { isActive: true } });
    revalidatePath('/admin/products');
    return { success: true };
  } catch (err: any) {
    if (err?.message === 'Forbidden') return { error: 'Akses ditolak.' };
    return { error: 'Gagal mengaktifkan kembali produk.' };
  }
}
