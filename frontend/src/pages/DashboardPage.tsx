import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  PiggyBank,
  Trophy,
  Layers,
  Boxes,
  ArrowUpRight,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
  Clock,
  Gauge,
  Zap,
  Target,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { DashboardSummary, Insight, BusinessImpact } from '../types';
import { api } from '../lib/api';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { SupplierLogo } from '../components/SupplierLogo';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatNumber, relativeTime } from '../lib/format';
import { getIcon } from '../lib/icons';
import { DateRangeFilter, DateRange } from '../components/DateRangeFilter';

const insightIcon: Record<string, any> = { TrendingUp, Award, Layers, PiggyBank, Sparkles };

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [trend, setTrend] = useState<{ month: string; amount: number }[]>([]);
  const [impact, setImpact] = useState<BusinessImpact | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({});

  const load = useCallback((range: DateRange) => {
    try {
      const { from, to } = range;
      api.dashboard(from, to).then(setData).catch(() => {});
      api.insights(from, to).then((r) => setInsights(r.insights)).catch(() => {});
      api.savings(from, to).then((r) => setTrend(r.savingsTrend)).catch(() => {});
      api.businessImpact(from, to).then(setImpact).catch(() => {});
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    load(dateRange);
  }, [dateRange, load]);

  const handleDateChange = useCallback((range: DateRange) => {
    try {
      setDateRange(range);
    } catch {
      // silent
    }
  }, []);

  const stats = data
    ? [
        { label: 'Supplier Comparisons', value: formatNumber(data.totalSearches), icon: Search, tone: 'text-ink' },
        { label: 'Purchase Decisions', value: formatNumber(data.procurementRequests), icon: ShoppingCart, tone: 'text-ink' },
        { label: 'Est. Monthly Savings', value: formatINR(data.estimatedMonthlySavings), icon: PiggyBank, tone: 'text-success' },
        { label: 'Procurement Categories', value: formatNumber(data.activeCategories), icon: Boxes, tone: 'text-ink' },
      ]
    : [];

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#07111f_0%,#0b2940_58%,#075b53_130%)] px-5 py-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.16)] sm:px-7 sm:py-8">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-emerald-300/20" />
        <div className="absolute right-[18%] top-0 h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">
              <Sparkles size={12} /> Explainable AI
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Find the best supplier. Every time.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Compare suppliers, optimize purchasing decisions, and measure business impact with explainable AI.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-300 sm:text-sm">
              <span><strong className="data-num text-emerald-300">{formatINR(data?.totalSavings || 0)}</strong> saved</span>
              <span className="hidden text-white/30 sm:inline">•</span>
              <span><strong className="data-num text-white">{formatNumber(data?.procurementRequests || 0)}</strong> decisions</span>
              <span className="hidden text-white/30 sm:inline">•</span>
              <span><strong className="data-num text-sky-200">{impact ? `${impact.aiAccuracyPct.toFixed(0)}%` : '—'}</strong> confidence</span>
              <span className="hidden text-white/30 sm:inline">•</span>
              <span><strong className="data-num text-violet-200">{impact ? `${impact.hoursSaved.toFixed(0)}h` : '—'}</strong> hours saved</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col xl:items-stretch">
            <button
              onClick={() => navigate('/search')}
              data-testid="dashboard-new-search"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition-all hover:-translate-y-px hover:bg-emerald-300 xl:flex-none"
            >
              <Search size={16} /> Start Procurement
            </button>
            <button
              onClick={() => {
                try {
                  window.dispatchEvent(new Event('open-procureai-chat'));
                } catch {
                }
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15 xl:flex-none"
            >
              <Sparkles size={16} /> Ask ProcureAI
            </button>
          </div>
        </div>
        <div className="relative mt-6 border-t border-white/10 pt-4">
          <DateRangeFilter value={dateRange} onChange={handleDateChange} />
        </div>
      </section>

      {impact && (
        <section className="grid gap-4 rounded-3xl bg-gradient-to-br from-emerald-500/12 via-surface to-sky-500/10 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)]">
          <div className="flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-accent">
                <Gauge size={17} />
                <span className="text-xs font-bold uppercase tracking-[0.16em]">Business Impact</span>
              </div>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink">Measurable value from every decision.</h2>
              <p className="mt-2 text-sm leading-6 text-muted">See exactly how AI recommendations reduce procurement costs and save operational time.</p>
            </div>
            <button onClick={() => navigate('/impact')} className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-accent hover:text-accent-hover">
              View full business impact <ArrowRight size={15} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: PiggyBank, label: 'Total Saved', value: formatINR(impact.totalSavings), color: 'text-success' },
              { icon: Clock, label: 'Hours Saved', value: `${impact.hoursSaved.toFixed(1)}h`, color: 'text-sky-600 dark:text-sky-400' },
              { icon: Zap, label: 'Efficiency', value: `${impact.efficiencyScore}/100`, color: 'text-amber-600 dark:text-amber-400' },
              { icon: Target, label: 'AI Accuracy', value: `${impact.aiAccuracyPct.toFixed(0)}%`, color: 'text-violet-600 dark:text-violet-400' },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl bg-surface/75 p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                <m.icon size={16} className={m.color} />
                <div className={`data-num mt-5 text-xl font-bold ${m.color}`}>{m.value}</div>
                <div className="mt-1 text-[11px] font-medium text-muted">{m.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* KPI grid */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" data-testid="dashboard-stats">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={i === 0 ? 'sm:col-span-2 xl:col-span-2' : ''}
          >
            <Card className={`rounded-2xl border-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift ${i === 0 ? 'bg-slate-950 shadow-[0_16px_32px_rgba(15,23,42,0.15)]' : i === 1 ? 'bg-gradient-to-br from-sky-500/[0.10] via-surface to-surface shadow-card' : i === 2 ? 'bg-gradient-to-br from-emerald-500/[0.10] via-surface to-surface shadow-card' : 'bg-gradient-to-br from-violet-500/[0.08] via-surface to-surface shadow-card'}`}> 
              <CardBody className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`label-eyebrow ${i === 0 ? 'text-slate-400' : ''}`}>{s.label}</span>
                    {i === 0 && <div className="mt-1 text-xs text-emerald-300">AI-tracked across your workspace</div>}
                  </div>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${i === 0 ? 'bg-white/10 text-emerald-300' : 'bg-accent-soft text-accent'}`}>
                    <s.icon size={16} />
                  </span>
                </div>
                <div className={`data-num mt-4 text-3xl font-bold sm:text-4xl ${i === 0 ? 'text-white' : s.tone}`}>{s.value}</div>
                <div className={`mt-1 text-xs ${i === 0 ? 'text-slate-400' : 'text-muted'}`}>{i === 0 ? 'Total procurement activity' : 'Updated from live procurement data'}</div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]">
        {/* Left: highlights + recent */}
        <div className="space-y-5">
          {/* Highlight cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="rounded-2xl border-0 bg-gradient-to-br from-amber-500/[0.08] via-surface to-surface shadow-card">
              <CardBody className="p-4">
                <div className="label-eyebrow flex items-center gap-1.5">
                  <Trophy size={12} className="text-accent" /> Preferred Supplier
                </div>
                <div className="mt-3 flex items-center gap-2.5">
                  {data?.preferredSupplier ? (
                    <>
                      <SupplierLogo name={data.preferredSupplier} size={32} />
                      <span className="font-display text-lg font-bold text-ink">{data.preferredSupplier}</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted">—</span>
                  )}
                </div>
              </CardBody>
            </Card>
            <Card className="rounded-2xl border-0 bg-gradient-to-br from-sky-500/[0.08] via-surface to-surface shadow-card">
              <CardBody className="p-4">
                <div className="label-eyebrow flex items-center gap-1.5">
                  <Layers size={12} className="text-accent" /> Top Category
                </div>
                <div className="mt-3 font-display text-lg font-bold text-ink">{data?.topCategory || '—'}</div>
              </CardBody>
            </Card>
            <Card className="rounded-2xl border-0 bg-gradient-to-br from-emerald-500/[0.08] via-surface to-surface shadow-card">
              <CardBody className="p-4">
                <div className="label-eyebrow flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-accent" /> Projected / yr
                </div>
                <div className="data-num mt-3 text-lg font-bold text-success">
                  {formatINR(data?.projectedAnnualSavings || 0)}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Savings trend */}
          <Card className="rounded-2xl border-0 bg-gradient-to-br from-sky-500/[0.06] via-surface to-surface shadow-card">
            <CardHeader className="flex items-center justify-between gap-3 border-line/60 px-4 sm:px-5">
              <div>
                <h3 className="font-display text-base font-semibold tracking-tight text-ink">Savings Trend</h3>
                <p className="mt-0.5 text-xs text-muted">AI-identified savings across completed comparisons</p>
              </div>
              <Badge tone="success">{formatINR(data?.totalSavings || 0)} total</Badge>
            </CardHeader>
            <CardBody className="p-3 pb-4 sm:p-5">
              {trend.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={[...trend].reverse()} margin={{ left: -16, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="savings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} width={56}
                      tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                    <Tooltip
                      formatter={(v: number) => [formatINR(v), 'Savings']}
                      contentStyle={{ borderRadius: 6, border: '1px solid var(--color-line)', fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-ink)' }}
                      labelStyle={{ color: 'var(--color-ink)' }}
                      itemStyle={{ color: 'var(--color-ink)' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2} fill="url(#savings)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="py-10 text-center text-sm text-muted">No savings data yet.</div>
              )}
            </CardBody>
          </Card>

          {/* Recent searches */}
          <Card className="rounded-2xl border-0 bg-gradient-to-br from-slate-500/[0.05] via-surface to-surface shadow-card">
            <CardHeader className="border-line/60 px-4 sm:px-5">
              <h3 className="font-display text-base font-semibold tracking-tight text-ink">Recent Comparisons</h3>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-line" data-testid="recent-searches">
                {data?.recentSearches.length ? (
                  data.recentSearches.map((r) => (
                    <button
                      key={r.id}
                      data-testid={`recent-search-${r.id}`}
                      onClick={() => navigate('/search', { state: { category: r.categorySlug, query: r.query } })}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-bg sm:px-5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink">{r.query}</span>
                          <Badge tone="neutral">{r.category}</Badge>
                        </div>
                        <div className="mt-0.5 text-xs text-muted">
                          {r.recommendedSupplier && <>→ {r.recommendedSupplier} · </>}
                          {relativeTime(r.timestamp)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {r.estimatedSavings > 0 && (
                          <span className="data-num text-sm font-semibold text-success">
                            +{formatINR(r.estimatedSavings)}
                          </span>
                        )}
                        <ArrowUpRight size={15} className="text-muted" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-5 py-10 text-center text-sm text-muted">No searches yet.</div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right: AI insights + Business Impact */}
        <div className="space-y-5">
          {/* Business Impact Summary */}
          <Card className="rounded-2xl border-0 bg-accent-soft/45 shadow-card">
            <CardHeader className="flex items-center gap-2 border-accent/20 px-4 sm:px-5">
              <Sparkles size={15} className="text-accent" />
              <h3 className="font-display text-base font-semibold tracking-tight text-accent">Today's AI Recommendations</h3>
            </CardHeader>
            <CardBody className="space-y-3 p-4 sm:p-5" data-testid="ai-insights">
              {insights.map((ins, i) => {
                const Icon = insightIcon[ins.icon] || Sparkles;
                return (
                  <div key={i} className="flex gap-3 rounded-xl bg-surface/80 p-3 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                        ins.tone === 'success' ? 'bg-success-bg text-success' : 'bg-accent-soft text-accent'
                      }`}
                    >
                      <Icon size={15} />
                    </span>
                    <p className="text-sm leading-snug text-ink-soft">{ins.text}</p>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
