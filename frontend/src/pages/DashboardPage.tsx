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
        { label: 'Total Searches', value: formatNumber(data.totalSearches), icon: Search, tone: 'text-ink' },
        { label: 'Procurement Requests', value: formatNumber(data.procurementRequests), icon: ShoppingCart, tone: 'text-ink' },
        { label: 'Est. Monthly Savings', value: formatINR(data.estimatedMonthlySavings), icon: PiggyBank, tone: 'text-success' },
        { label: 'Active Categories', value: formatNumber(data.activeCategories), icon: Boxes, tone: 'text-ink' },
      ]
    : [];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="label-eyebrow">Overview</div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-muted">Your procurement intelligence at a glance.</p>
          <div className="mt-3">
            <DateRangeFilter value={dateRange} onChange={handleDateChange} />
          </div>
        </div>
        <button
          onClick={() => navigate('/search')}
          data-testid="dashboard-new-search"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Search size={16} /> New Search
        </button>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="dashboard-stats">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className="transition-transform duration-200 hover:-translate-y-px hover:shadow-lift">
              <CardBody>
                <div className="flex items-start justify-between">
                  <span className="label-eyebrow">{s.label}</span>
                  <s.icon size={16} className="text-muted" />
                </div>
                <div className={`data-num mt-3 text-3xl font-bold ${s.tone}`}>{s.value}</div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: highlights + recent */}
        <div className="space-y-6 lg:col-span-2">
          {/* Highlight cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardBody>
                <div className="label-eyebrow flex items-center gap-1.5">
                  <Trophy size={12} /> Preferred Supplier
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
            <Card>
              <CardBody>
                <div className="label-eyebrow flex items-center gap-1.5">
                  <Layers size={12} /> Top Category
                </div>
                <div className="mt-3 font-display text-lg font-bold text-ink">{data?.topCategory || '—'}</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="label-eyebrow flex items-center gap-1.5">
                  <TrendingUp size={12} /> Projected / yr
                </div>
                <div className="data-num mt-3 text-lg font-bold text-success">
                  {formatINR(data?.projectedAnnualSavings || 0)}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Savings trend */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold tracking-tight text-ink">Savings Trend</h3>
              <Badge tone="success">{formatINR(data?.totalSavings || 0)} total</Badge>
            </CardHeader>
            <CardBody>
              {trend.length ? (
                <ResponsiveContainer width="100%" height={220}>
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
          <Card>
            <CardHeader>
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
                      className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-bg"
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
        <div className="space-y-4">
          {/* Business Impact Summary */}
          {impact && (
            <Card className="border-green-500/30 bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10">
              <CardHeader className="flex items-center justify-between border-green-500/20">
                <div className="flex items-center gap-2">
                  <Gauge size={15} className="text-green-600" />
                  <h3 className="font-display text-base font-semibold tracking-tight text-green-700 dark:text-green-400">Business Impact</h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: PiggyBank, label: 'Total Saved', value: formatINR(impact.totalSavings), color: 'text-green-600' },
                    { icon: Clock, label: 'Hours Saved', value: `${impact.hoursSaved.toFixed(1)}h`, color: 'text-blue-600' },
                    { icon: Zap, label: 'Efficiency', value: `${impact.efficiencyScore}/100`, color: 'text-amber-600' },
                    { icon: Target, label: 'AI Accuracy', value: `${impact.aiAccuracyPct.toFixed(0)}%`, color: 'text-violet-600' },
                  ].map((m) => (
                    <div key={m.label} className="rounded-lg border border-line bg-surface p-2.5 text-center">
                      <m.icon size={14} className={`mx-auto ${m.color}`} />
                      <div className={`mt-1 text-lg font-bold ${m.color}`}>{m.value}</div>
                      <div className="text-[10px] text-muted">{m.label}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/impact')}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                >
                  View Full Business Impact <ArrowRight size={14} />
                </button>
              </CardBody>
            </Card>
          )}

          <Card className="border-accent/30 bg-accent-soft/30">
            <CardHeader className="flex items-center gap-2 border-accent/20">
              <Sparkles size={15} className="text-accent" />
              <h3 className="font-display text-base font-semibold tracking-tight text-accent">AI Insights</h3>
            </CardHeader>
            <CardBody className="space-y-3" data-testid="ai-insights">
              {insights.map((ins, i) => {
                const Icon = insightIcon[ins.icon] || Sparkles;
                return (
                  <div key={i} className="flex gap-3 rounded-md border border-line bg-surface p-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                        ins.tone === 'success' ? 'bg-success-bg text-emerald-600' : 'bg-accent-soft text-accent'
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
