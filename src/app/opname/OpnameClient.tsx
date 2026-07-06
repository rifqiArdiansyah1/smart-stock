'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OpnameClient({ initialOpnames, locations }: { initialOpnames: any[], locations: any[] }) {
  const [opnames, setOpnames] = useState(initialOpnames);
  const [showModal, setShowModal] = useState(false);
  const [locationId, setLocationId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) return;
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/opname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Gagal memulai sesi.');
        setIsSubmitting(false);
        return;
      }

      router.push(`/opname/${data.data.id}`);
    } catch (err) {
      setError('Terjadi kesalahan jaringan.');
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">⏳ Sedang Berjalan</span>;
      case 'PENDING_APPROVAL': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">👀 Menunggu Review</span>;
      case 'APPROVED': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">✅ Disetujui</span>;
      case 'REJECTED': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">❌ Ditolak</span>;
      default: return null;
    }
  };

  return (
    <>
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="font-semibold text-slate-800">Daftar Sesi Opname</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-500 transition-colors shadow-sm"
        >
          + Mulai Sesi Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {opnames.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium text-slate-600">Belum ada sesi opname.</p>
          </div>
        ) : (
          opnames.map(op => (
            <div key={op.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    {op.location.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Tipe: {op.location.type}</p>
                </div>
                {getStatusBadge(op.status)}
              </div>
              
              <div className="space-y-2 text-sm text-slate-600 mb-5">
                <div className="flex justify-between">
                  <span>Mulai:</span>
                  <span className="font-medium">{new Date(op.startedAt).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Oleh:</span>
                  <span className="font-medium">{op.startedBy.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Item dihitung:</span>
                  <span className="font-medium">{op._count.items}</span>
                </div>
              </div>
              
              <a 
                href={`/opname/${op.id}`}
                className="block w-full py-2.5 text-center bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-xl border border-slate-200 transition-colors text-sm"
              >
                {op.status === 'IN_PROGRESS' ? 'Lanjutkan Opname' : 'Lihat Detail'}
              </a>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Mulai Sesi Opname Baru</h3>
            <p className="text-sm text-slate-500 mb-5">Pilih lokasi yang akan dihitung fisiknya.</p>
            
            <form onSubmit={handleStartSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Lokasi Gudang / Rak / Area</label>
                <select
                  value={locationId}
                  onChange={e => setLocationId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm"
                  required
                >
                  <option value="" disabled>-- Pilih Lokasi --</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.type})</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium text-sm">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting || !locationId} className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-500 font-semibold text-sm disabled:opacity-50">
                  {isSubmitting ? 'Memproses...' : 'Mulai Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
