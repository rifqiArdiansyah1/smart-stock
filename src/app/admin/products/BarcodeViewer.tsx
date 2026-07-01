'use client';

import { useEffect, useRef, useState } from 'react';

interface BarcodeViewerProps {
  barcode: string;
  productName: string;
  sku: string;
}

export default function BarcodeViewer({ barcode, productName, sku }: BarcodeViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current || !barcode) return;

    // Dynamically import bwip-js to avoid SSR issues
    import('bwip-js').then((bwipjs) => {
      try {
        bwipjs.toCanvas(canvasRef.current!, {
          bcid: 'code128',
          text: barcode,
          scale: 3,
          height: 12,
          includetext: true,
          textxalign: 'center',
        });
        setError(null);
      } catch (e) {
        setError('Gagal merender barcode. Pastikan format barcode valid.');
      }
    });
  }, [isOpen, barcode]);

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dataUrl = canvas.toDataURL('image/png');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode — ${productName}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
            .label { border: 1px solid #ccc; padding: 12px 16px; border-radius: 8px; text-align: center; }
            .product-name { font-size: 14px; font-weight: 700; margin-bottom: 6px; }
            .sku { font-size: 11px; color: #555; margin-bottom: 8px; }
            img { max-width: 300px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="product-name">${productName}</div>
            <div class="sku">SKU: ${sku}</div>
            <img src="${dataUrl}" />
          </div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!barcode) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Lihat & Cetak Barcode"
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 8V6a2 2 0 012-2h2M3 16v2a2 2 0 002 2h2m10-18h2a2 2 0 012 2v2m-4 14h2a2 2 0 002-2v-2M8 12h.01M12 12h.01M16 12h.01M8 8h.01M12 8h.01M16 8h.01M8 16h.01M12 16h.01M16 16h.01" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-sm text-center animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400"
            >
              ✕
            </button>

            <h3 className="font-bold text-slate-800 text-base mb-0.5">{productName}</h3>
            <p className="text-xs text-slate-400 mb-5">SKU: {sku} · Barcode: {barcode}</p>

            {error ? (
              <p className="text-sm text-red-500 py-4">{error}</p>
            ) : (
              <div className="flex justify-center mb-5">
                <canvas ref={canvasRef} className="max-w-full rounded-lg" />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={handlePrint}
                disabled={!!error}
                className="flex-1 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-500 disabled:opacity-50 transition-colors"
              >
                🖨️ Cetak Label
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
