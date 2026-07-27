/**
 * Kasir Layout — Warehouse Signal (Mobile-first)
 *
 * Wraps halaman /kasir dengan AppShell (BottomNav mobile)
 * Role: KASIR
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';

export default async function KasirLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role     = (session.user as any).role as string;
  const userName = session.user.name ?? session.user.email ?? 'Kasir';

  if (role !== 'KASIR') redirect('/');

  return (
    <AppShell role="KASIR" userName={userName} pageTitle="Kasir">
      {children}
    </AppShell>
  );
}
