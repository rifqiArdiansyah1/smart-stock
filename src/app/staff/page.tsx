/**
 * Staff Home — Warehouse Signal (Mobile)
 * Referensi: stitch_web_application_ui_ux_design/home_staf_smartstock/screen.png
 *
 * Layout:
 * - Greeting + nama user
 * - Tombol besar amber "Mulai Opname Baru" (64px min height)
 * - Card Opname Hari Ini: progress lorong
 * - Card Akurasi Stok
 * - Aktivitas Terakhir: list 5 sesi terbaru
 */

import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import StaffHomeClient from './StaffHomeClient';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Halaman utama staf gudang',
};

export default async function StaffHomePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userId = session.user.id as string;

  // Ambil sesi opname terbaru milik user ini
  const recentSessions = await db.stockOpnameSession.findMany({
    where: { startedById: userId },
    orderBy: { startedAt: 'desc' },
    take: 5,
    include: {
      location: { select: { name: true, type: true } },
      _count:   { select: { items: true } },
    },
  });

  // Sesi aktif hari ini (status OPEN)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySessions = recentSessions.filter(
    (s) => s.startedAt >= today,
  );
  const activeSessions = todaySessions.filter((s) => s.status === 'IN_PROGRESS');

  const userName = session.user.name ?? 'Staf';

  return (
    <StaffHomeClient
      userName={userName}
      recentSessions={recentSessions as any[]}
      todayCount={todaySessions.length}
      activeSession={activeSessions[0] as any ?? null}
    />
  );
}
