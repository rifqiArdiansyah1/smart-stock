/**
 * ScanViewfinder — Warehouse Signal
 * Viewfinder pemindai barcode / QR code kamera simulasi dengan border amber & laser line
 */

'use client';

import React from 'react';

interface ScanViewfinderProps {
  onManualInputClick?: () => void;
  onSimulateScan?: (barcode: string) => void;
  isScanning?: boolean;
}

export function ScanViewfinder({
  onManualInputClick,
  onSimulateScan,
  isScanning = true,
}: ScanViewfinderProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '240px',
        backgroundColor: '#071639',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Background Grid Pattern */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Target Viewfinder Frame (Amber Box) */}
      <div
        style={{
          position: 'relative',
          width: '200px',
          height: '140px',
          border: '2px dashed var(--color-accent)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(254, 166, 25, 0.25)',
        }}
      >
        {/* Laser Line Animation */}
        {isScanning && (
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: 'var(--color-critical)',
              boxShadow: '0 0 8px var(--color-critical)',
              animation: 'laserScan 2s infinite ease-in-out',
            }}
          />
        )}

        <style>{`
          @keyframes laserScan {
            0%, 100% { top: 10%; }
            50% { top: 90%; }
          }
        `}</style>

        {/* Center Target Icon */}
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(254,166,25,0.7)" strokeWidth="1.5">
          <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
          <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
        </svg>
      </div>

      <p
        style={{
          marginTop: 'var(--space-3)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-brand-text)',
          zIndex: 5,
        }}
      >
        Arahkan barcode / QR ke dalam kotak
      </p>

      {/* Manual Input Trigger */}
      {onManualInputClick && (
        <button
          type="button"
          onClick={onManualInputClick}
          style={{
            marginTop: 'var(--space-2)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            cursor: 'pointer',
            zIndex: 5,
            transition: 'background-color var(--duration-fast)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; }}
        >
          ⌨️ Input Manual
        </button>
      )}
    </div>
  );
}

export default ScanViewfinder;
