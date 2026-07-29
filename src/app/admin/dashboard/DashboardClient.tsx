/**
 * DashboardClient — Warehouse Signal Redesign
 * Ikhtisar Dasbor Admin / Owner
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { AlertList, type AlertItemData } from '@/components/dashboard/AlertList';
import { StatusPill } from '@/components/ui/StatusPill';
import { Card, CardHeader } from '@/components/ui/Card';

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

export default function DashboardClient() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [recentOpname, setRecentOpname] = useState<OpnameSession[]>([]);
  const [criticalItems, setCriticalItems] = useState<AlertItemData[]>([]);
  const [fastMoving, setFastMoving] = useState<ProductStat[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);

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
        setFastMoving(json.fastMoving || []);
        
        // Mock critical items or map lowStockData
        if (json.lowStockData) {
          setCriticalItems(
            json.lowStockData.map((item: any) => ({
              id: item.productId,
              sku: item.sku,
              name: item.productName,
              currentStock: item.currentStock || 5,
              minStock: item.minStock || 10,
              unit: item.unit || 'pcs',
            }))
          );
        }
      } finally {
        setIsLoadingCharts(false);
      }
    };

    fetchSummary();
    fetchCharts();
  }, []);

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000_000) {
      return `Rp ${(val / 1_000_000_000).toFixed(1)} M`;
    }
    if (val >= 1_000_000) {
      return `Rp ${(val / 1_000_000).toFixed(0)} Jt`;
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const getPillStatus = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'warn';
      case 'PENDING_APPROVAL': return 'critical';
      case 'APPROVED': return 'ok';
      default: return 'neutral';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* ── 3 KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        <KpiCard
          title="Total SKU Aktif"
          value={kpi ? kpi.totalProducts.toLocaleString('id-ID') : '...'}
          unit="SKU"
          accentColor="brand"
          trend={{ value: '+2.4% vs bulan lalu', isPositive: true }}
          icon={
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          }
        />

        <KpiCard
          title="Estimasi Nilai Stok"
          value={kpi ? formatCurrency(kpi.totalStockValue) : '...'}
          accentColor="accent"
          trend={{ value: '+0.8% vs bulan lalu', isPositive: true }}
          icon={
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          }
        />

        <KpiCard
          title="Item Selisih / Critical"
          value={kpi ? kpi.lowStockCount.toLocaleString('id-ID') : '...'}
          unit="Barang"
          accentColor={kpi && kpi.lowStockCount > 0 ? 'critical' : 'ok'}
          trend={{ value: kpi && kpi.lowStockCount > 0 ? 'Perlu perhatian' : 'Stok aman', isWarning: kpi ? kpi.lowStockCount > 0 : false }}
          icon={
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
          }
        />
      </div>

      {/* ── Main Data Section (2 Columns: Fast Moving Chart + Critical Alerts) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Fast Moving Chart Panel */}
        <Card padding="var(--space-5)" style={{ display: 'flex', flexDirection: 'column' }}>
          <CardHeader title="Barang Terlaris (Fast Moving)" subtitle="7 hari terakhir berdasarkan transaksi POS" />

          {isLoadingCharts ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Memuat grafik...
            </div>
          ) : fastMoving.length === 0 ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Belum ada data transaksi fast moving.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              {fastMoving.slice(0, 6).map((item) => {
                const maxVal = Math.max(...fastMoving.map((f) => f.totalSold || 1), 1);
                const pct = Math.max(8, Math.round(((item.totalSold || 0) / maxVal) * 100));

                return (
                  <div key={item.productId} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {item.productName}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brand)', fontWeight: 700 }}>
                        {item.totalSold || 0} pcs
                      </span>
                    </div>
                    <div style={{ width: '100%', backgroundColor: 'var(--color-surface-low)', height: '8px', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          backgroundColor: 'var(--color-brand)',
                          borderRadius: 'var(--radius-full)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Critical Alerts Component */}
        <AlertList items={criticalItems} />
      </div>

      {/* ── Recent Opname Sessions Table ── */}
      <Card padding="var(--space-5)">
        <CardHeader
          title="Sesi Stock Opname Terbaru"
          subtitle="5 sesi perhitungan fisik terakhir"
          action={
            <Link href="/admin/approval" style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-brand)', textDecoration: 'underline' }}>
              Approval Inbox →
            </Link>
          }
        />

        {recentOpname.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Belum ada sesi opname terbaru.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
              <thead style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-low)' }}>
                <tr>
                  <th style={{ padding: 'var(--space-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    Lokasi
                  </th>
                  <th style={{ padding: 'var(--space-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    Petugas
                  </th>
                  <th style={{ padding: 'var(--space-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    Tanggal
                  </th>
                  <th style={{ padding: 'var(--space-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOpname.map((op) => (
                  <tr key={op.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3)', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-brand)' }}>
                      <Link href={`/admin/approval/${op.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {op.locationName}
                      </Link>
                    </td>
                    <td style={{ padding: 'var(--space-3)', fontFamily: 'var(--font-body)' }}>
                      {op.startedBy}
                    </td>
                    <td style={{ padding: 'var(--space-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                      {new Date(op.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>
                      <StatusPill
                        value={op.status === 'IN_PROGRESS' ? 'Berjalan' : op.status === 'PENDING_APPROVAL' ? 'Review' : 'Approved'}
                        unit=""
                        status={getPillStatus(op.status)}
                        size="sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
