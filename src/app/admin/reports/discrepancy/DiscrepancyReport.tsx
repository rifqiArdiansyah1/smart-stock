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
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
        <svg className="w-8 h-8 text-slate-400 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Belum ada data tren</span>
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.totalAbsDiff), 1);
  return (
    <div className="flex items-end gap-3 h-40 px-2 mt-4">
      {data.map((d) => {
        const pct = (d.totalAbsDiff / max) * 100;
        return (
          <div key={d.month} className="group flex flex-col items-center gap-2 flex-1 min-w-0 relative">
            {/* Tooltip */}
            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 shadow-lg">
              {d.month}: {d.totalAbsDiff} unit
            </div>
            
            <div className="w-full relative flex flex-col justify-end" style={{ height: '120px' }}>
              <div
                className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 dark:from-indigo-500 dark:to-indigo-300 rounded-t-lg transition-all duration-700 hover:opacity-80 shadow-sm"
                style={{ height: `${Math.max(pct, 5)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate w-full text-center group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
              {new Date(d.month).toLocaleDateString('id-ID', { month: 'short' })}
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
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* ── Filter Bar ── */}
      <form
        onSubmit={(e) => { e.preventDefault(); fetchData(); }}
        className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row flex-wrap gap-4 items-end"
      >
        <div className="flex flex-col gap-1.5 w-full md:w-auto flex-1 md:flex-none">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dari Tanggal</label>
          <div className="relative">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 w-full md:w-auto flex-1 md:flex-none">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sampai Tanggal</label>
          <div className="relative">
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 w-full md:w-auto flex-1 md:flex-none min-w-[180px]">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lokasi</label>
          <div className="relative">
            <select value={locationId} onChange={e => setLocationId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 pr-10 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm cursor-pointer">
              <option value="">Semua Lokasi</option>
              {filterOptions.locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 w-full md:w-auto flex-1 md:flex-none min-w-[180px]">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kategori</label>
          <div className="relative">
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 pr-10 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm cursor-pointer">
              <option value="">Semua Kategori</option>
              {filterOptions.categories.map(c => <option key={c} value={c!}>{c}</option>)}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-none border-slate-100 dark:border-slate-700/50">
          <button type="button" onClick={() => { setDateFrom(''); setDateTo(''); setLocationId(''); setCategory(''); }}
            className="flex-1 w-full md:flex-none px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 cursor-pointer dark:hover:bg-slate-600 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400">
            Reset
          </button>
          <button type="submit"
            className="cursor-pointer flex-1 w-full md:flex-none px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Filter
          </button>
          <button type="button" onClick={handleExportCsv} disabled={isExporting}
            className="cursor-pointer flex-1 md:flex-none w-full px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-400">
            {isExporting
              ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            }
            Export
          </button>
        </div>
      </form>

      {/* ── Summary Cards + Trend Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 border border-red-200/60 dark:border-red-800/30 rounded-2xl p-6 shadow-sm group hover:shadow-md transition-shadow">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full blur-xl group-hover:bg-red-500/10 transition-colors" />
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><polyline points="17 5 12 2 7 5"/><polyline points="17 19 12 22 7 19"/></svg>
              </div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">Estimasi Kerugian</p>
            </div>
            <p className="text-3xl font-display font-extrabold text-red-700 dark:text-red-300 tracking-tight">
              {isLoading ? <span className="animate-pulse bg-red-200/50 dark:bg-red-800/50 rounded text-transparent">Rp 00.000</span> : formatCurrency(totalLoss)}
            </p>
            <p className="text-xs text-red-500/80 dark:text-red-400/80 mt-2 font-medium">Nilai akumulasi dari selisih negatif</p>
          </div>
          
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 border border-amber-200/60 dark:border-amber-800/30 rounded-2xl p-6 shadow-sm group hover:shadow-md transition-shadow">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors" />
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Produk Terdampak</p>
            </div>
            <p className="text-3xl font-display font-extrabold text-amber-700 dark:text-amber-300 tracking-tight">
              {isLoading ? <span className="animate-pulse bg-amber-200/50 dark:bg-amber-800/50 rounded text-transparent">00</span> : tableData.length}
            </p>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-2 font-medium">Dari {totalOccurrences} total kejadian</p>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100">Tren Volume Selisih per Bulan</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total unit selisih absolut (negatif & positif)</p>
          </div>
          {isLoading
            ? <div className="h-40 bg-slate-50 dark:bg-slate-800/50 rounded-xl animate-pulse mt-4 border border-dashed border-slate-200 dark:border-slate-700" />
            : <TrendChart data={trendData} />
          }
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Rincian Selisih Produk</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Detail pergerakan stok tak wajar per SKU</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-600">
            {tableData.length} Produk Ditemukan
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold text-center w-12">#</th>
                <th className="px-6 py-4 font-semibold">Info Produk</th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold text-right">Kumulatif</th>
                <th className="px-6 py-4 font-semibold text-right" title="Total Absolut Selisih">Total |Δ|</th>
                <th className="px-6 py-4 font-semibold text-center">Frekuensi</th>
                <th className="px-6 py-4 font-semibold text-right">Est. Kerugian</th>
                <th className="px-6 py-4 font-semibold text-right">Terakhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5 text-center"><div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded mx-auto" /></td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                      <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
                    </td>
                    <td className="px-6 py-5"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                    <td className="px-6 py-5"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded ml-auto" /></td>
                    <td className="px-6 py-5"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded ml-auto" /></td>
                    <td className="px-6 py-5"><div className="h-6 w-8 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" /></td>
                    <td className="px-6 py-5"><div className="h-4 w-24 bg-red-100 dark:bg-red-900/30 rounded ml-auto" /></td>
                    <td className="px-6 py-5"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : tableData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                      </div>
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-lg">Tidak Ada Selisih</p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Data selisih stok bersih untuk filter ini.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tableData.map((row, i) => (
                  <tr key={row.productId} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-center font-mono text-xs text-slate-400 dark:text-slate-500">{i + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{row.productName}</div>
                      <div className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 mt-1 bg-slate-100 dark:bg-slate-800 inline-block px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{row.sku}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{row.category || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex font-bold px-2.5 py-1 rounded-md ${
                        row.totalDifference < 0 
                          ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' 
                          : row.totalDifference > 0 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {row.totalDifference > 0 ? '+' : ''}{row.totalDifference}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">{row.absTotal}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-bold text-xs ring-1 ring-indigo-100 dark:ring-indigo-500/20 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                        {row.occurrences}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${row.lossValue > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {row.lossValue > 0 ? formatCurrency(row.lossValue) : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                      {new Date(row.lastOccurrence).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric'
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
