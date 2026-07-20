import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Check, Shield, TrendingUp, MessageSquareText } from 'lucide-react';
import type { LongTermRecommendation } from '../types';
import { Badge } from './ui/Badge';
import { SupplierLogo } from './SupplierLogo';
import { formatINR, cleanAIText } from '../lib/format';
import { cn } from '../lib/utils';

export function LongTermRecommendationCard({
  rec,
  supplierColors,
}: {
  rec: LongTermRecommendation;
  supplierColors: Record<string, string>;
}) {
  try {
    if (!rec) return null;

    const riskTone = rec.riskLevel === 'Low' ? 'success' : rec.riskLevel === 'Medium' ? 'warning' : 'danger';

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        data-testid="long-term-recommendation"
        className="overflow-hidden rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.12] via-surface to-slate-950 shadow-card"
      >
        <div className="flex items-center gap-2 border-b border-violet-400/15 px-5 py-3">
          <Clock size={16} className="text-accent" />
          <span className="label-eyebrow text-accent">Long-Term Procurement Recommendation</span>
          <span className="ml-auto text-[10px] text-muted">Estimated</span>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-3">
            <SupplierLogo name={rec.supplier} color={supplierColors[rec.supplier]} size={44} />
            <div>
              <div className="label-eyebrow">Recommended long-term partner</div>
              <div className="font-display text-2xl font-bold tracking-tight text-ink">{rec.supplier}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="data-num text-2xl font-bold text-accent">{rec.longTermScore}</div>
              <div className="text-[10px] text-muted">Long-Term Score</div>
            </div>
          </div>

          {rec.aiExplanation && cleanAIText(rec.aiExplanation) && (
            <div className="mt-4 rounded-xl border border-violet-300/20 bg-slate-950/35 p-3.5 backdrop-blur-sm">
              <div className="mb-2 flex items-center gap-1.5">
                <MessageSquareText size={13} className="text-accent" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">AI Procurement Advisor</span>
              </div>
              <p className="text-sm leading-relaxed text-ink-soft">{cleanAIText(rec.aiExplanation)}</p>
            </div>
          )}

          {/* Show deterministic reasons only when AI explanation is absent */}
          {!(rec.aiExplanation && cleanAIText(rec.aiExplanation)) && rec.reasons.length > 0 && (
            <ul className="mt-4 space-y-2">
              {rec.reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  {reason}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/8 bg-slate-950/35 p-2.5">
              <div className="label-eyebrow flex items-center gap-1"><Shield size={11} /> Risk</div>
              <div className={cn('data-num mt-1 text-sm font-bold', riskTone === 'success' ? 'text-success' : riskTone === 'warning' ? 'text-warning' : 'text-danger')}>
                {rec.riskLevel}
              </div>
            </div>
            <div className="rounded-xl border border-white/8 bg-slate-950/35 p-2.5">
              <div className="label-eyebrow flex items-center gap-1"><TrendingUp size={11} /> Reliability</div>
              <div className="data-num mt-1 text-sm font-bold text-ink">{rec.deliveryReliability}%</div>
            </div>
            <div className="rounded-xl border border-white/8 bg-slate-950/35 p-2.5">
              <div className="label-eyebrow">Supplier Score</div>
              <div className="data-num mt-1 text-sm font-bold text-ink">{rec.supplierScore}/100</div>
            </div>
            <div className="rounded-xl border border-white/8 bg-slate-950/35 p-2.5">
              <div className="label-eyebrow">Total Cost</div>
              <div className="data-num mt-1 text-sm font-bold text-ink">{formatINR(rec.totalProcurementCost)}</div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  } catch {
    return null;
  }
}
