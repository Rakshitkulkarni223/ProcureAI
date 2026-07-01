import React from 'react';
import { motion } from 'framer-motion';
import { Split, Layers, Truck, Gauge, Check, PackageX, Store } from 'lucide-react';
import type { BasketOptimizeResponse } from '../types';
import { Badge } from './ui/Badge';
import { SupplierLogo } from './SupplierLogo';
import { formatINR } from '../lib/format';
import { cn } from '../lib/utils';

export function BasketResults({
  result,
  supplierColors,
}: {
  result: BasketOptimizeResponse;
  supplierColors: Record<string, string>;
}) {
  const isSplit = result.recommendedPlan === 'split';
  const confidencePct = Math.round(result.confidence * 100);
  const saved = result.estimatedSavings > 0;
  const groups = Object.entries(result.groupedBySupplier);

  const headline = isSplit
    ? saved
      ? `Save ${formatINR(result.estimatedSavings)} by splitting across ${result.supplierCount} suppliers`
      : `Optimised across ${result.supplierCount} supplier${result.supplierCount > 1 ? 's' : ''}`
    : `Bundle everything at ${result.baseline.supplier} to save ${formatINR(result.estimatedSavings)}`;

  return (
    <div className="space-y-6 animate-fade-up" data-testid="basket-results">
      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        data-testid="basket-summary"
        className="relative overflow-hidden rounded-md border border-accent/40 bg-accent-soft/40 shadow-card"
      >
        <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
          <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-accent to-transparent animate-scan" />
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="flex items-center gap-2 text-accent">
              {isSplit ? <Split size={16} /> : <Layers size={16} />}
              <span className="label-eyebrow text-accent">
                {isSplit ? 'Split-Cart Recommendation' : 'Consolidation Recommendation'}
              </span>
            </div>
            <h3
              className="mt-2 font-display text-2xl font-bold leading-tight tracking-tight text-ink"
              data-testid="basket-headline"
            >
              {headline}
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Truck size={14} /> Delivered by <span className="font-semibold text-ink">{result.estimatedDelivery}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Gauge size={14} /> <span className="data-num font-semibold text-ink">{confidencePct}%</span> confidence
              </span>
              <span className="flex items-center gap-1.5">
                <Store size={14} /> <span className="data-num font-semibold text-ink">{result.supplierCount}</span>{' '}
                supplier{result.supplierCount > 1 ? 's' : ''}
              </span>
            </div>

            {result.unfulfillable.length > 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-warning-bg px-3 py-2 text-xs text-amber-700">
                <PackageX size={14} /> Out of stock everywhere: {result.unfulfillable.join(', ')}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-line bg-surface p-3.5">
              <div className="label-eyebrow">Optimised total</div>
              <div className="data-num mt-1.5 text-2xl font-bold text-ink" data-testid="basket-total">
                {formatINR(result.splitTotal)}
              </div>
            </div>
            <div className="rounded-md border border-line bg-surface p-3.5">
              <div className="label-eyebrow">Single supplier</div>
              <div className="data-num mt-1.5 text-lg font-semibold text-muted line-through">
                {formatINR(result.baseline.total)}
              </div>
              <div className="mt-0.5 text-[11px] text-muted">{result.baseline.supplier || '—'}</div>
            </div>
            <div className="col-span-2 rounded-md border border-success/30 bg-success-bg/50 p-3.5">
              <div className="label-eyebrow text-emerald-700">You save</div>
              <div className="data-num mt-1 text-2xl font-bold text-success" data-testid="basket-savings">
                {formatINR(result.estimatedSavings)}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grouped by supplier */}
      <div>
        <h3 className="mb-3 font-display text-lg font-semibold tracking-tight text-ink">Your baskets by supplier</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map(([supplier, group]) => (
            <div
              key={supplier}
              data-testid={`basket-group-${supplier}`}
              className="flex flex-col rounded-md border border-line bg-surface p-4 shadow-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <SupplierLogo name={supplier} color={supplierColors[supplier]} size={32} />
                  <div>
                    <div className="font-semibold text-ink">{supplier}</div>
                    <div className="text-xs text-muted">{group.eta}</div>
                  </div>
                </div>
                <Badge tone="neutral">{group.items.length} item{group.items.length > 1 ? 's' : ''}</Badge>
              </div>
              <ul className="mt-3 flex-1 space-y-1.5">
                {group.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-ink-soft">
                    <Check size={13} className="text-success" /> {item}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="label-eyebrow">Subtotal</span>
                <span className="data-num font-bold text-ink">{formatINR(group.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-item breakdown */}
      <div className="overflow-hidden rounded-md border border-line bg-surface">
        <div className="border-b border-line bg-slate-50 px-4 py-2.5">
          <span className="label-eyebrow">Item-by-item assignment</span>
        </div>
        <div className="divide-y divide-line">
          {result.items.map((item, i) => (
            <div
              key={`${item.query}-${i}`}
              data-testid={`basket-item-${i}`}
              className={cn('flex flex-wrap items-center justify-between gap-3 px-4 py-3', !item.availability && 'opacity-70')}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">{item.title}</span>
                  {item.quantity > 1 && <Badge tone="neutral">×{item.quantity}</Badge>}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted">
                  {item.reasons.map((r, ri) => (
                    <span key={ri} className="flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-muted" /> {r}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {item.supplier ? (
                  <span className="flex items-center gap-2">
                    <SupplierLogo name={item.supplier} color={supplierColors[item.supplier]} size={24} />
                    <span className="text-sm font-medium text-ink">{item.supplier}</span>
                  </span>
                ) : (
                  <Badge tone="danger">Out of stock</Badge>
                )}
                <span className="data-num w-24 text-right text-sm font-semibold text-ink">
                  {item.availability ? formatINR(item.lineTotal) : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
