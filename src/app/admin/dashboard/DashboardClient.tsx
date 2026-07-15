'use client';

import { useState, useEffect, useRef } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface KpiData {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  opnameThisMonth: number;
  pendingOpname: number;
}

interface OpnameSession {
  id: string;
  locationName: string;
  startedBy: string;
  status: string;
  createdAt: string;
}

interface ProductStat {
  productId: string;
  productName: string;
  sku: string;
  totalDifference?: number;
  occurrences?: number;
  totalSold?: number;
}

// ── Helper Components ──────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  icon,
  color,
  isLoading,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  color: string;
  isLoading: boolean;
}) {
  const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
    blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   text: 'text-blue-700' },
    green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600', text: 'text-green-700' },
    red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',     text: 'text-red-700' },
    amber:  { bg: 'bg-amber-50',  icon: 'bg-amber-100 text-amber-600', text: 'text-amber-700' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', text: 'text-purple-700' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`${c.bg} rounded-2xl p-5 border border-white shadow-sm flex items-start gap-4`}>
      <div className={`${c.icon} w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        {isLoading ? (
          <div className="h-8 w-24 bg-slate-200 rounded animate-pulse mt-1"></div>
        ) : (
          <p className={`text-2xl font-extrabold mt-0.5 ${c.text}`}>{value}</p>
        )}
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function HorizontalBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(4, (Math.abs(value) / Math.abs(max)) * 100) : 4;
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-36 shrink-0 text-slate-700 font-medium truncate" title={label}>{label}</div>
      <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-10 text-right font-mono text-xs text-slate-600 shrink-0">{Math.abs(value)}</div>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  IN_PROGRESS:      'bg-blue-100 text-blue-700',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
  APPROVED:         'bg-green-100 text-green-700',
  REJECTED:         'bg-red-100 text-red-700',
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function DashboardClient() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [recentOpname, setRecentOpname] = useState<OpnameSession[]>([]);
  const [discrepancyData, setDiscrepancyData] = useState<ProductStat[]>([]);
  const [fastMoving, setFastMoving] = useState<ProductStat[]>([]);
  const [slowMoving, setSlowMoving] = useState<ProductStat[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [activeChart, setActiveChart] = useState<'discrepancy' | 'fast' | 'slow'>('discrepancy');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch('/api/dashboard/summary');
        const json = await res.json();
        setKpi(json.kpi);
        setRecentOpname(json.recentOpname || []);
      } finally {
        setIsLoadingSummary(false);
      }
    };

    const fetchCharts = async () => {
      try {
        const res = await fetch('/api/dashboard/charts');
        const json = await res.json();
        setDiscrepancyData(json.discrepancyData || []);
        setFastMoving(json.fastMoving || []);
        setSlowMoving(json.slowMoving || []);
      } finally {
        setIsLoadingCharts(false);
      }
    };

    fetchSummary();
    fetchCharts();
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const chartData = activeChart === 'discrepancy'
    ? { items: discrepancyData, valueKey: 'occurrences' as const, label: 'Frekuensi Selisih', color: 'bg-purple-500' }
    : activeChart === 'fast'
    ? { items: fastMoving, valueKey: 'totalSold' as const, label: 'Total Terjual (30 hari)', color: 'bg-emerald-500' }
    : { items: slowMoving, valueKey: 'totalSold' as const, label: 'Total Terjual (30 hari)', color: 'bg-slate-400' };

  const chartMax = Math.max(...chartData.items.map((d) => Math.abs((d as any)[chartData.valueKey] || 0)), 1);

  return (
    <div className="flex flex-col gap-6">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Produk Aktif"
          value={kpi ? kpi.totalProducts.toLocaleString('id-ID') : '–'}
          icon="📦"
          color="blue"
          isLoading={isLoadingSummary}
        />
        <KpiCard
          label="Nilai Total Stok"
          value={kpi ? formatCurrency(kpi.totalStockValue) : '–'}
          sub="Estimasi dari harga jual"
          icon="💰"
          color="green"
          isLoading={isLoadingSummary}
        />
        <KpiCard
          label="Produk Low-Stock"
          value={kpi ? kpi.lowStockCount.toLocaleString('id-ID') : '–'}
          sub="Stok di bawah minimum"
          icon="⚠️"
          color={kpi && kpi.lowStockCount > 0 ? 'red' : 'green'}
          isLoading={isLoadingSummary}
        />
        <KpiCard
          label="Opname Bulan Ini"
          value={kpi ? kpi.opnameThisMonth.toLocaleString('id-ID') : '–'}
          sub={kpi && kpi.pendingOpname > 0 ? `${kpi.pendingOpname} menunggu approval` : undefined}
          icon="🗂️"
          color={kpi && kpi.pendingOpname > 0 ? 'amber' : 'purple'}
          isLoading={isLoadingSummary}
        />
      </div>

      {/* ── Charts + Recent Opname ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Panel */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="font-bold text-slate-800 text-lg">Analisis Produk</h2>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs font-semibold">
              {[
                { key: 'discrepancy', label: '📊 Selisih Terbanyak' },
                { key: 'fast', label: '🚀 Fast Moving' },
                { key: 'slow', label: '🐢 Slow Moving' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveChart(tab.key as any)}
                  className={`px-3 py-2 transition-colors ${
                    activeChart === tab.key
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {isLoadingCharts ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-36 h-4 bg-slate-100 rounded animate-pulse"></div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full animate-pulse"></div>
                  <div className="w-8 h-4 bg-slate-100 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : chartData.items.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Belum ada data untuk ditampilkan.
            </div>
          ) : (
            <div className="space-y-2.5">
              {chartData.items.map((item, i) => (
                <HorizontalBar
                  key={item.productId}
                  label={item.productName}
                  value={(item as any)[chartData.valueKey] || 0}
                  max={chartMax}
                  color={chartData.color}
                />
              ))}
            </div>
          )}

          {!isLoadingCharts && chartData.items.length > 0 && (
            <p className="text-xs text-slate-400 mt-4 text-right">{chartData.label}</p>
          )}
        </div>

        {/* Recent Opname */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 text-lg">Sesi Opname Terbaru</h2>
            <a href="/opname" className="text-xs text-primary-600 hover:underline font-medium">Lihat Semua →</a>
          </div>

          {isLoadingSummary ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentOpname.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Belum ada sesi opname.
            </div>
          ) : (
            <div className="space-y-2 flex-1">
              {recentOpname.map((s) => (
                <a
                  key={s.id}
                  href={`/opname/${s.id}`}
                  className="block p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-slate-800 text-sm leading-tight">{s.locationName}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${STATUS_STYLES[s.status] || 'bg-slate-100 text-slate-600'}`}>
                      {s.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {s.startedBy} · {new Date(s.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Links ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Monitor Expiry', href: '/admin/expiry', icon: '🗓️', desc: 'Cek produk hampir kadaluarsa' },
          { label: 'Audit Log', href: '/admin/audit-logs', icon: '📋', desc: 'Riwayat aktivitas sistem' },
          { label: 'Stock Opname', href: '/opname', icon: '🗂️', desc: 'Kelola sesi opname' },
          { label: 'Kasir POS', href: '/kasir', icon: '🛒', desc: 'Transaksi penjualan' },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-primary-300 hover:shadow-md transition-all group"
          >
            <div className="text-2xl mb-2">{link.icon}</div>
            <div className="font-semibold text-slate-800 text-sm group-hover:text-primary-700 transition-colors">{link.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{link.desc}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
