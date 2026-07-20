import React, { useState } from 'react';
import { Shield, Star, Gauge, TrendingUp, ChevronDown, Award, Info } from 'lucide-react';
import type { SupplierIntelligence } from '../types';
import { Badge } from './ui/Badge';
import { SupplierLogo } from './SupplierLogo';
import { cn } from '../lib/utils';

export function SupplierIntelligenceCard({
  supplier,
  intelligence,
  color,
  defaultOpen = false,
}: {
  supplier: string;
  intelligence: SupplierIntelligence;
  color?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  try {
    const score = intelligence.supplierScore;
    const scoreColor = score >= 80 ? 'text-success' : score >= 60 ? 'text-accent' : 'text-warning';
    const riskTone = intelligence.riskLevel === 'Low' ? 'success' : intelligence.riskLevel === 'Medium' ? 'warning' : 'danger';

    return (
      <div className="overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-slate-800/70 via-surface to-slate-950 shadow-card transition-all hover:border-white/15">
        <button
          onClick={() => { try { setOpen(v => !v); } catch { /* silent */ } }}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
          data-testid={`supplier-intel-toggle-${supplier}`}
        >
          <div className="flex items-center gap-3">
            <SupplierLogo name={supplier} color={color} size={32} />
            <div className="text-left">
              <div className="font-semibold text-ink">{supplier}</div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className={cn('font-bold', scoreColor)}>Score: {score}</span>
                <Badge tone={riskTone as any}>{intelligence.riskLevel} Risk</Badge>
                {intelligence.preferredSupplier && (
                  <Badge tone="accent"><Star size={9} className="fill-current" /> Preferred</Badge>
                )}
              </div>
            </div>
          </div>
          <ChevronDown size={16} className={cn('text-muted transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="border-t border-line px-4 py-4 animate-fade-up">
            <div className="mb-3 flex items-center gap-1.5 text-xs text-muted">
              <Info size={11} /> All metrics are <strong>Estimated (Demo Data)</strong>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Metric icon={<Award size={13} />} label="Supplier Score" value={`${score}/100`} valueClass={scoreColor} />
              <Metric icon={<Gauge size={13} />} label="Delivery Reliability" value={`${intelligence.deliveryReliability}%`} />
              <Metric icon={<TrendingUp size={13} />} label="On-Time Delivery" value={`${intelligence.onTimeDeliveryRate}%`} />
              <Metric icon={<Shield size={13} />} label="Risk Level" value={intelligence.riskLevel} valueClass={riskTone === 'success' ? 'text-success' : riskTone === 'warning' ? 'text-warning' : 'text-danger'} />
              <Metric label="Quality Consistency" value={intelligence.qualityConsistency} />
              <Metric label="Business Stability" value={intelligence.businessStability} />
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl border border-white/8 bg-slate-950/35 px-3 py-2">
              <span className="label-eyebrow">Intelligence Confidence</span>
              <span className="data-num text-sm font-bold text-ink">{intelligence.confidence}%</span>
            </div>

            {intelligence.preferredSupplier && (
              <div className="mt-2 flex items-center gap-1.5 rounded-md bg-accent-soft/30 px-3 py-2 text-xs text-accent">
                <Star size={12} className="fill-current" /> Preferred Supplier — consistently high performance across metrics
              </div>
            )}
          </div>
        )}
      </div>
    );
  } catch {
    return null;
  }
}

function Metric({ icon, label, value, valueClass }: { icon?: React.ReactNode; label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-bg/50 p-2.5">
      <div className="label-eyebrow flex items-center gap-1">{icon} {label}</div>
      <div className={cn('data-num mt-1 text-sm font-bold text-ink', valueClass)}>{value}</div>
    </div>
  );
}
