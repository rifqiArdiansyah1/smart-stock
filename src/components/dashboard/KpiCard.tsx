/**
 * KpiCard — Warehouse Signal
 * Card metrik KPI besar dengan font JetBrains Mono, trend indicator, dan aksen warna border
 */

import React from 'react';
import { Card } from '@/components/ui/Card';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isWarning?: boolean;
  };
  icon?: React.ReactNode;
  accentColor?: 'brand' | 'accent' | 'critical' | 'ok';
}

export function KpiCard({
  title,
  value,
  unit,
  trend,
  icon,
  accentColor = 'brand',
}: KpiCardProps) {
  const getBorderTopColor = () => {
    switch (accentColor) {
      case 'accent': return 'var(--color-accent)';
      case 'critical': return 'var(--color-critical)';
      case 'ok': return 'var(--color-ok)';
      case 'brand':
      default: return 'var(--color-brand)';
    }
  };

  return (
    <Card
      padding="var(--space-5)"
      style={{
        borderTop: `4px solid ${getBorderTopColor()}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Icon Watermark */}
      {icon && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 'var(--space-3)',
            right: 'var(--space-3)',
            color: 'var(--color-border)',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        >
          {icon}
        </div>
      )}

      {/* Label */}
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
          margin: '0 0 var(--space-2)',
        }}
      >
        {title}
      </p>

      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-3xl)',
            fontWeight: 700,
            color: accentColor === 'critical' ? 'var(--color-critical)' : 'var(--color-brand)',
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </span>
        {unit && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            {unit}
          </span>
        )}
      </div>

      {/* Trend Indicator */}
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              fontWeight: 500,
              color: trend.isWarning
                ? 'var(--color-warn-text)'
                : trend.isPositive === false
                ? 'var(--color-critical-text)'
                : 'var(--color-ok-text)',
            }}
          >
            {trend.isPositive ? '↑' : trend.isPositive === false ? '↓' : '•'} {trend.value}
          </span>
        </div>
      )}
    </Card>
  );
}

export default KpiCard;
