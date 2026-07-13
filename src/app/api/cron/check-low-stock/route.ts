import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';
import { dispatchLowStockAlert } from '@/lib/queue';

// CRON_SECRET environment variable digunakan untuk autentikasi request cron
// Bisa dipanggil dari Vercel Cron, GitHub Actions, dsb.
const CRON_SECRET = process.env.CRON_SECRET;
const DEDUP_TTL_SECONDS = 60 * 60 * 24; // 24 jam — tidak kirim duplikat notifikasi

export async function GET(req: NextRequest) {
  // Validasi secret (opsional jika CRON_SECRET di-set)
  if (CRON_SECRET) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Ambil semua stock levels produk aktif yang punya minStock > 0
    const allLevels = await db.stockLevel.findMany({
      where: {
        product: {
          isActive: true,
          minStock: { gt: 0 },
        },
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true, minStock: true },
        },
        location: { select: { id: true, name: true } },
      },
    });

    // Filter di level aplikasi: stok saat ini <= minStock produk
    const belowMin = allLevels.filter((sl) => sl.quantity <= sl.product.minStock);

    if (belowMin.length === 0) {
      return NextResponse.json({ message: 'No low-stock items found', dispatched: 0 });
    }

    // Ambil daftar ADMIN dan OWNER yang aktif untuk dinotifikasi
    const adminUsers = await db.user.findMany({
      where: { isActive: true, role: { in: ['ADMIN', 'OWNER'] } },
      select: { id: true },
    });

    const notifyUserIds = adminUsers.map((u) => u.id);

    let dispatched = 0;

    for (const sl of belowMin) {
      const dedupKey = `low-stock-notif:${sl.productId}:${sl.locationId}`;

      // Cek apakah sudah ada notifikasi dalam 24 jam terakhir (deduplication)
      const alreadySent = await redis.get(dedupKey);
      if (alreadySent) {
        console.log(`[cron/check-low-stock] Skipped (dedup): ${sl.product.name} @ ${sl.location.name}`);
        continue;
      }

      // Dispatch job ke BullMQ
      await dispatchLowStockAlert({
        productId: sl.productId,
        productName: sl.product.name,
        sku: sl.product.sku,
        currentQty: sl.quantity,
        minStock: sl.product.minStock,
        locationId: sl.locationId,
        locationName: sl.location.name,
        notifyUserIds,
      });

      // Set dedup key dengan TTL 24 jam
      await redis.set(dedupKey, '1', 'EX', DEDUP_TTL_SECONDS);

      dispatched++;
    }

    console.log(`[cron/check-low-stock] Dispatched ${dispatched} low-stock alert(s)`);
    return NextResponse.json({
      message: 'Low-stock check complete',
      total: belowMin.length,
      dispatched,
      skipped: belowMin.length - dispatched,
    });
  } catch (err) {
    console.error('[cron/check-low-stock]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
