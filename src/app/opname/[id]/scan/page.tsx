/**
 * Scan Opname Page — Warehouse Signal (Mobile)
 * Halaman scan & input qty opname fisik (Langkah 2 dari 3)
 */

import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import ScanOpnameClient from './ScanOpnameClient';

export const metadata: Metadata = {
  title: 'Scan Produk Opname',
  description: 'Pindai barcode dan masukkan jumlah fisik produk',
};

export default async function ScanOpnamePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) redirect('/login');

  const opnameSession = await db.stockOpnameSession.findUnique({
    where: { id },
    include: {
      location: true,
    },
  });

  if (!opnameSession) redirect('/opname');

  const systemStock = await db.stockLevel.findMany({
    where: { locationId: opnameSession.locationId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          barcode: true,
          unit: true,
        },
      },
    },
  });

  const formattedStock = systemStock.map((s) => ({
    product: {
      id: s.product.id,
      name: s.product.name,
      sku: s.product.sku,
      barcode: s.product.barcode,
      unit: s.product.unit,
    },
    quantity: s.quantity,
  }));

  return (
    <ScanOpnameClient
      sessionData={{
        id: opnameSession.id,
        locationName: opnameSession.location.name,
        locationType: opnameSession.location.type,
        status: opnameSession.status,
      }}
      systemStock={formattedStock}
    />
  );
}
