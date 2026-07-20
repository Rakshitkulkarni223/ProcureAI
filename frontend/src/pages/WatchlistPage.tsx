import React, { useState } from 'react';
import { Eye, Trash2, ExternalLink, Bell, TrendingDown, AlertTriangle, Target } from 'lucide-react';
import { useWatchlist } from '../hooks/useWatchlist';
import type { WatchlistItem } from '../hooks/useWatchlist';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ProductImage } from '../components/ProductImage';
import { SupplierLogo } from '../components/SupplierLogo';
import { formatINR } from '../lib/format';
import { cn } from '../lib/utils';

export function WatchlistPage() {
  const { items, removeItem, updateTargetPrice, clearAll } = useWatchlist();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (item: WatchlistItem) => {
    try {
      setEditingId(item.id);
      setEditValue(String(item.targetPrice));
    } catch {
      // silent
    }
  };

  const saveEdit = (id: string) => {
    try {
      const price = parseInt(editValue, 10);
      if (!isNaN(price) && price > 0) {
        updateTargetPrice(id, price);
      }
      setEditingId(null);
    } catch {
      // silent
    }
  };

  const belowTarget = items.filter((i) => i.price <= i.targetPrice);
  const aboveTarget = items.filter((i) => i.price > i.targetPrice);

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-slate-950 via-surface to-amber-500/[0.08] p-5 shadow-card sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <div className="label-eyebrow flex items-center gap-1.5">
            <Eye size={11} /> Price Watchlist
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">
            Watchlist
          </h1>
          <p className="mt-1 text-sm text-muted">
            Track products and set target prices. Get notified when prices drop.
          </p>
        </div>
        {items.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearAll}
            className="text-danger hover:bg-danger/10"
          >
            <Trash2 size={14} /> Clear all
          </Button>
        )}
      </section>

      {/* Summary cards */}
      {items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-0 bg-gradient-to-br from-emerald-500/[0.12] via-surface to-surface transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
            <CardBody className="flex items-center gap-3 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-accent shadow-[0_0_18px_rgba(52,211,153,0.14)]">
                <Eye size={18} />
              </div>
              <div>
                <div className="text-xs text-muted">Watching</div>
                <div className="text-xl font-bold text-ink">{items.length}</div>
              </div>
            </CardBody>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-sky-500/[0.12] via-surface to-surface transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
            <CardBody className="flex items-center gap-3 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300 shadow-[0_0_18px_rgba(56,189,248,0.14)]">
                <TrendingDown size={18} />
              </div>
              <div>
                <div className="text-xs text-muted">Below target</div>
                <div className="text-xl font-bold text-success">{belowTarget.length}</div>
              </div>
            </CardBody>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-amber-500/[0.12] via-surface to-surface transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
            <CardBody className="flex items-center gap-3 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.14)]">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="text-xs text-muted">Above target</div>
                <div className="text-xl font-bold text-warning">{aboveTarget.length}</div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {items.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/10 text-muted">
              <Bell size={28} />
            </div>
            <h3 className="font-display text-lg font-semibold text-ink">
              No items on your watchlist
            </h3>
            <p className="max-w-sm text-sm text-muted">
              Search for products and click the <Eye size={13} className="inline -mt-0.5" /> watch button 
              in the comparison table to track prices.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Below target alert */}
          {belowTarget.length > 0 && (
            <div className="rounded-xl border border-success/40 bg-success-bg/50 px-4 py-3 shadow-[0_0_22px_rgba(52,211,153,0.10)]">
              <div className="flex items-center gap-2 text-sm font-medium text-success">
                <TrendingDown size={15} />
                {belowTarget.length} item{belowTarget.length > 1 ? 's' : ''} at or below your target price!
              </div>
            </div>
          )}

          {/* Watchlist items */}
          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-bg text-left">
                  <th className="px-4 py-2.5 label-eyebrow">Product</th>
                  <th className="px-4 py-2.5 label-eyebrow">Supplier</th>
                  <th className="px-4 py-2.5 label-eyebrow text-right">Current Price</th>
                  <th className="px-4 py-2.5 label-eyebrow text-right">Target Price</th>
                  <th className="px-4 py-2.5 label-eyebrow text-center">Status</th>
                  <th className="px-4 py-2.5 label-eyebrow text-center">Added</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const atTarget = item.price <= item.targetPrice;
                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        'border-b border-line last:border-0 transition-colors',
                        atTarget ? 'bg-success-bg/30' : 'hover:bg-bg/70',
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <ProductImage
                            src={item.image}
                            alt={item.title}
                            className="h-9 w-9 rounded-md border border-line"
                          />
                          <div>
                            <div className="font-medium text-ink line-clamp-1 max-w-[200px]">{item.title}</div>
                            <div className="text-xs text-muted">{item.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <SupplierLogo name={item.supplier} size={22} />
                          <span className="text-sm text-ink">{item.supplier}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="data-num font-bold text-ink">{formatINR(item.price)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingId === item.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-xs text-muted">₹</span>
                            <input
                              autoFocus
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => saveEdit(item.id)}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(item.id); }}
                              className="h-7 w-20 rounded border border-accent bg-bg px-2 text-right text-xs text-ink focus:outline-none"
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(item)}
                            className="group inline-flex items-center gap-1 text-right"
                            title="Click to edit target price"
                          >
                            <span className="data-num font-bold text-accent">{formatINR(item.targetPrice)}</span>
                            <Target size={11} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {atTarget ? (
                          <Badge tone="success">✓ At target</Badge>
                        ) : (
                          <Badge tone="warning">Above</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-muted">
                        {new Date(item.addedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <a
                            href={item.productUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-7 w-7 items-center justify-center rounded text-muted transition-colors hover:bg-bg hover:text-accent"
                            title="View product"
                          >
                            <ExternalLink size={13} />
                          </a>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="flex h-7 w-7 items-center justify-center rounded text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                            title="Remove from watchlist"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
