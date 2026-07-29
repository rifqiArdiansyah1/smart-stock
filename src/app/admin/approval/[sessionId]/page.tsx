/**
 * Detail Approval Page — Warehouse Signal Redesign
 * Detail review sesi opname tertentu untuk Admin & Owner
 */

import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import ApprovalDetailClient from './ApprovalDetailClient';

export const metadata: Metadata = {
  title: 'Detail Approval Opname',
  description: 'Tinjau rincian selisih stok dan berikan persetujuan',
};

export default async function ApprovalDetailPage(props: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await props.params;
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRole = (session.user as any).role;
  if (userRole !== 'OWNER' && userRole !== 'ADMIN') redirect('/');

  const opnameSession = await db.stockOpnameSession.findUnique({
    where: { id: sessionId },
    include: {
      location: true,
      startedBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              unit: true,
              price: true,
            },
          },
        },
      },
    },
  });

  if (!opnameSession) redirect('/admin/approval');

  const formattedItems = opnameSession.items.map((item) => ({
    id: item.id,
    productName: item.product.name,
    sku: item.product.sku,
    unit: item.product.unit,
    systemQty: item.systemQty,
    physicalQty: item.physicalQty,
    difference: item.difference,
    price: item.product.price ? Number(item.product.price) : null,
    notes: item.notes,
  }));

  return (
    <ApprovalDetailClient
      sessionData={{
        id: opnameSession.id,
        locationName: opnameSession.location.name,
        locationType: opnameSession.location.type,
        status: opnameSession.status,
        startedBy: opnameSession.startedBy.name,
        startedAt: opnameSession.startedAt,
        submittedAt: opnameSession.submittedAt,
        reviewNotes: opnameSession.reviewNotes,
        approvedBy: opnameSession.approvedBy?.name,
      }}
      items={formattedItems}
    />
  );
}
