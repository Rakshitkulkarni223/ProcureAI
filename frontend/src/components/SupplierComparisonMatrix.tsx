import React from 'react';
import { motion } from 'framer-motion';
import { Table2, Check } from 'lucide-react';
import type { ComparisonMatrix } from '../types';
import { SupplierLogo } from './SupplierLogo';
import { cn } from '../lib/utils';

export function SupplierComparisonMatrix({
  matrix,
  supplierColors,
}: {
  matrix: ComparisonMatrix;
  supplierColors: Record<string, string>;
}) {
  try {
    if (!matrix || !matrix.suppliers || matrix.suppliers.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        data-testid="supplier-comparison-matrix"
        className="overflow-hidden rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-500/[0.08] via-surface to-slate-950 shadow-card"
      >
        <div className="flex items-center gap-2 border-b border-sky-400/15 px-5 py-3">
          <Table2 size={16} className="text-accent" />
          <span className="label-eyebrow text-accent">Supplier Comparison Matrix</span>
          <span className="ml-auto text-[10px] text-muted">Estimated</span>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-slate-950/35">
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted">Criteria</th>
                {matrix.suppliers.map(s => (
                  <th key={s} className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted">
                    <div className="flex flex-col items-center gap-1">
                      <SupplierLogo name={s} color={supplierColors[s]} size={24} />
                      <span className="text-xs">{s}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.criteria.map(criterion => (
                <tr key={criterion} className="border-b border-line last:border-0 transition-colors hover:bg-white/[0.025]">
                  <td className="px-3 py-2.5 font-medium text-ink">{criterion}</td>
                  {matrix.suppliers.map(supplier => {
                    const isBest = matrix.matrix?.[supplier]?.[criterion];
                    return (
                      <td key={supplier} className="px-3 py-2.5 text-center">
                        {isBest ? (
                          <span className="inline-flex items-center justify-center rounded-full bg-success-bg p-1 text-success" data-testid={`matrix-best-${supplier}-${criterion}`}>
                            <Check size={14} strokeWidth={3} />
                          </span>
                        ) : (
                          <span className="text-muted/30">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-line px-4 py-2.5 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1">
            <span className="inline-flex items-center justify-center rounded-full bg-success-bg p-0.5 text-success">
              <Check size={10} strokeWidth={3} />
            </span>
            = Best value for this criterion
          </span>
        </div>
      </motion.div>
    );
  } catch {
    return null;
  }
}
