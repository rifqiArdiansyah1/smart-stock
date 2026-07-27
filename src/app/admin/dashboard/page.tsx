import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Ringkasan kondisi bisnis dan stok secara real-time',
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = (session.user as any).role;
  if (role !== 'OWNER' && role !== 'ADMIN') redirect('/');

  return <DashboardClient />;
}
