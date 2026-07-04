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
  stockAvailable: number; // Max allowed
};

interface POSInterfaceProps {
  locations: Location[];
}

export default function POSInterface({ locations }: POSInterfaceProps) {
  const [locationId, setLocationId] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus barcode input when location is selected
  useEffect(() => {
    if (locationId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [locationId]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim() || !locationId) return;

    setIsLoading(true);
    setErrorMsg('');
    const query = barcodeInput.trim();
    setBarcodeInput(''); // clear immediately for next scan

    try {
      const res = await fetch(`/api/pos/lookup?q=${encodeURIComponent(query)}&locationId=${locationId}`);
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
            setErrorMsg(`Maksimal stok ${data.product.name} tercapai (${data.stockAvailable}).`);
            return prev;
          }
          return prev.map((i) =>
            i.productId === data.product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        }

        return [
          ...prev,
          {
            productId: data.product.id,
            sku: data.product.sku,
            barcode: data.product.barcode,
            name: data.product.name,
            price: data.product.price,
            unit: data.product.unit,
            quantity: 1,
            stockAvailable: data.stockAvailable,
          },
        ];
      });
    } catch (err) {
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId === productId) {
          const newQty = i.quantity + delta;
          if (newQty > 0 && newQty <= i.stockAvailable) {
            return { ...i, quantity: newQty };
          }
        }
        return i;
      })
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || !locationId) return;
    setIsCheckout(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          items: cart.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
            name: i.name
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal memproses transaksi.');
        return;
      }

      // Success
      const locationName = locations.find(l => l.id === locationId)?.name || '';
      setReceiptData({
        referenceId: data.referenceId,
        date: new Date(),
        locationName,
        items: [...cart],
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      });
      
      setCart([]);
    } catch (err) {
      setErrorMsg('Terjadi kesalahan saat memproses checkout.');
    } finally {
      setIsCheckout(false);
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (!locationId) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 h-full">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="text-5xl mb-4">🏪</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Pilih Lokasi Kasir</h2>
          <p className="text-sm text-slate-500 mb-6">Pilih lokasi penjualan untuk mengurangi stok dengan benar dari sistem.</p>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-medium bg-slate-50"
          >
            <option value="" disabled>-- Pilih Lokasi --</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name} ({l.type})</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-50">
      {/* Left Panel: Barcode Scan & Cart */}
      <div className="flex-1 flex flex-col border-r border-slate-200 bg-white">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <form onSubmit={handleLookup} className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Scan barcode atau ketik SKU lalu tekan Enter..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-700"
              autoFocus
              disabled={isLoading}
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </form>
          {errorMsg && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-center gap-2">
              <span className="text-base">⚠️</span> {errorMsg}
            </div>
          )}
        </div>

        {/* Cart List */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <span className="text-6xl mb-4">🛒</span>
              <p className="font-medium text-slate-600 text-lg">Keranjang Kosong</p>
              <p className="text-sm mt-1 max-w-xs text-center">Scan produk untuk menambahkan ke keranjang belanja.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-xl shrink-0">
                    📦
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{item.sku}</p>
                    <p className="font-semibold text-primary-600 text-sm mt-1">Rp {item.price.toLocaleString('id-ID')}</p>
                  </div>
                  
                  {/* Quantity Control */}
                  <div className="flex items-center gap-3 bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-200">
                    <button 
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="w-7 h-7 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="w-7 h-7 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                      disabled={item.quantity >= item.stockAvailable}
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[100px]">
                    <p className="font-bold text-slate-800 text-base">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <button 
                    onClick={() => removeItem(item.productId)}
                    className="w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                    title="Hapus"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Summary */}
      <div className="w-96 flex flex-col bg-white">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg">Ringkasan</h3>
          <span className="text-xs font-semibold bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full border border-primary-100">
            {locations.find(l => l.id === locationId)?.name}
          </span>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-4">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Total Item</span>
            <span className="font-bold text-slate-800">{totalItems} {totalItems > 1 ? 'items' : 'item'}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold">Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600 pb-4 border-b border-slate-100">
            <span>Pajak (0%)</span>
            <span className="font-semibold">Rp 0</span>
          </div>
          
          <div className="flex justify-between items-end mt-2">
            <span className="text-slate-500 font-medium">Total Bayar</span>
            <span className="text-3xl font-bold text-primary-600 tracking-tight">
              Rp {totalAmount.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <div className="p-6 pt-0 mt-auto">
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isCheckout}
            className="w-full py-4 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98] flex justify-center items-center gap-2 text-lg"
          >
            {isCheckout ? (
              <>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Memproses...
              </>
            ) : (
              <>Bayar Sekarang</>
            )}
          </button>
        </div>
      </div>

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
