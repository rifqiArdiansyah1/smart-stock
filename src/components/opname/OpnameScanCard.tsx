/**
 * OpnameScanCard — Warehouse Signal
 * Bottom sheet / modal card setelah produk discan / dipilih saat opname fisik.
 * Menampilkan stok sistem (JetBrains Mono), input qty fisik (numeric keyboard, auto-focus), tombol +/- dan aksi Konfirmasi/Undo.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';

export interface ScannedProductData {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  systemQty: number;
  unit: string;
  imageUrl?: string;
}

interface OpnameScanCardProps {
  product: ScannedProductData;
  initialPhysicalQty?: number | '';
  onConfirm: (productId: string, physicalQty: number, notes?: string) => void;
  onCancel?: () => void;
}

export function OpnameScanCard({
  product,
  initialPhysicalQty = '',
  onConfirm,
  onCancel,
}: OpnameScanCardProps) {
  const [qty, setQty] = useState<number | ''>(initialPhysicalQty);
  const [notes, setNotes] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus numeric input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [product.id]);

  const handleIncrement = () => {
    setQty((prev) => (typeof prev === 'number' ? prev + 1 : 1));
  };

  const handleDecrement = () => {
    setQty((prev) => (typeof prev === 'number' ? Math.max(0, prev - 1) : 0));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalQty = typeof qty === 'number' ? qty : 0;
    onConfirm(product.id, finalQty, notes);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
        padding: 'var(--space-6) var(--space-6) var(--space-8)',
        boxShadow: 'var(--shadow-modal)',
        animation: 'ws-slide-up var(--duration-slow) var(--ease-out)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      {/* Drag handle pill */}
      <div style={{ alignSelf: 'center', width: '36px', height: '4px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-border)' }} />

      {/* Product Info Header */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
        {/* Product Image / Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--color-surface-low)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
          }}
        >
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                backgroundColor: 'var(--color-ok-surface)',
                color: 'var(--color-ok-text)',
                padding: '1px 6px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 500,
              }}
            >
              ✓ Dipindai
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              SKU: {product.sku}
            </span>
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-lg)',
              fontWeight: 700,
              color: 'var(--color-brand)',
              margin: '2px 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {product.name}
          </h3>
        </div>
      </div>

      {/* System Stock Card */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
        }}
      >
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Stok Sistem:
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-brand)' }}>
          {product.systemQty} {product.unit}
        </span>
      </div>

      {/* Input Qty Form */}
      <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <label
            htmlFor="physical-qty-input"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-base)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
            }}
          >
            Jumlah Fisik
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {/* Quick Decrement Button */}
            <button
              type="button"
              onClick={handleDecrement}
              aria-label="Kurangi 1"
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-low)',
                border: '1px solid var(--color-border)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xl)',
                fontWeight: 700,
                color: 'var(--color-brand)',
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              −
            </button>

            {/* Qty Input */}
            <input
              id="physical-qty-input"
              ref={inputRef}
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="0"
              value={qty}
              onChange={(e) => setQty(e.target.value !== '' ? Math.max(0, parseInt(e.target.value, 10)) : '')}
              placeholder="0"
              style={{
                flex: 1,
                height: '56px',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-2xl)',
                fontWeight: 700,
                color: 'var(--color-brand)',
                backgroundColor: 'var(--color-card)',
                border: '2px solid var(--color-brand)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
              }}
            />

            {/* Quick Increment Button */}
            <button
              type="button"
              onClick={handleIncrement}
              aria-label="Tambah 1"
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-low)',
                border: '1px solid var(--color-border)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xl)',
                fontWeight: 700,
                color: 'var(--color-brand)',
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={onCancel}
              style={{ flex: 1 }}
            >
              Batal
            </Button>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            style={{ flex: 2 }}
          >
            Konfirmasi & Lanjut →
          </Button>
        </div>
      </form>
    </div>
  );
}

export default OpnameScanCard;
