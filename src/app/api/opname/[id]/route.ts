import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, ctx: any) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await ctx.params;

    const opname = await db.stockOpnameSession.findUnique({
      where: { id },
      include: {
        location: { select: { name: true, type: true } },
        startedBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true, unit: true } }
          }
        }
      },
    });

    if (!opname) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

    return NextResponse.json({ data: opname });
  } catch (err) {
    console.error('[GET /api/opname/[id]]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
