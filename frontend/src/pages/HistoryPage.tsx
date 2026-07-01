import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, RotateCw, History as HistoryIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import type { HistoryEntry } from '../types';
import { api } from '../lib/api';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { SupplierLogo } from '../components/SupplierLogo';
import { formatINR, formatDate } from '../lib/format';

const PAGE_SIZE = 20;

export function HistoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (p: number) => {
    try {
      setLoading(true);
      const res = await api.history(p, PAGE_SIZE);
      setItems(res.items);
      setPage(res.page);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const goToPage = (p: number) => {
    try {
      const target = Math.max(1, Math.min(p, totalPages));
      load(target);
    } catch {
      // silent
    }
  };

  const remove = async (id: string) => {
    try {
      setItems((prev) => prev.filter((i) => i.id !== id));
      await api.deleteHistory(id);
      const newTotal = total - 1;
      const newTotalPages = Math.ceil(newTotal / PAGE_SIZE) || 1;
      const targetPage = page > newTotalPages ? newTotalPages : page;
      await load(targetPage);
    } catch {
      await load(page);
    }
  };

  return (
    <div className="space-y-7">
      <div>
        <div className="label-eyebrow">Activity</div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Search History</h1>
        <p className="mt-1 text-sm text-muted">Every comparison you've run, with savings and recommendations.</p>
      </div>

      {loading && items.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center text-sm text-muted">Loading…</CardBody>
        </Card>
      ) : !loading && items.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-14 text-center text-muted">
            <HistoryIcon size={26} />
            <p className="text-sm">No searches yet. Head to Search &amp; Compare to begin.</p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            {loading && items.length > 0 && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-medium text-muted shadow-sm">
                  <RotateCw size={14} className="animate-spin" /> Refreshing…
                </span>
              </div>
            )}
            <div className="divide-y divide-line" data-testid="history-list">
              {items.map((h) => (
                <div
                  key={h.id}
                  data-testid={`history-item-${h.id}`}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-bg"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{h.query}</span>
                      <Badge tone="neutral">{h.category}</Badge>
                      <Badge tone="accent">{h.weightProfile}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                      <span>{h.suppliers.length} suppliers compared</span>
                      <span>{formatDate(h.createdAt)}</span>
                      {h.recommendedSupplier && (
                        <span className="flex items-center gap-1.5">
                          <SupplierLogo name={h.recommendedSupplier} size={16} /> {h.recommendedSupplier}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {h.estimatedSavings > 0 && (
                      <span className="data-num text-sm font-semibold text-success">+{formatINR(h.estimatedSavings)}</span>
                    )}
                    <button
                      data-testid={`history-rerun-${h.id}`}
                      onClick={() => navigate('/search', { state: { category: h.category, query: h.query } })}
                      className="rounded-md border border-line p-2 text-muted transition-colors hover:border-ink/40 hover:text-ink"
                      title="Re-run search"
                    >
                      <RotateCw size={15} />
                    </button>
                    <button
                      data-testid={`history-delete-${h.id}`}
                      onClick={() => remove(h.id)}
                      className="rounded-md border border-line p-2 text-muted transition-colors hover:border-danger/40 hover:text-danger"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-line px-5 py-3" data-testid="history-pagination">
                <span className="text-xs text-muted">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    data-testid="history-prev"
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1 || loading}
                    className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-ink/40 hover:text-ink disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span className="text-xs font-medium text-ink" data-testid="history-page-info">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    data-testid="history-next"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages || loading}
                    className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-ink/40 hover:text-ink disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
