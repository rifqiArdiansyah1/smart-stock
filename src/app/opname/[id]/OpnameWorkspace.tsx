'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { get, set, del } from 'idb-keyval';

interface OpnameWorkspaceProps {
  sessionData: any;
  systemStock: any[];
}

type DraftItem = {
  physicalQty: number | '';
  notes: string;
};

export default function OpnameWorkspace({ sessionData, systemStock }: OpnameWorkspaceProps) {
  const router = useRouter();
  const sessionId = sessionData.id;
  const isReadOnly = sessionData.status !== 'IN_PROGRESS';
  
  const [drafts, setDrafts] = useState<Record<string, DraftItem>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  // Load from IndexedDB on mount if IN_PROGRESS
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

  // Auto-save to IndexedDB when drafts change
  useEffect(() => {
    if (isReadOnly || !isLoaded) return;
    const saveDrafts = async () => {
      setIsSaving(true);
      try {
        await set(`opname_draft_${sessionId}`, drafts);
      } catch (e) {
        console.error('Failed to save drafts', e);
      } finally {
        setTimeout(() => setIsSaving(false), 500); // Visual cue
      }
    };
    
    // Simple debounce for auto-save
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

  const handleSubmit = async () => {
    if (isReadOnly || !confirm('Yakin ingin submit opname? Data tidak bisa diubah lagi setelah ini.')) return;
    
    setIsSubmitting(true);
    
    // Prepare items array
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

      // Clear local draft on success
      await del(`opname_draft_${sessionId}`);
      
      // Refresh page to show updated status
      router.refresh();
    } catch (e) {
      alert('Terjadi kesalahan jaringan');
      setIsSubmitting(false);
    }
  };

  // Prepare data for rendering
  const displayItems = useMemo(() => {
    if (isReadOnly) {
      // Show submitted items
      return sessionData.items.map((item: any) => ({
        id: item.productId,
        name: item.product.name,
        sku: item.product.sku,
        unit: item.product.unit,
        systemQty: item.systemQty,
        physicalQty: item.physicalQty,
        difference: item.difference,
        notes: item.notes,
      })).filter((item: any) => 
        item.name.toLowerCase().includes(search.toLowerCase()) || 
        item.sku.toLowerCase().includes(search.toLowerCase())
      );
    } else {
      // Show system stock + local drafts
      return systemStock.map((stock: any) => {
        const draft = drafts[stock.product.id];
        const pQty = draft?.physicalQty;
        const physicalQty = typeof pQty === 'number' ? pQty : '';
        const difference = typeof pQty === 'number' ? pQty - stock.quantity : 0;
        
        return {
          id: stock.product.id,
          name: stock.product.name,
          sku: stock.product.sku,
          unit: stock.product.unit,
          systemQty: stock.quantity,
          physicalQty,
          difference,
          notes: draft?.notes || '',
        };
      }).filter((item: any) => 
        item.name.toLowerCase().includes(search.toLowerCase()) || 
        item.sku.toLowerCase().includes(search.toLowerCase())
      );
    }
  }, [isReadOnly, sessionData.items, systemStock, drafts, search]);

  if (!isLoaded) {
    return <div className="h-full flex items-center justify-center">Memuat data...</div>;
  }

  const countedItemsCount = Object.keys(drafts).filter(k => typeof drafts[k]?.physicalQty === 'number').length;
  const totalItemsCount = isReadOnly ? sessionData.items.length : systemStock.length;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Toolbar */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama produk atau SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm"
          />
        </div>
        
        <div className="flex items-center gap-4">
          {!isReadOnly && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-500">
                Terhitung: <strong className="text-slate-800">{countedItemsCount}</strong> / {totalItemsCount}
              </span>
              <div className="w-px h-4 bg-slate-200"></div>
              <span className="text-slate-500 flex items-center gap-1.5 w-24">
                {isSaving ? (
                  <><div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /> Menyimpan...</>
                ) : (
                  <><span className="text-green-500">✓</span> Tersimpan</>
                )}
              </span>
            </div>
          )}

          {!isReadOnly && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-500 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Opname'}
            </button>
          )}
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="overflow-y-auto flex-1 relative">
            <table className="w-full text-sm text-left">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-600">Produk</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-right w-32">Stok Sistem</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-center w-40">Fisik (Hitung)</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-right w-32">Selisih</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 w-64">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{item.sku}</div>
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
