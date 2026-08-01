/**
 * KpiCard — Warehouse Signal
 * Card metrik KPI besar dengan font tipografi yang jelas, trend indicator, dan aksen warna
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
  // Mapping accent colors to Tailwind border and text classes
  const colorMap = {
    brand: { border: 'border-t-indigo-500', text: 'text-indigo-600 dark:text-indigo-400' },
    accent: { border: 'border-t-amber-500', text: 'text-amber-600 dark:text-amber-400' },
    critical: { border: 'border-t-red-500', text: 'text-red-600 dark:text-red-400' },
    ok: { border: 'border-t-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  };

  const selectedColor = colorMap[accentColor];

  return (
    <div
      className={`relative overflow-hidden bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 border-t-4 ${selectedColor.border} p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-slate-50 dark:hover:bg-slate-800`}
    >
      {/* Background Icon Watermark */}
      {icon && (
        <div
          aria-hidden="true"
          className="absolute top-4 right-4 text-slate-300 dark:text-slate-700 opacity-50 pointer-events-none transition-transform duration-500 group-hover:scale-110"
        >
          {icon}
        </div>
      )}

      {/* Label */}
      <p className="font-sans text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
        {title}
      </p>

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className={`font-mono text-3xl font-bold tracking-tight ${selectedColor.text}`}>
          {value}
        </span>
        {unit && (
          <span className="font-sans text-xs text-slate-500 dark:text-slate-400">
            {unit}
          </span>
        )}
      </div>

      {/* Trend Indicator */}
      {trend && (
        <div className="flex items-center gap-1 text-xs">
          <span
            className={`flex items-center font-medium px-2 py-0.5 rounded-full ${
              trend.isWarning
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                : trend.isPositive === false
                ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
            }`}
          >
            {trend.isPositive ? '↑' : trend.isPositive === false ? '↓' : '•'} {trend.value}
          </span>
        </div>
      )}
    </div>
  );
}

export default KpiCard;
