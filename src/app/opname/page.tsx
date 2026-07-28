/**
 * Opname Page (Pilih Lokasi) — Warehouse Signal (Mobile)
 * Referensi: stitch_web_application_ui_ux_design/pilih_lokasi_smartstock/screen.png
 *
 * Step 1 dari alur opname: pilih lokasi/rak/zona
 */

import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import PilihLokasiClient from './PilihLokasiClient';

export const metadata: Metadata = {
  title: 'Mulai Opname',
  description: 'Pilih lokasi untuk memulai stock opname',
};

export default async function OpnamePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const locations = await db.location.findMany({
    where:   { isActive: true },
    orderBy: { name: 'asc' },
    select:  {
      id:   true,
      name: true,
      type: true,
      _count: { select: { stockLevels: true } },
    },
  });

  return <PilihLokasiClient locations={locations as any[]} />;
}
