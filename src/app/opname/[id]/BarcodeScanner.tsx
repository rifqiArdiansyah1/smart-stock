'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScanSuccess, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Prevent multiple initializations in React strict mode
    if (scannerRef.current) return;

    scannerRef.current = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true,
      },
      /* verbose= */ false
    );

    const onScan = (decodedText: string) => {
      // Clear scanner immediately to prevent multiple scans of the same item instantly
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
      onScanSuccess(decodedText);
    };

    const onScanFailure = (err: string) => {
      // Html5QrcodeScanner routinely throws errors when no barcode is found in the current frame.
      // We ignore these to prevent spamming the console/UI.
    };

    try {
      scannerRef.current.render(onScan, onScanFailure);
    } catch (e: any) {
      setError('Kamera tidak dapat diakses. Pastikan Anda telah memberikan izin kamera.');
      console.error(e);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-800">Scan Barcode / SKU</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scanner Viewport */}
        <div className="p-4 bg-black flex-1 relative min-h-[300px]">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-red-400 bg-slate-900">
              <p>{error}</p>
            </div>
          ) : (
            <div id="reader" className="w-full h-full overflow-hidden rounded-xl border-2 border-slate-800" />
          )}
        </div>

        {/* Footer / Instructions */}
        <div className="p-4 bg-slate-800 text-slate-300 text-sm text-center">
          Arahkan kamera ke barcode produk. Pastikan pencahayaan cukup.
        </div>
      </div>
    </div>
  );
}
