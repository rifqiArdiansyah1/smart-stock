/**
 * InputField — Warehouse Signal
 *
 * State: default, focus (indigo border), error (merah border + error label), disabled
 * Support: text, number, password, email, search
 * Mobile: numeric keyboard otomatis untuk tipe number
 */

'use client';

import React, { useId } from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:       string;
  error?:       string;
  hint?:        string;
  leftIcon?:    React.ReactNode;
  rightElement?: React.ReactNode;
  fullWidth?:   boolean;
}

export function InputField({
  label,
  error,
  hint,
  leftIcon,
  rightElement,
  fullWidth = true,
  id,
  type = 'text',
  style,
  ...props
}: InputFieldProps) {
  const generatedId = useId();
  const inputId     = id ?? generatedId;
  const errorId     = `${inputId}-error`;
  const hintId      = `${inputId}-hint`;
  const hasError    = Boolean(error);

  const inputStyle: React.CSSProperties = {
    width:           fullWidth ? '100%' : undefined,
    height:          'var(--touch-target)',  /* 48px */
    padding:         leftIcon ? '0 0.75rem 0 2.5rem' : rightElement ? '0 2.5rem 0 0.75rem' : '0 0.75rem',
    fontFamily:      'var(--font-body)',
    fontSize:        'var(--text-sm)',
    color:           'var(--color-text-primary)',
    backgroundColor: props.disabled ? 'var(--color-surface-low)' : 'var(--color-card)',
    border:          `1.5px solid ${hasError ? 'var(--color-critical)' : 'var(--color-border)'}`,
    borderRadius:    'var(--radius-md)',
    outline:         'none',
    transition:      `border-color var(--duration-fast) var(--ease-out),
                      box-shadow var(--duration-fast) var(--ease-out)`,
    cursor:          props.disabled ? 'not-allowed' : 'text',
    ...style,
  };

  return (
    <div style={{ width: fullWidth ? '100%' : undefined, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontFamily:  'var(--font-body)',
            fontSize:    'var(--text-sm)',
            fontWeight:  500,
            color:       hasError ? 'var(--color-critical-text)' : 'var(--color-text-primary)',
            cursor:      'pointer',
          }}
        >
          {label}
          {props.required && (
            <span aria-hidden="true" style={{ color: 'var(--color-critical)', marginLeft: '0.25rem' }}>*</span>
          )}
        </label>
      )}

      {/* Input wrapper */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Left icon */}
        {leftIcon && (
          <span
            aria-hidden="true"
            style={{
              position:  'absolute',
              left:      '0.75rem',
              display:   'flex',
              color:     hasError ? 'var(--color-critical)' : 'var(--color-text-secondary)',
              pointerEvents: 'none',
            }}
          >
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          type={type}
          inputMode={type === 'number' ? 'numeric' : undefined}
          style={inputStyle}
          aria-invalid={hasError}
          aria-describedby={[hasError ? errorId : '', hint ? hintId : ''].filter(Boolean).join(' ') || undefined}
          onFocus={(e) => {
            e.target.style.borderColor = hasError ? 'var(--color-critical)' : 'var(--color-border-focus)';
            e.target.style.boxShadow   = hasError
              ? '0 0 0 3px var(--color-critical-surface)'
              : '0 0 0 3px rgba(7,22,57,0.1)';
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.target.style.borderColor = hasError ? 'var(--color-critical)' : 'var(--color-border)';
            e.target.style.boxShadow   = 'none';
            props.onBlur?.(e);
          }}
          {...props}
        />

        {/* Right element (icon, button) */}
        {rightElement && (
          <span
            style={{
              position: 'absolute',
              right:    '0.75rem',
              display:  'flex',
              color:    'var(--color-text-secondary)',
            }}
          >
            {rightElement}
          </span>
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <span
          id={errorId}
          role="alert"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize:   'var(--text-xs)',
            color:      'var(--color-critical-text)',
            display:    'flex',
            alignItems: 'center',
            gap:        '0.25rem',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1zm0 3a.75.75 0 0 1 .75.75v2a.75.75 0 0 1-1.5 0v-2A.75.75 0 0 1 6 4zm0 5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z"/>
          </svg>
          {error}
        </span>
      )}

      {/* Hint */}
      {hint && !hasError && (
        <span
          id={hintId}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize:   'var(--text-xs)',
            color:      'var(--color-text-secondary)',
          }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}

export default InputField;
