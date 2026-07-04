'use client';

import { useState } from 'react';

type ReceiptItem = {
  productId: string;
  name: string;
  sku: string;
  unit: string;
  price: number;
  quantity: number;
  subtotal: number;
};

type Receipt = {
  referenceId: string;
  items: ReceiptItem[];
  totalAmount: number;
  processedAt: string;
  locationName: string;
};

interface ReceiptModalProps {
  receipt: Receipt;
  onNewTransaction: () => void;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v);
}

export default function ReceiptModal({ receipt, onNewTransaction }: ReceiptModalProps) {
  const [printing, setPrinting] = useState(false);

  const handlePrint = () => {
    setPrinting(true);
    window.print();
    setTimeout(() => setPrinting(false), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Success Header */}
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 px-6 py-6 text-white text-center">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Transaksi Berhasil!</h2>
          <p className="text-emerald-100 text-sm mt-1">Stok telah diperbarui secara otomatis</p>
        </div>

        {/* Receipt Body */}
        <div className="px-6 py-5">
          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-4 pb-4 border-b border-dashed border-slate-200">
            <div>
              <p className="font-mono font-medium text-slate-700 text-xs">{receipt.referenceId.slice(0, 8).toUpperCase()}</p>
              <p className="mt-0.5">{new Date(receipt.processedAt).toLocaleString('id-ID')}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-slate-700">{receipt.locationName}</p>
              <p className="mt-0.5">{receipt.items.length} produk</p>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2.5 mb-4">
            {receipt.items.map((item) => (
              <div key={item.productId} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 text-sm leading-tight truncate">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.quantity} {item.unit} × {formatCurrency(item.price)}</p>
                </div>
                <p className="font-semibold text-slate-700 text-sm whitespace-nowrap">{formatCurrency(item.subtotal)}</p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t-2 border-dashed border-slate-200 pt-4 mb-5">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-800">Total</span>
              <span className="text-xl font-bold text-emerald-600">{formatCurrency(receipt.totalAmount)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              disabled={printing}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button
              onClick={onNewTransaction}
              className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold transition-colors shadow-sm"
            >
              Transaksi Baru
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
