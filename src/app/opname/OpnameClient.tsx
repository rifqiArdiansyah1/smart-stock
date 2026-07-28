/**
 * OpnameClient — Warehouse Signal Redesign
 * Daftar Sesi Opname & Tombol Mulai Opname Baru
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

interface OpnameClientProps {
  initialOpnames: Array<{
    id: string;
    status: string;
    startedAt: string | Date;
    startedBy: { name: string };
    location: { name: string; type: string };
    _count: { items: number };
  }>;
  locations: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

export default function OpnameClient({ initialOpnames }: OpnameClientProps) {
  const [opnames] = useState(initialOpnames);

  const getPillStatus = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'warn';
      case 'PENDING_APPROVAL': return 'critical';
      case 'APPROVED': return 'ok';
      case 'REJECTED': return 'expired';
      default: return 'neutral';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'Sedang Berjalan';
      case 'PENDING_APPROVAL': return 'Menunggu Review';
      case 'APPROVED': return 'Disetujui';
      case 'REJECTED': return 'Ditolak';
      default: return status;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-brand)', margin: 0 }}>
            Sesi Stock Opname
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
            Daftar seluruh sesi perhitungan stok fisik di gudang
          </p>
        </div>

        <Link href="/opname/lokasi" style={{ textDecoration: 'none' }}>
          <Button variant="primary" size="md">
            + Mulai Sesi Baru
          </Button>
        </Link>
      </div>

      {/* Grid List */}
      {opnames.length === 0 ? (
        <Card padding="var(--space-8)">
          <EmptyState
            title="Belum Ada Sesi Opname"
            description="Tekan tombol di atas untuk memilih lokasi dan memulai sesi stock opname baru."
          />
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {opnames.map((op) => (
            <Card key={op.id} interactive padding="var(--space-5)">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-brand)', margin: 0 }}>
                    {op.location.name}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                    {op.location.type}
                  </p>
                </div>
                <StatusPill
                  value={getStatusLabel(op.status)}
                  unit=""
                  status={getPillStatus(op.status)}
                  size="sm"
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-secondary)',
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: 'var(--space-3)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Mulai:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {new Date(op.startedAt).toLocaleDateString('id-ID')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Petugas:</span>
                  <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{op.startedBy.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Item Dihitung:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {op._count.items} item
                  </span>
                </div>
              </div>

              <Link
                href={op.status === 'IN_PROGRESS' ? `/opname/${op.id}/scan` : `/opname/${op.id}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <Button variant="secondary" size="md" fullWidth>
                  {op.status === 'IN_PROGRESS' ? 'Lanjutkan Opname →' : 'Lihat Detail →'}
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
