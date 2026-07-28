/**
 * LocationSelectionClient — Warehouse Signal (Mobile)
 * Halaman pilih lokasi opname fisik (Langkah 1 dari 3)
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LocationListItem, type LocationItemData } from '@/components/opname/LocationListItem';
import { ProgressCounter } from '@/components/opname/ProgressCounter';
import { InputField } from '@/components/ui/InputField';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

interface LocationSelectionClientProps {
  locations: LocationItemData[];
}

export default function LocationSelectionClient({ locations }: LocationSelectionClientProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.type.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLocation = locations.find((l) => l.id === selectedId);

  const handleContinue = async () => {
    if (!selectedId) return;
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/opname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId: selectedId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal memulai sesi opname.');
        setIsSubmitting(false);
        return;
      }

      // Navigate to scan page
      router.push(`/opname/${data.data.id}/scan`);
    } catch (err) {
      setError('Terjadi kesalahan koneksi.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - var(--topbar-height))',
        backgroundColor: 'var(--color-surface)',
        paddingBottom: '100px',
      }}
    >
      {/* Step Header */}
      <div
        style={{
          padding: 'var(--space-4) var(--space-margin-mobile)',
          backgroundColor: 'var(--color-card)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          position: 'sticky',
          top: 'var(--topbar-height)',
          zIndex: 20,
        }}
      >
        <ProgressCounter current={1} total={3} label="Pilih Lokasi" />

        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-brand)', margin: 0 }}>
            Pilih Area / Rak Gudang
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
            Pilih lokasi fisik tempat barang yang akan Anda hitung stoknya.
          </p>
        </div>

        {/* Search Bar */}
        <InputField
          placeholder="Cari nama lokasi atau tipe (mis. Rak A, Gudang)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          }
        />
      </div>

      {/* Location List Content */}
      <div style={{ padding: 'var(--space-margin-mobile)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {error && (
          <div
            role="alert"
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--color-critical-surface)',
              border: '1px solid var(--color-critical)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-critical-text)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {filteredLocations.length === 0 ? (
          <EmptyState
            title="Lokasi tidak ditemukan"
            description="Tidak ada lokasi fisik yang sesuai dengan kata kunci pencarian Anda."
          />
        ) : (
          filteredLocations.map((loc) => (
            <LocationListItem
              key={loc.id}
              location={loc}
              isSelected={loc.id === selectedId}
              onSelect={(item) => setSelectedId(item.id)}
            />
          ))
        )}
      </div>

      {/* Sticky Bottom Footer CTA */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--color-card)',
          borderTop: '1px solid var(--color-border)',
          padding: 'var(--space-4) var(--space-margin-mobile)',
          zIndex: 30,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
        }}
      >
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!selectedId || isSubmitting}
          loading={isSubmitting}
          onClick={handleContinue}
        >
          {selectedLocation ? `Lanjutkan (${selectedLocation.name}) →` : 'Pilih Lokasi untuk Lanjut'}
        </Button>
      </div>
    </div>
  );
}
