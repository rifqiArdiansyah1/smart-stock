import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ROLES } from '@/lib/rbac';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== ROLES.OWNER && role !== ROLES.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date'); // YYYY-MM-DD
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Number(searchParams.get('limit') ?? '20')); // limit of *transactions*, not items
    const skip = (page - 1) * limit;

    // Build Prisma where clause
    const where: any = {
      type: 'SALE',
      referenceId: { not: null },
    };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // Step 1: Get distinct referenceIds (transactions)
    // Prisma distinct doesn't allow ordering by non-selected fields easily with pagination,
    // so we'll fetch movements, group them in DB is hard.
    // Instead, fetch raw query or just fetch movements and group.
    // Since we need pagination on *transactions*, let's use raw query for the referenceIds.
    
    let queryArgs: any = [where.type];
    let dateFilter = '';
    
    if (where.createdAt) {
      dateFilter = `AND "created_at" >= $2 AND "created_at" <= $3`;
      queryArgs.push(where.createdAt.gte, where.createdAt.lte);
    }
    
    const countArgs = [...queryArgs];
    
    queryArgs.push(limit, skip);
    const limitOffsetParams = dateFilter ? `LIMIT $4 OFFSET $5` : `LIMIT $2 OFFSET $3`;

    // Fetch distinct referenceIds sorted by max(createdAt) desc
    const transactionIdsRaw = await db.$queryRawUnsafe<any[]>(
      `SELECT "reference_id" as ref, MAX("created_at") as max_date
       FROM "stock_movements"
       WHERE "type" = $1 AND "reference_id" IS NOT NULL ${dateFilter}
       GROUP BY "reference_id"
       ORDER BY max_date DESC
       ${limitOffsetParams}`,
      ...queryArgs
    );

    const countResult = await db.$queryRawUnsafe<any[]>(
      `SELECT COUNT(DISTINCT "reference_id")::int as total
       FROM "stock_movements"
       WHERE "type" = $1 AND "reference_id" IS NOT NULL ${dateFilter}`,
      ...countArgs
    );

    const total = countResult[0]?.total || 0;
    const referenceIds = transactionIdsRaw.map(r => r.ref);

    if (referenceIds.length === 0) {
      return NextResponse.json({
        data: [],
        meta: { page, limit, total, totalPages: 0 },
      });
    }

    // Step 2: Fetch full details for those referenceIds
    const movements = await db.stockMovement.findMany({
      where: {
        referenceId: { in: referenceIds },
        type: 'SALE'
      },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, name: true, sku: true, price: true, unit: true }
        },
        actor: {
          select: { id: true, name: true }
        },
        location: {
          select: { id: true, name: true }
        }
      }
    });

    // Step 3: Group by referenceId
    const grouped = movements.reduce((acc, curr) => {
      const ref = curr.referenceId!;
      if (!acc[ref]) {
        acc[ref] = {
          id: ref,
          date: curr.createdAt,
          cashier: curr.actor.name,
          location: curr.location?.name || '-',
          items: [],
          totalAmount: 0,
        };
      }
      const qty = Math.abs(curr.quantityChange);
      const price = curr.product.price ? Number(curr.product.price) : 0;
      acc[ref].items.push({
        productId: curr.product.id,
        name: curr.product.name,
        sku: curr.product.sku,
        quantity: qty,
        unit: curr.product.unit,
        price: price,
        subtotal: qty * price,
      });
      acc[ref].totalAmount += qty * price;
      return acc;
    }, {} as Record<string, any>);

    // Convert to array and sort by date descending
    const data = Object.values(grouped).sort((a, b) => b.date.getTime() - a.date.getTime());

    return NextResponse.json({
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[GET /api/pos/history]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
