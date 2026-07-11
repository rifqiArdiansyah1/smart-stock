import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const actorId = searchParams.get('actorId') || undefined;
  const action = searchParams.get('action') || undefined;
  const entityType = searchParams.get('entityType') || undefined;
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;

  const where: any = {};
  if (actorId) where.actorId = actorId;
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      where.createdAt.lte = to;
    }
  }

  const logs = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 10000, // Hard limit for CSV
    include: {
      actor: { select: { name: true, role: true } },
    },
  });

  const header = ['Timestamp', 'Actor', 'Role', 'Aksi', 'Tipe Entitas', 'Entity ID', 'Nilai Lama', 'Nilai Baru'];
  const rows = logs.map((log) => [
    new Date(log.createdAt).toISOString(),
    log.actor?.name || '-',
    log.actor?.role || '-',
    log.action,
    log.entityType,
    log.entityId,
    log.oldValue ? JSON.stringify(log.oldValue) : '-',
    log.newValue ? JSON.stringify(log.newValue) : '-',
  ]);

  const csvContent = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
