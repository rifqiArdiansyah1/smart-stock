/**
 * AlertList — Warehouse Signal
 * Daftar peringatan produk stok kritis / kedaluwarsa dengan pill status merah dan aksi pesan ulang.
 */

import React from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';

export interface AlertItemData {
  id: string;
  sku: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
  isExpired?: boolean;
}

interface AlertListProps {
  items: AlertItemData[];
  onReorderClick?: (item: AlertItemData) => void;
}

export function AlertList({ items, onReorderClick }: AlertListProps) {
  return (
    <Card padding="0px" style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: 'var(--space-4)',
          backgroundColor: 'var(--color-critical-surface)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ color: 'var(--color-critical)', display: 'flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-critical-text)', margin: 0 }}>
            Stok Kritis & Alerts
          </h3>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            backgroundColor: 'var(--color-critical)',
            color: '#ffffff',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
          }}
        >
          {items.length} Barang
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {items.length === 0 ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            🎉 Tidak ada stok kritis saat ini.
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {items.map((item, i) => (
              <li
                key={item.id}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}
              >
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)' }}>
                    {item.sku}
                  </span>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', margin: '2px 0 0' }}>
                    {item.name}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <StatusPill
                    value={item.currentStock}
                    unit={item.unit}
                    status={item.isExpired ? 'expired' : 'critical'}
                    size="sm"
                  />

                  {onReorderClick && (
                    <button
                      type="button"
                      onClick={() => onReorderClick(item)}
                      title="Restock barang"
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'var(--color-brand)',
                        color: 'var(--color-text-on-brand)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-body)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Pesan
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

export default AlertList;
