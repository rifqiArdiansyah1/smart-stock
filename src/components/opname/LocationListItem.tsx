/**
 * LocationListItem — Warehouse Signal
 * Item pilihan lokasi opname dengan tap-target besar (min 64px height)
 */

'use client';

import React from 'react';

export interface LocationItemData {
  id: string;
  name: string;
  type: string;
  description?: string;
  itemCount?: number;
  isDisabled?: boolean;
  disabledReason?: string;
}

interface LocationListItemProps {
  location: LocationItemData;
  isSelected?: boolean;
  onSelect: (location: LocationItemData) => void;
}

export function LocationListItem({
  location,
  isSelected = false,
  onSelect,
}: LocationListItemProps) {
  const { id, name, type, description, itemCount = 0, isDisabled = false, disabledReason } = location;

  const getIcon = () => {
    if (isDisabled) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      );
    }
    if (type.toLowerCase().includes('zona') || type.toLowerCase().includes('area')) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
        </svg>
      );
    }
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="5" rx="1"/><path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9"/><line x1="10" y1="14" x2="14" y2="14"/>
      </svg>
    );
  };

  return (
    <div
      role="radio"
      aria-checked={isSelected}
      aria-disabled={isDisabled}
      tabIndex={isDisabled ? -1 : 0}
      onClick={() => {
        if (!isDisabled) onSelect(location);
      }}
      onKeyDown={(e) => {
        if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect(location);
        }
      }}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        minHeight: '64px',
        padding: 'var(--space-4)',
        backgroundColor: 'var(--color-card)',
        border: isSelected ? '2px solid var(--color-brand)' : '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'all var(--duration-fast) var(--ease-out)',
        outline: 'none',
        userSelect: 'none',
      }}
    >
      {/* Icon Box */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: isSelected
            ? 'var(--color-brand-container)'
            : 'var(--color-surface-low)',
          color: isSelected ? 'var(--color-accent)' : 'var(--color-brand)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 'var(--space-4)',
          flexShrink: 0,
          transition: 'all var(--duration-fast)',
        }}
      >
        {getIcon()}
      </div>

      {/* Info Container */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-base)',
              fontWeight: 700,
              color: isSelected ? 'var(--color-brand)' : 'var(--color-text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </span>
          {isDisabled ? (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                backgroundColor: 'var(--color-critical-surface)',
                color: 'var(--color-critical-text)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {disabledReason || 'Terkunci'}
            </span>
          ) : (
            itemCount > 0 && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  backgroundColor: 'var(--color-surface-low)',
                  color: 'var(--color-text-secondary)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {itemCount} item
              </span>
            )
          )}
        </div>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-secondary)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {description || `Tipe: ${type}`}
        </p>
      </div>

      {/* Chevron indicator */}
      <div style={{ marginLeft: 'var(--space-2)', color: isSelected ? 'var(--color-brand)' : 'var(--color-text-disabled)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>
  );
}

export default LocationListItem;
