import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import ScanOpnameWorkspace from './ScanOpnameWorkspace';

export const metadata: Metadata = {
  title: 'Scan Produk',
  description: 'Scan barcode dan input jumlah fisik stok',
};

export default async function OpnameWorkspacePage(props: { params: Promise<{ id: string }> }) {
  const { id }    = await props.params;
  const session   = await auth();
  if (!session?.user) redirect('/login');

  const opnameSession = await db.stockOpnameSession.findUnique({
    where:   { id },
    include: {
      location: true,
      startedBy: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true, sku: true, unit: true, barcode: true } },
        },
        orderBy: { product: { name: 'asc' } },
      },
    },
  });

  if (!opnameSession) redirect('/opname');
  if (opnameSession.status !== 'IN_PROGRESS' && opnameSession.status !== 'PENDING_APPROVAL') {
    redirect('/opname');
  }

  const systemStock = await db.stockLevel.findMany({
    where:   { locationId: opnameSession.locationId },
    include: { product: { select: { id: true, name: true, sku: true, unit: true, barcode: true } } },
  });

  return (
    <ScanOpnameWorkspace
      sessionData={opnameSession as any}
      systemStock={systemStock as any[]}
    />
  );
}
