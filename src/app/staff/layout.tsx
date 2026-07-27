/**
 * Staff Layout — Warehouse Signal (Mobile)
 * Wraps /staff pages dengan AppShell mobile untuk STAFF_GUDANG
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role     = (session.user as any).role as string;
  const userName = session.user.name ?? session.user.email ?? 'Staf';

  if (role !== 'STAFF_GUDANG') redirect('/');

  return (
    <AppShell role="STAFF_GUDANG" userName={userName} pageTitle="SmartStock">
      {children}
    </AppShell>
  );
}
