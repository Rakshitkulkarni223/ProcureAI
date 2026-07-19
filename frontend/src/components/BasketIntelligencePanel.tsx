import React from 'react';
import {
  TrendingDown, Truck, Store, Star, Clock, Layers, Gauge,
  Shield, Scale, PieChart, Calendar, Sparkles, AlertTriangle, Info,
  CheckCircle2, Zap, Package, CircleDot,
} from 'lucide-react';
import type { BasketIntelligence } from '../types';
import { formatINR } from '../lib/format';
import { cn } from '../lib/utils';

function MetricCard({
  icon: Icon, label, value, sublabel, tone = 'default',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sublabel?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const toneClass = {
    default: 'text-ink',
    success: 'text-success',
    warning: 'text-amber-600',
    danger: 'text-danger',
    info: 'text-accent',
  }[tone];
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center gap-2 text-muted">
        <Icon size={14} />
        <span className="label-eyebrow">{label}</span>
      </div>
      <div className={cn('mt-2 data-num text-xl font-bold', toneClass)}>{value}</div>
      {sublabel && <div className="mt-0.5 text-xs text-muted">{sublabel}</div>}
    </div>
  );
}

function riskTone(level: string): 'success' | 'warning' | 'danger' {
  if (level === 'Low') return 'success';
  if (level === 'Medium') return 'warning';
  return 'danger';
}

function complexityTone(level: string): 'success' | 'info' | 'warning' | 'danger' {
  if (level === 'Very Easy' || level === 'Easy') return 'success';
  if (level === 'Medium') return 'info';
  if (level === 'High') return 'warning';
  return 'danger';
}

/** Parses a flat AI summary string into beautifully formatted card with structured items. */
function AISummaryCard({ summary }: { summary: string }) {
  try {
    // Parse the flat summary into structured key-value pairs
    const parseItems = (text: string) => {
      try {
        const items: { label: string; value: string; icon: React.ElementType; tone: string }[] = [];
        const patterns: { regex: RegExp; label: string; icon: React.ElementType; tone: (v: string) => string }[] = [
          { regex: /optimized across (\d+ supplier\w?)/i, label: 'Suppliers', icon: Store, tone: () => 'info' },
          { regex: /(?:estimated )?savings:?\s*(₹[\d,]+\s*\([\d.]+%\))/i, label: 'Savings', icon: TrendingDown, tone: () => 'success' },
          { regex: /(?:supplier )?diversification:?\s*([^.]+)/i, label: 'Diversification', icon: Layers, tone: (v) => v.toLowerCase().includes('excellent') ? 'success' : 'warning' },
          { regex: /risk:?\s*(high|medium|low)/i, label: 'Risk Level', icon: Shield, tone: (v) => v.toLowerCase() === 'low' ? 'success' : v.toLowerCase() === 'medium' ? 'warning' : 'danger' },
          { regex: /(?:expected )?delivery:?\s*(within \d+ days|\d+ days?)/i, label: 'Delivery', icon: Truck, tone: () => 'info' },
          { regex: /complexity:?\s*(easy|medium|high|very easy|very high)/i, label: 'Complexity', icon: Zap, tone: (v) => v.toLowerCase() === 'easy' || v.toLowerCase() === 'very easy' ? 'success' : 'warning' },
          { regex: /recommendation:?\s*([^.]+)/i, label: 'Recommendation', icon: CheckCircle2, tone: () => 'success' },
          { regex: /reason:?\s*([^.]+)/i, label: 'Reason', icon: Info, tone: () => 'default' },
        ];

        for (const p of patterns) {
          const m = text.match(p.regex);
          if (m?.[1]) {
            const value = m[1].trim();
            items.push({ label: p.label, value, icon: p.icon, tone: p.tone(value) });
          }
        }
        return items;
      } catch {
        return [];
      }
    };

    // Extract warning line (⚠ ...)
    const warningMatch = summary.match(/⚠\s*([^.]+\.?)/);
    const items = parseItems(summary);

    const toneClasses: Record<string, { bg: string; text: string; dot: string }> = {
      success: { bg: 'bg-success-bg/50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      warning: { bg: 'bg-warning-bg/50', text: 'text-amber-700', dot: 'bg-amber-500' },
      danger: { bg: 'bg-danger/5', text: 'text-danger', dot: 'bg-danger' },
      info: { bg: 'bg-accent-soft/30', text: 'text-accent', dot: 'bg-accent' },
      default: { bg: 'bg-bg', text: 'text-ink-soft', dot: 'bg-muted' },
    };

    if (items.length === 0) {
      // Fallback to plain text display
      return (
        <div className="rounded-lg border border-accent/30 bg-accent-soft/20 p-5 shadow-card">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles size={16} className="text-accent" />
            <span className="label-eyebrow text-accent">AI Procurement Summary</span>
          </div>
          <p className="text-sm leading-relaxed text-ink-soft">{summary}</p>
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-accent/30 bg-gradient-to-br from-accent-soft/10 to-surface p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
            <Sparkles size={14} className="text-accent" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-ink">AI Procurement Summary</h3>
            <p className="text-[10px] text-muted">Generated by ProcureAI Advisor</p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((item, i) => {
            const tc = toneClasses[item.tone] || toneClasses.default;
            const Icon = item.icon;
            return (
              <div key={i} className={cn('flex items-start gap-3 rounded-lg px-3.5 py-3', tc.bg)}>
                <div className={cn('mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md', tc.bg)}>
                  <Icon size={13} className={tc.text} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-muted">{item.label}</div>
                  <div className={cn('mt-0.5 text-sm font-semibold capitalize', tc.text)}>{item.value}</div>
                </div>
              </div>
            );
          })}
        </div>

        {warningMatch && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-warning-bg/60 px-3.5 py-2.5 text-xs font-medium text-amber-700">
            <AlertTriangle size={14} className="flex-shrink-0" />
            <span>{warningMatch[1]}</span>
          </div>
        )}
      </div>
    );
  } catch {
    return (
      <div className="rounded-lg border border-accent/30 bg-accent-soft/20 p-5 shadow-card">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          <span className="label-eyebrow text-accent">AI Procurement Summary</span>
        </div>
        <p className="text-sm leading-relaxed text-ink-soft">{summary}</p>
      </div>
    );
  }
}

export function BasketIntelligencePanel({
  intelligence,
  supplierColors,
}: {
  intelligence: BasketIntelligence;
  supplierColors: Record<string, string>;
}) {
  const {
    totalProcurementCost, productCost, logisticsCost, logisticsBreakdown,
    savings, supplierCount, consolidationScore, deliveryWindow,
    complexity, aiScore, confidence, risk, costVsConvenience,
    supplierDependency, dominantSupplier, categorySpend,
    expectedSavings, aiSummary,
  } = intelligence;

  return (
    <div className="space-y-6">
      {/* === Summary Grid === */}
      <div className="rounded-lg border border-line bg-bg p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
            Procurement Intelligence Summary
          </h3>
          <span className="ml-auto rounded-full bg-accent-soft/50 px-2.5 py-0.5 text-[11px] font-medium text-accent">
            Estimated
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={TrendingDown}
            label="Total Procurement Cost"
            value={formatINR(totalProcurementCost)}
            sublabel={`Products: ${formatINR(productCost)} + Logistics: ${formatINR(logisticsCost)}`}
          />
          <MetricCard
            icon={TrendingDown}
            label="Total Savings"
            value={formatINR(savings.amount)}
            sublabel={`${savings.percentage}% vs market (${formatINR(savings.marketCost)})`}
            tone="success"
          />
          <MetricCard
            icon={Gauge}
            label="AI Score"
            value={`${aiScore}/100`}
            sublabel={aiScore >= 80 ? 'Excellent' : aiScore >= 60 ? 'Good' : 'Needs Review'}
            tone={aiScore >= 80 ? 'success' : aiScore >= 60 ? 'info' : 'warning'}
          />
          <MetricCard
            icon={Shield}
            label="Confidence"
            value={`${confidence.percentage}%`}
            sublabel={confidence.label}
            tone="info"
          />
          <MetricCard
            icon={Store}
            label="Supplier Count"
            value={supplierCount}
            sublabel={supplierCount === 1 ? 'Single vendor' : `${supplierCount} vendors`}
          />
          <MetricCard
            icon={Shield}
            label="Risk Level"
            value={risk.level}
            sublabel={`Score: ${risk.score}/100`}
            tone={riskTone(risk.level)}
          />
          <MetricCard
            icon={Clock}
            label="Delivery Window"
            value={deliveryWindow.latestLabel}
            sublabel={`Earliest: ${deliveryWindow.earliestLabel}`}
          />
          <MetricCard
            icon={Layers}
            label="Complexity"
            value={complexity.level}
            tone={complexityTone(complexity.level)}
          />
        </div>
      </div>

      {/* === AI Procurement Summary === */}
      {aiSummary && <AISummaryCard summary={aiSummary} />}

      {/* === Two-column layout === */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* Logistics Cost Breakdown */}
          <div className="rounded-lg border border-line bg-surface p-5 shadow-card">
            <div className="mb-3 flex items-center gap-2">
              <Truck size={16} className="text-muted" />
              <span className="label-eyebrow">Logistics Cost Breakdown</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Shipping', value: logisticsBreakdown.shipping },
                { label: 'Transport', value: logisticsBreakdown.transport },
                { label: 'Handling', value: logisticsBreakdown.handling },
                { label: 'Hidden Costs', value: logisticsBreakdown.hidden },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted">{row.label}</span>
                  <span className="data-num font-semibold text-ink">{formatINR(row.value)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-line pt-2 text-sm">
                <span className="font-semibold text-ink">Total Logistics</span>
                <span className="data-num font-bold text-accent">{formatINR(logisticsBreakdown.total)}</span>
              </div>
            </div>
          </div>

          {/* Consolidation Score */}
          <div className="rounded-lg border border-line bg-surface p-5 shadow-card">
            <div className="mb-3 flex items-center gap-2">
              <Star size={16} className="text-muted" />
              <span className="label-eyebrow">Supplier Consolidation Score</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-ink">{consolidationScore.stars}</span>
              <span className="text-sm font-medium text-ink">{consolidationScore.label}</span>
            </div>
            <p className="mt-2 text-xs text-muted">
              {supplierCount === 1
                ? 'All items from a single supplier — minimal management effort.'
                : `${supplierCount} suppliers means ${supplierCount} invoices, ${supplierCount} deliveries, and ${supplierCount} vendor follow-ups.`}
            </p>
          </div>

          {/* Cost vs Convenience */}
          <div className="rounded-lg border border-line bg-surface p-5 shadow-card">
            <div className="mb-3 flex items-center gap-2">
              <Scale size={16} className="text-muted" />
              <span className="label-eyebrow">Cost vs Convenience</span>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div className="rounded-md border border-line bg-bg p-3">
                <div className="text-xs text-muted">Split Cost</div>
                <div className="data-num mt-1 font-bold text-ink">{formatINR(costVsConvenience.splitCost)}</div>
              </div>
              <div className="rounded-md border border-line bg-bg p-3">
                <div className="text-xs text-muted">Consolidate Cost</div>
                <div className="data-num mt-1 font-bold text-ink">{formatINR(costVsConvenience.consolidateCost)}</div>
              </div>
            </div>
            <div className={cn(
              'rounded-md px-3 py-2 text-sm',
              costVsConvenience.recommended === 'consolidate'
                ? 'bg-accent-soft/30 text-accent'
                : 'bg-success-bg/50 text-emerald-700',
            )}>
              <span className="font-semibold">
                Recommended: {costVsConvenience.recommended === 'consolidate' ? 'Consolidate' : 'Split'}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">{costVsConvenience.reason}</p>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Supplier Dependency */}
          {Object.keys(supplierDependency).length > 0 && (
            <div className="rounded-lg border border-line bg-surface p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <PieChart size={16} className="text-muted" />
                <span className="label-eyebrow">Supplier Dependency</span>
              </div>
              <div className="space-y-3">
                {Object.entries(supplierDependency)
                  .sort(([, a], [, b]) => b.percentage - a.percentage)
                  .map(([supplier, dep]) => (
                    <div key={supplier}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-ink">{supplier}</span>
                        <span className="data-num text-muted">
                          {formatINR(dep.amount)} ({dep.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-bg">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${dep.percentage}%`,
                            backgroundColor: supplierColors[supplier] || '#6366f1',
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
              {dominantSupplier && (
                <div className="mt-3 flex items-center gap-2 rounded-md bg-warning-bg px-3 py-2 text-xs text-amber-700">
                  <AlertTriangle size={14} />
                  {dominantSupplier} dominates the basket — consider diversifying to reduce dependency.
                </div>
              )}
            </div>
          )}

          {/* Expected Savings */}
          {expectedSavings.perBasket > 0 && (
            <div className="rounded-lg border border-success/30 bg-success-bg/30 p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-emerald-600" />
                <span className="label-eyebrow text-emerald-700">Expected Savings</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-muted">Per Basket</div>
                  <div className="data-num mt-1 font-bold text-success">{formatINR(expectedSavings.perBasket)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Monthly</div>
                  <div className="data-num mt-1 font-bold text-success">{formatINR(expectedSavings.monthly)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Yearly</div>
                  <div className="data-num mt-1 font-bold text-success">{formatINR(expectedSavings.yearly)}</div>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted">Assumes daily procurement of the same basket.</p>
            </div>
          )}

          {/* Confidence Detail */}
          <div className="rounded-lg border border-line bg-surface p-5 shadow-card">
            <div className="mb-3 flex items-center gap-2">
              <Info size={16} className="text-muted" />
              <span className="label-eyebrow">Confidence Analysis</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft/30">
                <span className="data-num font-bold text-accent">{confidence.percentage}%</span>
              </div>
              <div>
                <div className="font-semibold text-ink">{confidence.label}</div>
                <div className="text-xs text-muted">{confidence.reason}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === Category Spend === */}
      {categorySpend.length > 0 && (
        <div className="rounded-lg border border-line bg-surface p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <PieChart size={16} className="text-muted" />
            <span className="label-eyebrow">Item-wise Spend</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categorySpend.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border border-line bg-bg px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink">{item.item}</div>
                  <div className="text-xs text-muted">{item.supplier}</div>
                </div>
                <span className="data-num ml-2 font-semibold text-ink">{formatINR(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
