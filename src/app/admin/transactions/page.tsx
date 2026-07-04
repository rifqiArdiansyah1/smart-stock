import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ROLES } from '@/lib/rbac';
import { db } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Riwayat Transaksi — SmartStock',
  description: 'Riwayat penjualan dan transaksi kasir',
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v);
}

const LOCATION_TYPE_ICON: Record<string, string> = {
  GUDANG: '🏭', RAK: '📦', AREA: '📍', TOKO: '🏪',
};

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = (session.user as any).role as string;
  if (role !== ROLES.OWNER && role !== ROLES.ADMIN) redirect('/');

  // Ambil semua SALE movements dan kelompokkan
  const movements = await db.stockMovement.findMany({
    where: { type: 'SALE', referenceId: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 500, // limit untuk performa
    select: {
      id: true,
      referenceId: true,
      quantityChange: true,
      createdAt: true,
      product: { select: { id: true, name: true, sku: true, unit: true, price: true } },
      location: { select: { id: true, name: true, type: true } },
      actor: { select: { id: true, name: true, email: true } },
    },
  });

  // Group by referenceId
  const grouped = new Map<string, {
    referenceId: string;
    processedAt: Date;
    actor: { id: string; name: string; email: string };
    location: { id: string; name: string; type: string } | null;
    items: typeof movements;
    totalAmount: number;
  }>();

  for (const m of movements) {
    const refId = m.referenceId!;
    if (!grouped.has(refId)) {
      grouped.set(refId, {
        referenceId: refId,
        processedAt: m.createdAt,
        actor: m.actor,
        location: m.location,
        items: [],
        totalAmount: 0,
      });
    }
    const group = grouped.get(refId)!;
    group.items.push(m);
    const price = m.product.price ? Number(m.product.price) : 0;
    group.totalAmount += price * Math.abs(m.quantityChange);
  }

  const transactions = Array.from(grouped.values());
  const totalRevenue = transactions.reduce((s, t) => s + t.totalAmount, 0);
  const totalItems = movements.reduce((s, m) => s + Math.abs(m.quantityChange), 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <a href="/" className="hover:text-slate-600 transition-colors">Dashboard</a>
            <span>/</span>
            <span className="text-slate-600 font-medium">Riwayat Transaksi</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Riwayat Transaksi</h1>
          <p className="text-slate-500 text-sm mt-1">Semua transaksi penjualan yang dicatat melalui modul kasir.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Transaksi', value: transactions.length, icon: '🧾', color: 'from-blue-500/10 to-indigo-500/10 border-blue-200/60' },
            { label: 'Total Item Terjual', value: totalItems, icon: '📦', color: 'from-purple-500/10 to-violet-500/10 border-purple-200/60' },
            { label: 'Total Pendapatan', value: formatCurrency(totalRevenue), icon: '💰', color: 'from-emerald-500/10 to-green-500/10 border-emerald-200/60', isText: true },
          ].map(({ label, value, icon, color, isText }) => (
            <div key={label} className={`bg-gradient-to-br ${color} border rounded-2xl px-5 py-4`}>
              <div className="text-xl mb-1">{icon}</div>
              <div className={`font-bold text-slate-800 ${isText ? 'text-xl' : 'text-2xl'}`}>{value}</div>
              <div className="text-sm text-slate-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-4xl mb-3">🧾</p>
              <p className="font-medium text-slate-600">Belum ada transaksi</p>
              <p className="text-sm text-slate-400 mt-1">Transaksi dari modul kasir akan muncul di sini.</p>
            </div>
          ) : (
            transactions.map((t) => (
              <details
                key={t.referenceId}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group"
              >
                <summary className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors list-none">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-lg shrink-0">
                    🧾
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">
                      #{t.referenceId.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(t.processedAt).toLocaleString('id-ID')} ·{' '}
                      {LOCATION_TYPE_ICON[t.location?.type ?? ''] ?? '📍'} {t.location?.name ?? 'Tidak diketahui'} ·{' '}
                      Kasir: {t.actor.name}
                    </p>
                  </div>

                  {/* Total & Items count */}
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-800">{formatCurrency(t.totalAmount)}</p>
                    <p className="text-xs text-slate-400">{t.items.length} produk</p>
                  </div>

                  {/* Chevron */}
                  <svg className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform shrink-0"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>

                {/* Item Detail */}
                <div className="border-t border-slate-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Produk</th>
                        <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Qty</th>
                        <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Harga</th>
                        <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {t.items.map((m) => {
                        const price = m.product.price ? Number(m.product.price) : 0;
                        const qty = Math.abs(m.quantityChange);
                        return (
                          <tr key={m.id} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3">
                              <p className="font-medium text-slate-800">{m.product.name}</p>
                              <p className="text-xs text-slate-400 font-mono">{m.product.sku}</p>
                            </td>
                            <td className="px-5 py-3 text-right text-slate-700">
                              {qty} <span className="text-xs text-slate-400">{m.product.unit}</span>
                            </td>
                            <td className="px-5 py-3 text-right text-slate-600">{formatCurrency(price)}</td>
                            <td className="px-5 py-3 text-right font-semibold text-slate-800">{formatCurrency(price * qty)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50">
                        <td colSpan={3} className="px-5 py-3 text-right font-bold text-slate-700">Total</td>
                        <td className="px-5 py-3 text-right font-bold text-emerald-600">{formatCurrency(t.totalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </details>
            ))
          )}
        </div>

        <p className="text-center text-xs text-slate-400 pb-4">
          Menampilkan {transactions.length} transaksi terakhir (maks. 500)
        </p>
      </div>
    </main>
  );
}
