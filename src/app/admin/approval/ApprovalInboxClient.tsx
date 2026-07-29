/**
 * ApprovalInboxClient — Warehouse Signal Redesign
 * Halaman Kotak Masuk Persetujuan (Approval Inbox)
 */

'use client';

import React, { useState, useMemo } from 'react';
import { ApprovalCard, type ApprovalSessionData } from '@/components/approval/ApprovalCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { InputField } from '@/components/ui/InputField';

interface ApprovalInboxClientProps {
  initialSessions: ApprovalSessionData[];
  locations: Array<{ id: string; name: string }>;
}

export default function ApprovalInboxClient({
  initialSessions,
  locations,
}: ApprovalInboxClientProps) {
  const [sessions] = useState<ApprovalSessionData[]>(initialSessions);
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const pendingCount = useMemo(
    () => sessions.filter((s) => s.status === 'PENDING_APPROVAL').length,
    [sessions]
  );

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchLocation = selectedLocation === 'ALL' || s.locationName === selectedLocation;
      const matchSearch =
        search === '' ||
        s.locationName.toLowerCase().includes(search.toLowerCase()) ||
        s.staffName.toLowerCase().includes(search.toLowerCase());
      return matchLocation && matchSearch;
    });
  }, [sessions, selectedLocation, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-brand)', margin: 0 }}>
              Menunggu Approval
            </h1>
            <Badge variant="critical" size="md">
              {pendingCount} Sesi Pending
            </Badge>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
            Tinjau dan setujui hasil perhitungan fisik opname dari staf gudang.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          backgroundColor: 'var(--color-card)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ flex: 1, minWidth: '240px' }}>
          <InputField
            placeholder="Cari lokasi atau nama staf..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            }
          />
        </div>

        {/* Location Dropdown Filter */}
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          style={{
            height: 'var(--touch-target)',
            padding: '0 var(--space-4)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-primary)',
            backgroundColor: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="ALL">Semua Lokasi</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.name}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Cards List */}
      {filteredSessions.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--color-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-8)',
          }}
        >
          <EmptyState
            title="Tidak Ada Sesi Menunggu Persetujuan 🎉"
            description="Semua sesi opname yang diajukan sudah ditinjau dan ditangani."
          />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {filteredSessions.map((session) => (
            <ApprovalCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
