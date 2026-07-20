import React, { useState, useCallback } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { cn } from '../lib/utils';

export interface DateRange {
  from?: string; // YYYY-MM-DD
  to?: string;
}

const PRESETS: { label: string; value: () => DateRange }[] = [
  {
    label: 'All Time',
    value: () => ({}),
  },
  {
    label: 'Last 7 days',
    value: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 7);
      return { from: fmt(from), to: fmt(to) };
    },
  },
  {
    label: 'Last 30 days',
    value: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30);
      return { from: fmt(from), to: fmt(to) };
    },
  },
  {
    label: 'Last 90 days',
    value: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 90);
      return { from: fmt(from), to: fmt(to) };
    },
  },
  {
    label: 'This Month',
    value: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: fmt(from), to: fmt(now) };
    },
  },
  {
    label: 'Last Month',
    value: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: fmt(from), to: fmt(to) };
    },
  },
];

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: Props) {
  const [showCustom, setShowCustom] = useState(false);

  const activePreset = PRESETS.find((p) => {
    try {
      const pv = p.value();
      return pv.from === value.from && pv.to === value.to;
    } catch {
      return false;
    }
  });

  const handlePreset = useCallback(
    (preset: (typeof PRESETS)[number]) => {
      try {
        onChange(preset.value());
        setShowCustom(false);
      } catch {
        // silent
      }
    },
    [onChange],
  );

  const isAllTime = !value.from && !value.to;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CalendarDays size={15} className="text-muted" />

      {PRESETS.map((p) => {
        const pv = p.value();
        const active = pv.from === value.from && pv.to === value.to;
        return (
          <button
            key={p.label}
            onClick={() => handlePreset(p)}
            className={cn(
              'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
              active
                ? 'bg-accent text-white'
                : 'border border-line text-muted hover:border-ink/40 hover:text-ink',
            )}
          >
            {p.label}
          </button>
        );
      })}

      <button
        onClick={() => setShowCustom((v) => !v)}
        className={cn(
          'shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
          showCustom && !activePreset
            ? 'bg-accent text-white'
            : 'border border-line text-muted hover:border-ink/40 hover:text-ink',
        )}
      >
        Custom
      </button>

      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value.from || ''}
            onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
            className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink"
          />
          <span className="text-xs text-muted">to</span>
          <input
            type="date"
            value={value.to || ''}
            onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
            className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink"
          />
          {(value.from || value.to) && (
            <button
              onClick={() => { onChange({}); setShowCustom(false); }}
              className="rounded-md border border-line p-1.5 text-muted hover:text-danger"
              title="Clear"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {!isAllTime && !showCustom && (
        <span className="text-[11px] text-muted">
          {value.from} → {value.to}
        </span>
      )}
    </div>
  );
}
