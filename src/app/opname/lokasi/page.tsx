/**
 * Pilih Lokasi Page — Warehouse Signal (Mobile)
 * Halaman pilih lokasi fisik opname (Langkah 1 dari 3)
 */

import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import LocationSelectionClient from './LocationSelectionClient';

export const metadata: Metadata = {
  title: 'Pilih Lokasi Opname',
  description: 'Pilih lokasi rak atau zona fisik untuk perhitungan stok',
};

export default async function LocationSelectionPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const locations = await db.location.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      type: true,
      _count: { select: { stockLevels: true } },
    },
  });

  const formattedLocations = locations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    type: loc.type,
    itemCount: loc._count.stockLevels,
  }));

  return <LocationSelectionClient locations={formattedLocations} />;
}
