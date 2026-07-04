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
  };
  onClose: () => void;
}

export default function ReceiptModal({ data, onClose }: ReceiptModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:max-w-none print:p-0">
        
        {/* Receipt Content */}
        <div className="p-8 print:p-0 font-mono text-sm text-slate-800">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-1">SmartStock POS</h2>
            <p className="text-xs text-slate-500">{data.locationName}</p>
            <p className="text-xs text-slate-500 mt-1">
              {data.date.toLocaleDateString('id-ID')} {data.date.toLocaleTimeString('id-ID')}
            </p>
          </div>

          <div className="text-xs text-slate-500 mb-4 border-b border-dashed border-slate-300 pb-2">
            Ref: {data.referenceId.split('-')[0].toUpperCase()}
          </div>

          <table className="w-full mb-4">
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-1">
                    <div>{item.name}</div>
                    <div className="text-xs text-slate-500">{item.quantity} x {item.price.toLocaleString('id-ID')}</div>
                  </td>
                  <td className="py-1 text-right align-bottom">
                    {(item.quantity * item.price).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed border-slate-300 pt-3 pb-6 flex justify-between font-bold text-base">
            <span>TOTAL</span>
            <span>Rp {data.total.toLocaleString('id-ID')}</span>
          </div>

          <div className="text-center text-xs text-slate-500">
            <p>Terima Kasih</p>
            <p className="mt-1">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
          </div>
        </div>

        {/* Actions (Not printed) */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex gap-3 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-white transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-500 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Cetak Struk
          </button>
        </div>
        
        {/* Style for print */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * { visibility: hidden; }
            .print\\:hidden { display: none !important; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:max-w-none { max-width: none !important; }
            .print\\:p-0 { padding: 0 !important; }
            .fixed { position: static !important; }
            .absolute { display: none !important; }
            .relative > div:first-child * { visibility: visible; }
            .relative > div:first-child { 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 100%; 
            }
          }
        ` }} />
      </div>
    </div>
  );
}
