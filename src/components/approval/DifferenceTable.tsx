/**
 * DifferenceTable — Warehouse Signal
 * Tabel selisih opname dengan perbandingan stok sistem vs fisik, color-coded status, dan highlight merah muda (#FEF2F2) untuk baris minus.
 */

import React from 'react';

export interface DifferenceItemData {
  id: string;
  productName: string;
  sku: string;
  unit: string;
  systemQty: number;
  physicalQty: number;
  difference: number;
  price?: number | null;
  notes?: string | null;
}

interface DifferenceTableProps {
  items: DifferenceItemData[];
}

export function DifferenceTable({ items }: DifferenceTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
          <thead style={{ backgroundColor: 'var(--color-surface-low)', borderBottom: '1px solid var(--color-border)' }}>
            <tr>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                Produk / SKU
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                Stok Sistem
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                Hitung Fisik
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                Selisih
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                Estimasi Kerugian
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                Catatan
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const isMinus = item.difference < 0;
              const isPlus = item.difference > 0;
              const loss = isMinus && item.price ? Math.abs(item.difference) * item.price : 0;

              return (
                <tr
                  key={item.id}
                  style={{
                    backgroundColor: isMinus ? '#FEF2F2' : idx % 2 === 0 ? 'var(--color-card)' : 'var(--color-surface-low)',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {item.productName}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {item.sku}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                    {item.systemQty} {item.unit}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {item.physicalQty} {item.unit}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 700,
                        backgroundColor: isMinus
                          ? 'var(--color-critical-surface)'
                          : isPlus
                          ? 'var(--color-ok-surface)'
                          : 'var(--color-surface-low)',
                        color: isMinus
                          ? 'var(--color-critical-text)'
                          : isPlus
                          ? 'var(--color-ok-text)'
                          : 'var(--color-text-secondary)',
                        border: `1px solid ${isMinus ? 'var(--color-critical)' : isPlus ? 'var(--color-ok)' : 'var(--color-border)'}`,
                      }}
                    >
                      {item.difference > 0 ? `+${item.difference}` : item.difference} {item.unit}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: loss > 0 ? 700 : 400, color: loss > 0 ? 'var(--color-critical-text)' : 'var(--color-text-disabled)' }}>
                    {loss > 0 ? formatCurrency(loss) : '-'}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    {item.notes || '-'}
                  </td>
                </tr>
              );
            })}

            {items.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  Tidak ada item selisih pada sesi opname ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DifferenceTable;
