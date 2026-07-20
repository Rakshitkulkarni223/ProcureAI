import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, ExternalLink, TrendingDown, Gauge, ChevronDown, Brain, Store, Building2, MessageSquareText } from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import type { Recommendation } from '../types';
import { Badge } from './ui/Badge';
import { SupplierLogo } from './SupplierLogo';
import { formatINR, cleanAIText } from '../lib/format';
import { cn } from '../lib/utils';

const PROFILE_LABEL: Record<string, string> = {
  balanced: 'Balanced',
  budget: 'Budget',
  urgent: 'Urgent',
  fast: 'Fast',
};

export function RecommendationCard({
  rec,
  supplierColors,
}: {
  rec: Recommendation;
  supplierColors: Record<string, string>;
}) {
  const [showExplanation, setShowExplanation] = useState(false);
  const confidencePct = Math.round(rec.confidence * 100);
  const confTone = rec.confidence >= 0.6 ? 'success' : rec.confidence >= 0.3 ? 'accent' : 'warning';

  // Radar chart data from factors
  const radarData = rec.factors.map((f) => ({
    factor: f.label,
    score: Math.round(f.score * 100),
    fullMark: 100,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      data-testid="recommendation-card"
      className="relative overflow-hidden rounded-3xl border border-emerald-400/30 bg-[linear-gradient(120deg,#07111f_0%,#103349_58%,#075b53_130%)] shadow-[0_20px_50px_rgba(15,23,42,0.16)]"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-accent to-transparent animate-scan" />
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-2 text-accent">
          <Sparkles size={16} />
          <span className="label-eyebrow text-accent">AI Recommendation</span>
        </div>
        <Badge tone="accent" data-testid="recommendation-profile">
          {PROFILE_LABEL[rec.weightProfile] || rec.weightProfile} profile
        </Badge>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,1fr)]">
        {/* Left: supplier + reasons */}
        <div>
          <div className="flex items-center gap-3">
            <SupplierLogo name={rec.supplier} color={supplierColors[rec.supplier]} size={44} />
            <div>
              <div className="label-eyebrow">Recommended supplier</div>
              <div
                className="font-display text-2xl font-bold tracking-tight text-white"
                data-testid="recommended-supplier-name"
              >
                {rec.supplier}
              </div>
              <div className="mt-0.5">
                {rec.product?.supplierSource === 'supplier_hub' ? (
                  <Badge tone="neutral" className="gap-1">
                    <Building2 size={10} /> My Supplier Network
                  </Badge>
                ) : (
                  <Badge tone="accent" className="gap-1">
                    <Store size={10} /> Marketplace
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-300">
            for <span className="font-medium text-white">{rec.product.title}</span>
          </p>

          {rec.aiExplanation && cleanAIText(rec.aiExplanation) && (
            <div className="mt-4 rounded-xl border border-emerald-300/20 bg-slate-950/35 p-3.5 backdrop-blur-sm">
              <div className="mb-2 flex items-center gap-1.5">
                <MessageSquareText size={13} className="text-accent" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">AI Procurement Advisor</span>
              </div>
              <p className="text-sm leading-relaxed text-ink-soft">{cleanAIText(rec.aiExplanation)}</p>
            </div>
          )}

          <ul className="mt-4 space-y-2">
            {rec.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-ink-soft">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success-bg text-emerald-600">
                  <Check size={11} strokeWidth={3} />
                </span>
                {reason}
              </li>
            ))}
          </ul>

          <a
            href={rec.product.productUrl}
            target="_blank"
            rel="noreferrer"
            data-testid="recommendation-buy-link"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_20px_rgba(34,197,94,0.22)] transition-all hover:-translate-y-px hover:bg-accent-hover"
          >
            Buy from {rec.supplier} <ExternalLink size={15} />
          </a>
        </div>

        {/* Right: savings + confidence + factors */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/45 p-3.5 backdrop-blur-sm">
              <div className="label-eyebrow flex items-center gap-1.5">
                <TrendingDown size={12} /> Est. savings
              </div>
              <div className="data-num mt-1.5 text-2xl font-bold text-success" data-testid="recommendation-savings">
                {formatINR(rec.estimatedSavings)}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/45 p-3.5 backdrop-blur-sm">
              <div className="label-eyebrow flex items-center gap-1.5">
                <Gauge size={12} /> Confidence
              </div>
              <div className="data-num mt-1.5 text-2xl font-bold text-ink" data-testid="recommendation-confidence">
                {confidencePct}%
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-bg">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    confTone === 'success' ? 'bg-success' : confTone === 'accent' ? 'bg-accent' : 'bg-warning',
                  )}
                  style={{ width: `${Math.max(6, confidencePct)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-md border border-line shadow-sm p-3.5">
            <div className="label-eyebrow mb-2.5">Decision factors</div>
            <div className="space-y-2">
              {rec.factors.map((f, i) => {
                const FACTOR_COLORS = ['#6366F1', '#2563EB', '#F59E0B', '#10B981', '#0EA5E9', '#7E3FF2', '#EF4444'];
                return (
                  <div key={f.label} className="flex items-center gap-2.5">
                    <span className="w-20 shrink-0 text-xs text-muted">{f.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.round(f.score * 100)}%`, backgroundColor: FACTOR_COLORS[i % FACTOR_COLORS.length] }}
                      />
                    </div>
                    <span className="data-num w-9 shrink-0 text-right text-[11px] text-muted">
                      {Math.round(f.weight * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* AI Explanation Toggle */}
      <div className="border-t border-accent/20">
        <button
          onClick={() => { try { setShowExplanation((v) => !v); } catch { /* silent */ } }}
          className="flex w-full items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/5"
        >
          <Brain size={13} />
          {showExplanation ? 'Hide' : 'Why this recommendation?'}
          <ChevronDown
            size={13}
            className={cn('transition-transform', showExplanation && 'rotate-180')}
          />
        </button>

        {showExplanation && (
          <div className="border-t border-accent/20 px-5 py-5 animate-fade-up">
            <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
              {/* Radar Chart */}
              <div>
                <div className="label-eyebrow mb-3 flex items-center gap-1.5">
                  <Sparkles size={11} /> Factor Performance
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                      <PolarGrid stroke="var(--color-line)" />
                      <PolarAngleAxis
                        dataKey="factor"
                        tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
                        axisLine={false}
                      />
                      <Radar
                        name={rec.supplier}
                        dataKey="score"
                        stroke="var(--color-accent)"
                        fill="var(--color-accent)"
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Scoreboard */}
              <div>
                <div className="mb-1 flex items-center gap-1.5 label-eyebrow">
                  <Gauge size={11} /> Supplier Scoreboard
                </div>
                <p className="mb-3 text-[11px] text-muted">
                  Each supplier is scored out of <strong className="text-ink">100</strong> based on price, delivery, rating, discount &amp; stock. Higher is better.
                </p>
                <div className="overflow-hidden rounded-md border border-line bg-surface">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line bg-bg text-left">
                        <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted">Rank</th>
                        <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted">Supplier</th>
                        <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted">Score (out of 100)</th>
                        <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rec.scoreboard
                        .sort((a, b) => b.score - a.score)
                        .map((s, i) => {
                          const pct = Math.round(s.score * 100);
                          const barColor = s.supplier === rec.supplier
                            ? 'bg-accent'
                            : pct >= 70 ? 'bg-emerald-400' : pct >= 45 ? 'bg-amber-400' : 'bg-red-400';
                          return (
                          <tr
                            key={s.supplier}
                            className={cn(
                              'border-b border-line last:border-0',
                              s.supplier === rec.supplier ? 'bg-accent/5' : '',
                            )}
                          >
                            <td className="px-3 py-2 text-xs font-bold text-muted">#{i + 1}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <SupplierLogo name={s.supplier} color={supplierColors[s.supplier]} size={22} />
                                <span className={cn(
                                  'text-sm font-medium',
                                  s.supplier === rec.supplier ? 'text-accent' : 'text-ink',
                                )}>
                                  {s.supplier}
                                  {s.supplier === rec.supplier && (
                                    <Badge tone="accent" className="ml-1.5 text-[9px]">Best</Badge>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="h-2 w-20 overflow-hidden rounded-full bg-bg">
                                  <div
                                    className={cn('h-full rounded-full transition-all', barColor)}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="data-num w-12 text-right text-xs font-semibold text-ink">
                                  {pct}<span className="text-muted font-normal">/100</span>
                                </span>
                              </div>
                            </td>
                            <td className="data-num px-3 py-2 text-right text-xs font-medium text-ink">
                              {formatINR(s.price)}
                            </td>
                          </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2.5 text-[11px] text-muted">
                  Scores computed using the <strong>{PROFILE_LABEL[rec.weightProfile] || rec.weightProfile}</strong> weight profile.
                  Factors include price, delivery speed, rating, discount, and stock availability.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
