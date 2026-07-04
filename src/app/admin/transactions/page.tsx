import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ROLES } from '@/lib/rbac';
import { db } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Riwayat Transaksi — SmartStock',
  description: 'Riwayat transaksi penjualan kasir',
};

export default async function TransactionsPage(props: { searchParams: Promise<{ date?: string, page?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = (session.user as any).role;
  if (role !== ROLES.OWNER && role !== ROLES.ADMIN) {
    redirect('/'); // Forbidden
  }

  const dateParam = searchParams.date || '';
  const page = Math.max(1, Number(searchParams.page || '1'));
  const limit = 20;
  const skip = (page - 1) * limit;

  // Build where
  const where: any = {
    type: 'SALE',
    referenceId: { not: null },
  };

  if (dateParam) {
    const startOfDay = new Date(dateParam);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateParam);
    endOfDay.setHours(23, 59, 59, 999);
    where.createdAt = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }

  // Fetch unique referenceIds for pagination using raw query (Prisma doesn't easily support paginated distinct queries)
  let dateFilter = '';
  const queryArgs: any[] = ['SALE'];

  if (where.createdAt) {
    dateFilter = `AND "created_at" >= $2 AND "created_at" <= $3`;
    queryArgs.push(where.createdAt.gte, where.createdAt.lte);
  }

  const countArgs = [...queryArgs];
  
  queryArgs.push(limit, skip);
  const limitOffsetParams = dateFilter ? `LIMIT $4 OFFSET $5` : `LIMIT $2 OFFSET $3`;

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
  const totalPages = Math.ceil(total / limit);
  const referenceIds = transactionIdsRaw.map(r => r.ref);

  let data: any[] = [];
  let summary = { transactions: 0, revenue: 0 };

  if (referenceIds.length > 0) {
    const movements = await db.stockMovement.findMany({
      where: {
        referenceId: { in: referenceIds },
        type: 'SALE'
      },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, sku: true, price: true, unit: true } },
        actor: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } }
      }
    });

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

    data = Object.values(grouped).sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Calculate total revenue for this page (or ideally for the day, but we'll show page summary)
    summary.transactions = data.length;
    summary.revenue = data.reduce((sum, tx) => sum + tx.totalAmount, 0);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-10">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <a href="/" className="hover:text-slate-600 transition-colors">Dashboard</a>
              <span>/</span>
              <span className="text-slate-600 font-medium">Riwayat Transaksi</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Riwayat Transaksi Penjualan</h1>
            <p className="text-slate-500 text-sm mt-1">Data penjualan dari modul kasir / POS.</p>
          </div>
          
          <form className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-sm font-medium text-slate-500 px-2">Tanggal:</span>
            <input 
              type="date" 
              name="date"
              defaultValue={dateParam}
              className="px-3 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
            />
            <button type="submit" className="px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-500 transition-colors">
              Filter
            </button>
            {dateParam && (
              <a href="/admin/transactions" className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                Reset
              </a>
            )}
          </form>
        </div>

        {/* Stat Cards (For current view) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 shadow-sm">
            <div className="text-sm text-slate-500 mb-1">Total Transaksi (Halaman Ini)</div>
            <div className="text-3xl font-bold text-slate-800">{summary.transactions}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 shadow-sm">
            <div className="text-sm text-slate-500 mb-1">Total Pendapatan (Halaman Ini)</div>
            <div className="text-3xl font-bold text-emerald-600">Rp {summary.revenue.toLocaleString('id-ID')}</div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {data.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-5xl mb-4">🧾</p>
              <p className="font-medium text-slate-600 text-lg">Belum ada transaksi</p>
              <p className="text-sm mt-1">
                {dateParam ? `Tidak ada data transaksi untuk tanggal ${dateParam}.` : 'Belum ada data penjualan dari kasir.'}
              </p>
            </div>
          ) : (
            data.map((tx) => (
              <div key={tx.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-semibold px-2 py-1 bg-slate-200 text-slate-700 rounded uppercase">
                        {tx.id.split('-')[0]}
                      </span>
                      <span className="text-sm text-slate-500">
                        {tx.date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · {tx.date.toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-700">
                      📍 {tx.location} &nbsp;·&nbsp; 👤 Kasir: {tx.cashier}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Total Bayar</div>
                    <div className="text-xl font-bold text-primary-600">Rp {tx.totalAmount.toLocaleString('id-ID')}</div>
                  </div>
                </div>
                
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white border-b border-slate-100">
                        <th className="px-6 py-3 text-left font-semibold text-slate-500">Produk</th>
                        <th className="px-6 py-3 text-right font-semibold text-slate-500">Harga</th>
                        <th className="px-6 py-3 text-right font-semibold text-slate-500">Qty</th>
                        <th className="px-6 py-3 text-right font-semibold text-slate-500">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {tx.items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3">
                            <div className="font-medium text-slate-800">{item.name}</div>
                            <div className="font-mono text-xs text-slate-400">{item.sku}</div>
                          </td>
                          <td className="px-6 py-3 text-right text-slate-600">Rp {item.price.toLocaleString('id-ID')}</td>
                          <td className="px-6 py-3 text-right font-medium text-slate-700">{item.quantity}</td>
                          <td className="px-6 py-3 text-right font-semibold text-slate-800">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-4">
            {page > 1 && (
              <a href={`/admin/transactions?page=${page - 1}${dateParam ? `&date=${dateParam}` : ''}`} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium text-sm transition-colors">
                Sebelumnya
              </a>
            )}
            <span className="text-sm font-medium text-slate-500 px-4">
              Halaman {page} dari {totalPages}
            </span>
            {page < totalPages && (
              <a href={`/admin/transactions?page=${page + 1}${dateParam ? `&date=${dateParam}` : ''}`} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium text-sm transition-colors">
                Selanjutnya
              </a>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
