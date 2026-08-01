/**
 * Opname Layout — Warehouse Signal (Mobile)
 *
 * Wraps semua halaman di /opname dengan AppShell (BottomNav mobile)
 * Role: STAFF_GUDANG
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';

export default async function OpnameLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role     = (session.user as any).role as string;
  const userName = session.user.name ?? session.user.email ?? 'Staf';

  const allowedRoles = ['OWNER', 'ADMIN', 'STAFF_GUDANG'];
  if (!allowedRoles.includes(role)) redirect('/');

  return (
    <AppShell role="STAFF_GUDANG" userName={userName} pageTitle="Stock Opname">
      {children}
    </AppShell>
  );
}
