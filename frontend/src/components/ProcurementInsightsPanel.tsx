import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, TrendingDown, Truck, Award, ShieldCheck, Calculator, Gauge } from 'lucide-react';
import type { ProcurementInsight } from '../types';
import { cn } from '../lib/utils';

const ICON_MAP: Record<string, React.ReactNode> = {
  TrendingDown: <TrendingDown size={14} />,
  Truck: <Truck size={14} />,
  Award: <Award size={14} />,
  ShieldCheck: <ShieldCheck size={14} />,
  Calculator: <Calculator size={14} />,
  Gauge: <Gauge size={14} />,
};

const TONE_STYLES: Record<string, string> = {
  success: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-400',
  info: 'border-sky-400/40 bg-sky-500/10 text-sky-400',
  warning: 'border-amber-400/40 bg-amber-500/10 text-amber-400',
};

export function ProcurementInsightsPanel({ insights }: { insights: ProcurementInsight[] }) {
  try {
    if (!insights || insights.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        data-testid="procurement-insights-panel"
        className="rounded-md border border-line bg-surface shadow-card"
      >
        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          <Lightbulb size={16} className="text-accent" />
          <span className="label-eyebrow text-accent">Procurement Insights</span>
          <span className="ml-auto text-[10px] text-muted">Estimated</span>
        </div>

        <div className="space-y-2 p-4">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-sm',
                TONE_STYLES[insight.tone] || TONE_STYLES.info,
              )}
              data-testid={`insight-${i}`}
            >
              <span className="mt-0.5 shrink-0">{ICON_MAP[insight.icon] || <Lightbulb size={14} />}</span>
              <span className="leading-relaxed">{insight.text}</span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  } catch {
    return null;
  }
}
