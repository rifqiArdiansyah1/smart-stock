/**
 * AuditLogTable.tsx — Client component Audit Log
 *
 * Redesign per ISSUE-029-D6:
 * - Filter bar 4-kolom: pengguna, jenis aksi, entitas, rentang tanggal
 * - Tabel dengan sticky header, timestamp JetBrains Mono
 * - Action badge berwarna per tipe
 * - Export CSV button
 * - Pagination numerik
 *
 * Design ref: stitch audit_log_smartstock_final/code.html
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

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

const DATE_OPTIONS = [
  { label: '24 Jam Terakhir', value: '1d' },
  { label: '7 Hari Terakhir',  value: '7d' },
  { label: '30 Hari Terakhir', value: '30d' },
  { label: 'Kustom',           value: 'custom' },
];

/* Map action → badge class */
function getActionBadgeClass(action: string): string {
  const map: Record<string, string> = {
    APPROVE:          'ss-action-badge--approve',
    REJECT:           'ss-action-badge--reject',
    CREATE:           'ss-action-badge--create',
    UPDATE:           'ss-action-badge--update',
    DELETE:           'ss-action-badge--delete',
    CHECKOUT:         'ss-action-badge--checkout',
    STOCK_ADJUSTMENT: 'ss-action-badge--stock',
    LOGIN:            'ss-action-badge--auth',
    LOGOUT:           'ss-action-badge--auth',
  };
  return map[action] ?? 'ss-action-badge--auth';
}

/* Map action → icon */
function getActionIcon(action: string): string {
  const map: Record<string, string> = {
    APPROVE:          'check_circle',
    REJECT:           'cancel',
    CREATE:           'add_box',
    UPDATE:           'edit_square',
    DELETE:           'delete',
    CHECKOUT:         'shopping_cart_checkout',
    STOCK_ADJUSTMENT: 'tune',
    LOGIN:            'login',
    LOGOUT:           'logout',
  };
  return map[action] ?? 'info';
}

/* Format action label */
function getActionLabel(action: string): string {
  const map: Record<string, string> = {
    APPROVE: 'Disetujui', REJECT: 'Ditolak', CREATE: 'Dibuat',
    UPDATE: 'Diperbarui', DELETE: 'Dihapus', CHECKOUT: 'Checkout',
    STOCK_ADJUSTMENT: 'Disesuaikan', LOGIN: 'Masuk', LOGOUT: 'Keluar',
  };
  return map[action] ?? action;
}

/* Format timestamp */
function formatTs(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

export default function AuditLogTable({ actors }: AuditLogTableProps) {
  const [logs, setLogs]             = useState<AuditLog[]>([]);
  const [meta, setMeta]             = useState<Meta>({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [isLoading, setIsLoading]   = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filters
  const [actorId, setActorId]       = useState('');
  const [action, setAction]         = useState('');
  const [entityType, setEntityType] = useState('');
  const [dateRange, setDateRange]   = useState('7d');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [page, setPage]             = useState(1);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (actorId)     params.set('actorId', actorId);
    if (action)      params.set('action', action);
    if (entityType)  params.set('entityType', entityType);
    if (dateRange !== 'custom') {
      const days  = dateRange === '1d' ? 1 : dateRange === '7d' ? 7 : 30;
      const from  = new Date(Date.now() - days * 86400_000);
      params.set('dateFrom', from.toISOString().split('T')[0]);
    } else {
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo)   params.set('dateTo', dateTo);
    }
    params.set('page', String(page));
    params.set('limit', '50');
    return params.toString();
  }, [actorId, action, entityType, dateRange, dateFrom, dateTo, page]);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res  = await fetch(`/api/audit-logs?${buildQuery()}`);
      const json = await res.json();
      setLogs(json.data || []);
      setMeta(json.meta || { total: 0, page: 1, limit: 50, totalPages: 1 });
    } catch {
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleReset = () => {
    setActorId(''); setAction(''); setEntityType('');
    setDateRange('7d'); setDateFrom(''); setDateTo(''); setPage(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (actorId)    params.set('actorId', actorId);
      if (action)     params.set('action', action);
      if (entityType) params.set('entityType', entityType);
      if (dateFrom)   params.set('dateFrom', dateFrom);
      if (dateTo)     params.set('dateTo', dateTo);

      const res  = await fetch(`/api/audit-logs/export-csv?${params.toString()}`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* ── Filter Bar ── */}
      <div className="ss-audit-filter" role="search" aria-label="Filter Log Audit">
        {/* Pengguna */}
        <div className="ss-audit-filter-field">
          <label className="ss-audit-filter-label" htmlFor="al-actor">Pengguna</label>
          <div className="ss-audit-filter-select-wrap">
            <span className="material-symbols-outlined ss-audit-filter-icon">person</span>
            <select
              id="al-actor"
              value={actorId}
              onChange={(e) => { setActorId(e.target.value); setPage(1); }}
              className="ss-audit-filter-select"
            >
              <option value="">Semua Pengguna</option>
              <option value="system">Sistem</option>
              {actors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Jenis Aksi */}
        <div className="ss-audit-filter-field">
          <label className="ss-audit-filter-label" htmlFor="al-action">Jenis Tindakan</label>
          <div className="ss-audit-filter-select-wrap">
            <span className="material-symbols-outlined ss-audit-filter-icon">category</span>
            <select
              id="al-action"
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
              className="ss-audit-filter-select"
            >
              <option value="">Semua Tindakan</option>
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>{getActionLabel(a)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Entitas */}
        <div className="ss-audit-filter-field">
          <label className="ss-audit-filter-label" htmlFor="al-entity">Entitas</label>
          <div className="ss-audit-filter-select-wrap">
            <span className="material-symbols-outlined ss-audit-filter-icon">database</span>
            <select
              id="al-entity"
              value={entityType}
              onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
              className="ss-audit-filter-select"
            >
              <option value="">Semua Entitas</option>
              {ENTITY_OPTIONS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Rentang Tanggal */}
        <div className="ss-audit-filter-field">
          <label className="ss-audit-filter-label" htmlFor="al-date">Rentang Tanggal</label>
          <div className="ss-audit-filter-select-wrap">
            <span className="material-symbols-outlined ss-audit-filter-icon">calendar_today</span>
            <select
              id="al-date"
              value={dateRange}
              onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
              className="ss-audit-filter-select"
            >
              {DATE_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions row */}
        <div className="ss-audit-filter-actions" style={{ gridColumn: '1 / -1', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleReset}
            className="ss-btn-outlined"
            style={{ height: '40px', padding: '0 1rem', fontSize: 'var(--text-sm)' }}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => { setPage(1); fetchLogs(); }}
            className="ss-btn-primary"
            style={{ height: '40px', padding: '0 1rem', fontSize: 'var(--text-sm)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>filter_list</span>
            Terapkan
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="ss-btn-outlined"
            style={{ height: '40px', padding: '0 1rem', fontSize: 'var(--text-sm)' }}
          >
            {isExporting
              ? <span className="ss-btn-spinner material-symbols-outlined" style={{ fontSize: '18px' }}>progress_activity</span>
              : <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
            }
            Ekspor CSV
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', paddingInline: 'var(--space-1)' }}>
        <span>
          Total: <strong style={{ color: 'var(--color-text-primary)' }}>{meta.total.toLocaleString('id-ID')}</strong> entri
        </span>
        <span>
          Hal. <strong style={{ color: 'var(--color-text-primary)' }}>{meta.page}</strong> dari <strong style={{ color: 'var(--color-text-primary)' }}>{meta.totalPages}</strong>
        </span>
      </div>

      {/* ── Table Card ── */}
      <div className="ss-audit-table-card">
        <div className="ss-audit-table-scroll">
          <table className="ss-audit-table" aria-label="Log Audit Sistem">
            <thead className="ss-audit-table-head">
              <tr>
                <th className="ss-audit-th" scope="col">Waktu</th>
                <th className="ss-audit-th" scope="col">Pengguna</th>
                <th className="ss-audit-th" scope="col">Jenis Aktivitas</th>
                <th className="ss-audit-th" scope="col">Entitas</th>
                <th className="ss-audit-th" scope="col">ID Entitas</th>
                <th className="ss-audit-th" scope="col">Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="ss-audit-skeleton-row">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div className="ss-audit-skeleton-cell" style={{ width: j === 5 ? '100%' : '80%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="ss-table-empty">
                      <span className="material-symbols-outlined ss-table-empty-icon">history</span>
                      <p className="ss-table-empty-title">Tidak ada data audit log</p>
                      <p className="ss-table-empty-desc">Coba ubah filter untuk melihat catatan lain.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const ts = formatTs(log.createdAt);
                  const isSystem = !log.actor;
                  return (
                    <tr key={log.id} className="ss-audit-tr">
                      {/* Timestamp */}
                      <td className="ss-audit-td ss-audit-td--timestamp">
                        {ts.date}<br />{ts.time}
                      </td>

                      {/* Actor */}
                      <td className="ss-audit-td ss-audit-td--actor">
                        <div className="ss-audit-actor">
                          {isSystem ? (
                            <div className="ss-audit-actor-sys" aria-label="Sistem">SYS</div>
                          ) : (
                            <div className="ss-audit-actor-sys" style={{ background: 'var(--color-brand-container)' }}>
                              {(log.actor?.name?.[0] ?? '?').toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="ss-audit-actor-name">{log.actor?.name || 'Sistem'}</div>
                            {log.actor?.role && (
                              <div className="ss-audit-actor-role">{log.actor.role}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Action badge */}
                      <td className="ss-audit-td">
                        <span className={`ss-action-badge ${getActionBadgeClass(log.action)}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                            {getActionIcon(log.action)}
                          </span>
                          {getActionLabel(log.action)}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="ss-audit-td">
                        <span className="ss-audit-entity">{log.entityType}</span>
                      </td>

                      {/* Entity ID */}
                      <td className="ss-audit-td">
                        <span className="ss-audit-entity-id" title={log.entityId}>
                          {log.entityId.slice(0, 8)}…
                        </span>
                      </td>

                      {/* Description (newValue / oldValue summary) */}
                      <td className="ss-audit-td">
                        <span className="ss-audit-desc" title={
                          log.newValue ? (typeof log.newValue === 'string' ? log.newValue : JSON.stringify(log.newValue)) : ''
                        }>
                          {log.newValue
                            ? (typeof log.newValue === 'string'
                                ? log.newValue
                                : JSON.stringify(log.newValue).slice(0, 80))
                            : <span style={{ color: 'var(--color-text-disabled)', fontStyle: 'italic' }}>—</span>
                          }
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <nav className="ss-audit-pagination" aria-label="Paginasi Halaman">
          <span className="ss-audit-pagination-count">
            Menampilkan {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)} dari {meta.total.toLocaleString('id-ID')} catatan
          </span>
          <div className="ss-audit-pagination-nav">
            <button
              className="ss-audit-page-btn"
              aria-label="Halaman Sebelumnya"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_left</span>
            </button>
            {Array.from({ length: Math.min(5, meta.totalPages) }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  className={`ss-audit-page-btn ${page === p ? 'ss-audit-page-btn--active' : ''}`}
                  aria-label={`Halaman ${p}`}
                  aria-current={page === p ? 'page' : undefined}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              );
            })}
            {meta.totalPages > 5 && (
              <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)', padding: '0 var(--space-1)' }}>…</span>
            )}
            <button
              className="ss-audit-page-btn"
              aria-label="Halaman Selanjutnya"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_right</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
