'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ── Types ─────────────────────────────────────────────────────
type StockStatus = 'normal' | 'low' | 'critical';

type StockItem = {
  id: string;
  quantity: number;
  updatedAt: string;
  status: StockStatus;
  product: {
    id: string;
    sku: string;
    name: string;
    category: string;
    unit: string;
    minStock: number;
  };
  location: {
    id: string;
    name: string;
    type: string;
  };
};

type Summary = { total: number; critical: number; low: number; normal: number };

type Location = { id: string; name: string; type: string };

interface StockTableProps {
  initialData: StockItem[];
  initialSummary: Summary;
  locations: Location[];
}

// ── Config ────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 30_000;

const STATUS_CONFIG: Record<StockStatus, { label: string; rowClass: string; badgeClass: string; icon: string }> = {
  critical: {
    label: 'Critical',
    rowClass: 'bg-red-50/60 hover:bg-red-50',
    badgeClass: 'bg-red-100 text-red-700 ring-red-300',
    icon: '🔴',
  },
  low: {
    label: 'Low Stock',
    rowClass: 'bg-amber-50/60 hover:bg-amber-50',
    badgeClass: 'bg-amber-100 text-amber-700 ring-amber-300',
    icon: '🟡',
  },
  normal: {
    label: 'Normal',
    rowClass: 'hover:bg-slate-50/70',
    badgeClass: 'bg-green-100 text-green-700 ring-green-300',
    icon: '🟢',
  },
};

const LOCATION_TYPE_ICON: Record<string, string> = {
  GUDANG: '🏭', RAK: '📦', AREA: '📍', TOKO: '🏪',
};

// ── Helpers ───────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}d lalu`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}j lalu`;
  return `${Math.floor(seconds / 86400)}h lalu`;
}

// ── Component ─────────────────────────────────────────────────
export default function StockTable({ initialData, initialSummary, locations }: StockTableProps) {
  const [data, setData] = useState<StockItem[]>(initialData);
  const [summary, setSummary] = useState<Summary>(initialSummary);
  const [search, setSearch] = useState('');
  const [locationId, setLocationId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | StockStatus>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [countdown, setCountdown] = useState(POLL_INTERVAL_MS / 1000);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // ── Fetch data ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (locationId) params.set('locationId', locationId);
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/stock-levels?${params.toString()}`);
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setData(json.data);
      setSummary(json.summary);
      setLastRefreshed(new Date());
      setCountdown(POLL_INTERVAL_MS / 1000);
    } catch {
      /* silent */
    } finally {
      setIsRefreshing(false);
    }
  }, [locationId, statusFilter, search]);

  // ── Polling: reset every filter change ────────────────────
  useEffect(() => {
    fetchData();

    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    intervalRef.current = setInterval(fetchData, POLL_INTERVAL_MS);

    setCountdown(POLL_INTERVAL_MS / 1000);
    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c > 1 ? c - 1 : POLL_INTERVAL_MS / 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [fetchData]);

  // ── Client-side search filter (instant UX) ────────────────
  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (s) =>
        s.product.name.toLowerCase().includes(q) ||
        s.product.sku.toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Entri Stok', value: summary.total, icon: '📊', color: 'from-blue-500/10 to-indigo-500/10 border-blue-200/60' },
          { label: 'Normal', value: summary.normal, icon: '🟢', color: 'from-emerald-500/10 to-green-500/10 border-emerald-200/60' },
          { label: 'Low Stock', value: summary.low, icon: '🟡', color: 'from-amber-500/10 to-orange-500/10 border-amber-200/60' },
          { label: 'Critical (Habis)', value: summary.critical, icon: '🔴', color: 'from-red-500/10 to-rose-500/10 border-red-200/60' },
        ].map(({ label, value, icon, color }) => (
          <div
            key={label}
            className={`bg-gradient-to-br ${color} border rounded-2xl px-5 py-4 cursor-pointer transition-all hover:shadow-sm`}
          >
            <div className="text-xl mb-1">{icon}</div>
            <div className="text-2xl font-bold text-slate-800">{value}</div>
            <div className="text-sm text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama produk atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
          />
        </div>

        {/* Location Filter */}
        <select
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
        >
          <option value="">Semua Lokasi</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {LOCATION_TYPE_ICON[l.type] ?? '📍'} {l.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as '' | StockStatus)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
        >
          <option value="">Semua Status</option>
          <option value="critical">🔴 Critical</option>
          <option value="low">🟡 Low Stock</option>
          <option value="normal">🟢 Normal</option>
        </select>

        {/* Manual Refresh + Countdown */}
        <button
          onClick={fetchData}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition-all whitespace-nowrap"
          title="Refresh sekarang"
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isRefreshing ? 'Refresh...' : `Refresh (${countdown}s)`}
        </button>
      </div>

      {/* Last Refreshed */}
      <p className="text-xs text-slate-400 -mt-2">
        Terakhir diperbarui: {lastRefreshed.toLocaleTimeString('id-ID')} · Auto-refresh tiap 30 detik
      </p>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Produk</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Lokasi</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Stok Sistem</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Min. Stok</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Diperbarui</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const cfg = STATUS_CONFIG[item.status];
                return (
                  <tr key={item.id} className={`transition-colors ${cfg.rowClass}`}>
                    {/* Produk */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-base shrink-0">
                          📦
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm leading-tight">{item.product.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{item.product.sku} · {item.product.category}</p>
                        </div>
                      </div>
                    </td>

                    {/* Lokasi */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{LOCATION_TYPE_ICON[item.location.type] ?? '📍'}</span>
                        <span className="text-sm text-slate-700 font-medium">{item.location.name}</span>
                      </div>
                    </td>

                    {/* Stok Sistem */}
                    <td className="px-5 py-3.5 text-right">
                      <span className={`text-lg font-bold ${
                        item.status === 'critical' ? 'text-red-600' :
                        item.status === 'low' ? 'text-amber-600' :
                        'text-slate-800'
                      }`}>
                        {item.quantity.toLocaleString('id-ID')}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">{item.product.unit}</span>
                    </td>

                    {/* Min Stok */}
                    <td className="px-5 py-3.5 text-right text-sm text-slate-500">
                      {item.product.minStock.toLocaleString('id-ID')}
                      <span className="text-xs text-slate-400 ml-1">{item.product.unit}</span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${cfg.badgeClass}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>

                    {/* Terakhir Update */}
                    <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      {timeAgo(item.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400">
            <p className="text-4xl mb-3">📊</p>
            <p className="font-medium text-slate-600">Tidak ada data stok</p>
            <p className="text-sm mt-1">Coba ubah filter atau tambah stok melalui transaksi.</p>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-400 pb-4">
        Menampilkan {filtered.length} dari {summary.total} entri stok ·{' '}
        <span className="font-medium text-slate-500">stock_levels hanya diperbarui melalui proses resmi</span>
      </p>
    </div>
  );
}
