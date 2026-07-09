import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { ROLES } from '@/lib/rbac';
import { randomUUID } from 'crypto';
import { NotificationType } from '@prisma/client';

export async function POST(req: NextRequest, ctx: any) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  if (role !== ROLES.ADMIN && role !== ROLES.OWNER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await ctx.params;
    const { action, notes } = await req.json();

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const opnameSession = await db.stockOpnameSession.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!opnameSession) {
      return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 });
    }

    if (opnameSession.status !== 'PENDING_APPROVAL') {
      return NextResponse.json({ error: 'Sesi tidak dalam status PENDING_APPROVAL' }, { status: 400 });
    }

    const nextStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const notificationType = action === 'APPROVE' ? NotificationType.OPNAME_APPROVED : NotificationType.OPNAME_REJECTED;

    await db.$transaction(async (tx) => {
      // 1. Update session status
      await tx.stockOpnameSession.update({
        where: { id },
        data: {
          status: nextStatus,
          approvedById: userId,
          approvedAt: new Date(),
          reviewNotes: notes || null,
        },
      });

      // 2. If APPROVE, create StockMovement and update StockLevel
      if (action === 'APPROVE') {
        const referenceId = randomUUID();
        for (const item of opnameSession.items) {
          if (item.difference !== 0) {
            // Update StockLevel (it might exist, or might not, but since it's an opname, it likely exists. If not, create it via upsert or just use update if we assume it exists. Actually opname was loaded from existing levels, so it exists.)
            await tx.stockLevel.update({
              where: {
                productId_locationId: {
                  productId: item.productId,
                  locationId: opnameSession.locationId,
                },
              },
              data: {
                quantity: item.physicalQty,
              },
            });

            // Create StockMovement
            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                locationId: opnameSession.locationId,
                actorId: userId, // Admin who approved
                type: 'ADJUSTMENT',
                quantityChange: item.difference, // difference is physicalQty - systemQty
                quantityBefore: item.systemQty,
                quantityAfter: item.physicalQty,
                referenceId: referenceId,
                notes: `Opname adjustment. Sesi: ${id}. Note: ${item.notes || '-'}`,
              },
            });
          }
        }
      }

      // 3. Log to AuditLog
      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: action,
          entityType: 'StockOpnameSession',
          entityId: id,
          newValue: { status: nextStatus, notes },
        },
      });

      // 4. Send Notification to staff
      await tx.notification.create({
        data: {
          userId: opnameSession.startedById,
          type: notificationType,
          title: `Hasil Opname ${nextStatus}`,
          message: `Sesi opname Anda telah di-${action === 'APPROVE' ? 'setujui' : 'tolak'}. ${notes ? `Catatan: ${notes}` : ''}`,
          data: { sessionId: id },
        },
      });
    });

    return NextResponse.json({ success: true, status: nextStatus });
  } catch (err) {
    console.error('[POST /api/opname/[id]/review]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
