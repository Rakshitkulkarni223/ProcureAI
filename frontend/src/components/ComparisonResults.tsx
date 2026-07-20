import React, { useMemo, useState, useCallback } from 'react';
import { ExternalLink, Crown, ArrowUpDown, PackageX, Download, FileText, Eye, EyeOff, Store, Building2, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product, SortOption, TotalCostBreakdown } from '../types';
import { Badge } from './ui/Badge';
import { Switch } from './ui/Switch';
import { SupplierLogo } from './SupplierLogo';
import { ProductImage } from './ProductImage';
import { RatingStars } from './RatingStars';
import { formatINR, formatNumber, deliveryLabel } from '../lib/format';
import { cn } from '../lib/utils';
import { exportToCSV, exportToPDF } from '../lib/exportUtils';
import { useWatchlist } from '../hooks/useWatchlist';

const SORTS: { value: SortOption; label: string }[] = [
  { value: 'lowest_price', label: 'Lowest Price' },
  { value: 'lowest_total_cost', label: 'Lowest Total Cost' },
  { value: 'highest_rating', label: 'Highest Rating' },
  { value: 'fastest_delivery', label: 'Fastest Delivery' },
  { value: 'highest_discount', label: 'Highest Discount' },
];

const defaultSorters: Record<string, (a: Product, b: Product) => number> = {
  lowest_price: (a, b) => a.price - b.price,
  highest_rating: (a, b) => b.rating - a.rating,
  fastest_delivery: (a, b) => a.deliveryDays - b.deliveryDays,
  highest_discount: (a, b) => b.discount - a.discount,
};

export function ComparisonResults({
  products,
  recommendedSupplier,
  supplierColors,
  categoryIcon,
  initialSort = 'lowest_price',
  query = '',
  category = '',
  recommendation,
  totalCosts,
}: {
  products: Product[];
  recommendedSupplier?: string;
  supplierColors: Record<string, string>;
  categoryIcon?: string;
  initialSort?: SortOption;
  query?: string;
  category?: string;
  recommendation?: { supplier: string; estimatedSavings: number; confidence: number } | null;
  totalCosts?: TotalCostBreakdown[];
}) {
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const watchlist = useWatchlist();
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6;

  // Build lookup: productId -> TotalCostBreakdown
  const costMap = useMemo(() => {
    try {
      const map = new Map<string, TotalCostBreakdown>();
      if (totalCosts) {
        for (const tc of totalCosts) map.set(tc.productId, tc);
      }
      return map;
    } catch { return new Map<string, TotalCostBreakdown>(); }
  }, [totalCosts]);

  const lowestTotalCost = useMemo(() => {
    try {
      if (!totalCosts || totalCosts.length === 0) return 0;
      return Math.min(...totalCosts.map(tc => tc.totalProcurementCost));
    } catch { return 0; }
  }, [totalCosts]);

  // Sorters including total-cost (needs costMap)
  const sorters = useMemo((): Record<SortOption, (a: Product, b: Product) => number> => {
    try {
      return {
        ...defaultSorters,
        lowest_total_cost: (a, b) => {
          const aCost = costMap.get(a.id)?.totalProcurementCost ?? a.price;
          const bCost = costMap.get(b.id)?.totalProcurementCost ?? b.price;
          return aCost - bCost;
        },
      } as Record<SortOption, (a: Product, b: Product) => number>;
    } catch { return defaultSorters as Record<SortOption, (a: Product, b: Product) => number>; }
  }, [costMap]);

  const view = useMemo(() => {
    let list = [...products];
    if (inStockOnly) list = list.filter((p) => p.availability);
    if (minRating > 0) list = list.filter((p) => p.rating >= minRating);
    list.sort(sorters[sortBy]);
    return list;
  }, [products, sortBy, inStockOnly, minRating, sorters]);

  // Reset page when filters change
  useMemo(() => { setCurrentPage(1); }, [sortBy, inStockOnly, minRating]);

  const totalPages = Math.ceil(view.length / PAGE_SIZE);
  const paginatedView = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return view.slice(start, start + PAGE_SIZE);
  }, [view, currentPage]);

  const goToPage = useCallback((page: number) => {
    try {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    } catch { /* silent */ }
  }, [totalPages]);

  const cheapest = useMemo(() => (products.length ? Math.min(...products.map((p) => p.price)) : 0), [products]);

  return (
    <div className="space-y-4" data-testid="comparison-results">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
            Supplier Comparison
          </h3>
          <Badge tone="neutral" data-testid="results-count">
            {view.length} of {products.length}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => exportToCSV(view, query)}
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-ink/40 hover:text-ink"
            title="Export as CSV"
          >
            <Download size={13} /> CSV
          </button>
          <button
            onClick={() => exportToPDF(view, query, category, recommendation)}
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-ink/40 hover:text-ink"
            title="Export as PDF report"
          >
            <FileText size={13} /> PDF
          </button>
          <label className="flex items-center gap-2 text-xs text-muted">
            <span>In stock only</span>
            <Switch checked={inStockOnly} onCheckedChange={setInStockOnly} data-testid="filter-instock" />
          </label>
          <div className="relative">
            <select
              data-testid="filter-rating"
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="h-9 appearance-none rounded-md border border-line bg-surface pl-3 pr-8 text-xs font-medium text-ink focus:outline-none focus:border-ink"
            >
              <option value={0}>Any rating</option>
              <option value={4}>4★ & up</option>
              <option value={4.5}>4.5★ & up</option>
            </select>
          </div>
          <div className="relative">
            <ArrowUpDown size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <select
              data-testid="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-9 appearance-none rounded-md border border-line bg-surface pl-8 pr-8 text-xs font-medium text-ink focus:outline-none focus:border-ink"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {view.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-line bg-surface py-12 text-muted">
          <PackageX size={28} />
          <p className="text-sm">No suppliers match these filters.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-md border border-line bg-surface lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-bg text-left">
                  <th className="px-4 py-2.5 label-eyebrow">Supplier</th>
                  <th className="px-4 py-2.5 label-eyebrow">Source</th>
                  <th className="px-4 py-2.5 label-eyebrow">Product</th>
                  <th className="px-4 py-2.5 label-eyebrow text-right">Price</th>
                  <th className="px-4 py-2.5 label-eyebrow text-right">Total Cost</th>
                  <th className="px-4 py-2.5 label-eyebrow text-center">Discount</th>
                  <th className="px-4 py-2.5 label-eyebrow text-center">Rating</th>
                  <th className="px-4 py-2.5 label-eyebrow text-center">Delivery</th>
                  <th className="px-4 py-2.5 label-eyebrow text-center">Stock</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedView.map((p, idx) => {
                  const isBest = p.provider === recommendedSupplier;
                  return (
                    <tr
                      key={p.id}
                      data-testid={`comparison-row-${p.provider}`}
                      className={cn(
                        'border-b border-line last:border-0 transition-colors',
                        isBest ? 'bg-accent-soft/50' : idx % 2 ? 'bg-bg/40' : 'bg-surface',
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <SupplierLogo name={p.provider} color={supplierColors[p.provider]} size={30} />
                          <div>
                            <div className="font-semibold text-ink flex items-center gap-1.5">
                              {p.provider}
                              {isBest && (
                                <Badge tone="accent" className="gap-1">
                                  <Crown size={10} /> Best
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted">{p.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {p.supplierSource === 'supplier_hub' ? (
                          <Badge tone="neutral" className="gap-1">
                            <Building2 size={10} /> My Supplier
                          </Badge>
                        ) : (
                          <Badge tone="accent" className="gap-1">
                            <Store size={10} /> Marketplace
                          </Badge>
                        )}
                        {p.city && (
                          <div className="mt-1 flex items-center gap-0.5 text-[10px] text-muted">
                            <MapPin size={8} className="shrink-0" /> {p.city}
                            {p.distanceKm != null && p.distanceKm > 0 && (
                              <span className="text-muted/70">({p.distanceKm}km)</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <ProductImage
                            src={p.image}
                            alt={p.title}
                            icon={categoryIcon}
                            className="h-9 w-9 rounded-md border border-line"
                          />
                          <span className="line-clamp-1 max-w-[200px] text-ink-soft">{p.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className={cn('data-num font-bold', p.price === cheapest ? 'text-success' : 'text-ink')}>
                          {formatINR(p.price)}
                        </div>
                        {p.discount > 0 && (
                          <div className="data-num text-[11px] text-muted line-through">
                            {formatINR(p.originalPrice)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(() => {
                          try {
                            const tc = costMap.get(p.id);
                            if (!tc) return <span className="text-xs text-muted">—</span>;
                            const logistics = tc.totalProcurementCost - tc.productPrice;
                            const isLowest = tc.totalProcurementCost === lowestTotalCost;
                            return (
                              <div>
                                <div className={cn('data-num font-bold', isLowest ? 'text-success' : 'text-ink')}>
                                  {formatINR(tc.totalProcurementCost)}
                                </div>
                                {logistics > 0 && (
                                  <div className="data-num text-[10px] text-muted">+{formatINR(logistics)} logistics</div>
                                )}
                              </div>
                            );
                          } catch { return <span className="text-xs text-muted">—</span>; }
                        })()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.discount > 0 ? (
                          <Badge tone="success">{p.discount}% off</Badge>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-center">
                          <RatingStars rating={p.rating} />
                          <span className="text-[11px] text-muted">{formatNumber(p.reviews)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('data-num text-xs font-medium', p.deliveryDays === 0 ? 'text-accent' : 'text-ink-soft')}>
                          {deliveryLabel(p.deliveryDays)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.availability ? (
                          <Badge tone="success">In stock</Badge>
                        ) : (
                          <Badge tone="danger">Out</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              try {
                                if (watchlist.isWatching(p.title, p.provider)) return;
                                watchlist.addItem({
                                  title: p.title,
                                  category: category,
                                  supplier: p.provider,
                                  price: p.price,
                                  targetPrice: Math.round(p.price * 0.9),
                                  image: p.image,
                                  productUrl: p.productUrl,
                                });
                              } catch { /* silent */ }
                            }}
                            className={cn(
                              'flex h-7 w-7 items-center justify-center rounded transition-colors',
                              watchlist.isWatching(p.title, p.provider)
                                ? 'bg-accent/10 text-accent'
                                : 'text-muted hover:bg-bg hover:text-accent',
                            )}
                            title={watchlist.isWatching(p.title, p.provider) ? 'Watching' : 'Add to watchlist'}
                          >
                            {watchlist.isWatching(p.title, p.provider) ? <Eye size={13} /> : <EyeOff size={13} />}
                          </button>
                          <a
                            href={p.productUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                          >
                            View <ExternalLink size={12} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface px-4 py-3 lg:mb-24">
              <span className="text-xs text-muted">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, view.length)} of {view.length} products
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors',
                    currentPage === 1
                      ? 'border-line text-muted/40 cursor-not-allowed'
                      : 'border-line text-ink hover:bg-bg',
                  )}
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={cn(
                      'flex h-8 min-w-[2rem] items-center justify-center rounded-md border text-xs font-medium transition-colors',
                      page === currentPage
                        ? 'border-accent bg-accent text-white'
                        : 'border-line text-ink hover:bg-bg',
                    )}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors',
                    currentPage === totalPages
                      ? 'border-line text-muted/40 cursor-not-allowed'
                      : 'border-line text-ink hover:bg-bg',
                  )}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {paginatedView.map((p) => {
              const isBest = p.provider === recommendedSupplier;
              return (
                <div
                  key={p.id}
                  data-testid={`comparison-card-${p.provider}`}
                  className={cn(
                    'rounded-md border bg-surface p-4 shadow-card',
                    isBest ? 'border-accent/50 bg-accent-soft/40' : 'border-line',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <SupplierLogo name={p.provider} color={supplierColors[p.provider]} size={32} />
                      <div>
                        <div className="font-semibold text-ink flex items-center gap-1.5">
                          {p.provider}
                          {isBest && <Crown size={13} className="text-accent" />}
                        </div>
                        <RatingStars rating={p.rating} />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn('data-num text-lg font-bold', p.price === cheapest ? 'text-success' : 'text-ink')}>
                        {formatINR(p.price)}
                      </div>
                      {p.discount > 0 && <Badge tone="success">{p.discount}% off</Badge>}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {p.supplierSource === 'supplier_hub' ? (
                      <Badge tone="neutral" className="gap-1">
                        <Building2 size={10} /> My Supplier
                      </Badge>
                    ) : (
                      <Badge tone="accent" className="gap-1">
                        <Store size={10} /> Marketplace
                      </Badge>
                    )}
                    {p.city && (
                      <span className="flex items-center gap-0.5 text-[10px] text-muted">
                        <MapPin size={8} /> {p.city}
                        {p.distanceKm != null && p.distanceKm > 0 && (
                          <span className="text-muted/70">({p.distanceKm}km)</span>
                        )}
                      </span>
                    )}
                  </div>
                  {(() => {
                    try {
                      const tc = costMap.get(p.id);
                      if (!tc) return null;
                      const logistics = tc.totalProcurementCost - tc.productPrice;
                      const isLowest = tc.totalProcurementCost === lowestTotalCost;
                      return (
                        <div className="mt-2 flex items-center justify-between rounded bg-bg/50 px-2.5 py-1.5 text-xs">
                          <span className="text-muted">Total Cost</span>
                          <span className={cn('data-num font-bold', isLowest ? 'text-success' : 'text-ink')}>
                            {formatINR(tc.totalProcurementCost)}
                            {logistics > 0 && (
                              <span className="ml-1 text-[10px] font-normal text-muted">+{formatINR(logistics)}</span>
                            )}
                          </span>
                        </div>
                      );
                    } catch { return null; }
                  })()}
                  <div className="mt-3 flex items-center justify-between text-xs text-muted">
                    <span>Delivery: {deliveryLabel(p.deliveryDays)}</span>
                    <span>{p.availability ? 'In stock' : 'Out of stock'}</span>
                    <a href={p.productUrl} target="_blank" rel="noreferrer" className="font-medium text-accent">
                      View →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination (bottom — visible on mobile too) */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2.5 sm:px-4 sm:py-3 lg:hidden">
              <span className="text-xs text-muted">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, view.length)} of {view.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors',
                    currentPage === 1
                      ? 'border-line text-muted/40 cursor-not-allowed'
                      : 'border-line text-ink hover:bg-bg',
                  )}
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 text-xs font-medium text-ink">{currentPage}/{totalPages}</span>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors',
                    currentPage === totalPages
                      ? 'border-line text-muted/40 cursor-not-allowed'
                      : 'border-line text-ink hover:bg-bg',
                  )}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
