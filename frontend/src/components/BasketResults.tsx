import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Split, Layers, Truck, Gauge, Check, PackageX, Store, Building2, ArrowUpDown, MapPin } from 'lucide-react';
import type { BasketOptimizeResponse } from '../types';
import { Badge } from './ui/Badge';
import { SupplierLogo } from './SupplierLogo';
import { formatINR } from '../lib/format';
import { cn } from '../lib/utils';
import { BasketIntelligencePanel } from './BasketIntelligencePanel';
import { SupplierIntelligenceCard } from './SupplierIntelligenceCard';

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
  const allUnfulfillable = result.items.every((i) => !i.availability);

  const headline = isSplit
    ? saved
      ? `Save ${formatINR(result.estimatedSavings)} by splitting across ${result.supplierCount} suppliers`
      : `Optimised across ${result.supplierCount} supplier${result.supplierCount > 1 ? 's' : ''}`
    : `Bundle everything at ${result.baseline.supplier} to save ${formatINR(result.estimatedSavings)}`;

  if (allUnfulfillable) {
    return (
      <div className="space-y-6 animate-fade-up" data-testid="basket-results">
        <div className="flex flex-col items-center gap-3 rounded-md border border-line bg-surface py-14 text-center shadow-card">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
            <PackageX size={22} />
          </span>
          <h3 className="font-display text-lg font-semibold text-ink">
            No matching products found
          </h3>
          <p className="max-w-md text-sm text-muted">
            None of the items in your basket matched any products in our catalog.
            Try using specific product names like "Laptop", "Rice", or "Office Chair".
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {result.unfulfillable.map((item) => (
              <span key={item} className="rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-xs font-medium text-danger">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up" data-testid="basket-results">
      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        data-testid="basket-summary"
        className="relative overflow-hidden rounded-3xl border border-emerald-400/30 bg-[linear-gradient(120deg,#07111f_0%,#103349_58%,#075b53_130%)] shadow-[0_20px_50px_rgba(15,23,42,0.16)]"
      >
        <div className="absolute inset-x-0 top-0 h-1 overflow-hidden">
          <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-accent to-transparent animate-scan" />
        </div>

        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">
          <div>
            <div className="flex items-center gap-2 text-accent">
              {isSplit ? <Split size={16} /> : <Layers size={16} />}
              <span className="label-eyebrow text-accent">
                {isSplit ? 'Split-Cart Recommendation' : 'Consolidation Recommendation'}
              </span>
            </div>
            <h3
              className="mt-2 font-display text-2xl font-bold leading-tight tracking-tight text-white"
              data-testid="basket-headline"
            >
              {headline}
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <span className="flex items-center gap-1.5">
                <Truck size={14} /> Delivered by <span className="font-semibold text-white">{result.estimatedDelivery}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Gauge size={14} /> <span className="data-num font-semibold text-white">{confidencePct}%</span> confidence
              </span>
              <span className="flex items-center gap-1.5">
                <Store size={14} /> <span className="data-num font-semibold text-white">{result.supplierCount}</span>{' '}
                supplier{result.supplierCount > 1 ? 's' : ''}
              </span>
            </div>

            {result.unfulfillable.length > 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-warning-bg px-3 py-2 text-xs text-amber-700">
                <PackageX size={14} /> Not found in catalog: {result.unfulfillable.join(', ')}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/45 p-3.5 backdrop-blur-sm">
              <div className="label-eyebrow">Optimised total</div>
              <div className="data-num mt-1.5 text-2xl font-bold text-ink" data-testid="basket-total">
                {formatINR(result.splitTotal)}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/45 p-3.5 backdrop-blur-sm">
              <div className="label-eyebrow">Single supplier</div>
              <div className="data-num mt-1.5 text-lg font-semibold text-muted line-through">
                {formatINR(result.baseline.total)}
              </div>
              <div className="mt-0.5 text-[11px] text-muted">{result.baseline.supplier || '—'}</div>
            </div>
            <div className="col-span-2 rounded-xl border border-emerald-300/35 bg-emerald-400/10 p-3.5 shadow-[0_0_22px_rgba(52,211,153,0.12)]">
              <div className="label-eyebrow text-emerald-700">You save</div>
              <div className="data-num mt-1 text-2xl font-bold text-success" data-testid="basket-savings">
                {formatINR(result.estimatedSavings)}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Basket Intelligence Panel */}
      {result.intelligence && (
        <BasketIntelligencePanel
          intelligence={result.intelligence}
          supplierColors={supplierColors}
        />
      )}

      {/* Supplier Intelligence Cards */}
      {result.intelligence?.supplierIntelligence &&
        Object.keys(result.intelligence.supplierIntelligence).length > 0 && (
          <div>
            <div className="label-eyebrow mb-3">Supplier Intelligence</div>
            <div className="grid items-start gap-3 sm:grid-cols-2">
              {Object.entries(result.intelligence.supplierIntelligence).map(([supplier, intel]) => (
                <SupplierIntelligenceCard
                  key={supplier}
                  supplier={supplier}
                  intelligence={intel}
                  color={supplierColors[supplier]}
                />
              ))}
            </div>
          </div>
        )}

      {/* Supplier Mix Summary */}
      <div className="rounded-md border border-line bg-surface p-4 shadow-card">
        <div className="label-eyebrow mb-3">Supplier Mix</div>
        <div className="flex flex-wrap gap-3">
          {(() => {
            try {
              const marketplaceCount = groups.filter(([, g]) => g.supplierSource !== 'supplier_hub').length;
              const supplierHubCount = groups.filter(([, g]) => g.supplierSource === 'supplier_hub').length;
              const marketplaceSubtotal = groups.filter(([, g]) => g.supplierSource !== 'supplier_hub').reduce((sum, [, g]) => sum + g.subtotal, 0);
              const supplierHubSubtotal = groups.filter(([, g]) => g.supplierSource === 'supplier_hub').reduce((sum, [, g]) => sum + g.subtotal, 0);
              return (
                <>
                  {marketplaceCount > 0 && (
                    <div className="flex-1 min-w-[180px] rounded-md border border-accent/30 bg-accent-soft/20 p-3">
                      <div className="flex items-center gap-2 text-accent">
                        <Store size={14} />
                        <span className="text-sm font-semibold">Marketplace</span>
                      </div>
                      <div className="mt-1.5 text-xs text-muted">
                        {marketplaceCount} supplier{marketplaceCount > 1 ? 's' : ''} · {formatINR(marketplaceSubtotal)}
                      </div>
                    </div>
                  )}
                  {supplierHubCount > 0 && (
                    <div className="flex-1 min-w-[180px] rounded-md border border-line bg-bg/40 p-3">
                      <div className="flex items-center gap-2 text-ink-soft">
                        <Building2 size={14} />
                        <span className="text-sm font-semibold">My Supplier Network</span>
                      </div>
                      <div className="mt-1.5 text-xs text-muted">
                        {supplierHubCount} supplier{supplierHubCount > 1 ? 's' : ''} · {formatINR(supplierHubSubtotal)}
                      </div>
                    </div>
                  )}
                </>
              );
            } catch {
              return null;
            }
          })()}
        </div>
      </div>

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
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span>{group.eta}</span>
                      {group.city && (
                        <span className="flex items-center gap-0.5">
                          <MapPin size={9} /> {group.city}
                          {group.distanceKm != null && group.distanceKm > 0 && (
                            <span className="text-muted/70">({group.distanceKm}km)</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {group.supplierSource === 'supplier_hub' ? (
                    <Badge tone="neutral" className="gap-1">
                      <Building2 size={10} /> My Supplier
                    </Badge>
                  ) : (
                    <Badge tone="accent" className="gap-1">
                      <Store size={10} /> Marketplace
                    </Badge>
                  )}
                  <Badge tone="neutral">{group.items.length} item{group.items.length > 1 ? 's' : ''}</Badge>
                </div>
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
        <div className="border-b border-line bg-bg px-4 py-2.5">
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
                    {item.supplierSource === 'supplier_hub' ? (
                      <Badge tone="neutral" className="gap-1">
                        <Building2 size={9} /> My Supplier
                      </Badge>
                    ) : (
                      <Badge tone="accent" className="gap-1">
                        <Store size={9} /> Marketplace
                      </Badge>
                    )}
                  </span>
                ) : (
                  <Badge tone="danger">Not Found</Badge>
                )}
                <span className="data-num w-24 text-right text-sm font-semibold text-ink">
                  {item.availability ? formatINR(item.lineTotal) : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-item supplier comparison */}
      {result.comparisons && result.comparisons.length > 0 && (
        <SupplierComparisonDropdown
          comparisons={result.comparisons}
          items={result.items}
          supplierColors={supplierColors}
        />
      )}
    </div>
  );
}

function SupplierComparisonDropdown({
  comparisons,
  items,
  supplierColors,
}: {
  comparisons: NonNullable<BasketOptimizeResponse['comparisons']>;
  items: BasketOptimizeResponse['items'];
  supplierColors: Record<string, string>;
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  try {
    const cmp = comparisons[selectedIdx];
    if (!cmp) return null;

    const chosenItem = items.find((it) => it.query === cmp.query);
    const chosenSupplier = chosenItem?.supplier;

    return (
      <div className="overflow-hidden rounded-md border border-line bg-surface">
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-bg px-4 py-2.5 sm:flex-nowrap sm:gap-3">
          <ArrowUpDown size={14} className="text-muted shrink-0" />
          <span className="label-eyebrow shrink-0">Supplier Comparison</span>
          <select
            value={selectedIdx}
            onChange={(e) => { try { setSelectedIdx(Number(e.target.value)); } catch { /* silent */ } }}
            className="ml-auto min-w-0 max-w-full truncate rounded-md border border-line bg-surface px-2.5 py-1 text-sm text-ink focus:border-accent focus:outline-none sm:max-w-[260px]"
          >
            {comparisons.map((c, i) => {
              const label = c.query.length > 30 ? c.query.slice(0, 30) + '…' : c.query;
              return (
                <option key={`${c.query}-${i}`} value={i}>
                  {label} ({c.suppliers.length} supplier{c.suppliers.length > 1 ? 's' : ''})
                </option>
              );
            })}
          </select>
        </div>

        <div className="px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-medium text-ink">{cmp.query}</span>
            {chosenItem && chosenItem.quantity > 1 && (
              <Badge tone="neutral">×{chosenItem.quantity}</Badge>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="pb-1.5 pr-3 font-medium">Supplier</th>
                  <th className="pb-1.5 pr-3 font-medium">Source</th>
                  <th className="pb-1.5 pr-3 font-medium">Location</th>
                  <th className="pb-1.5 pr-3 text-right font-medium">Unit Price</th>
                  <th className="pb-1.5 pr-3 text-right font-medium">Line Total</th>
                  <th className="pb-1.5 pr-3 text-right font-medium">Delivery</th>
                  <th className="pb-1.5 text-right font-medium">Rating</th>
                </tr>
              </thead>
              <tbody>
                {cmp.suppliers.map((s, si) => {
                  const isChosen = s.supplier === chosenSupplier;
                  const isCheapest = si === 0;
                  return (
                    <tr
                      key={`${s.supplier}-${si}`}
                      className={cn(
                        'border-b border-line/50 last:border-0',
                        isChosen && 'bg-accent-soft/30'
                      )}
                    >
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <SupplierLogo name={s.supplier} color={supplierColors[s.supplier]} size={20} />
                          <span className={cn('font-medium', isChosen ? 'text-ink' : 'text-ink-soft')}>
                            {s.supplier}
                          </span>
                          {isChosen && (
                            <Badge tone="accent" className="gap-1 text-[10px]">
                              <Check size={9} /> Chosen
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        {s.supplierSource === 'supplier_hub' ? (
                          <Badge tone="neutral" className="gap-1">
                            <Building2 size={9} /> My Supplier
                          </Badge>
                        ) : (
                          <Badge tone="accent" className="gap-1">
                            <Store size={9} /> Marketplace
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        {s.city ? (
                          <div className="flex items-center gap-1 text-xs text-muted">
                            <MapPin size={10} className="shrink-0" />
                            <span>{s.city}</span>
                            {s.distanceKm != null && s.distanceKm > 0 && (
                              <span className="text-[10px] text-muted/70">({s.distanceKm}km)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted/50">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <span className={cn('data-num', isCheapest && 'font-semibold text-success')}>
                          {formatINR(s.price)}
                        </span>
                        {isCheapest && cmp.suppliers.length > 1 && (
                          <span className="ml-1 text-[10px] text-success">lowest</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right data-num text-ink-soft">
                        {formatINR(s.lineTotal)}
                      </td>
                      <td className="py-2 pr-3 text-right text-xs text-muted">
                        {s.deliveryDays}d
                      </td>
                      <td className="py-2 text-right text-xs text-muted">
                        {s.rating > 0 ? s.rating.toFixed(1) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  } catch {
    return null;
  }
}
