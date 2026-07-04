'use client';

import { useCallback, useRef, useState } from 'react';
import ReceiptModal from './ReceiptModal';

// ── Types ─────────────────────────────────────────────────────
type Location = { id: string; name: string; type: string };

type CartItem = {
  productId: string;
  name: string;
  sku: string;
  unit: string;
  price: number;
  quantity: number;
  availableStock: number;
};

type Receipt = {
  referenceId: string;
  items: Array<{ productId: string; name: string; sku: string; unit: string; price: number; quantity: number; subtotal: number }>;
  totalAmount: number;
  processedAt: string;
  locationName: string;
};

const LOCATION_TYPE_ICON: Record<string, string> = {
  GUDANG: '🏭', RAK: '📦', AREA: '📍', TOKO: '🏪',
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
}

// ── Component ─────────────────────────────────────────────────
export default function POSInterface({ locations }: { locations: Location[] }) {
  const [selectedLocationId, setSelectedLocationId] = useState(locations[0]?.id ?? '');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLooking, setIsLooking] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLocation = locations.find((l) => l.id === selectedLocationId);
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // ── Lookup produk ─────────────────────────────────────────
  const handleLookup = useCallback(async () => {
    const q = barcodeInput.trim();
    if (!q || !selectedLocationId) return;
    setIsLooking(true);
    setLookupError('');

    try {
      const res = await fetch(
        `/api/pos/lookup?q=${encodeURIComponent(q)}&locationId=${selectedLocationId}`,
      );
      const json = await res.json();

      if (!res.ok) {
        setLookupError(json.message ?? json.error ?? 'Produk tidak ditemukan.');
        return;
      }

      const product = json.data;

      if (product.availableStock <= 0) {
        setLookupError(`Stok ${product.name} habis di lokasi ini.`);
        return;
      }

      // Tambahkan ke keranjang atau tambah qty jika sudah ada
      setCart((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          if (existing.quantity >= existing.availableStock) {
            setLookupError(`Stok maksimum ${product.name}: ${product.availableStock} ${product.unit}.`);
            return prev;
          }
          return prev.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            unit: product.unit,
            price: product.price,
            quantity: 1,
            availableStock: product.availableStock,
          },
        ];
      });
      setBarcodeInput('');
    } catch {
      setLookupError('Terjadi kesalahan jaringan.');
    } finally {
      setIsLooking(false);
      inputRef.current?.focus();
    }
  }, [barcodeInput, selectedLocationId]);

  // ── Update quantity di keranjang ──────────────────────────
  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.productId !== productId) return i;
          const newQty = Math.min(i.availableStock, Math.max(1, i.quantity + delta));
          return { ...i, quantity: newQty };
        })
        .filter((i) => i.quantity > 0),
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  // ── Checkout ──────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!cart.length || !selectedLocationId) return;
    setIsCheckingOut(true);
    setCheckoutError('');

    try {
      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: selectedLocationId,
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        const details = json.details?.join('\n') ?? json.message ?? json.error;
        setCheckoutError(details);
        return;
      }

      setReceipt({
        ...json.receipt,
        locationName: selectedLocation?.name ?? '',
      });
      setCart([]);
    } catch {
      setCheckoutError('Transaksi gagal. Silakan coba lagi.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // ── Reset untuk transaksi baru ────────────────────────────
  const handleNewTransaction = () => {
    setReceipt(null);
    setCart([]);
    setCheckoutError('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="flex gap-6 flex-col lg:flex-row">
      {/* ── Kiri: Input & Keranjang ── */}
      <div className="flex-1 space-y-4">

        {/* Location Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            📍 Lokasi Penjualan
          </label>
          <select
            value={selectedLocationId}
            onChange={(e) => {
              setSelectedLocationId(e.target.value);
              setCart([]);
              setLookupError('');
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm font-medium"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {LOCATION_TYPE_ICON[l.type] ?? '📍'} {l.name}
              </option>
            ))}
          </select>
          {!locations.length && (
            <p className="text-sm text-red-500 mt-2">Tidak ada lokasi aktif. Tambahkan di Manajemen Lokasi.</p>
          )}
        </div>

        {/* Barcode / SKU Input */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            🔍 Scan Barcode / Ketik SKU
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => {
                setBarcodeInput(e.target.value);
                setLookupError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              placeholder="Scan barcode atau ketik SKU, tekan Enter..."
              autoFocus
              disabled={isLooking || !selectedLocationId}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm disabled:bg-slate-50"
            />
            <button
              onClick={handleLookup}
              disabled={isLooking || !barcodeInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold disabled:opacity-50 transition-all"
            >
              {isLooking ? '...' : 'Cari'}
            </button>
          </div>
          {lookupError && (
            <p className="mt-2 text-sm text-red-500 flex items-center gap-1.5">
              <span>⚠️</span> {lookupError}
            </p>
          )}
        </div>

        {/* Cart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-700">
              🛒 Keranjang
              {cart.length > 0 && (
                <span className="ml-2 text-xs font-medium bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                  {cart.length} item
                </span>
              )}
            </h2>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                Kosongkan
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-3xl mb-2">🛒</p>
              <p className="text-sm">Keranjang kosong. Scan barcode untuk mulai.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {cart.map((item) => (
                <div key={item.productId} className="px-5 py-3.5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{item.sku}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatCurrency(item.price)} / {item.unit} · Stok: {item.availableStock}
                    </p>
                  </div>

                  {/* Quantity Control */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(item.productId, -1)}
                      className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors text-sm font-bold"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-bold text-slate-800 text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.productId, 1)}
                      disabled={item.quantity >= item.availableStock}
                      className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition-colors text-sm font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right min-w-[80px]">
                    <p className="font-bold text-slate-800 text-sm">{formatCurrency(item.price * item.quantity)}</p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Kanan: Ringkasan & Bayar ── */}
      <div className="w-full lg:w-72 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sticky top-6">
          <h2 className="font-bold text-slate-700 mb-4">💳 Ringkasan</h2>

          <div className="space-y-2.5 mb-4">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Jumlah Item</span>
              <span className="font-semibold">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Jenis Produk</span>
              <span className="font-semibold">{cart.length}</span>
            </div>
            <div className="border-t border-slate-100 pt-2.5 flex justify-between">
              <span className="font-bold text-slate-800">Total</span>
              <span className="font-bold text-xl text-primary-600">{formatCurrency(cartTotal)}</span>
            </div>
          </div>

          {checkoutError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs whitespace-pre-line">
              {checkoutError}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isCheckingOut}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all active:scale-95"
          >
            {isCheckingOut ? 'Memproses...' : '✅ Proses Bayar'}
          </button>

          <p className="text-xs text-slate-400 text-center mt-3">
            Stok berkurang otomatis setelah transaksi
          </p>
        </div>
      </div>

      {/* Receipt Modal */}
      {receipt && (
        <ReceiptModal receipt={receipt} onNewTransaction={handleNewTransaction} />
      )}
    </div>
  );
}
