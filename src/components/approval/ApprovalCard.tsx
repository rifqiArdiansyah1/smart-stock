/**
 * ApprovalCard — Warehouse Signal
 * Card sesi opname di Approval Inbox dengan info lokasi, tanggal, staf, badge selisih, dan tombol Review
 */

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';

export interface ApprovalSessionData {
  id: string;
  locationName: string;
  locationType: string;
  startedAt: string | Date;
  staffName: string;
  differenceCount: number;
  totalLossAmount?: number;
  status: string;
}

interface ApprovalCardProps {
  session: ApprovalSessionData;
}

export function ApprovalCard({ session }: ApprovalCardProps) {
  const { id, locationName, locationType, startedAt, staffName, differenceCount, totalLossAmount = 0, status } = session;

  const formattedDate = new Date(startedAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedLoss = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(totalLossAmount);

  return (
    <Card interactive padding="var(--space-5)" style={{ borderLeft: differenceCount > 0 ? '4px solid var(--color-critical)' : '4px solid var(--color-ok)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            ID: #{id.substring(0, 8).toUpperCase()}
          </span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-brand)', margin: '2px 0 0' }}>
            {locationName}
          </h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
            {locationType} • {formattedDate}
          </p>
        </div>

        {differenceCount > 0 ? (
          <StatusPill value={`-${differenceCount} selisih`} unit="" status="critical" size="sm" />
        ) : (
          <StatusPill value="Sesuai (0)" unit="" status="ok" size="sm" />
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 'var(--space-3)',
          borderTop: '1px solid var(--color-border)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-brand-container)',
              color: 'var(--color-accent)',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {staffName.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            Petugas: <strong style={{ color: 'var(--color-text-primary)' }}>{staffName}</strong>
          </span>
        </div>

        {totalLossAmount > 0 && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-critical-text)', fontWeight: 700 }}>
            Rugi: {formattedLoss}
          </span>
        )}
      </div>

      <Link href={`/admin/approval/${id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <Button variant="primary" size="md" fullWidth>
          Review Sesi →
        </Button>
      </Link>
    </Card>
  );
}

export default ApprovalCard;
