/**
 * Card — Warehouse Signal
 * Container dengan 1px border, 12px radius, dan optional hover state
 */

import React from 'react';

interface CardProps {
  children:     React.ReactNode;
  interactive?: boolean;
  padding?:     string;
  className?:   string;
  style?:       React.CSSProperties;
  onClick?:     () => void;
  as?:          'div' | 'article' | 'section' | 'li';
}

export function Card({
  children,
  interactive = false,
  padding     = 'var(--space-4)',
  className   = '',
  style,
  onClick,
  as: Tag     = 'div',
}: CardProps) {
  const baseStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-card)',
    border:          '1px solid var(--color-border)',
    borderRadius:    'var(--radius-lg)',
    padding,
    transition:      interactive
      ? `background-color var(--duration-fast) var(--ease-out),
         box-shadow var(--duration-fast) var(--ease-out),
         transform var(--duration-fast) var(--ease-out)`
      : undefined,
    cursor:          interactive ? 'pointer' : undefined,
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (!interactive) return;
    const el = e.currentTarget as HTMLElement;
    el.style.backgroundColor = 'var(--color-card-hover)';
    el.style.boxShadow       = 'var(--shadow-md)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (!interactive) return;
    const el = e.currentTarget as HTMLElement;
    el.style.backgroundColor = 'var(--color-card)';
    el.style.boxShadow       = 'none';
  };

  return (
    <Tag
      className={className}
      style={baseStyle}
      onClick={onClick}
      onMouseEnter={interactive ? handleMouseEnter : undefined}
      onMouseLeave={interactive ? handleMouseLeave : undefined}
      role={interactive && onClick ? 'button' : undefined}
      tabIndex={interactive && onClick ? 0 : undefined}
    >
      {children}
    </Tag>
  );
}

/** CardHeader — title + subtitle area */
export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title:     React.ReactNode;
  subtitle?: React.ReactNode;
  action?:   React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export default Card;
