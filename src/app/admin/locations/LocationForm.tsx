'use client';

import { useActionState, useEffect } from 'react';
import { createLocation, updateLocation } from './actions';

type Location = {
  id: string;
  name: string;
  type: string;
  description?: string | null;
};

interface LocationFormProps {
  location?: Location;
  onClose: () => void;
}

const LOCATION_TYPES = [
  { value: 'GUDANG', label: '🏭 Gudang', desc: 'Gudang utama penyimpanan barang' },
  { value: 'RAK', label: '📦 Rak', desc: 'Rak penyimpanan di dalam gudang' },
  { value: 'AREA', label: '📍 Area', desc: 'Zona atau area tertentu' },
  { value: 'TOKO', label: '🏪 Toko', desc: 'Area penjualan / display toko' },
];

export default function LocationForm({ location, onClose }: LocationFormProps) {
  const isEdit = !!location;
  const action = isEdit ? updateLocation : createLocation;
  const [state, formAction, isPending] = useActionState(action, undefined);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state?.success, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {isEdit ? 'Edit Lokasi' : 'Tambah Lokasi Baru'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {isEdit ? `Mengedit: ${location.name}` : 'Definisikan lokasi penyimpanan baru.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form action={formAction} className="px-6 py-5 space-y-4">
          {isEdit && <input type="hidden" name="id" value={location.id} />}

          {/* Nama */}
          <div>
            <label htmlFor="loc-name" className="block text-sm font-medium text-slate-700 mb-1.5">
              Nama Lokasi <span className="text-red-500">*</span>
            </label>
            <input
              id="loc-name"
              name="name"
              type="text"
              required
              defaultValue={location?.name}
              placeholder="cth: Gudang A, Rak B-01, Area Dingin"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
            />
          </div>

          {/* Tipe */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipe Lokasi <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LOCATION_TYPES.map(({ value, label, desc }) => (
                <label
                  key={value}
                  className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-primary-300 hover:bg-primary-50/50 transition-all has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 has-[:checked]:ring-2 has-[:checked]:ring-primary-500/20"
                >
                  <input
                    type="radio"
                    name="type"
                    value={value}
                    defaultChecked={location ? location.type === value : value === 'GUDANG'}
                    required
                    className="mt-0.5 accent-primary-600"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-700">{label}</div>
                    <div className="text-xs text-slate-400">{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label htmlFor="loc-desc" className="block text-sm font-medium text-slate-700 mb-1.5">
              Deskripsi <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <textarea
              id="loc-desc"
              name="description"
              rows={2}
              defaultValue={location?.description ?? ''}
              placeholder="cth: Gudang utama di lantai 1, kapasitas 500 karton"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm resize-none"
            />
          </div>

          {/* Error */}
          {state?.error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {state.error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold disabled:opacity-60 transition-all shadow-sm"
            >
              {isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Lokasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
