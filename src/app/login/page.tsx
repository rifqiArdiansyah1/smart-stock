/**
 * LoginPage — Warehouse Signal
 *
 * Layout: Full-screen indigo background + white card center
 * Referensi: stitch_web_application_ui_ux_design/login_smartstock/screen.png
 */

import { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Masuk',
  description: 'Masuk ke SmartStock — Sistem Manajemen Inventaris',
};

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight:       '100vh',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        backgroundColor: 'var(--color-brand)',  /* Indigo #071639 */
        padding:         'var(--space-margin-mobile)',
        position:        'relative',
        overflow:        'hidden',
      }}
    >
      {/* Subtle grid texture overlay */}
      <div
        aria-hidden="true"
        style={{
          position:   'absolute',
          inset:      0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          pointerEvents:  'none',
        }}
      />

      {/* Ambient glow top-right */}
      <div
        aria-hidden="true"
        style={{
          position:        'absolute',
          top:             '-10%',
          right:           '-10%',
          width:           '500px',
          height:          '500px',
          borderRadius:    '50%',
          background:      'radial-gradient(circle, rgba(254,166,25,0.12) 0%, transparent 70%)',
          pointerEvents:   'none',
        }}
      />

      {/* Login Card */}
      <div
        style={{
          width:           '100%',
          maxWidth:        '440px',
          backgroundColor: 'var(--color-card)',
          border:          '1px solid var(--color-border)',
          borderRadius:    'var(--radius-xl)',
          padding:         'var(--space-8)',
          boxShadow:       '0 8px 40px rgba(0,0,0,0.25)',
          position:        'relative',
          zIndex:          10,
          animation:       'ws-scale-in var(--duration-normal) var(--ease-out)',
        }}
      >
        {/* Logo + Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--space-8)', textAlign: 'center' }}>
          {/* App icon */}
          <div
            style={{
              width:           '64px',
              height:          '64px',
              borderRadius:    'var(--radius-lg)',
              backgroundColor: 'var(--color-brand)',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              marginBottom:    'var(--space-4)',
              boxShadow:       '0 4px 16px rgba(7,22,57,0.3)',
            }}
            aria-hidden="true"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-brand)', margin: '0 0 var(--space-1)' }}>
            SmartStock
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Akses Sistem Manajemen Gudang
          </p>
        </div>

        {/* Form */}
        <LoginForm />

        {/* Security footer */}
        <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
          <p style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Koneksi Terenkripsi &amp; Aman
          </p>
        </div>
      </div>
    </main>
  );
}
