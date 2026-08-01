/**
 * Kasir Layout — Warehouse Signal (Mobile-first)
 *
 * Wraps halaman /kasir dengan AppShell (BottomNav mobile)
 * Allowed Roles: OWNER, ADMIN, KASIR
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { ROLES, Role } from '@/lib/rbac';

export default async function KasirLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = (session.user as any).role as Role;
  const userName = session.user.name ?? session.user.email ?? 'Kasir';

  const allowedRoles: Role[] = [ROLES.OWNER, ROLES.ADMIN, ROLES.KASIR];
  if (!allowedRoles.includes(role)) {
    redirect('/');
  }

  return (
    <AppShell role={role} userName={userName} pageTitle="Kasir">
      {children}
    </AppShell>
  );
}
