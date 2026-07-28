'use client';

/**
 * PilihLokasiClient — Warehouse Signal (Mobile)
 * Referensi visual: pilih_lokasi_smartstock/screen.png
 *
 * Step 1 dari alur opname: pilih lokasi/rak/zona sebelum scan
 */

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

// ── Icons ─────────────────────────────────────────────────────────────────────
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const RackIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="3" width="20" height="4" rx="1"/><rect x="2" y="10" width="20" height="4" rx="1"/><rect x="2" y="17" width="20" height="4" rx="1"/>
    <line x1="6" y1="7" x2="6" y2="10"/><line x1="18" y1="7" x2="18" y2="10"/><line x1="6" y1="14" x2="6" y2="17"/><line x1="18" y1="14" x2="18" y2="17"/>
  </svg>
);

const ZoneIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M14 14h7v7h-7z"/><path d="M3 14h7v7H3z"/>
  </svg>
);

const LockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ animation: 'spin 0.75s linear infinite' }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5"/>
    <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────────
interface Location {
  id:     string;
  name:   string;
  type:   string;
  _count: { stockLevels: number };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getLocationIcon(type: string, isSelected: boolean) {
  const color = isSelected ? 'white' : 'var(--color-text-secondary)';
  const props = { color, style: { display: 'flex' } };

  if (type === 'ZONE') return <span style={{ color }}><ZoneIcon /></span>;
  return <span style={{ color }}><RackIcon /></span>;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PilihLokasiClient({ locations }: { locations: Location[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search,     setSearch]      = useState('');
  const [selected,   setSelected]    = useState<string | null>(null);

  const filtered = locations.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedLocation = locations.find((l) => l.id === selected);

  const handleLanjutkan = () => {
    if (!selected) return;
    startTransition(async () => {
      // Buat sesi opname baru via API
      const res = await fetch('/api/opname/sessions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ locationId: selected }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/opname/${data.id}`);
      }
    });
  };

  const padding = 'var(--space-margin-mobile)';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div style={{ backgroundColor: 'var(--color-card)', borderBottom: '1px solid var(--color-border)', padding: `var(--space-4) ${padding}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
          <button
            onClick={() => router.back()}
            aria-label="Kembali"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', padding: '4px', borderRadius: 'var(--radius-sm)' }}
          >
            <ArrowLeftIcon />
          </button>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-brand)', margin: 0 }}>
              Mulai Opname
            </h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
              Langkah 1 dari 2 — Pilih Lokasi
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: '4px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-full)', marginTop: 'var(--space-3)' }}>
          <div style={{ height: '100%', width: '33%', backgroundColor: 'var(--color-accent)', borderRadius: 'var(--radius-full)' }} />
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, padding, paddingBottom: 'calc(var(--bottomnav-height) + 72px + 16px)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 var(--space-2)' }}>
          Pilih Area Rak/Zona
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-4)' }}>
          Silakan pilih lokasi fisik yang akan Anda periksa stoknya saat ini.
        </p>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', display: 'flex', pointerEvents: 'none' }}>
            <SearchIcon />
          </span>
          <input
            type="search"
            placeholder="Cari lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari lokasi"
            style={{
              width:           '100%',
              height:          'var(--touch-target)',
              padding:         '0 0.75rem 0 2.5rem',
              fontFamily:      'var(--font-body)',
              fontSize:        'var(--text-sm)',
              color:           'var(--color-text-primary)',
              backgroundColor: 'var(--color-card)',
              border:          '1px solid var(--color-border)',
              borderRadius:    'var(--radius-lg)',
              outline:         'none',
            }}
          />
        </div>

        {/* Location List */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12) 0', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Tidak ada lokasi yang sesuai
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {filtered.map((loc) => {
              const isSelected = selected === loc.id;
              const isMaintenance = !loc._count; // placeholder check
              return (
                <button
                  key={loc.id}
                  id={`loc-${loc.id}`}
                  onClick={() => setSelected(isSelected ? null : loc.id)}
                  aria-pressed={isSelected}
                  aria-label={`${loc.name}, ${loc._count.stockLevels} item`}
                  style={{
                    display:         'flex',
                    alignItems:      'center',
                    gap:             'var(--space-3)',
                    width:           '100%',
                    minHeight:       'var(--touch-target-lg)',  /* 64px */
                    padding:         'var(--space-3) var(--space-4)',
                    backgroundColor: isSelected ? 'var(--color-brand)' : 'var(--color-card)',
                    border:          `1.5px solid ${isSelected ? 'var(--color-brand)' : 'var(--color-border)'}`,
                    borderRadius:    'var(--radius-lg)',
                    cursor:          'pointer',
                    textAlign:       'left',
                    transition:      'background-color var(--duration-fast), border-color var(--duration-fast)',
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width:           '44px',
                      height:          '44px',
                      borderRadius:    'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--color-brand-container)' : 'var(--color-surface-low)',
                      display:         'flex',
                      alignItems:      'center',
                      justifyContent:  'center',
                      flexShrink:      0,
                    }}
                    aria-hidden="true"
                  >
                    {getLocationIcon(loc.type, isSelected)}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: 'var(--font-display)',
                      fontSize:   'var(--text-base)',
                      fontWeight: 700,
                      color:      isSelected ? 'white' : 'var(--color-text-primary)',
                      margin:     '0 0 2px',
                    }}>
                      {loc.name}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--color-text-secondary)', margin: 0 }}>
                      {loc.type === 'ZONE' ? 'Area/Zona' : 'Rak Penyimpanan'}
                    </p>
                  </div>

                  {/* Item count / status */}
                  <span style={{
                    fontFamily:      'var(--font-mono)',
                    fontSize:        'var(--text-sm)',
                    fontWeight:      500,
                    color:           isSelected ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    backgroundColor: isSelected ? 'rgba(254,166,25,0.15)' : 'var(--color-surface-low)',
                    padding:         '3px 10px',
                    borderRadius:    'var(--radius-full)',
                    flexShrink:      0,
                  }}>
                    {loc._count.stockLevels} item
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Info hint */}
        <div style={{
          display:         'flex',
          alignItems:      'flex-start',
          gap:             'var(--space-2)',
          padding:         'var(--space-3)',
          marginTop:       'var(--space-4)',
          backgroundColor: 'var(--color-surface-low)',
          borderRadius:    'var(--radius-md)',
          fontFamily:      'var(--font-body)',
          fontSize:        'var(--text-xs)',
          color:           'var(--color-text-secondary)',
        }}>
          <InfoIcon />
          <span>Pastikan lokasi yang dipilih sesuai dengan posisi fisik Anda saat ini untuk akurasi data.</span>
        </div>
      </div>

      {/* ── Sticky Bottom CTA ── */}
      <div style={{
        position:        'fixed',
        bottom:          'calc(var(--bottomnav-height) + env(safe-area-inset-bottom))',
        left:            0,
        right:           0,
        padding:         `var(--space-3) ${padding}`,
        backgroundColor: 'var(--color-card)',
        borderTop:       '1px solid var(--color-border)',
        zIndex:          20,
      }}>
        <button
          onClick={handleLanjutkan}
          disabled={!selected || isPending}
          aria-label="Lanjutkan ke scan produk"
          style={{
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            gap:             'var(--space-2)',
            width:           '100%',
            height:          'var(--touch-target-lg)',
            backgroundColor: !selected ? 'var(--color-border)' : 'var(--color-accent)',
            color:           !selected ? 'var(--color-text-disabled)' : 'var(--color-text-on-accent)',
            border:          'none',
            borderRadius:    'var(--radius-xl)',
            fontFamily:      'var(--font-display)',
            fontSize:        'var(--text-lg)',
            fontWeight:      700,
            cursor:          !selected ? 'not-allowed' : 'pointer',
            transition:      'background-color var(--duration-fast)',
          }}
        >
          {isPending ? <><SpinnerIcon /><span>Membuat sesi...</span></> : <><span>Lanjutkan</span><ArrowRightIcon /></>}
        </button>
      </div>
    </div>
  );
}
