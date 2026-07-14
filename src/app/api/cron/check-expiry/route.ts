import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';
import { dispatchExpiryAlert } from '@/lib/queue';

const CRON_SECRET = process.env.CRON_SECRET;
const DEDUP_TTL_SECONDS = 60 * 60 * 24; // 24 jam
const ALERT_THRESHOLDS_DAYS = [30, 14, 7]; // Hari-hari yang memicu alert

export async function GET(req: NextRequest) {
  if (CRON_SECRET) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const now = new Date();
    // Ambil semua produk aktif yang punya expiryDate dalam 30 hari ke depan (atau sudah expired)
    const thirtyDaysLater = new Date(now);
    thirtyDaysLater.setDate(now.getDate() + 30);

    const expiringProducts = await db.product.findMany({
      where: {
        isActive: true,
        expiryDate: {
          not: null,
          lte: thirtyDaysLater,
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        expiryDate: true,
        stockLevels: {
          select: { quantity: true },
        },
      },
    });

    if (expiringProducts.length === 0) {
      return NextResponse.json({ message: 'No expiring products found', dispatched: 0 });
    }

    // Ambil ADMIN dan OWNER aktif untuk dinotifikasi
    const adminUsers = await db.user.findMany({
      where: { isActive: true, role: { in: ['ADMIN', 'OWNER'] } },
      select: { id: true },
    });
    const notifyUserIds = adminUsers.map((u) => u.id);

    let dispatched = 0;

    for (const product of expiringProducts) {
      if (!product.expiryDate) continue;

      const expiryDate = new Date(product.expiryDate);
      const diffMs = expiryDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Hitung total stok di semua lokasi
      const totalQty = product.stockLevels.reduce((sum, sl) => sum + sl.quantity, 0);

      // Tentukan threshold yang relevan untuk produk ini
      // Kirim notif di threshold terdekat yang belum pernah dikirim
      let threshold: number | null = null;
      for (const t of ALERT_THRESHOLDS_DAYS) {
        if (daysRemaining <= t) {
          threshold = t;
          break; // Gunakan threshold terkecil yang masih mencakup daysRemaining
        }
      }

      if (threshold === null) continue;

      // Dedup: satu notif per produk per threshold per hari
      const dedupKey = `expiry-notif:${product.id}:${threshold}d`;
      const alreadySent = await redis.get(dedupKey);
      if (alreadySent) {
        console.log(`[cron/check-expiry] Skipped (dedup): ${product.name} (${threshold}d threshold)`);
        continue;
      }

      await dispatchExpiryAlert({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        expiryDate: product.expiryDate.toISOString(),
        daysRemaining,
        currentQty: totalQty,
        notifyUserIds,
      });

      await redis.set(dedupKey, '1', 'EX', DEDUP_TTL_SECONDS);
      dispatched++;
    }

    console.log(`[cron/check-expiry] Dispatched ${dispatched} expiry alert(s)`);
    return NextResponse.json({
      message: 'Expiry check complete',
      total: expiringProducts.length,
      dispatched,
      skipped: expiringProducts.length - dispatched,
    });
  } catch (err) {
    console.error('[cron/check-expiry]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
