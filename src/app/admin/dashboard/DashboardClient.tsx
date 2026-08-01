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
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* ── 3 KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fast Moving Chart Panel */}
        <div className="flex flex-col bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 p-6 overflow-hidden">
          <CardHeader title="Barang Terlaris (Fast Moving)" subtitle="7 hari terakhir berdasarkan transaksi POS" />

          {isLoadingCharts ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm animate-pulse">
              Memuat grafik...
            </div>
          ) : fastMoving.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              Belum ada data transaksi fast moving.
            </div>
          ) : (
            <div className="flex flex-col gap-4 mt-4">
              {fastMoving.slice(0, 6).map((item) => {
                const maxVal = Math.max(...fastMoving.map((f) => f.totalSold || 1), 1);
                const pct = Math.max(8, Math.round(((item.totalSold || 0) / maxVal) * 100));

                return (
                  <div key={item.productId} className="flex flex-col gap-1.5 group">
                    <div className="flex justify-between text-xs">
                      <span className="font-sans font-medium text-slate-700 dark:text-slate-300">
                        {item.productName}
                      </span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {item.totalSold || 0} pcs
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700/50 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-1000 ease-out group-hover:brightness-110"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Critical Alerts Component */}
        <div className="h-[400px] lg:h-auto">
          <AlertList items={criticalItems} />
        </div>
      </div>

      {/* ── Recent Opname Sessions Table ── */}
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 p-6 overflow-hidden">
        <CardHeader
          title="Sesi Stock Opname Terbaru"
          subtitle="5 sesi perhitungan fisik terakhir"
          action={
            <Link href="/admin/approval" className="font-sans text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
              Approval Inbox &rarr;
            </Link>
          }
        />

        {recentOpname.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm m-0">
            Belum ada sesi opname terbaru.
          </p>
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4 font-sans font-semibold text-slate-600 dark:text-slate-300">Lokasi</th>
                  <th className="p-4 font-sans font-semibold text-slate-600 dark:text-slate-300">Petugas</th>
                  <th className="p-4 font-sans font-semibold text-slate-600 dark:text-slate-300">Tanggal</th>
                  <th className="p-4 font-sans font-semibold text-slate-600 dark:text-slate-300 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {recentOpname.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      <Link href={`/admin/approval/${op.id}`} className="hover:underline">
                        {op.locationName}
                      </Link>
                    </td>
                    <td className="p-4 font-sans text-slate-700 dark:text-slate-300">
                      {op.startedBy}
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {new Date(op.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="p-4 text-right">
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
      </div>
    </div>
  );
}
