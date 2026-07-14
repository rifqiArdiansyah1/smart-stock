'use client';

import { useState, useMemo } from 'react';

interface StockLevel {
  quantity: number;
  location: { name: string };
}

interface ExpiryProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  unit: string;
  expiryDate: string;
  category: string | null;
  daysRemaining: number;
  totalQty: number;
  stockLevels: StockLevel[];
}

interface ExpiryProductListProps {
  products: ExpiryProduct[];
}

type FilterRange = 'all' | 'expired' | '7' | '14' | '30';

function ExpiryBadge({ daysRemaining }: { daysRemaining: number }) {
  if (daysRemaining < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
        🚨 EXPIRED {Math.abs(daysRemaining)} hari lalu
      </span>
    );
  }
  if (daysRemaining === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
        🚨 Expired Hari Ini
      </span>
    );
  }
  if (daysRemaining <= 7) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
        ⚠️ {daysRemaining} hari lagi
      </span>
    );
  }
  if (daysRemaining <= 14) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
        ⚠️ {daysRemaining} hari lagi
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
      📅 {daysRemaining} hari lagi
    </span>
  );
}

export default function ExpiryProductList({ products }: ExpiryProductListProps) {
  const [filter, setFilter] = useState<FilterRange>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = products;

    // Filter by day range
    if (filter === 'expired') {
      result = result.filter((p) => p.daysRemaining < 0);
    } else if (filter === '7') {
      result = result.filter((p) => p.daysRemaining >= 0 && p.daysRemaining <= 7);
    } else if (filter === '14') {
      result = result.filter((p) => p.daysRemaining >= 0 && p.daysRemaining <= 14);
    } else if (filter === '30') {
      result = result.filter((p) => p.daysRemaining >= 0 && p.daysRemaining <= 30);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }

    return result;
  }, [products, filter, search]);

  const counts = useMemo(() => ({
    all: products.length,
    expired: products.filter((p) => p.daysRemaining < 0).length,
    d7: products.filter((p) => p.daysRemaining >= 0 && p.daysRemaining <= 7).length,
    d14: products.filter((p) => p.daysRemaining >= 0 && p.daysRemaining <= 14).length,
    d30: products.filter((p) => p.daysRemaining >= 0 && p.daysRemaining <= 30).length,
  }), [products]);

  const filterButtons: { label: string; value: FilterRange; count: number; color: string }[] = [
    { label: 'Semua', value: 'all', count: counts.all, color: 'slate' },
    { label: 'Sudah Expired', value: 'expired', count: counts.expired, color: 'red' },
    { label: '≤ 7 Hari', value: '7', count: counts.d7, color: 'red' },
    { label: '≤ 14 Hari', value: '14', count: counts.d14, color: 'orange' },
    { label: '≤ 30 Hari', value: '30', count: counts.d30, color: 'amber' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`bg-red-50 border border-red-200 rounded-2xl p-4 ${counts.expired > 0 ? 'ring-2 ring-red-400' : ''}`}>
          <div className="text-2xl font-bold text-red-700">{counts.expired}</div>
          <div className="text-sm text-red-600 mt-0.5">Sudah Expired</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <div className="text-2xl font-bold text-orange-700">{counts.d7}</div>
          <div className="text-sm text-orange-600 mt-0.5">Dalam 7 Hari</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="text-2xl font-bold text-amber-700">{counts.d14}</div>
          <div className="text-sm text-amber-600 mt-0.5">Dalam 14 Hari</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <div className="text-2xl font-bold text-yellow-700">{counts.d30}</div>
          <div className="text-sm text-yellow-600 mt-0.5">Dalam 30 Hari</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-colors flex items-center gap-1.5 ${
                filter === btn.value
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {btn.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === btn.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {btn.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama / SKU / Barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold text-slate-600">Produk</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600">Kategori</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600">Tanggal Kadaluarsa</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600 text-center">Status</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600 text-right">Total Stok</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600">Lokasi Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Tidak ada produk yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr
                    key={product.id}
                    className={`transition-colors ${
                      product.daysRemaining < 0
                        ? 'bg-red-50/40 hover:bg-red-50/80'
                        : product.daysRemaining <= 7
                        ? 'bg-orange-50/30 hover:bg-orange-50/60'
                        : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{product.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{product.sku}</div>
                      {product.barcode && (
                        <div className="text-xs text-slate-400 font-mono">BC: {product.barcode}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{product.category || '-'}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono text-slate-700">
                        {new Date(product.expiryDate).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <ExpiryBadge daysRemaining={product.daysRemaining} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-bold text-slate-800">{product.totalQty}</span>
                      <span className="text-xs text-slate-400 ml-1">{product.unit}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5">
                        {product.stockLevels.map((sl, i) => (
                          <span key={i} className="text-xs text-slate-500">
                            <span className="font-medium">{sl.location.name}</span>: {sl.quantity}
                          </span>
                        ))}
                        {product.stockLevels.length === 0 && (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </div>
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
