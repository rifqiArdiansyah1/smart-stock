/**
 * ScanOpnameClient — Warehouse Signal (Mobile Flow)
 * Halaman scan & input qty opname fisik (Langkah 2 dari 3)
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressCounter } from '@/components/opname/ProgressCounter';
import { ScanViewfinder } from '@/components/opname/ScanViewfinder';
import { OpnameScanCard, type ScannedProductData } from '@/components/opname/OpnameScanCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { InputField } from '@/components/ui/InputField';
import { Button } from '@/components/ui/Button';
import BarcodeScanner from '../BarcodeScanner';

interface ScanOpnameClientProps {
  sessionData: {
    id: string;
    locationName: string;
    locationType: string;
    status: string;
  };
  systemStock: Array<{
    product: {
      id: string;
      name: string;
      sku: string;
      barcode?: string | null;
      unit: string;
    };
    quantity: number;
  }>;
}

export default function ScanOpnameClient({ sessionData, systemStock }: ScanOpnameClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selectedProduct, setSelectedProduct] = useState<ScannedProductData | null>(null);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flashSuccessId, setFlashSuccessId] = useState<string | null>(null);

  const totalProducts = systemStock.length;
  const countedCount = Object.keys(counts).length;

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return systemStock;
    return systemStock.filter(
      (s) =>
        s.product.name.toLowerCase().includes(q) ||
        s.product.sku.toLowerCase().includes(q) ||
        (s.product.barcode && s.product.barcode.toLowerCase().includes(q))
    );
  }, [systemStock, search]);

  const handleSelectProduct = (stockItem: (typeof systemStock)[0]) => {
    setSelectedProduct({
      id: stockItem.product.id,
      name: stockItem.product.name,
      sku: stockItem.product.sku,
      barcode: stockItem.product.barcode || undefined,
      systemQty: stockItem.quantity,
      unit: stockItem.product.unit,
    });
  };

  const handleScanSuccess = (decodedText: string) => {
    setShowCameraScanner(false);
    const matched = systemStock.find(
      (s) => s.product.barcode === decodedText || s.product.sku === decodedText
    );

    if (matched) {
      handleSelectProduct(matched);
    } else {
      alert(`Barcode/SKU "${decodedText}" tidak ditemukan pada lokasi ini.`);
    }
  };

  const handleConfirmQty = (productId: string, physicalQty: number) => {
    setCounts((prev) => ({
      ...prev,
      [productId]: physicalQty,
    }));

    // Trigger visual success flash
    setFlashSuccessId(productId);
    setTimeout(() => setFlashSuccessId(null), 1500);

    // Close bottom sheet card
    setSelectedProduct(null);
  };

  const handleSubmitAll = async () => {
    if (countedCount === 0) {
      alert('Belum ada produk yang dihitung fisiknya.');
      return;
    }

    if (!confirm('Submit hasil hitung fisik opname ini?')) return;

    setIsSubmitting(true);

    const itemsPayload = systemStock.map((stock) => {
      const pQty = counts[stock.product.id];
      return {
        productId: stock.product.id,
        systemQty: stock.quantity,
        physicalQty: typeof pQty === 'number' ? pQty : stock.quantity,
        notes: '',
      };
    });

    try {
      const res = await fetch(`/api/opname/${sessionData.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsPayload }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Gagal submit opname.');
        setIsSubmitting(false);
        return;
      }

      router.push(`/opname/${sessionData.id}`);
      router.refresh();
    } catch (e) {
      alert('Terjadi kesalahan jaringan.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - var(--topbar-height))',
        backgroundColor: 'var(--color-surface)',
        paddingBottom: '120px',
        position: 'relative',
      }}
    >
      {/* Real Camera Scanner Modal */}
      {showCameraScanner && (
        <BarcodeScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowCameraScanner(false)}
        />
      )}

      {/* Sticky Header */}
      <div
        style={{
          padding: 'var(--space-4) var(--space-margin-mobile)',
          backgroundColor: 'var(--color-card)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          position: 'sticky',
          top: 'var(--topbar-height)',
          zIndex: 20,
        }}
      >
        <ProgressCounter
          current={countedCount}
          total={totalProducts}
          label="Sudah Dihitung"
          stepLabel="Item"
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-brand)', margin: 0 }}>
              📍 {sessionData.locationName}
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
              Pindai barcode atau pilih dari daftar produk di bawah
            </p>
          </div>
          <StatusPill value={`${countedCount}/${totalProducts}`} unit="item" status={countedCount > 0 ? 'ok' : 'warn'} size="sm" />
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ padding: 'var(--space-margin-mobile)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Scanner Viewfinder Area */}
        <ScanViewfinder
          onManualInputClick={() => setShowCameraScanner(true)}
          isScanning={!selectedProduct}
        />

        {/* Search Bar */}
        <InputField
          placeholder="Cari produk / SKU / barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          }
        />

        {/* Product Item List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {filteredProducts.map((item) => {
            const hasCounted = typeof counts[item.product.id] === 'number';
            const countedQty = counts[item.product.id];
            const isFlashed = flashSuccessId === item.product.id;

            return (
              <div
                key={item.product.id}
                onClick={() => handleSelectProduct(item)}
                style={{
                  padding: 'var(--space-4)',
                  backgroundColor: isFlashed ? 'var(--color-ok-surface)' : 'var(--color-card)',
                  border: `1px solid ${hasCounted ? 'var(--color-ok)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast)',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-brand)' }}>
                    {item.product.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    SKU: {item.product.sku}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  {hasCounted ? (
                    <StatusPill value={countedQty} unit={item.product.unit} status="ok" size="sm" />
                  ) : (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                      Sistem: {item.quantity} {item.product.unit}
                    </span>
                  )}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-disabled)" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* OpnameScanCard Bottom Sheet Modal */}
      {selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', justifyItems: 'flex-end', backgroundColor: 'rgba(7,22,57,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ flex: 1 }} onClick={() => setSelectedProduct(null)} />
          <OpnameScanCard
            product={selectedProduct}
            initialPhysicalQty={counts[selectedProduct.id] ?? ''}
            onConfirm={handleConfirmQty}
            onCancel={() => setSelectedProduct(null)}
          />
        </div>
      )}

      {/* Sticky Bottom Finish Button */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--color-card)',
          borderTop: '1px solid var(--color-border)',
          padding: 'var(--space-4) var(--space-margin-mobile)',
          zIndex: 30,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
        }}
      >
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isSubmitting}
          disabled={isSubmitting || countedCount === 0}
          onClick={handleSubmitAll}
        >
          Selesaikan Opname ({countedCount}/{totalProducts} Item) →
        </Button>
      </div>
    </div>
  );
}
