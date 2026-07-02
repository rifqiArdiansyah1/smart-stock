'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { ROLES } from '@/lib/rbac';

async function assertCanManageLocations() {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  const role = (session.user as any).role;
  if (role !== ROLES.OWNER && role !== ROLES.ADMIN) throw new Error('Forbidden');
}

// ══════════════════════════════════════════════════════════════
// CREATE LOCATION
// ══════════════════════════════════════════════════════════════
export async function createLocation(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  try {
    await assertCanManageLocations();

    const name = (formData.get('name') as string)?.trim();
    const type = formData.get('type') as string;
    const description = (formData.get('description') as string)?.trim() || null;

    if (!name || !type) {
      return { error: 'Nama dan tipe lokasi wajib diisi.' };
    }

    await db.location.create({
      data: { name, type: type as any, description },
    });

    revalidatePath('/admin/locations');
    return { success: true };
  } catch (err: any) {
    if (err?.message === 'Forbidden') return { error: 'Hanya Owner/Admin yang bisa menambah lokasi.' };
    return { error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

// ══════════════════════════════════════════════════════════════
// UPDATE LOCATION
// ══════════════════════════════════════════════════════════════
export async function updateLocation(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  try {
    await assertCanManageLocations();

    const id = formData.get('id') as string;
    const name = (formData.get('name') as string)?.trim();
    const type = formData.get('type') as string;
    const description = (formData.get('description') as string)?.trim() || null;

    if (!id || !name || !type) {
      return { error: 'Nama dan tipe lokasi wajib diisi.' };
    }

    await db.location.update({
      where: { id },
      data: { name, type: type as any, description },
    });

    revalidatePath('/admin/locations');
    return { success: true };
  } catch (err: any) {
    if (err?.message === 'Forbidden') return { error: 'Hanya Owner/Admin yang bisa mengedit lokasi.' };
    return { error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

// ══════════════════════════════════════════════════════════════
// TOGGLE STATUS (Soft delete / restore)
// ══════════════════════════════════════════════════════════════
export async function toggleLocationStatus(id: string, currentIsActive: boolean) {
  try {
    await assertCanManageLocations();
    await db.location.update({
      where: { id },
      data: { isActive: !currentIsActive },
    });
    revalidatePath('/admin/locations');
    return { success: true };
  } catch (err: any) {
    if (err?.message === 'Forbidden') return { error: 'Akses ditolak.' };
    return { error: 'Gagal mengubah status lokasi.' };
  }
}
