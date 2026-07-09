'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { get, set, del } from 'idb-keyval';
import BarcodeScanner from './BarcodeScanner';

interface OpnameWorkspaceProps {
  sessionData: any;
  systemStock: any[];
  userRole: string;
}

type DraftItem = {
  physicalQty: number | '';
  notes: string;
};

export default function OpnameWorkspace({ sessionData, systemStock, userRole }: OpnameWorkspaceProps) {
  const router = useRouter();
  const sessionId = sessionData.id;
  const isReadOnly = sessionData.status !== 'IN_PROGRESS';
  const isAdminOrOwner = userRole === 'ADMIN' || userRole === 'OWNER';
  const isPending = sessionData.status === 'PENDING_APPROVAL';
  const canReview = isAdminOrOwner && isPending;
  
  const [drafts, setDrafts] = useState<Record<string, DraftItem>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  
  // Offline-first states
  const [isOnline, setIsOnline] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  
  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  
  // Refs for scrolling to item
  const itemRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  // 1. Connection listener
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Load from IndexedDB on mount if IN_PROGRESS
  useEffect(() => {
    if (isReadOnly) {
      setIsLoaded(true);
      return;
    }

    const loadDrafts = async () => {
      try {
        const localData = await get(`opname_draft_${sessionId}`);
        if (localData) setDrafts(localData);
      } catch (e) {
        console.error('Failed to load drafts', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadDrafts();
  }, [sessionId, isReadOnly]);

  // 3. Auto-save to IndexedDB when drafts change
  useEffect(() => {
    if (isReadOnly || !isLoaded) return;
    const saveDrafts = async () => {
      setIsSaving(true);
      try {
        await set(`opname_draft_${sessionId}`, drafts);
      } catch (e) {
        console.error('Failed to save drafts', e);
      } finally {
        setTimeout(() => setIsSaving(false), 500);
      }
    };
    
    const timer = setTimeout(saveDrafts, 1000);
    return () => clearTimeout(timer);
  }, [drafts, sessionId, isReadOnly, isLoaded]);

  const handleInputChange = (productId: string, field: keyof DraftItem, value: any) => {
    if (isReadOnly) return;
    setDrafts(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || { physicalQty: '', notes: '' }),
        [field]: value
      }
    }));
  };

  const handleScanSuccess = (decodedText: string) => {
    setShowScanner(false);
    
    const matchedStock = systemStock.find(
      s => s.product.barcode === decodedText || s.product.sku === decodedText
    );

    if (matchedStock) {
      setSearch(decodedText);
      setTimeout(() => {
        const rowElement = itemRefs.current[matchedStock.product.id];
        if (rowElement) {
          rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          rowElement.classList.add('bg-primary-50');
          setTimeout(() => rowElement.classList.remove('bg-primary-50'), 2000);
          
          const inputEl = rowElement.querySelector('input[type="number"]') as HTMLInputElement;
          if (inputEl) inputEl.focus();
        }
      }, 300);
    } else {
      alert(`Produk dengan Barcode/SKU "${decodedText}" tidak ditemukan di lokasi ini.`);
    }
  };

  const handleSubmit = async () => {
    if (isReadOnly) return;
    
    if (!isOnline) {
      alert('Anda sedang offline. Data Anda aman tersimpan di perangkat (IndexedDB). Silakan tekan tombol submit lagi ketika koneksi internet sudah kembali.');
      return;
    }

    if (!confirm('Yakin ingin submit opname? Data tidak bisa diubah lagi setelah ini.')) return;
    
    setIsSubmitting(true);
    
    const itemsPayload = systemStock.map(stock => {
      const draft = drafts[stock.product.id];
      const physicalQty = draft && typeof draft.physicalQty === 'number' ? draft.physicalQty : stock.quantity;
      return {
        productId: stock.product.id,
        systemQty: stock.quantity,
        physicalQty,
        notes: draft?.notes || '',
      };
    });

    try {
      const res = await fetch(`/api/opname/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsPayload }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Gagal submit opname');
        setIsSubmitting(false);
        return;
      }

      await del(`opname_draft_${sessionId}`);
      router.refresh();
    } catch (e) {
      alert('Terjadi kesalahan jaringan');
      setIsSubmitting(false);
    }
  };

  const submitReview = async () => {
    if (!reviewAction) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/opname/${sessionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: reviewAction, notes: reviewNotes }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Gagal mereview opname');
        setIsSubmitting(false);
        return;
      }

      setShowReviewModal(false);
      router.refresh();
    } catch (e) {
      alert('Terjadi kesalahan jaringan');
      setIsSubmitting(false);
    }
  };

  const displayItems = useMemo(() => {
    const query = search.toLowerCase();
    
    if (isReadOnly) {
      return sessionData.items.map((item: any) => ({
        id: item.productId,
        name: item.product.name,
        sku: item.product.sku,
        barcode: item.product.barcode,
        unit: item.product.unit,
        systemQty: item.systemQty,
        physicalQty: item.physicalQty,
        difference: item.difference,
        notes: item.notes,
      })).filter((item: any) => 
        item.name.toLowerCase().includes(query) || 
        item.sku.toLowerCase().includes(query) ||
        (item.barcode && item.barcode.toLowerCase().includes(query))
      );
    } else {
      return systemStock.map((stock: any) => {
        const draft = drafts[stock.product.id];
        const pQty = draft?.physicalQty;
        const physicalQty = typeof pQty === 'number' ? pQty : '';
        const difference = typeof pQty === 'number' ? pQty - stock.quantity : 0;
        
        return {
          id: stock.product.id,
          name: stock.product.name,
          sku: stock.product.sku,
          barcode: stock.product.barcode,
          unit: stock.product.unit,
          systemQty: stock.quantity,
          physicalQty,
          difference,
          notes: draft?.notes || '',
        };
      }).filter((item: any) => 
        item.name.toLowerCase().includes(query) || 
        item.sku.toLowerCase().includes(query) ||
        (item.barcode && item.barcode.toLowerCase().includes(query))
      );
    }
  }, [isReadOnly, sessionData.items, systemStock, drafts, search]);

  if (!isLoaded) {
    return <div className="h-full flex items-center justify-center">Memuat data...</div>;
  }

  const countedItemsCount = Object.keys(drafts).filter(k => typeof drafts[k]?.physicalQty === 'number').length;
  const totalItemsCount = isReadOnly ? sessionData.items.length : systemStock.length;
  const hasDifferences = isReadOnly ? sessionData.items.some((i: any) => i.difference !== 0) : false;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {showScanner && (
        <BarcodeScanner 
          onScanSuccess={handleScanSuccess} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {reviewAction === 'APPROVE' ? 'Setujui Opname' : 'Tolak Opname'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {reviewAction === 'APPROVE' 
                ? 'Stok sistem akan otomatis disesuaikan dengan hasil hitung fisik staff.' 
                : 'Sesi opname ini akan dikembalikan ke staff tanpa mengubah stok.'}
            </p>
            
            <textarea
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              placeholder="Catatan untuk staff (opsional)..."
              className="w-full h-24 p-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm mb-5 resize-none"
            ></textarea>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium text-sm transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={submitReview}
                disabled={isSubmitting}
                className={`flex-1 py-2.5 text-white rounded-xl font-semibold text-sm transition-colors ${
                  reviewAction === 'APPROVE' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {isSubmitting ? 'Memproses...' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Review Banner */}
      {canReview && (
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="text-xl">👀</span> Menunggu Persetujuan Anda
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Terdapat selisih pada hasil hitung fisik yang membutuhkan persetujuan.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setReviewAction('REJECT'); setShowReviewModal(true); }}
              className="px-5 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-semibold text-sm transition-colors"
            >
              Tolak Hasil
            </button>
            <button 
              onClick={() => { setReviewAction('APPROVE'); setShowReviewModal(true); }}
              className="px-5 py-2 text-white bg-green-600 hover:bg-green-500 rounded-xl font-semibold text-sm transition-colors shadow-sm"
            >
              Setujui & Update Stok
            </button>
          </div>
        </div>
      )}

      {/* Review Notes Info Banner */}
      {sessionData.reviewNotes && (sessionData.status === 'APPROVED' || sessionData.status === 'REJECTED') && (
        <div className={`px-6 py-4 border-b shrink-0 flex items-start gap-3 ${
          sessionData.status === 'APPROVED' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span className="text-xl mt-0.5">💬</span>
          <div>
            <strong className="block text-sm mb-0.5">
              Catatan {sessionData.status === 'APPROVED' ? 'Persetujuan' : 'Penolakan'} dari {sessionData.approvedBy?.name || 'Sistem'}:
            </strong>
            <span className="text-sm opacity-90">{sessionData.reviewNotes}</span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
        
        {/* Left Side */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-lg">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari produk / SKU / Barcode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm"
            />
          </div>

          {!isReadOnly && (
            <button 
              onClick={() => setShowScanner(true)}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-2 text-sm font-semibold shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Scan Kamera
            </button>
          )}
        </div>
        
        {/* Right Side */}
        <div className="flex flex-wrap items-center gap-4 md:justify-end w-full md:w-auto">
          {!isReadOnly && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-500">
                Terhitung: <strong className="text-slate-800">{countedItemsCount}</strong> / {totalItemsCount}
              </span>
              <div className="w-px h-4 bg-slate-200 hidden md:block"></div>
              
              {/* Sync Indicator */}
              <span className="flex items-center gap-1.5 min-w-[120px]">
                {!isOnline ? (
                  <span className="text-red-500 flex items-center gap-1 text-xs font-semibold bg-red-50 px-2 py-1 rounded">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Offline
                  </span>
                ) : isSaving ? (
                  <span className="text-slate-500 flex items-center gap-1 text-xs"><div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /> Menyimpan...</span>
                ) : (
                  <span className="text-green-600 flex items-center gap-1 text-xs font-semibold bg-green-50 px-2 py-1 rounded">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span> Tersimpan Lokal
                  </span>
                )}
              </span>
            </div>
          )}

          {!isReadOnly && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm ${
                !isOnline 
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                  : 'bg-primary-600 text-white hover:bg-primary-500'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Opname'}
            </button>
          )}
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        {/* Offline Warning Banner */}
        {!isOnline && !isReadOnly && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
            <span className="text-lg">⚠️</span>
            <div>
              <strong className="block mb-0.5">Koneksi Internet Terputus (Mode Offline)</strong>
              Anda tetap dapat memindai barcode dan menginput stok. Data otomatis disimpan di perangkat Anda secara aman. 
              Sistem akan mengizinkan Anda mensubmit data saat koneksi kembali.
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="overflow-y-auto flex-1 relative">
            <table className="w-full text-sm text-left">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-600">Produk</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-right w-32">Stok Sistem</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-center w-40">Fisik (Hitung)</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-right w-32">Selisih</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 w-64">Catatan Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayItems.map((item: any) => (
                  <tr 
                    key={item.id} 
                    ref={el => { itemRefs.current[item.id] = el }}
                    className={`transition-colors ${
                      item.difference !== 0 && isReadOnly ? 'bg-amber-50/30' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{item.sku}</div>
                      {item.barcode && <div className="text-xs text-slate-400 font-mono">BC: {item.barcode}</div>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-slate-700">{item.systemQty}</span>
                      <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isReadOnly ? (
                        <div className="font-bold text-slate-800">
                          {item.physicalQty} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={item.physicalQty}
                            onChange={(e) => handleInputChange(item.id, 'physicalQty', e.target.value !== '' ? Number(e.target.value) : '')}
                            placeholder={String(item.systemQty)}
                            className="w-20 px-3 py-1.5 text-center font-semibold rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.physicalQty === '' ? (
                        <span className="text-slate-300">-</span>
                      ) : (
                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold ${
                          item.difference > 0 ? 'bg-green-100 text-green-700' :
                          item.difference < 0 ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {item.difference > 0 ? '+' : ''}{item.difference}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isReadOnly ? (
                        <span className="text-slate-600 text-xs">{item.notes || '-'}</span>
                      ) : (
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => handleInputChange(item.id, 'notes', e.target.value)}
                          placeholder="Catatan (opsional)"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                        />
                      )}
                    </td>
                  </tr>
                ))}

                {displayItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      Tidak ada produk yang sesuai pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
