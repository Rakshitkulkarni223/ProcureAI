import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  PiggyBank,
  Clock,
  Target,
  TrendingUp,
  BarChart3,
  Users,
  Zap,
  CheckCircle2,
  ArrowRight,
  Calculator,
  Gauge,
  ShoppingCart,
  Search,
  ArrowDown,
} from 'lucide-react';
import type { BusinessImpact } from '../types';
import { api } from '../lib/api';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatINR, formatNumber } from '../lib/format';
import { DateRangeFilter, DateRange } from '../components/DateRangeFilter';

/* ═══════════════════════════════════════════════
   Section 1: KPI Metrics
   ═══════════════════════════════════════════════ */

function ImpactMetrics({ data }: { data: BusinessImpact }) {
  try {
    const metrics = [
      { label: 'Total Savings', value: formatINR(data.totalSavings), icon: PiggyBank, color: 'text-emerald-300', bg: 'bg-emerald-400/10 shadow-[0_0_18px_rgba(52,211,153,0.15)]' },
      { label: 'Savings This Month', value: formatINR(data.monthlySavings), icon: TrendingUp, color: 'text-sky-300', bg: 'bg-sky-400/10 shadow-[0_0_18px_rgba(56,189,248,0.15)]' },
      { label: 'Hours Saved', value: `${formatNumber(data.hoursSaved)} hrs`, icon: Clock, color: 'text-violet-300', bg: 'bg-violet-400/10 shadow-[0_0_18px_rgba(167,139,250,0.15)]' },
      { label: 'Procurement Searches', value: formatNumber(data.optimizedPurchases), icon: ShoppingCart, color: 'text-amber-300', bg: 'bg-amber-400/10 shadow-[0_0_18px_rgba(251,191,36,0.15)]' },
      { label: 'Supplier Quotes Compared', value: formatNumber(data.productsCompared), icon: Search, color: 'text-pink-300', bg: 'bg-pink-400/10 shadow-[0_0_18px_rgba(244,114,182,0.15)]' },
      { label: 'Average Savings / Decision', value: formatINR(data.avgSavingPerPurchase), icon: Target, color: 'text-teal-300', bg: 'bg-teal-400/10 shadow-[0_0_18px_rgba(45,212,191,0.15)]' },
      { label: 'Active Suppliers', value: formatNumber(data.suppliersCompared), icon: Users, color: 'text-orange-300', bg: 'bg-orange-400/10 shadow-[0_0_18px_rgba(251,146,60,0.15)]' },
      { label: 'Manual Work Reduced', value: `${data.manualEliminatedPct}%`, icon: CheckCircle2, color: 'text-green-300', bg: 'bg-green-400/10 shadow-[0_0_18px_rgba(74,222,128,0.15)]' },
    ];

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <BarChart3 size={20} className="text-accent" />
          <h2 className="font-display text-xl font-bold text-ink">Business Impact</h2>
        </div>
        <Card className="rounded-2xl border border-accent/25 bg-gradient-to-r from-accent-soft/55 via-surface to-sky-500/10 shadow-card">
          <CardBody className="flex items-start gap-3 sm:items-center">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <TrendingUp size={19} />
            </span>
            <p className="text-sm leading-6 text-ink-soft">
              ProcureAI helped your team save <strong className="data-num text-success">{formatINR(data.totalSavings)}</strong>, reduce manual work by <strong className="text-ink">{data.manualEliminatedPct}%</strong>, and reduce procurement time from 45 minutes to under 5 minutes.
            </p>
          </CardBody>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="rounded-2xl border border-line bg-surface shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:shadow-lift">
                <CardBody>
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${m.bg}`}>
                      <m.icon size={18} className={m.color} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted">{m.label}</p>
                      <p className={`mt-0.5 text-2xl font-bold tracking-tight ${m.color}`}>{m.value}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Efficiency Score gauge */}
        <Card className="rounded-2xl border border-accent/30 bg-gradient-to-r from-accent-soft/40 to-transparent shadow-card">
          <CardBody className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-accent bg-accent-soft">
                <Gauge size={28} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted">Efficiency Score</p>
                <p className="text-4xl font-bold text-accent">{data.efficiencyScore}<span className="text-lg text-muted">/100</span></p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted">Projected Annual Savings</p>
              <p className="text-2xl font-bold text-success">{formatINR(data.annualProjection)}</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════
   Section 2: Before vs After Workflow
   ═══════════════════════════════════════════════ */

const BEFORE_STEPS = [
  { step: 'Employee identifies need', time: '5 min' },
  { step: 'Open Amazon', time: '3 min' },
  { step: 'Open Flipkart', time: '3 min' },
  { step: 'Open IndiaMART', time: '3 min' },
  { step: 'Copy prices to Excel', time: '10 min' },
  { step: 'Compare manually', time: '10 min' },
  { step: 'Manager approval', time: '5 min' },
  { step: 'Purchase', time: '5 min' },
];

const AFTER_STEPS = [
  { step: 'Employee searches product', time: '1 min' },
  { step: 'AI compares all suppliers', time: '10 sec' },
  { step: 'Review AI recommendation', time: '1 min' },
  { step: 'Export report', time: '30 sec' },
  { step: 'Purchase', time: '1 min' },
];

function BeforeAfterWorkflow() {
  try {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Zap size={20} className="text-accent" />
          <h2 className="font-display text-xl font-bold text-ink">Procurement Workflow Comparison</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* BEFORE */}
          <Card className="overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/[0.08] via-surface to-surface shadow-card">
            <CardHeader className="border-red-100 dark:border-red-900/30">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-red-400">Traditional Procurement</h3>
                <Badge tone="danger">45–60 min</Badge>
              </div>
            </CardHeader>
            <CardBody className="space-y-0 p-0">
              {BEFORE_STEPS.map((s, i) => (
                <div key={i} className="flex items-center justify-between border-b border-line px-5 py-3 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600 dark:bg-red-950 dark:text-red-400">{i + 1}</span>
                    <span className="text-sm text-ink">{s.step}</span>
                  </div>
                  <span className="text-xs font-medium text-muted">{s.time}</span>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* AFTER */}
          <Card className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] via-surface to-surface shadow-card">
            <CardHeader className="border-green-100 dark:border-green-900/30">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-emerald-400">ProcureAI Workflow</h3>
                <Badge tone="success">3–5 min</Badge>
              </div>
            </CardHeader>
            <CardBody className="space-y-0 p-0">
              {AFTER_STEPS.map((s, i) => (
                <div key={i} className="flex items-center justify-between border-b border-line px-5 py-3 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600 dark:bg-green-950 dark:text-green-400">{i + 1}</span>
                    <span className="text-sm text-ink">{s.step}</span>
                  </div>
                  <span className="text-xs font-medium text-muted">{s.time}</span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        {/* Impact summary bar */}
        <Card className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.12] via-surface to-sky-500/[0.08] shadow-card">
          <CardBody className="flex flex-wrap items-center justify-center gap-6 text-center">
            {[
              { label: 'Time Reduction', value: '~93%', icon: Clock },
              { label: 'Manual Steps Eliminated', value: '3 of 8', icon: CheckCircle2 },
              { label: 'Suppliers Covered', value: 'All at once', icon: Users },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <s.icon size={16} className="text-emerald-300" />
                <span className="text-sm font-semibold text-emerald-300">{s.value}</span>
                <span className="text-xs text-muted">{s.label}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    );
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════
   Section 3: Business Impact Calculator
   ═══════════════════════════════════════════════ */

function ROICalculator() {
  const [purchasesPerMonth, setPurchasesPerMonth] = useState(50);
  const [hourlyCost, setHourlyCost] = useState(600);
  const [manualTime, setManualTime] = useState(45);
  const [aiTime, setAiTime] = useState(3);
  const [averagePurchaseValue, setAveragePurchaseValue] = useState(7000);
  const [costOptimizationRate, setCostOptimizationRate] = useState(6);

  const roi = useMemo(() => {
    try {
      const monthlyMinutesSaved = purchasesPerMonth * (manualTime - aiTime);
      const monthlyHoursSaved = monthlyMinutesSaved / 60;
      const monthlySalarySavings = Math.round(monthlyHoursSaved * hourlyCost);
      const annualSavings = monthlySalarySavings * 12;
      const timeReduction = manualTime > 0 ? Math.round(((manualTime - aiTime) / manualTime) * 100) : 0;
      const annualProcurementSavings = Math.round(purchasesPerMonth * averagePurchaseValue * (costOptimizationRate / 100) * 12);
      return { monthlyHoursSaved: Math.round(monthlyHoursSaved), monthlySalarySavings, annualSavings, timeReduction, annualProcurementSavings }; 
    } catch {
      return { monthlyHoursSaved: 0, monthlySalarySavings: 0, annualSavings: 0, timeReduction: 0, annualProcurementSavings: 0 };
    }
  }, [purchasesPerMonth, hourlyCost, manualTime, aiTime, averagePurchaseValue, costOptimizationRate]);

  try {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Calculator size={20} className="text-accent" />
          <h2 className="font-display text-xl font-bold text-ink">Business Impact Calculator</h2>
        </div>
        <p className="text-sm text-muted">Estimate how much your business saves by switching to ProcureAI.</p>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Inputs */}
          <Card className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
            <CardHeader>
              <h3 className="font-display text-base font-semibold text-ink">Your Numbers</h3>
            </CardHeader>
            <CardBody className="space-y-5">
              {[
                { label: 'Purchases per Month', value: purchasesPerMonth, set: setPurchasesPerMonth, min: 1, max: 500, unit: '' },
                { label: 'Employee Cost (₹/hr)', value: hourlyCost, set: setHourlyCost, min: 100, max: 5000, unit: '₹' },
                { label: 'Manual Comparison Time (min)', value: manualTime, set: setManualTime, min: 10, max: 120, unit: 'min' },
                { label: 'ProcureAI Time (min)', value: aiTime, set: setAiTime, min: 1, max: 30, unit: 'min' },
                { label: 'Average Purchase Value (₹)', value: averagePurchaseValue, set: setAveragePurchaseValue, min: 1000, max: 100000, unit: '₹' },
                { label: 'Cost Optimization Rate', value: costOptimizationRate, set: setCostOptimizationRate, min: 1, max: 20, unit: '%' },
              ].map((input) => (
                <div key={input.label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-medium text-muted">{input.label}</label>
                    <span className="text-sm font-bold text-ink">{input.value} {input.unit}</span>
                  </div>
                  <input
                    type="range"
                    min={input.min}
                    max={input.max}
                    value={input.value}
                    onChange={(e) => input.set(Number(e.target.value))}
                    className="w-full accent-accent"
                  />
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Outputs */}
          <Card className="overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent-soft/40 via-surface to-sky-500/[0.08] shadow-card">
            <CardHeader className="border-accent/20">
              <h3 className="font-display text-base font-semibold text-accent">Estimated Savings</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              {[
                { label: 'Monthly Time Saved', value: `${roi.monthlyHoursSaved} Hours`, icon: Clock, color: 'text-violet-300' },
                { label: 'Monthly Labor Savings', value: formatINR(roi.monthlySalarySavings), icon: PiggyBank, color: 'text-emerald-300' },
                { label: 'Annual Labor Savings', value: formatINR(roi.annualSavings), icon: TrendingUp, color: 'text-sky-300' },
                { label: 'Procurement Time Reduction', value: `${roi.timeReduction}%`, icon: ArrowDown, color: 'text-green-300' },
                { label: 'Estimated Procurement Savings', value: `${formatINR(roi.annualProcurementSavings)} / year`, icon: Target, color: 'text-teal-300' },
              ].map((o) => (
                <div key={o.label} className="flex items-center gap-4 rounded-xl border border-line bg-bg/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg ${o.color}`}>
                    <o.icon size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-muted">{o.label}</p>
                    <p className={`text-xl font-bold ${o.color}`}>{o.value}</p>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    );
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════
   Page Component
   ═══════════════════════════════════════════════ */

export function BusinessImpactPage() {
  const [data, setData] = useState<BusinessImpact | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback((range: DateRange) => {
    try {
      setLoading(true);
      api.businessImpact(range.from, range.to)
        .then((d) => { setData(d); setLoading(false); })
        .catch(() => setLoading(false));
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(dateRange); }, [dateRange, load]);

  const handleDateChange = useCallback((range: DateRange) => {
    try {
      setDateRange(range);
    } catch {
      // silent
    }
  }, []);

  return (
    <div className="space-y-10">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-400/15 bg-[linear-gradient(120deg,#07111f_0%,#0b2940_58%,#075b53_130%)] px-5 py-6 shadow-[0_20px_50px_rgba(15,23,42,0.16)] sm:px-7 sm:py-7">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-emerald-300/20" />
        <div className="absolute right-[28%] top-0 h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        <div className="relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">
              <BarChart3 size={12} /> Measurable Impact
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Measurable Business Impact.</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">See how AI transforms procurement into measurable savings, efficiency, and smarter decisions.</p>
          </div>
          <div className="mt-5 border-t border-white/10 pt-3">
            <DateRangeFilter value={dateRange} onChange={handleDateChange} />
          </div>
        </div>
      </section>

      {/* Priority 1: Impact Metrics */}
      {loading ? (
        <div className="py-20 text-center text-sm text-muted">Loading impact data…</div>
      ) : data ? (
        <ImpactMetrics data={data} />
      ) : (
        <div className="py-20 text-center text-sm text-muted">No data available yet. Run some searches first!</div>
      )}

      {/* Priority 2: Before vs After */}
      <BeforeAfterWorkflow />

      {/* Priority 3: Business Impact Calculator */}
      <ROICalculator />
    </div>
  );
}
