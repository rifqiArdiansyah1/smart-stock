/**
 * Approval Inbox Page — Warehouse Signal Redesign
 * Halaman Kotak Masuk Persetujuan Opname untuk Admin & Owner
 */

import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import ApprovalInboxClient from './ApprovalInboxClient';

export const metadata: Metadata = {
  title: 'Approval Inbox',
  description: 'Tinjau dan setujui sesi opname stok',
};

export default async function ApprovalInboxPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRole = (session.user as any).role;
  if (userRole !== 'OWNER' && userRole !== 'ADMIN') redirect('/');

  const [sessions, locations] = await Promise.all([
    db.stockOpnameSession.findMany({
      where: { status: 'PENDING_APPROVAL' },
      orderBy: { submittedAt: 'desc' },
      include: {
        location: { select: { id: true, name: true, type: true } },
        startedBy: { select: { name: true } },
        items: {
          include: {
            product: { select: { price: true } },
          },
        },
      },
    }),
    db.location.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  const formattedSessions = sessions.map((s) => {
    let diffCount = 0;
    let totalLoss = 0;

    s.items.forEach((item) => {
      if (item.difference !== 0) {
        diffCount++;
        if (item.difference < 0 && item.product.price) {
          totalLoss += Math.abs(item.difference) * Number(item.product.price);
        }
      }
    });

    return {
      id: s.id,
      locationName: s.location.name,
      locationType: s.location.type,
      startedAt: s.startedAt,
      staffName: s.startedBy.name,
      differenceCount: diffCount,
      totalLossAmount: totalLoss,
      status: s.status,
    };
  });

  return <ApprovalInboxClient initialSessions={formattedSessions} locations={locations} />;
}
