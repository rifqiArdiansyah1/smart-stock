/**
 * ApprovalDetailClient — Warehouse Signal Redesign
 * Detail review sesi opname dengan DifferenceTable dan ApprovalActionBar
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DifferenceTable, type DifferenceItemData } from '@/components/approval/DifferenceTable';
import { ApprovalActionBar } from '@/components/approval/ApprovalActionBar';
import { StatusPill } from '@/components/ui/StatusPill';
import { Card } from '@/components/ui/Card';

interface ApprovalDetailClientProps {
  sessionData: {
    id: string;
    locationName: string;
    locationType: string;
    status: string;
    startedBy: string;
    startedAt: string | Date;
    submittedAt?: string | Date | null;
    reviewNotes?: string | null;
    approvedBy?: string | null;
  };
  items: DifferenceItemData[];
}

export default function ApprovalDetailClient({
  sessionData,
  items,
}: ApprovalDetailClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPending = sessionData.status === 'PENDING_APPROVAL';

  const handleReview = async (action: 'APPROVE' | 'REJECT', notes: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/opname/${sessionData.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Gagal memproses review opname.');
        setIsSubmitting(false);
        return;
      }

      router.push('/admin/approval');
      router.refresh();
    } catch (e) {
      alert('Terjadi kesalahan jaringan.');
      setIsSubmitting(false);
    }
  };

  const formattedDate = new Date(sessionData.startedAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalDeficitLoss = items.reduce((acc, item) => {
    if (item.difference < 0 && item.price) {
      return acc + Math.abs(item.difference) * item.price;
    }
    return acc;
  }, 0);

  const formattedLoss = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(totalDeficitLoss);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: isPending ? '140px' : '0' }}>
      {/* Back button & Title */}
      <div>
        <Link href="/admin/approval" style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-brand)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: 'var(--space-2)' }}>
          ← Kembali ke Inbox
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-brand)', margin: 0 }}>
              Review Sesi Opname: {sessionData.locationName}
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
              ID: #{sessionData.id} • Dibuat pada {formattedDate} oleh {sessionData.startedBy}
            </p>
          </div>

          <StatusPill
            value={isPending ? 'Menunggu Review' : sessionData.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
            unit=""
            status={isPending ? 'critical' : sessionData.status === 'APPROVED' ? 'ok' : 'expired'}
            size="md"
          />
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <Card padding="var(--space-4)">
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>Total Item Dihitung</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-brand)', margin: '4px 0 0' }}>
            {items.length} Barang
          </p>
        </Card>

        <Card padding="var(--space-4)">
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>Jumlah Item Selisih</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-critical)', margin: '4px 0 0' }}>
            {items.filter((i) => i.difference !== 0).length} Barang
          </p>
        </Card>

        <Card padding="var(--space-4)">
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>Estimasi Nilai Kerugian</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-critical)', margin: '4px 0 0' }}>
            {formattedLoss}
          </p>
        </Card>
      </div>

      {/* Review notes if already reviewed */}
      {sessionData.reviewNotes && (
        <Card padding="var(--space-4)" style={{ backgroundColor: 'var(--color-surface-low)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)', margin: '0 0 4px' }}>
            Catatan Review dari {sessionData.approvedBy || 'Admin'}:
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', margin: 0 }}>
            {sessionData.reviewNotes}
          </p>
        </Card>
      )}

      {/* Discrepancy Table */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-brand)', marginBottom: 'var(--space-3)' }}>
          Daftar Perbandingan Stok Sistem vs Fisik
        </h2>
        <DifferenceTable items={items} />
      </div>

      {/* Sticky Action Bar (Only if Pending) */}
      {isPending && (
        <ApprovalActionBar
          onApprove={(notes) => handleReview('APPROVE', notes)}
          onReject={(notes) => handleReview('REJECT', notes)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
