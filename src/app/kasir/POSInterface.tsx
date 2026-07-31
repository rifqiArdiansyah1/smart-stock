/**
 * POSInterface.tsx — POS Kasir Client Component
 *
 * Redesign per ISSUE-029-D6:
 * - Split layout: produk kiri (scan + cart) | ringkasan kanan
 * - CTA amber besar "Bayar Sekarang"
 * - Mobile: stacked (produk atas, summary bawah)
 * - Location selector screen sebelum masuk POS
 *
 * Design ref: stitch — Warehouse Signal Design System
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import ReceiptModal from './ReceiptModal';

type Location = { id: string; name: string; type: string };

type CartItem = {
  productId: string;
  sku: string;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  stockAvailable: number;
};

interface POSInterfaceProps {
  locations: Location[];
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
}

export default function POSInterface({ locations }: POSInterfaceProps) {
  const [locationId, setLocationId] = useState<string>('');
  const [cart, setCart]             = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [errorMsg, setErrorMsg]     = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (locationId && inputRef.current) inputRef.current.focus();
  }, [locationId]);

  /* ── Product lookup ── */
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim() || !locationId) return;

    setIsLoading(true);
    setErrorMsg('');
    const query = barcodeInput.trim();
    setBarcodeInput('');

    try {
      const res  = await fetch(`/api/pos/lookup?q=${encodeURIComponent(query)}&locationId=${locationId}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal mencari produk');
        return;
      }
      if (data.stockAvailable <= 0) {
        setErrorMsg(`Stok ${data.product.name} kosong di lokasi ini.`);
        return;
      }

      setCart((prev) => {
        const existing = prev.find((i) => i.productId === data.product.id);
        if (existing) {
          if (existing.quantity >= data.stockAvailable) {
            setErrorMsg(`Maksimal stok ${data.product.name}: ${data.stockAvailable}.`);
            return prev;
          }
          return prev.map((i) =>
            i.productId === data.product.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
        return [
          ...prev,
          {
            productId:      data.product.id,
            sku:            data.product.sku,
            barcode:        data.product.barcode,
            name:           data.product.name,
            price:          data.product.price,
            unit:           data.product.unit,
            quantity:       1,
            stockAvailable: data.stockAvailable,
          },
        ];
      });
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i;
        const newQty = i.quantity + delta;
        if (newQty > 0 && newQty <= i.stockAvailable) return { ...i, quantity: newQty };
        return i;
      })
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  /* ── Checkout ── */
  const handleCheckout = async () => {
    if (cart.length === 0 || !locationId) return;
    setIsCheckout(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/pos/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          locationId,
          items: cart.map((i) => ({
            productId: i.productId,
            quantity:  i.quantity,
            price:     i.price,
            name:      i.name,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal memproses transaksi.');
        return;
      }

      const locationName = locations.find((l) => l.id === locationId)?.name || '';
      setReceiptData({
        referenceId: data.referenceId,
        date:        new Date(),
        locationName,
        items:       [...cart],
        total:       cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      });
      setCart([]);
    } catch {
      setErrorMsg('Terjadi kesalahan saat memproses checkout.');
    } finally {
      setIsCheckout(false);
    }
  };

  const totalAmount = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems  = cart.reduce((sum, i) => sum + i.quantity, 0);
  const locationName = locations.find((l) => l.id === locationId)?.name ?? '';

  /* ── Location Picker Screen ── */
  if (!locationId) {
    return (
      <div className="ss-pos-location-screen">
        <div className="ss-pos-location-card">
          <span className="material-symbols-outlined ss-pos-location-icon"
            style={{ fontVariationSettings: "'FILL' 1" }}>
            storefront
          </span>
          <h2 className="ss-pos-location-title">Pilih Lokasi Kasir</h2>
          <p className="ss-pos-location-desc">
            Pilih lokasi penjualan untuk mengurangi stok dari sistem secara akurat.
          </p>
          <div className="ss-pos-location-select-wrap">
            <select
              id="pos-location-select"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="ss-pos-location-select"
              aria-label="Pilih lokasi kasir"
            >
              <option value="" disabled>-- Pilih Lokasi --</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name} ({l.type})</option>
              ))}
            </select>
            <span className="material-symbols-outlined ss-pos-location-select-icon">expand_more</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main POS Interface ── */
  return (
    <div className="ss-pos-main">
      {/* ── LEFT: Scan + Cart ── */}
      <div className="ss-pos-left">
        {/* Search Bar */}
        <div className="ss-pos-search-wrap">
          <form onSubmit={handleLookup} className="ss-pos-search-form">
            <span className="material-symbols-outlined ss-pos-search-icon">barcode_scanner</span>
            <input
              id="pos-barcode-input"
              ref={inputRef}
              type="text"
              placeholder="Scan barcode atau ketik SKU, lalu tekan Enter..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="ss-pos-search-input"
              autoFocus
              autoComplete="off"
              disabled={isLoading}
              aria-label="Scan barcode atau ketik SKU"
            />
            {isLoading && <div className="ss-pos-search-spinner" />}
          </form>

          {errorMsg && (
            <div className="ss-pos-error-banner" role="alert">
              <span className="material-symbols-outlined">warning</span>
              {errorMsg}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="ss-pos-cart">
          {cart.length === 0 ? (
            <div className="ss-pos-cart-empty">
              <span className="material-symbols-outlined ss-pos-cart-empty-icon">shopping_cart</span>
              <p className="ss-pos-cart-empty-title">Keranjang Kosong</p>
              <p className="ss-pos-cart-empty-desc">
                Scan produk untuk menambahkan ke keranjang belanja.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="ss-pos-cart-item">
                {/* Thumbnail */}
                <div className="ss-pos-cart-thumb">
                  <span className="material-symbols-outlined">inventory_2</span>
                </div>

                {/* Info */}
                <div className="ss-pos-cart-info">
                  <p className="ss-pos-cart-name">{item.name}</p>
                  <p className="ss-pos-cart-sku">{item.sku}</p>
                  <p className="ss-pos-cart-price">{formatCurrency(item.price)}</p>
                </div>

                {/* Qty */}
                <div className="ss-pos-qty">
                  <button
                    className="ss-pos-qty-btn"
                    onClick={() => updateQty(item.productId, -1)}
                    disabled={item.quantity <= 1}
                    aria-label={`Kurangi ${item.name}`}
                    type="button"
                  >−</button>
                  <span className="ss-pos-qty-value">{item.quantity}</span>
                  <button
                    className="ss-pos-qty-btn"
                    onClick={() => updateQty(item.productId, 1)}
                    disabled={item.quantity >= item.stockAvailable}
                    aria-label={`Tambah ${item.name}`}
                    type="button"
                  >+</button>
                </div>

                {/* Subtotal */}
                <div className="ss-pos-item-total">
                  <span className="ss-pos-item-total-value">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>

                {/* Remove */}
                <button
                  className="ss-pos-remove-btn"
                  onClick={() => removeItem(item.productId)}
                  aria-label={`Hapus ${item.name}`}
                  type="button"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT: Summary Panel ── */}
      <div className="ss-pos-right">
        {/* Header */}
        <div className="ss-pos-summary-header">
          <h3 className="ss-pos-summary-title">Ringkasan</h3>
          <span className="ss-pos-location-badge">
            <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>location_on</span>
            {locationName}
          </span>
        </div>

        {/* Body */}
        <div className="ss-pos-summary-body">
          <div className="ss-pos-summary-row">
            <span>Total Item</span>
            <span className="ss-pos-summary-row-value">{totalItems} item</span>
          </div>
          <div className="ss-pos-summary-row">
            <span>Subtotal</span>
            <span className="ss-pos-summary-row-value">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="ss-pos-summary-row">
            <span>Pajak (0%)</span>
            <span className="ss-pos-summary-row-value">Rp 0</span>
          </div>
          <hr className="ss-pos-summary-divider" />
          <div className="ss-pos-total-row">
            <span className="ss-pos-total-label">Total Bayar</span>
            <span className="ss-pos-total-value">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="ss-pos-footer">
          <button
            id="btn-bayar-sekarang"
            onClick={handleCheckout}
            disabled={cart.length === 0 || isCheckout}
            className="ss-pos-checkout-btn"
            type="button"
          >
            {isCheckout ? (
              <>
                <div className="ss-pos-checkout-spinner" />
                Memproses...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  payments
                </span>
                Bayar Sekarang
              </>
            )}
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {receiptData && (
        <ReceiptModal
          data={receiptData}
          onClose={() => {
            setReceiptData(null);
            inputRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}
