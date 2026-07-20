import React, { useEffect, useState } from 'react';
import { Users, CheckCircle, XCircle, Star, Clock, Lightbulb, PieChart } from 'lucide-react';
import { Card, CardBody, CardHeader } from './ui/Card';
import { Badge } from './ui/Badge';
import { supplierHubApi, supplierHubApiError } from '../lib/supplierHubApi';
import { SUPPLIER_TYPE_LABELS } from '../types_supplier';
import type { SupplierHubIntelligence } from '../types_supplier';
import { cn } from '../lib/utils';

export function SupplierHubIntelligence() {
  const [intel, setIntel] = useState<SupplierHubIntelligence | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      Promise.all([supplierHubApi.getIntelligence(), supplierHubApi.getInsights()])
        .then(([i, ins]) => {
          setIntel(i);
          setInsights(ins);
        })
        .catch((e) => setError(supplierHubApiError(e)))
        .finally(() => setLoading(false));
    } catch (e) {
      setError('Failed to load intelligence');
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <Card>
        <CardBody className="py-10 text-center text-sm text-muted">Loading procurement intelligence…</CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody className="py-6 text-center text-sm text-danger">{error}</CardBody>
      </Card>
    );
  }

  if (!intel) return null;

  const metrics = [
    { label: 'Total Suppliers', value: intel.totalSuppliers, icon: Users, tone: 'accent' as const },
    { label: 'Active', value: intel.activeSuppliers, icon: CheckCircle, tone: 'success' as const },
    { label: 'Inactive', value: intel.inactiveSuppliers, icon: XCircle, tone: 'danger' as const },
    { label: 'Avg Reliability', value: `${intel.avgReliability}/10`, icon: Star, tone: 'accent' as const },
    { label: 'Avg Credit (days)', value: intel.avgCreditPeriod, icon: Clock, tone: 'neutral' as const },
  ];

  const typeEntries = Object.entries(intel.supplierTypes).sort((a, b) => b[1] - a[1]);
  const categoryEntries = Object.entries(intel.preferredCategories).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label} className="border-0 bg-gradient-to-br from-slate-800 via-surface to-surface transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
              <CardBody className="flex items-center gap-3">
                <span className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl shadow-[0_0_18px_rgba(52,211,153,0.12)]',
                  m.tone === 'accent' && 'bg-accent-soft text-accent',
                  m.tone === 'success' && 'bg-success-bg text-success',
                  m.tone === 'danger' && 'bg-accent-soft text-danger',
                  m.tone === 'neutral' && 'bg-bg text-ink-soft',
                )}>
                  <Icon size={18} />
                </span>
                <div>
                  <div className="data-num text-2xl font-bold text-ink">{m.value}</div>
                  <div className="label-eyebrow">{m.label}</div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Supplier type distribution */}
        <Card>
          <CardHeader className="flex items-center gap-2">
            <PieChart size={15} className="text-muted" />
            <h3 className="font-display text-base font-semibold tracking-tight text-ink">Supplier Distribution</h3>
          </CardHeader>
          <CardBody className="space-y-2">
            {typeEntries.length === 0 ? (
              <p className="text-sm text-muted">No suppliers yet.</p>
            ) : (
              typeEntries.map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-ink-soft">{SUPPLIER_TYPE_LABELS[type] || type}</span>
                  <Badge tone="neutral">{count}</Badge>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Preferred categories */}
        <Card className="overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-violet-500/[0.08] via-surface to-surface shadow-card">
          <CardHeader className="flex items-center gap-2">
            <PieChart size={15} className="text-muted" />
            <h3 className="font-display text-base font-semibold tracking-tight text-ink">Preferred Categories</h3>
          </CardHeader>
          <CardBody className="space-y-2">
            {categoryEntries.length === 0 ? (
              <p className="text-sm text-muted">No categories set.</p>
            ) : (
              categoryEntries.map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm text-ink-soft capitalize">{cat}</span>
                  <Badge tone="accent">{count}</Badge>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      {/* Smart insights */}
      <Card className="overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-br from-accent-soft/45 via-surface to-sky-500/[0.06] shadow-card">
        <CardHeader className="flex items-center gap-2">
          <Lightbulb size={15} className="text-accent" />
          <h3 className="font-display text-base font-semibold tracking-tight text-ink">Smart Insights</h3>
        </CardHeader>
        <CardBody className="space-y-2">
          {insights.map((ins, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-ink-soft">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              {ins}
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
