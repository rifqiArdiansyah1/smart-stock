'use client';

/**
 * ScanOpnameWorkspace — Warehouse Signal (Mobile)
 * Referensi visual: stock_opname_scan_produk_final/screen.png
 *
 * Layout 3 zona:
 * 1. Header sticky: nama lokasi + counter "12/45"
 * 2. Area tengah: viewfinder kamera + tombol Input Manual
 * 3. Panel bawah: setelah scan — nama produk, stok sistem, input qty, konfirmasi
 */

import React, { useState, useRef, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BarcodeScanner from './BarcodeScanner';

// ── Icons ─────────────────────────────────────────────────────────────────────
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const ScanIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 5v14M7 5v14M11 5v14M15 5v7M19 5v7M15 16v3M19 16v3M13 19h8M13 16h2M17 16h2"/>
  </svg>
);

const KeyboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
  </svg>
);

const BoxIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const MinusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ animation: 'spin 0.75s linear infinite' }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5"/>
    <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────────
interface ScannedProduct {
  id:   string;
  name: string;
  sku:  string;
  unit: string;
  systemQty: number;
}

interface SessionData {
  id:       string;
  location: { name: string };
  items:    Array<{ product: { sku: string }; physicalQty: number }>;
}

interface SystemStock {
  product:  { id: string; name: string; sku: string; unit: string; barcode?: string };
  quantity: number;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ScanOpnameWorkspace({
  sessionData,
  systemStock,
}: {
  sessionData: SessionData;
  systemStock: SystemStock[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State
  const [mode,           setMode]           = useState<'scan' | 'manual'>('scan');
  const [showScanner,    setShowScanner]    = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [physicalQty,    setPhysicalQty]    = useState(0);
  const [manualBarcode,  setManualBarcode]  = useState('');
  const [flashSuccess,   setFlashSuccess]   = useState(false);
  const [confirmedItems, setConfirmedItems] = useState<string[]>(
    sessionData.items.map((i) => i.product.sku),
  );
  const manualInputRef = useRef<HTMLInputElement>(null);

  const totalItems    = systemStock.length;
  const scannedCount  = confirmedItems.length;

  // Lookup produk dari barcode / sku
  const lookupProduct = useCallback((query: string): ScannedProduct | null => {
    const stock = systemStock.find(
      (s) => s.product.barcode === query || s.product.sku === query,
    );
    if (!stock) return null;
    return {
      id:        stock.product.id,
      name:      stock.product.name,
      sku:       stock.product.sku,
      unit:      stock.product.unit,
      systemQty: stock.quantity,
    };
  }, [systemStock]);

  // Handle scan sukses dari BarcodeScanner modal
  const handleScanSuccess = useCallback((barcode: string) => {
    setShowScanner(false);
    const product = lookupProduct(barcode);
    if (product) {
      setScannedProduct(product);
      setPhysicalQty(0);
    }
  }, [lookupProduct]);

  // Handle input manual
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = lookupProduct(manualBarcode.trim().toUpperCase());
    if (product) {
      setScannedProduct(product);
      setPhysicalQty(0);
      setManualBarcode('');
      setMode('scan');
    }
  };

  // Konfirmasi item
  const handleConfirm = () => {
    if (!scannedProduct) return;
    startTransition(async () => {
      await fetch(`/api/opname/sessions/${sessionData.id}/items`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ productId: scannedProduct.id, physicalQty }),
      });
      // Animasi sukses
      setFlashSuccess(true);
      setConfirmedItems((prev) => [...new Set([...prev, scannedProduct.sku])]);
      setTimeout(() => {
        setFlashSuccess(false);
        setScannedProduct(null);
        setPhysicalQty(0);
      }, 600);
    });
  };

  const padding = 'var(--space-margin-mobile)';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)', display: 'flex', flexDirection: 'column' }}>

      {/* ── ZONA 1: Sticky Header ── */}
      <header style={{
        position:        'sticky',
        top:             0,
        zIndex:          30,
        backgroundColor: 'var(--color-card)',
        borderBottom:    '1px solid var(--color-border)',
        padding:         `var(--space-3) ${padding}`,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={() => router.push('/opname')}
            aria-label="Kembali ke daftar lokasi"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', padding: '4px' }}
          >
            <BackIcon />
          </button>
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
              Opname Sesi
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-brand)', margin: 0 }}>
              {sessionData.location.name}
            </h1>
          </div>
        </div>

        {/* Counter */}
        <div style={{
          display:         'flex',
          alignItems:      'center',
          gap:             'var(--space-1)',
          backgroundColor: 'var(--color-surface-low)',
          border:          '1px solid var(--color-border)',
          borderRadius:    'var(--radius-full)',
          padding:         '4px 10px 4px 8px',
        }}>
          <span style={{ color: 'var(--color-text-secondary)', display: 'flex' }}><BoxIcon /></span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-brand)' }}>
            {scannedCount}/{totalItems}
          </span>
        </div>
      </header>

      {/* ── ZONA 2: Area Scan ── */}
      <div style={{ flex: 1, padding, paddingBottom: scannedProduct ? '320px' : '80px' }}>

        {mode === 'scan' ? (
          <>
            {/* Tombol Buka Kamera */}
            <button
              onClick={() => setShowScanner(true)}
              aria-label="Buka pemindai barcode"
              style={{
                display:         'flex',
                flexDirection:   'column',
                alignItems:      'center',
                justifyContent:  'center',
                gap:             'var(--space-3)',
                width:           '100%',
                aspectRatio:     '4/3',
                backgroundColor: scannedProduct ? 'var(--color-ok-surface)' : '#0f172a',
                border:          `2px solid ${scannedProduct ? 'var(--color-ok)' : 'var(--color-accent)'}`,
                borderRadius:    'var(--radius-xl)',
                cursor:          'pointer',
                color:           scannedProduct ? 'var(--color-ok-text)' : 'rgba(255,255,255,0.8)',
                marginBottom:    'var(--space-4)',
                transition:      'border-color var(--duration-normal), background-color var(--duration-normal)',
                position:        'relative',
                overflow:        'hidden',
              }}
            >
              {/* Corner markers */}
              {(['tl','tr','bl','br'] as const).map((corner) => (
                <span key={corner} aria-hidden="true" style={{
                  position:    'absolute',
                  width:       '24px', height: '24px',
                  borderColor: scannedProduct ? 'var(--color-ok)' : 'var(--color-accent)',
                  borderStyle: 'solid', borderWidth: 0,
                  ...(corner === 'tl' ? { top: '12px', left: '12px', borderTopWidth: '3px', borderLeftWidth: '3px', borderRadius: '4px 0 0 0' } : {}),
                  ...(corner === 'tr' ? { top: '12px', right: '12px', borderTopWidth: '3px', borderRightWidth: '3px', borderRadius: '0 4px 0 0' } : {}),
                  ...(corner === 'bl' ? { bottom: '12px', left: '12px', borderBottomWidth: '3px', borderLeftWidth: '3px', borderRadius: '0 0 0 4px' } : {}),
                  ...(corner === 'br' ? { bottom: '12px', right: '12px', borderBottomWidth: '3px', borderRightWidth: '3px', borderRadius: '0 0 4px 0' } : {}),
                }} />
              ))}

              {scannedProduct ? (
                <>
                  <span style={{ display:'flex', color:'var(--color-ok)', transform:'scale(1.5)' }}><CheckIcon /></span>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:'var(--text-sm)', fontWeight:700, color:'var(--color-ok-text)' }}>Dipindai — Ketuk untuk scan ulang</span>
                </>
              ) : (
                <>
                  <span style={{ display:'flex', opacity:0.8 }}><ScanIcon /></span>
                  <span style={{ fontFamily:'var(--font-body)', fontSize:'var(--text-sm)', color:'rgba(255,255,255,0.7)' }}>Ketuk untuk buka kamera</span>
                </>
              )}
            </button>

            {/* Input Manual button */}
            <button
              onClick={() => { setMode('manual'); setTimeout(() => manualInputRef.current?.focus(), 100); }}
              style={{
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                gap:             'var(--space-2)',
                width:           '100%',
                height:          'var(--touch-target)',
                backgroundColor: 'var(--color-card)',
                border:          '1.5px solid var(--color-border)',
                borderRadius:    'var(--radius-lg)',
                fontFamily:      'var(--font-body)',
                fontSize:        'var(--text-sm)',
                fontWeight:      500,
                color:           'var(--color-text-secondary)',
                cursor:          'pointer',
              }}
            >
              <KeyboardIcon />
              Input Manual (SKU/Barcode)
            </button>

            {/* BarcodeScanner Modal */}
            {showScanner && (
              <BarcodeScanner
                onScanSuccess={handleScanSuccess}
                onClose={() => setShowScanner(false)}
              />
            )}
          </>
        ) : (
          /* Manual Input mode */
          <form onSubmit={handleManualSubmit}>
            <label htmlFor="manual-barcode" style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
              Masukkan SKU atau Barcode
            </label>
            <input
              ref={manualInputRef}
              id="manual-barcode"
              type="text"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value.toUpperCase())}
              placeholder="Contoh: OIL-2L-890123"
              autoCapitalize="characters"
              style={{
                width:           '100%',
                height:          'var(--touch-target)',
                padding:         '0 0.75rem',
                fontFamily:      'var(--font-mono)',
                fontSize:        'var(--text-base)',
                color:           'var(--color-text-primary)',
                backgroundColor: 'var(--color-card)',
                border:          '1.5px solid var(--color-border-focus)',
                borderRadius:    'var(--radius-lg)',
                outline:         'none',
                marginBottom:    'var(--space-3)',
                letterSpacing:   '0.05em',
              }}
            />
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button type="button" onClick={() => setMode('scan')} style={{
                flex: 1, height: 'var(--touch-target)', backgroundColor: 'var(--color-card)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', cursor: 'pointer', color: 'var(--color-text-secondary)',
              }}>
                Batal
              </button>
              <button type="submit" style={{
                flex: 2, height: 'var(--touch-target)', backgroundColor: 'var(--color-brand)', border: 'none', borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, cursor: 'pointer', color: 'white',
              }}>
                Cari Produk
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── ZONA 3: Bottom Sheet — setelah scan ── */}
      {scannedProduct && (
        <div
          role="dialog"
          aria-label="Detail produk yang dipindai"
          style={{
            position:        'fixed',
            bottom:          'calc(var(--bottomnav-height) + env(safe-area-inset-bottom))',
            left:            0,
            right:           0,
            borderTop:       '2px solid var(--color-border)',
            borderRadius:    'var(--radius-2xl) var(--radius-2xl) 0 0',
            padding:         padding,
            zIndex:          40,
            animation:       'ws-slide-up var(--duration-slow) var(--ease-out)',
            boxShadow:       '0 -4px 24px rgba(0,0,0,0.12)',
            backgroundColor: flashSuccess ? 'var(--color-ok-surface)' : 'var(--color-card)',
            transition:      'background-color var(--duration-normal)',
          }}
        >
          {/* Product name + SKU */}
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 var(--space-1)' }}>
            {scannedProduct.name}
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-4)' }}>
            SKU: {scannedProduct.sku}
          </p>

          {/* Stok sistem */}
          <div style={{
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'space-between',
            backgroundColor: 'var(--color-surface-low)',
            border:          '1px solid var(--color-border)',
            borderRadius:    'var(--radius-lg)',
            padding:         'var(--space-3) var(--space-4)',
            marginBottom:    'var(--space-4)',
          }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Stok Sistem:
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {scannedProduct.systemQty} {scannedProduct.unit}
            </span>
          </div>

          {/* Jumlah Fisik — stepper */}
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 var(--space-3)' }}>
            Jumlah Fisik
          </p>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <button
              onClick={() => setPhysicalQty(Math.max(0, physicalQty - 1))}
              aria-label="Kurangi jumlah"
              style={{ width: '56px', backgroundColor: 'var(--color-surface-low)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-primary)', flexShrink: 0 }}
            >
              <MinusIcon />
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={physicalQty}
              onChange={(e) => setPhysicalQty(Math.max(0, Number(e.target.value)))}
              aria-label="Jumlah fisik"
              style={{
                flex:        1,
                textAlign:   'center',
                fontFamily:  'var(--font-mono)',
                fontSize:    'var(--text-2xl)',
                fontWeight:  500,
                color:       'var(--color-text-primary)',
                backgroundColor: 'var(--color-card)',
                border:      '1px solid var(--color-border)',
                borderRadius:'var(--radius-lg)',
                outline:     'none',
                minHeight:   'var(--touch-target-lg)',
              }}
            />
            <button
              onClick={() => setPhysicalQty(physicalQty + 1)}
              aria-label="Tambah jumlah"
              style={{ width: '56px', backgroundColor: 'var(--color-surface-low)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-primary)', flexShrink: 0 }}
            >
              <PlusIcon />
            </button>
          </div>

          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textAlign: 'center', margin: '0 0 var(--space-2)' }}>
            Masukkan jumlah fisik yang ditemukan di rak.
          </p>

          {/* Reset */}
          <button
            onClick={() => setPhysicalQty(0)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-warn)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 500, margin: '0 auto var(--space-4)', padding: '4px 8px' }}
          >
            <RefreshIcon /> Reset Jumlah
          </button>

          {/* Konfirmasi */}
          <button
            onClick={handleConfirm}
            disabled={isPending}
            aria-busy={isPending}
            style={{
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              gap:             'var(--space-2)',
              width:           '100%',
              height:          'var(--touch-target-lg)',
              backgroundColor: flashSuccess ? 'var(--color-ok)' : 'var(--color-accent)',
              border:          'none',
              borderRadius:    'var(--radius-xl)',
              fontFamily:      'var(--font-display)',
              fontSize:        'var(--text-lg)',
              fontWeight:      700,
              color:           flashSuccess ? 'white' : 'var(--color-text-on-accent)',
              cursor:          isPending ? 'wait' : 'pointer',
              transition:      'background-color var(--duration-normal)',
            }}
          >
            {isPending ? <><SpinnerIcon /><span>Menyimpan...</span></> : <><span>Konfirmasi &amp; Lanjut</span><span aria-hidden="true">→</span></>}
          </button>
        </div>
      )}
    </div>
  );
}
