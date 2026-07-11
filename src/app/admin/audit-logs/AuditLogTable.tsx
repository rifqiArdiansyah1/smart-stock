'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: any;
  newValue: any;
  createdAt: string;
  actor: { id: string; name: string; role: string } | null;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AuditLogTableProps {
  actors: { id: string; name: string }[];
}

const ACTION_OPTIONS = [
  'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT',
  'LOGIN', 'LOGOUT', 'STOCK_ADJUSTMENT', 'CHECKOUT',
];

const ENTITY_OPTIONS = [
  'User', 'Product', 'Location', 'StockMovement',
  'StockOpnameSession', 'StockOpnameItem',
];

const ACTION_BADGE: Record<string, string> = {
  APPROVE: 'bg-green-100 text-green-700',
  REJECT: 'bg-red-100 text-red-700',
  CREATE: 'bg-blue-100 text-blue-700',
  UPDATE: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-rose-100 text-rose-700',
  CHECKOUT: 'bg-purple-100 text-purple-700',
  STOCK_ADJUSTMENT: 'bg-orange-100 text-orange-700',
  LOGIN: 'bg-slate-100 text-slate-600',
  LOGOUT: 'bg-slate-100 text-slate-600',
};

function JsonCell({ value }: { value: any }) {
  if (value == null) return <span className="text-slate-300 italic text-xs">-</span>;
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  return (
    <span className="font-mono text-xs text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded max-w-[200px] truncate inline-block" title={str}>
      {str}
    </span>
  );
}

export default function AuditLogTable({ actors }: AuditLogTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filter state
  const [actorId, setActorId] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (actorId) params.set('actorId', actorId);
    if (action) params.set('action', action);
    if (entityType) params.set('entityType', entityType);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    params.set('page', String(page));
    params.set('limit', '50');
    return params.toString();
  }, [actorId, action, entityType, dateFrom, dateTo, page]);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/audit-logs?${buildQuery()}`);
      const json = await res.json();
      setLogs(json.data || []);
      setMeta(json.meta || { total: 0, page: 1, limit: 50, totalPages: 1 });
    } catch {
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleReset = () => {
    setActorId('');
    setAction('');
    setEntityType('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (actorId) params.set('actorId', actorId);
      if (action) params.set('action', action);
      if (entityType) params.set('entityType', entityType);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/audit-logs/export-csv?${params.toString()}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Filter Panel */}
      <form onSubmit={handleFilterSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Actor */}
          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Pengguna</label>
            <select
              value={actorId}
              onChange={e => setActorId(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none bg-white"
            >
              <option value="">Semua Pengguna</option>
              {actors.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Action */}
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tipe Aksi</label>
            <select
              value={action}
              onChange={e => setAction(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none bg-white"
            >
              <option value="">Semua Aksi</option>
              {ACTION_OPTIONS.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Entity Type */}
          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tipe Entitas</label>
            <select
              value={entityType}
              onChange={e => setEntityType(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none bg-white"
            >
              <option value="">Semua Entitas</option>
              {ENTITY_OPTIONS.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Dari Tanggal</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Sampai Tanggal</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-medium"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-500 rounded-xl transition-colors font-semibold shadow-sm"
            >
              Terapkan Filter
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="px-4 py-2 text-sm text-white bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors font-semibold shadow-sm flex items-center gap-2"
            >
              {isExporting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              Export CSV
            </button>
          </div>
        </div>
      </form>

      {/* Stats Row */}
      <div className="flex items-center justify-between text-sm text-slate-500 px-1">
        <span>
          Total: <strong className="text-slate-800">{meta.total.toLocaleString('id-ID')}</strong> entri
        </span>
        <span>Halaman <strong className="text-slate-800">{meta.page}</strong> dari <strong className="text-slate-800">{meta.totalPages}</strong></span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold text-slate-600 whitespace-nowrap">Timestamp</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600 whitespace-nowrap">Pelaku</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600 whitespace-nowrap">Aksi</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600 whitespace-nowrap">Entitas</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600 whitespace-nowrap">Entity ID</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600 whitespace-nowrap">Nilai Lama</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600 whitespace-nowrap">Nilai Baru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-slate-100 rounded w-full"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    Tidak ada data audit log sesuai filter yang dipilih.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                      {new Date(log.createdAt).toLocaleString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{log.actor?.name || 'System'}</div>
                      <div className="text-xs text-slate-400">{log.actor?.role}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ACTION_BADGE[log.action] || 'bg-slate-100 text-slate-600'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-slate-700 font-medium">{log.entityType}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-slate-400 truncate max-w-[100px] inline-block" title={log.entityId}>
                        {log.entityId.slice(0, 8)}…
                      </span>
                    </td>
                    <td className="px-5 py-4"><JsonCell value={log.oldValue} /></td>
                    <td className="px-5 py-4"><JsonCell value={log.newValue} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Sebelumnya
          </button>
          <span className="px-4 py-2 text-sm text-slate-500">
            {page} / {meta.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
            disabled={page >= meta.totalPages}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Selanjutnya →
          </button>
        </div>
      )}
    </div>
  );
}
