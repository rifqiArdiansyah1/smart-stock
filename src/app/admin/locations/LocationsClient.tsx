'use client';

import { useState, useTransition } from 'react';
import { toggleLocationStatus } from './actions';
import LocationForm from './LocationForm';

type Location = {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { stockLevels: number; opnameSessions: number };
};

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  GUDANG: { label: 'Gudang', icon: '🏭', color: 'bg-blue-50 text-blue-700 ring-blue-200' },
  RAK: { label: 'Rak', icon: '📦', color: 'bg-amber-50 text-amber-700 ring-amber-200' },
  AREA: { label: 'Area', icon: '📍', color: 'bg-purple-50 text-purple-700 ring-purple-200' },
  TOKO: { label: 'Toko', icon: '🏪', color: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
};

interface LocationsClientProps {
  initialLocations: Location[];
  canManage: boolean;
}

export default function LocationsClient({ initialLocations, canManage }: LocationsClientProps) {
  const [formLocation, setFormLocation] = useState<Location | null | 'new'>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleToggle = (loc: Location) => {
    setSelectedId(loc.id);
    startTransition(async () => {
      await toggleLocationStatus(loc.id, loc.isActive);
      setSelectedId(null);
    });
  };

  const grouped = Object.keys(TYPE_CONFIG).reduce(
    (acc, type) => {
      acc[type] = initialLocations.filter((l) => l.type === type);
      return acc;
    },
    {} as Record<string, Location[]>,
  );

  return (
    <>
      {/* Toolbar */}
      <div className="flex justify-end">
        {canManage && (
          <button
            onClick={() => setFormLocation('new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-primary-500/20 transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Lokasi
          </button>
        )}
      </div>

      {/* Location Groups */}
      <div className="space-y-6">
        {Object.entries(TYPE_CONFIG).map(([type, config]) => {
          const locs = grouped[type] ?? [];
          if (locs.length === 0) return null;

          return (
            <div key={type}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{config.icon}</span>
                <h2 className="text-base font-semibold text-slate-700">{config.label}</h2>
                <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                  {locs.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {locs.map((loc) => (
                  <div
                    key={loc.id}
                    className={`bg-white rounded-2xl border shadow-sm p-5 transition-all duration-200 ${
                      !loc.isActive
                        ? 'opacity-50 border-slate-200'
                        : 'border-slate-200/80 hover:shadow-md hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-lg">
                          {config.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800 text-sm">{loc.name}</h3>
                          <span className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded-md ring-1 ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ring-1 ${
                        loc.isActive
                          ? 'bg-green-50 text-green-700 ring-green-200'
                          : 'bg-slate-100 text-slate-500 ring-slate-200'
                      }`}>
                        {loc.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>

                    {/* Deskripsi */}
                    {loc.description && (
                      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{loc.description}</p>
                    )}

                    {/* Stats */}
                    <div className="flex gap-3 mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span><strong className="text-slate-700">{loc._count.stockLevels}</strong> produk</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span><strong className="text-slate-700">{loc._count.opnameSessions}</strong> opname</span>
                      </div>
                    </div>

                    {/* Actions */}
                    {canManage && (
                      <div className="flex gap-2 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => setFormLocation(loc)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-200 hover:border-blue-200"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggle(loc)}
                          disabled={isPending && selectedId === loc.id}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors border disabled:opacity-50 ${
                            loc.isActive
                              ? 'text-red-500 hover:bg-red-50 border-slate-200 hover:border-red-200'
                              : 'text-green-600 hover:bg-green-50 border-slate-200 hover:border-green-200'
                          }`}
                        >
                          {isPending && selectedId === loc.id ? '...' : loc.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {initialLocations.length === 0 && (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <p className="text-4xl mb-3">🏭</p>
          <p className="font-medium text-slate-600">Belum ada lokasi</p>
          <p className="text-sm mt-1">Tambahkan lokasi pertama untuk mulai mengelola inventaris.</p>
        </div>
      )}

      {/* Form Modal */}
      {formLocation !== null && (
        <LocationForm
          location={formLocation === 'new' ? undefined : formLocation}
          onClose={() => setFormLocation(null)}
        />
      )}
    </>
  );
}
