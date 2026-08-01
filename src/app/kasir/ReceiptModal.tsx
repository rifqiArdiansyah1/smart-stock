'use client';

type ReceiptItem = {
  name: string;
  quantity: number;
  price: number;
};

interface ReceiptModalProps {
  data: {
    referenceId: string;
    date: Date;
    locationName: string;
    items: ReceiptItem[];
    total: number;
    cashGiven?: number;
    changeGiven?: number;
    cashierName?: string;
  };
  onClose: () => void;
}

function formatIDR(val: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(val);
}

export default function ReceiptModal({ data, onClose }: ReceiptModalProps) {
  const handlePrint = () => {
    window.print();
  };

  const cashGiven = data.cashGiven ?? data.total;
  const changeGiven = data.changeGiven ?? Math.max(0, cashGiven - data.total);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-ws-scale-in print:shadow-none print:max-w-none print:p-0 print:border-none print:rounded-none">
        
        {/* Receipt Printable Content */}
        <div className="p-6 print:p-0 font-mono text-sm text-slate-800" id="receipt-print-area">
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold tracking-tight">SmartStock POS</h2>
            <p className="text-xs text-slate-500 font-sans">{data.locationName}</p>
            {data.cashierName && (
              <p className="text-xs text-slate-500 font-sans mt-0.5">Kasir: {data.cashierName}</p>
            )}
            <p className="text-xs text-slate-400 mt-1 font-mono">
              {data.date.toLocaleDateString('id-ID')} {data.date.toLocaleTimeString('id-ID')}
            </p>
          </div>

          <div className="text-xs text-slate-500 mb-3 border-b border-dashed border-slate-300 pb-2 flex justify-between">
            <span>REF: {data.referenceId.split('-')[0].toUpperCase()}</span>
            <span>TUNAI</span>
          </div>

          <table className="w-full mb-3 text-xs">
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-none">
                  <td className="py-1.5 pr-2">
                    <div className="font-semibold text-slate-800">{item.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {item.quantity} x Rp {formatIDR(item.price)}
                    </div>
                  </td>
                  <td className="py-1.5 text-right align-bottom font-semibold">
                    Rp {formatIDR(item.quantity * item.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed border-slate-300 pt-2 pb-2 space-y-1 text-xs">
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL</span>
              <span>Rp {formatIDR(data.total)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>TUNAI</span>
              <span>Rp {formatIDR(cashGiven)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>KEMBALIAN</span>
              <span>Rp {formatIDR(changeGiven)}</span>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400 mt-4 pt-3 border-t border-dashed border-slate-200">
            <p className="font-semibold text-slate-600">Terima Kasih Atas Kunjungan Anda</p>
            <p className="mt-0.5">Barang yang sudah dibeli tidak dapat dikembalikan.</p>
          </div>
        </div>

        {/* Action Buttons (Hidden on Print) */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex gap-3 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-white transition-colors text-sm"
            type="button"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold hover:brightness-95 transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Cetak Struk
          </button>
        </div>
        
        {/* Style for Thermal Receipt Printing */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              background: white !important;
              color: black !important;
            }
            body * {
              visibility: hidden;
            }
            #receipt-print-area, #receipt-print-area * {
              visibility: visible;
            }
            #receipt-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 10px;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        ` }} />
      </div>
    </div>
  );
}
