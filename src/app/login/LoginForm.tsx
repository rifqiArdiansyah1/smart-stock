'use client';

import { useActionState, useState } from 'react';
import { authenticate } from './actions';

// ── Icons ─────────────────────────────────────────────────────────────────────
const EmailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const EyeIcon = ({ show }: { show: boolean }) => show ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ animation: 'spin 0.75s linear infinite' }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5"/>
    <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

// ── Input styles ──────────────────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
  width:           '100%',
  height:          'var(--touch-target)',   /* 48px */
  padding:         '0 0.75rem 0 2.75rem',
  fontFamily:      'var(--font-body)',
  fontSize:        'var(--text-base)',
  color:           'var(--color-text-primary)',
  backgroundColor: 'var(--color-surface)',
  border:          '1px solid var(--color-border)',
  borderRadius:    'var(--radius-lg)',
  outline:         'none',
  transition:      'border-color 150ms ease, box-shadow 150ms ease',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocus, setEmailFocus]     = useState(false);
  const [passFocus,  setPassFocus]      = useState(false);

  return (
    <form action={formAction}>
      {/* ── Email ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <label
          htmlFor="email"
          style={{
            display:    'block',
            fontFamily: 'var(--font-mono)',
            fontSize:   'var(--text-sm)',
            fontWeight: 500,
            color:      'var(--color-text-secondary)',
            marginBottom: 'var(--space-2)',
          }}
        >
          Email Operator
        </label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', display: 'flex', pointerEvents: 'none' }}>
            <EmailIcon />
          </span>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="operator@warehouse.com"
            required
            autoComplete="email"
            aria-required="true"
            aria-label="Masukkan Email Operator"
            style={{
              ...inputBase,
              borderColor: emailFocus ? 'var(--color-brand)' : 'var(--color-border)',
              boxShadow:   emailFocus ? '0 0 0 3px rgba(7,22,57,0.1)' : 'none',
            }}
            onFocus={() => setEmailFocus(true)}
            onBlur={() => setEmailFocus(false)}
          />
        </div>
      </div>

      {/* ── Password ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <label
          htmlFor="password"
          style={{
            display:    'block',
            fontFamily: 'var(--font-mono)',
            fontSize:   'var(--text-sm)',
            fontWeight: 500,
            color:      'var(--color-text-secondary)',
            marginBottom: 'var(--space-2)',
          }}
        >
          Kata Sandi
        </label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', display: 'flex', pointerEvents: 'none' }}>
            <LockIcon />
          </span>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            aria-required="true"
            aria-label="Masukkan Kata Sandi"
            style={{
              ...inputBase,
              padding:     '0 2.75rem',
              borderColor: passFocus ? 'var(--color-brand)' : 'var(--color-border)',
              boxShadow:   passFocus ? '0 0 0 3px rgba(7,22,57,0.1)' : 'none',
            }}
            onFocus={() => setPassFocus(true)}
            onBlur={() => setPassFocus(false)}
          />
          {/* Toggle visibility */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            style={{
              position:  'absolute',
              right:     '0.75rem',
              top:       '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border:    'none',
              cursor:    'pointer',
              color:     'var(--color-text-secondary)',
              display:   'flex',
              padding:   '4px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <EyeIcon show={showPassword} />
          </button>
        </div>
      </div>

      {/* ── Error Message ── */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            display:         'flex',
            alignItems:      'flex-start',
            gap:             'var(--space-2)',
            padding:         'var(--space-3)',
            marginBottom:    'var(--space-4)',
            backgroundColor: 'var(--color-critical-surface)',
            border:          '1px solid var(--color-critical)',
            borderRadius:    'var(--radius-md)',
            color:           'var(--color-critical-text)',
            fontFamily:      'var(--font-body)',
            fontSize:        'var(--text-sm)',
            animation:       'ws-slide-up var(--duration-slow) var(--ease-out)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: '1px' }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── CTA Button ── */}
      <button
        type="submit"
        id="btn-login"
        disabled={isPending}
        aria-busy={isPending}
        aria-label="Tombol Masuk"
        style={{
          width:           '100%',
          height:          'var(--touch-target)',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          gap:             'var(--space-2)',
          backgroundColor: isPending ? 'var(--color-accent-hover)' : 'var(--color-accent)',
          color:           'var(--color-text-on-accent)',
          border:          'none',
          borderRadius:    'var(--radius-lg)',
          fontFamily:      'var(--font-display)',
          fontSize:        'var(--text-lg)',
          fontWeight:      700,
          cursor:          isPending ? 'not-allowed' : 'pointer',
          opacity:         isPending ? 0.8 : 1,
          transition:      'background-color 150ms ease, transform 150ms ease',
          boxShadow:       '0 2px 8px rgba(254,166,25,0.35)',
        }}
        onMouseEnter={(e) => { if (!isPending) e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'; }}
        onMouseLeave={(e) => { if (!isPending) e.currentTarget.style.backgroundColor = 'var(--color-accent)'; }}
        onMouseDown={(e) => { if (!isPending) e.currentTarget.style.transform = 'scale(0.98)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = ''; }}
      >
        {isPending ? (
          <>
            <SpinnerIcon />
            <span>Memverifikasi...</span>
          </>
        ) : (
          <>
            <span>Masuk</span>
            <ArrowIcon />
          </>
        )}
      </button>
    </form>
  );
}
