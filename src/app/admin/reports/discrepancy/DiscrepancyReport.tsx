'use client';

import { useState, useEffect, useCallback } from 'react';

interface TableRow {
  productId: string;
  productName: string;
  sku: string;
  category: string | null;
  price: number;
  totalDifference: number;
  absTotal: number;
  occurrences: number;
  lastOccurrence: string;
  lossValue: number;
}

interface TrendPoint {
  month: string;
  totalAbsDiff: number;
}

interface FilterOptions {
  locations: { id: string; name: string }[];
  categories: string[];
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
}

function TrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return <div className="py-8 text-center text-slate-400 text-sm">Belum ada data tren.</div>;
  }
  const max = Math.max(...data.map((d) => d.totalAbsDiff), 1);
  return (
    <div className="flex items-end gap-2 h-32 px-2">
      {data.map((d) => {
        const pct = (d.totalAbsDiff / max) * 100;
        return (
          <div key={d.month} className="flex flex-col items-center gap-1 flex-1 min-w-0" title={`${d.month}: ${d.totalAbsDiff} unit selisih`}>
            <div className="w-full relative flex flex-col justify-end" style={{ height: '100px' }}>
              <div
                className="w-full bg-purple-500 rounded-t-md transition-all duration-700 hover:bg-purple-600"
                style={{ height: `${Math.max(pct, 3)}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 truncate w-full text-center">
              {d.month.slice(5)} {/* Show only MM */}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function DiscrepancyReport() {
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ locations: [], categories: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [locationId, setLocationId] = useState('');
  const [category, setCategory] = useState('');

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (locationId) params.set('locationId', locationId);
    if (category) params.set('category', category);
    return params.toString();
  }, [dateFrom, dateTo, locationId, category]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reports/discrepancy?${buildQuery()}`);
      const json = await res.json();
      setTableData(json.tableData || []);
      setTrendData(json.trendData || []);
      setFilterOptions(json.filterOptions || { locations: [], categories: [] });
    } finally {
      setIsLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/reports/discrepancy/export-csv?${buildQuery()}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-selisih-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const totalLoss = tableData.reduce((s, r) => s + r.lossValue, 0);
  const totalOccurrences = tableData.reduce((s, r) => s + r.occurrences, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Filter Bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); fetchData(); }}
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-wrap gap-4 items-end"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Dari Tanggal</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Sampai Tanggal</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none" />
        </div>
        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Lokasi</label>
          <select value={locationId} onChange={e => setLocationId(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none bg-white">
            <option value="">Semua Lokasi</option>
            {filterOptions.locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Kategori</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none bg-white">
            <option value="">Semua Kategori</option>
            {filterOptions.categories.map(c => <option key={c} value={c!}>{c}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button type="button" onClick={() => { setDateFrom(''); setDateTo(''); setLocationId(''); setCategory(''); }}
            className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors">
            Reset
          </button>
          <button type="submit"
            className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-500 rounded-xl font-semibold shadow-sm transition-colors">
            Tampilkan
          </button>
          <button type="button" onClick={handleExportCsv} disabled={isExporting}
            className="px-4 py-2 text-sm text-white bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold shadow-sm transition-colors flex items-center gap-2">
            {isExporting
              ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            }
            Export CSV
          </button>
        </div>
      </form>

      {/* Summary Cards + Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 grid grid-cols-1 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-red-600 font-medium">Total Estimasi Kerugian</p>
            <p className="text-2xl font-extrabold text-red-700 mt-1">
              {isLoading ? '...' : formatCurrency(totalLoss)}
            </p>
            <p className="text-xs text-red-400 mt-1">Dari selisih negatif × harga</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-purple-600 font-medium">Jumlah Produk Berselisih</p>
            <p className="text-2xl font-extrabold text-purple-700 mt-1">
              {isLoading ? '...' : tableData.length}
            </p>
            <p className="text-xs text-purple-400 mt-1">{totalOccurrences} kejadian total</p>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4">Tren Selisih per Bulan (unit)</h2>
          {isLoading
            ? <div className="h-32 bg-slate-50 rounded-xl animate-pulse" />
            : <TrendChart data={trendData} />
          }
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Detail Selisih per Produk</h2>
          <span className="text-xs text-slate-400">{tableData.length} produk</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold text-slate-600">#</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600">Produk</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600">Kategori</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600 text-right">Selisih Kumulatif</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600 text-right">Total |Selisih|</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600 text-right">Frekuensi</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600 text-right">Est. Kerugian</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600">Terakhir Selisih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : tableData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    Tidak ada data selisih sesuai filter.
                  </td>
                </tr>
              ) : (
                tableData.map((row, i) => (
                  <tr key={row.productId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 text-slate-400 font-mono text-xs">{i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{row.productName}</div>
                      <div className="text-xs text-slate-400 font-mono">{row.sku}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{row.category || '-'}</td>
                    <td className="px-5 py-4 text-right">
                      <span className={`font-bold ${row.totalDifference < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {row.totalDifference > 0 ? '+' : ''}{row.totalDifference}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-700">{row.absTotal}</td>
                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold text-xs">
                        {row.occurrences}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-red-600">
                      {row.lossValue > 0 ? formatCurrency(row.lossValue) : '-'}
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(row.lastOccurrence).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
