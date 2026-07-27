/**
 * Admin Layout — Warehouse Signal
 *
 * Wraps semua halaman di /admin dengan AppShell (sidebar + topbar)
 * Role: OWNER, ADMIN
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import type { AppRole } from '@/components/layout/AppShell';
import { signOut } from '@/auth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await auth();

  if (!session?.user) redirect('/login');

  const role     = (session.user as any).role as AppRole;
  const userName = session.user.name ?? session.user.email ?? 'User';

  // Hanya OWNER dan ADMIN yang boleh masuk /admin
  if (role !== 'OWNER' && role !== 'ADMIN') redirect('/');

  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/login' });
  }

  return (
    <AppShell
      role={role}
      userName={userName}
      pageTitle="SmartStock"
      onSignOut={handleSignOut}
    >
      {children}
    </AppShell>
  );
}
