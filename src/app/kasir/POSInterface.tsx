/**
 * POSInterface.tsx — POS Kasir Client Component
 *
 * Enhanced per issue.md:
 * - Search suggestions dropdown for partial product name / SKU / Barcode lookup
 * - Cash Payment & Change calculator with nominal shortcut buttons (Pas, 20k, 50k, 100k, 200k)
 * - Real-time change calculation & validation (disables checkout if cash is insufficient)
 * - Integrated receipt data with cashGiven & changeGiven
 *
 * Design: Warehouse Signal System
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

type LookupProduct = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  unit: string;
};

type SuggestionItem = {
  product: LookupProduct;
  stockAvailable: number;
};

interface POSInterfaceProps {
  locations: Location[];
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
}

export default function POSInterface({ locations }: POSInterfaceProps) {
  const [locationId, setLocationId]     = useState<string>('');
  const [cart, setCart]                 = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [suggestions, setSuggestions]   = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Cash Payment Calculator State
  const [cashInput, setCashInput]       = useState<string>('');
  
  const [isLoading, setIsLoading]       = useState(false);
  const [isCheckout, setIsCheckout]     = useState(false);
  const [receiptData, setReceiptData]   = useState<any>(null);
  const [errorMsg, setErrorMsg]         = useState('');

  const inputRef    = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (locationId && inputRef.current) inputRef.current.focus();
  }, [locationId]);

  /* ── Add product to cart helper ── */
  const addProductToCart = (prod: LookupProduct, stockAvailable: number) => {
    if (stockAvailable <= 0) {
      setErrorMsg(`Stok ${prod.name} kosong di lokasi ini.`);
      return;
    }

    setErrorMsg('');
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === prod.id);
      if (existing) {
        if (existing.quantity >= stockAvailable) {
          setErrorMsg(`Maksimal stok ${prod.name}: ${stockAvailable}.`);
          return prev;
        }
        return prev.map((i) =>
          i.productId === prod.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId:      prod.id,
          sku:            prod.sku,
          barcode:        prod.barcode,
          name:           prod.name,
          price:          prod.price,
          unit:           prod.unit,
          quantity:       1,
          stockAvailable: stockAvailable,
        },
      ];
    });
  };

  /* ── Search Input Change (Debounced lookup for suggestions) ── */
  const handleInputChange = (val: string) => {
    setBarcodeInput(val);
    setErrorMsg('');

    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      if (!locationId || !val.trim()) return;
      try {
        const res  = await fetch(`/api/pos/lookup?q=${encodeURIComponent(val.trim())}&locationId=${locationId}`);
        const data = await res.json();
        if (res.ok && data.results && data.results.length > 0) {
          setSuggestions(data.results);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch {
        setSuggestions([]);
      }
    }, 250);
  };

  /* ── Submit Lookup ── */
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim() || !locationId) return;

    setIsLoading(true);
    setErrorMsg('');
    setShowSuggestions(false);
    const query = barcodeInput.trim();
    setBarcodeInput('');

    try {
      const res  = await fetch(`/api/pos/lookup?q=${encodeURIComponent(query)}&locationId=${locationId}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal mencari produk');
        return;
      }

      if (data.product) {
        addProductToCart(data.product, data.stockAvailable);
      } else if (data.results && data.results.length === 1) {
        addProductToCart(data.results[0].product, data.results[0].stockAvailable);
      } else if (data.results && data.results.length > 1) {
        setSuggestions(data.results);
        setShowSuggestions(true);
      }
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const selectSuggestion = (item: SuggestionItem) => {
    addProductToCart(item.product, item.stockAvailable);
    setBarcodeInput('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
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

  /* ── Computations ── */
  const totalAmount = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems  = cart.reduce((sum, i) => sum + i.quantity, 0);
  const locationName = locations.find((l) => l.id === locationId)?.name ?? '';

  const cashGiven = cashInput === '' ? 0 : Number(cashInput);
  const changeGiven = Math.max(0, cashGiven - totalAmount);
  const isCashInsufficient = cart.length > 0 && cashGiven < totalAmount;
  const isPaymentValid = cart.length > 0 && cashGiven >= totalAmount;

  /* ── Shortcut buttons ── */
  const handleShortcutCash = (amt: number) => {
    setCashInput(String(amt));
  };

  /* ── Checkout ── */
  const handleCheckout = async () => {
    if (cart.length === 0 || !locationId || !isPaymentValid) return;
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
          cashGiven,
          changeGiven,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal memproses transaksi.');
        return;
      }

      setReceiptData({
        referenceId: data.referenceId,
        date:        new Date(),
        locationName,
        items:       [...cart],
        total:       totalAmount,
        cashGiven,
        changeGiven,
      });
      setCart([]);
      setCashInput('');
    } catch {
      setErrorMsg('Terjadi kesalahan saat memproses checkout.');
    } finally {
      setIsCheckout(false);
    }
  };

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
        <div className="ss-pos-search-wrap" style={{ position: 'relative' }}>
          <form onSubmit={handleLookup} className="ss-pos-search-form">
            <span className="material-symbols-outlined ss-pos-search-icon">search</span>
            <input
              id="pos-barcode-input"
              ref={inputRef}
              type="text"
              placeholder="Scan barcode, SKU, atau ketik nama produk..."
              value={barcodeInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              className="ss-pos-search-input"
              autoFocus
              autoComplete="off"
              disabled={isLoading}
              aria-label="Scan barcode atau cari nama produk"
            />
            {isLoading && <div className="ss-pos-search-spinner" />}
          </form>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="ss-pos-suggestions">
              {suggestions.map((item) => (
                <div
                  key={item.product.id}
                  className="ss-pos-suggestion-item"
                  onClick={() => selectSuggestion(item)}
                >
                  <div className="ss-pos-suggestion-info">
                    <span className="ss-pos-suggestion-name">{item.product.name}</span>
                    <span className="ss-pos-suggestion-sku">
                      {item.product.sku} {item.product.barcode ? `• ${item.product.barcode}` : ''}
                    </span>
                  </div>
                  <div className="ss-pos-suggestion-right">
                    <span className="ss-pos-suggestion-price">{formatCurrency(item.product.price)}</span>
                    <span className={`ss-pill ${item.stockAvailable > 0 ? 'ss-pill-success' : 'ss-pill-critical'}`}>
                      Stok: {item.stockAvailable}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

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
                Ketik nama produk, SKU, atau scan barcode untuk menambahkan barang.
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

      {/* ── RIGHT: Summary & Cash Payment Calculator ── */}
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

          {/* ── Cash Payment & Change Section ── */}
          <div className="ss-pos-cash-section">
            <label className="ss-pos-cash-label" htmlFor="cash-given-input">
              Uang Dibayar (Tunai)
            </label>
            <div className="ss-pos-cash-input-wrap">
              <span className="ss-pos-cash-currency">Rp</span>
              <input
                id="cash-given-input"
                type="number"
                min="0"
                step="500"
                placeholder="0"
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
                className="ss-pos-cash-input"
              />
            </div>

            {/* Shortcuts */}
            <div className="ss-pos-cash-shortcuts">
              <button
                type="button"
                className="ss-pos-cash-btn ss-pos-cash-btn--pas"
                onClick={() => handleShortcutCash(totalAmount)}
              >
                Uang Pas
              </button>
              <button
                type="button"
                className="ss-pos-cash-btn"
                onClick={() => handleShortcutCash(20000)}
              >
                20rb
              </button>
              <button
                type="button"
                className="ss-pos-cash-btn"
                onClick={() => handleShortcutCash(50000)}
              >
                50rb
              </button>
              <button
                type="button"
                className="ss-pos-cash-btn"
                onClick={() => handleShortcutCash(100000)}
              >
                100rb
              </button>
              <button
                type="button"
                className="ss-pos-cash-btn"
                onClick={() => handleShortcutCash(200000)}
              >
                200rb
              </button>
            </div>

            {/* Change Box */}
            <div className={`ss-pos-change-box ${isCashInsufficient ? 'ss-pos-change-box--invalid' : 'ss-pos-change-box--valid'}`}>
              <span className="ss-pos-change-label">KEMBALIAN</span>
              {isCashInsufficient ? (
                <span className="ss-pos-change-value ss-pos-change-value--invalid">
                  Uang kurang {formatCurrency(totalAmount - cashGiven)}
                </span>
              ) : (
                <span className="ss-pos-change-value">
                  {formatCurrency(changeGiven)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="ss-pos-footer">
          <button
            id="btn-bayar-sekarang"
            onClick={handleCheckout}
            disabled={!isPaymentValid || isCheckout}
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
