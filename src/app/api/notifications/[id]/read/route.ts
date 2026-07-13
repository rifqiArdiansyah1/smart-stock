import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// POST /api/notifications/[id]/read — Tandai notifikasi sebagai dibaca
export async function POST(req: NextRequest, ctx: any) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const { id } = await ctx.params;

  const notification = await db.notification.findUnique({ where: { id } });

  if (!notification) {
    return NextResponse.json({ error: 'Notifikasi tidak ditemukan' }, { status: 404 });
  }

  // Pastikan hanya pemilik notifikasi yang bisa menandai
  if (notification.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}
