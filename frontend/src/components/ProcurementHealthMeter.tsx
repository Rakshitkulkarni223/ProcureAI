import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import type { HealthScore } from '../types';
import { cn } from '../lib/utils';

export function ProcurementHealthMeter({ health }: { health: HealthScore }) {
  try {
    if (!health) return null;

    const { score, status, statusBadge, factors } = health;
    const scoreColor = score >= 80 ? 'text-success' : score >= 65 ? 'text-emerald-600' : score >= 45 ? 'text-warning' : 'text-danger';
    const barColor = score >= 80 ? 'bg-success' : score >= 65 ? 'bg-emerald-500' : score >= 45 ? 'bg-warning' : 'bg-danger';

    const factorLabels: Record<string, string> = {
      costSavings: 'Cost Savings',
      supplierRisk: 'Supplier Risk',
      supplierDiversity: 'Supplier Diversity',
      deliveryPerformance: 'Delivery Performance',
      procurementEfficiency: 'Procurement Efficiency',
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        data-testid="procurement-health-meter"
        className="overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.10] via-surface to-slate-950 shadow-card"
      >
        <div className="flex items-center gap-2 border-b border-emerald-400/15 px-5 py-3">
          <Activity size={16} className="text-accent" />
          <span className="label-eyebrow text-accent">Procurement Health</span>
          <span className="ml-auto text-[10px] text-muted">Estimated</span>
        </div>

        <div className="p-5">
          {/* Score Display */}
          <div className="flex items-center justify-between rounded-xl border border-white/8 bg-slate-950/30 p-3">
            <div>
              <div className="data-num text-4xl font-bold text-ink">
                <span className={scoreColor}>{score}</span>
                <span className="text-lg text-muted">/100</span>
              </div>
              <div className={cn('mt-1 flex items-center gap-1.5 text-sm font-semibold', scoreColor)}>
                <span>{statusBadge}</span> {status}
              </div>
            </div>
            {/* Circular progress */}
            <div className="relative h-20 w-20">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-line)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={score >= 80 ? 'var(--color-success)' : score >= 65 ? '#10b981' : score >= 45 ? 'var(--color-warning)' : 'var(--color-danger)'}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 264} 264`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="data-num text-lg font-bold text-ink">{score}</span>
              </div>
            </div>
          </div>

          {/* Factor Breakdown */}
          <div className="mt-4 space-y-2.5">
            {Object.entries(factors).map(([key, value]) => (
              <div key={key}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">{factorLabels[key] || key}</span>
                  <span className="data-num font-semibold text-ink">{value}/100</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', barColor)}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  } catch {
    return null;
  }
}
