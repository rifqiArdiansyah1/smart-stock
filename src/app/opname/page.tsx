import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import OpnameClient from './OpnameClient';

export const metadata: Metadata = {
  title: 'Stock Opname',
  description: 'Mulai dan kelola sesi stock opname',
};

export default async function OpnamePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [opnames, locations] = await Promise.all([
    db.stockOpnameSession.findMany({
      orderBy: { startedAt: 'desc' },
      include: {
        location: { select: { name: true, type: true } },
        startedBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
    db.location.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, type: true },
    }),
  ]);

  return <OpnameClient initialOpnames={opnames as any[]} locations={locations} />;
}

