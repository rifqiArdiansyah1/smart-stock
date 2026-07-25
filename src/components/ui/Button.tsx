/**
 * Button — Warehouse Signal
 *
 * Varian: primary (amber CTA), secondary (outline), ghost, danger
 * Semua state: default, hover, active, disabled, loading
 * Touch target minimum 48px (sesuai spec WCAG + design system)
 */

'use client';

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant;
  size?:      ButtonSize;
  loading?:   boolean;
  leftIcon?:  React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties & { '--hover-bg'?: string }> = {
  primary: {
    backgroundColor: 'var(--color-accent)',
    color:           'var(--color-text-on-accent)',
    border:          '1.5px solid var(--color-accent)',
  },
  secondary: {
    backgroundColor: 'var(--color-card)',
    color:           'var(--color-brand)',
    border:          '1.5px solid var(--color-brand)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color:           'var(--color-text-secondary)',
    border:          '1.5px solid transparent',
  },
  danger: {
    backgroundColor: 'var(--color-critical)',
    color:           '#FFFFFF',
    border:          '1.5px solid var(--color-critical)',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { height: '2rem',    padding: '0 0.75rem', fontSize: 'var(--text-sm)',  gap: '0.375rem' },
  md: { height: '3rem',    padding: '0 1.25rem', fontSize: 'var(--text-sm)',  gap: '0.5rem'   },
  lg: { height: '3.5rem',  padding: '0 1.5rem',  fontSize: 'var(--text-base)', gap: '0.5rem'  },
};

const LoadingSpinnerSVG = () => (
  <svg
    width="16" height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    style={{ animation: 'spin 0.8s linear infinite' }}
  >
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2"/>
    <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export function Button({
  variant    = 'primary',
  size       = 'md',
  loading    = false,
  leftIcon,
  rightIcon,
  fullWidth  = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const baseStyle: React.CSSProperties = {
    display:        'inline-flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontFamily:     'var(--font-body)',
    fontWeight:     500,
    borderRadius:   'var(--radius-md)',
    cursor:         isDisabled ? 'not-allowed' : 'pointer',
    opacity:        isDisabled ? 0.5 : 1,
    transition:     `background-color var(--duration-fast) var(--ease-out),
                     transform var(--duration-fast) var(--ease-out),
                     opacity var(--duration-fast)`,
    outline:        'none',
    whiteSpace:     'nowrap',
    userSelect:     'none',
    width:          fullWidth ? '100%' : undefined,
    minWidth:       '3rem',
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return;
    const el = e.currentTarget;
    if (variant === 'primary') el.style.backgroundColor = 'var(--color-accent-hover)';
    if (variant === 'secondary') el.style.backgroundColor = 'var(--color-surface-low)';
    if (variant === 'ghost') el.style.backgroundColor = 'var(--color-surface-low)';
    if (variant === 'danger') el.style.filter = 'brightness(0.9)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    el.style.backgroundColor = variantStyles[variant].backgroundColor as string;
    el.style.filter = '';
    el.style.transform = '';
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return;
    e.currentTarget.style.transform = 'scale(0.98)';
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = '';
  };

  return (
    <button
      style={baseStyle}
      disabled={isDisabled}
      aria-busy={loading}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    >
      {loading ? (
        <LoadingSpinnerSVG />
      ) : leftIcon ? (
        <span aria-hidden="true" style={{ display: 'flex', flexShrink: 0 }}>{leftIcon}</span>
      ) : null}
      {children && (
        <span style={{ flex: loading && !children ? '0' : undefined }}>{children}</span>
      )}
      {!loading && rightIcon && (
        <span aria-hidden="true" style={{ display: 'flex', flexShrink: 0 }}>{rightIcon}</span>
      )}
    </button>
  );
}

export default Button;
