import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
} from 'recharts';
import { api } from '../lib/api';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatINR } from '../lib/format';

const PIE_COLORS = ['#0F172A', '#2563EB', '#10B981', '#F59E0B', '#7E3FF2', '#EF4444', '#0EA5E9', '#84C225'];

export function AnalyticsPage() {
  const [spend, setSpend] = useState<{
    monthlySpend: { month: string; amount: number }[];
    categorySpend: { category: string; amount: number }[];
    supplierUsage: { supplier: string; count: number }[];
  } | null>(null);
  const [savings, setSavings] = useState<{ savingsTrend: { month: string; amount: number }[]; totalSavings: number } | null>(null);

  useEffect(() => {
    api.spend().then(setSpend).catch(() => {});
    api.savings().then(setSavings).catch(() => {});
  }, []);

  const monthly = spend ? [...spend.monthlySpend].reverse() : [];
  const trend = savings ? [...savings.savingsTrend].reverse() : [];

  return (
    <div className="space-y-7">
      <div>
        <div className="label-eyebrow">Analytics</div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Procurement Analytics</h1>
        <p className="mt-1 text-sm text-muted">Spend, savings and supplier activity across your comparisons.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="font-display text-base font-semibold tracking-tight text-ink">Monthly Procurement Value</h3>
          </CardHeader>
          <CardBody>
            <ChartOrEmpty empty={!monthly.length}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthly} margin={{ left: -8, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip formatter={(v: number) => [formatINR(v), 'Value']}
                    cursor={{ fill: 'var(--color-line)', opacity: 0.3 }}
                    contentStyle={{ borderRadius: 6, border: '1px solid var(--color-line)', fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-ink)' }}
                    labelStyle={{ color: 'var(--color-ink)' }}
                    itemStyle={{ color: 'var(--color-ink)' }} />
                  <Bar dataKey="amount" fill="var(--color-accent)" radius={[4, 4, 0, 0]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            </ChartOrEmpty>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-display text-base font-semibold tracking-tight text-ink">Savings Trend</h3>
          </CardHeader>
          <CardBody>
            <ChartOrEmpty empty={!trend.length}>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trend} margin={{ left: -8, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip formatter={(v: number) => [formatINR(v), 'Savings']}
                    contentStyle={{ borderRadius: 6, border: '1px solid var(--color-line)', fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-ink)' }}
                    labelStyle={{ color: 'var(--color-ink)' }}
                    itemStyle={{ color: 'var(--color-ink)' }} />
                  <Line type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartOrEmpty>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-display text-base font-semibold tracking-tight text-ink">Category-wise Spend</h3>
          </CardHeader>
          <CardBody>
            <ChartOrEmpty empty={!spend?.categorySpend.length}>
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={spend?.categorySpend || []}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {(spend?.categorySpend || []).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatINR(v)}
                      contentStyle={{ borderRadius: 6, border: '1px solid var(--color-line)', fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-ink)' }}
                      labelStyle={{ color: 'var(--color-ink)' }}
                      itemStyle={{ color: 'var(--color-ink)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartOrEmpty>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-display text-base font-semibold tracking-tight text-ink">Supplier Recommendations</h3>
          </CardHeader>
          <CardBody>
            <ChartOrEmpty empty={!spend?.supplierUsage.length}>
              <div className="space-y-2.5" data-testid="supplier-usage">
                {(spend?.supplierUsage || []).map((s, i) => {
                  const max = Math.max(...(spend?.supplierUsage || []).map((x) => x.count));
                  return (
                    <div key={s.supplier} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 truncate text-sm text-ink-soft">{s.supplier}</span>
                      <div className="h-6 flex-1 overflow-hidden rounded-md bg-bg">
                        <div
                          className="flex h-full items-center justify-end rounded-md px-2 text-[11px] font-semibold text-white"
                          style={{ width: `${(s.count / max) * 100}%`, background: PIE_COLORS[i % PIE_COLORS.length] }}
                        >
                          {s.count}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ChartOrEmpty>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function ChartOrEmpty({ empty, children }: { empty?: boolean; children: React.ReactNode }) {
  if (empty) {
    return (
      <div className="flex h-[220px] items-center justify-center">
        <Badge tone="neutral">Run some searches to populate this chart</Badge>
      </div>
    );
  }
  return <>{children}</>;
}
