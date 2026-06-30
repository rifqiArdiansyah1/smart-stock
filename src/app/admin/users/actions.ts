'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { ROLES, type Role } from '@/lib/rbac';
import * as bcrypt from 'bcryptjs';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

// ── Guard: hanya OWNER yang boleh menjalankan aksi ini ───────
async function assertOwner() {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  if ((session.user as any).role !== ROLES.OWNER) throw new Error('Forbidden');
}

// ══════════════════════════════════════════════════════════════
// CREATE USER
// ══════════════════════════════════════════════════════════════
export async function createUser(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  try {
    await assertOwner();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as Role;

    if (!name || !email || !password || !role) {
      return { error: 'Semua field wajib diisi.' };
    }
    if (password.length < 8) {
      return { error: 'Password minimal 8 karakter.' };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.user.create({
      data: { name, email, password: passwordHash, role, tenantId: TENANT_ID },
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: any) {
    if (err?.code === 'P2002') return { error: 'Email sudah digunakan user lain.' };
    if (err?.message === 'Unauthorized') return { error: 'Anda harus login.' };
    if (err?.message === 'Forbidden') return { error: 'Hanya Owner yang bisa menambah user.' };
    return { error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

// ══════════════════════════════════════════════════════════════
// UPDATE ROLE
// ══════════════════════════════════════════════════════════════
export async function updateUserRole(userId: string, role: Role) {
  try {
    await assertOwner();
    await db.user.update({ where: { id: userId }, data: { role } });
    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: any) {
    if (err?.message === 'Forbidden') return { error: 'Hanya Owner yang bisa mengubah role.' };
    return { error: 'Gagal mengubah role.' };
  }
}

// ══════════════════════════════════════════════════════════════
// TOGGLE STATUS (Nonaktifkan / Aktifkan)
// ══════════════════════════════════════════════════════════════
export async function toggleUserStatus(userId: string, currentIsActive: boolean) {
  try {
    await assertOwner();
    await db.user.update({
      where: { id: userId },
      data: { isActive: !currentIsActive },
    });
    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: any) {
    if (err?.message === 'Forbidden') return { error: 'Hanya Owner yang bisa mengubah status user.' };
    return { error: 'Gagal mengubah status user.' };
  }
}
