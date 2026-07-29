/**
 * ApprovalActionBar — Warehouse Signal
 * Sticky action bar untuk menyetujui (green) atau menolak (red) hasil opname + textarea catatan review.
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface ApprovalActionBarProps {
  onApprove: (notes: string) => Promise<void>;
  onReject: (notes: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function ApprovalActionBar({
  onApprove,
  onReject,
  isSubmitting = false,
}: ApprovalActionBarProps) {
  const [notes, setNotes] = useState('');
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);

  const handleAction = async (type: 'APPROVE' | 'REJECT') => {
    setActionType(type);
    if (type === 'APPROVE') {
      await onApprove(notes);
    } else {
      await onReject(notes);
    }
  };

  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        backgroundColor: 'var(--color-card)',
        borderTop: '1px solid var(--color-border)',
        padding: 'var(--space-4) var(--space-6)',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        zIndex: 30,
      }}
    >
      {/* Review Notes Textarea */}
      <div>
        <label
          htmlFor="review-notes-input"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            display: 'block',
            marginBottom: 'var(--space-1)',
          }}
        >
          Catatan Review (Opsional):
        </label>
        <textarea
          id="review-notes-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Berikan alasan atau instruksi lebih lanjut jika ada selisih stok..."
          rows={2}
          style={{
            width: '100%',
            padding: 'var(--space-2) var(--space-3)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            outline: 'none',
            resize: 'none',
          }}
        />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'flex-end' }}>
        <Button
          type="button"
          variant="danger"
          size="lg"
          disabled={isSubmitting}
          loading={isSubmitting && actionType === 'REJECT'}
          onClick={() => handleAction('REJECT')}
        >
          ✕ Tolak Sesi
        </Button>

        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          loading={isSubmitting && actionType === 'APPROVE'}
          onClick={() => handleAction('APPROVE')}
          style={{
            backgroundColor: 'var(--color-ok)',
            borderColor: 'var(--color-ok)',
            color: '#ffffff',
          }}
        >
          ✓ Setujui & Update Stok
        </Button>
      </div>
    </div>
  );
}

export default ApprovalActionBar;
