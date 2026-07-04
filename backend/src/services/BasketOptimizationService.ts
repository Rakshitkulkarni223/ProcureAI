import { CATEGORY_SUPPLIERS } from '../config/data';
import { ApiError } from '../utils/http';
import { logger } from '../utils/logger';
import {
  Product,
  WeightProfileKey,
  BasketItemInput,
  BasketItemResult,
  BasketSupplierGroup,
  BasketOptimizeResponse,
} from '../types';
import { RecommendationService } from './RecommendationService';
import { SearchService } from './SearchService';
import { basketHistoryRepository } from '../repositories/BasketHistoryRepository';

export interface BasketItemOptions {
  query: string;
  quantity: number;
  products: Product[]; // one normalized offer per supplier (may be out of stock)
}

function etaLabel(days: number): string {
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

/**
 * Split-Cart Optimizer (Multi-Supplier Basket).
 *
 * Composes the existing weighted RecommendationEngine per item to pick the best
 * supplier for each line, then compares a SPLIT plan (each item to its best
 * supplier) against a CONSOLIDATED baseline (everything from one supplier). A
 * per-supplier consolidation penalty models delivery/handling cost, so the
 * optimizer genuinely trades cheaper item prices against fewer deliveries.
 *
 * `buildPlan` is a PURE function (no I/O) so it is deterministically unit-testable.
 */
export class BasketOptimizationService {
  static buildPlan(
    items: BasketItemOptions[],
    consolidationPenalty = 0,
    weightProfile: WeightProfileKey = 'balanced',
  ): Omit<BasketOptimizeResponse, 'category' | 'weightProfile'> {
    const penalty = Math.max(0, consolidationPenalty || 0);
    const unfulfillable: string[] = [];

    // --- Per-item analysis: best in-stock supplier by weighted score ---
    const analyses = items.map((item) => {
      const qty = Math.max(1, Math.round(item.quantity || 1));
      const inStock = item.products.filter((p) => p.availability);
      const bySupplier = new Map<string, Product>();
      for (const p of inStock) {
        const existing = bySupplier.get(p.provider);
        if (!existing || p.price < existing.price) bySupplier.set(p.provider, p);
      }
      let best: Product | null = null;
      let reasons: string[] = [];
      if (bySupplier.size) {
        const rec = RecommendationService.recommend([...bySupplier.values()], weightProfile);
        if (rec) {
          best = rec.product;
          reasons = rec.reasons.slice(0, 3);
        }
      }
      if (!best) unfulfillable.push(item.query);
      return { query: item.query, qty, bySupplier, best, reasons };
    });

    const fulfillable = analyses.filter((a) => a.best);

    // --- Split-optimal plan (per-item argmax by score) ---
    const splitItemsTotal = fulfillable.reduce((s, a) => s + a.best!.price * a.qty, 0);
    const splitSuppliers = new Set(fulfillable.map((a) => a.best!.provider));
    const splitNet = splitItemsTotal + penalty * splitSuppliers.size;

    // --- Baseline plan (single supplier: most coverage, then lowest total) ---
    const allSuppliers = new Set<string>();
    fulfillable.forEach((a) => a.bySupplier.forEach((_v, s) => allSuppliers.add(s)));
    let baseline: { supplier: string | null; total: number; coverage: number } = {
      supplier: null,
      total: 0,
      coverage: 0,
    };
    for (const s of allSuppliers) {
      let coverage = 0;
      let total = 0;
      for (const a of fulfillable) {
        const p = a.bySupplier.get(s);
        if (p) {
          coverage++;
          total += p.price * a.qty;
        }
      }
      const better =
        coverage > baseline.coverage ||
        (coverage === baseline.coverage && (baseline.supplier === null || total < baseline.total));
      if (better) baseline = { supplier: s, total, coverage };
    }
    const baselineNet = baseline.supplier ? baseline.total + penalty : Infinity;
    const canConsolidate = !!baseline.supplier && baseline.coverage === fulfillable.length && fulfillable.length > 0;

    const recommendedPlan: 'split' | 'consolidate' =
      canConsolidate && baselineNet < splitNet ? 'consolidate' : 'split';

    // --- Materialize the chosen plan ---
    const grouped: Record<string, BasketSupplierGroup & { _days?: number }> = {};
    let chosenTotal = 0;
    const chosenSuppliers = new Set<string>();
    let maxDays = 0;

    const resultItems: BasketItemResult[] = analyses.map((a) => {
      if (!a.best) {
        return {
          query: a.query,
          supplier: null,
          title: a.query,
          image: '',
          price: 0,
          quantity: a.qty,
          lineTotal: 0,
          deliveryDays: 0,
          availability: false,
          reasons: ['Not found in catalog'],
        };
      }
      let product = a.best;
      let reasons = a.reasons;
      if (recommendedPlan === 'consolidate' && baseline.supplier) {
        product = a.bySupplier.get(baseline.supplier)!;
        reasons = [
          `Bundled at ${baseline.supplier} to save on delivery`,
          product.discount > 0 ? `${product.discount}% off` : 'In stock',
        ];
      }
      const lineTotal = product.price * a.qty;
      chosenTotal += lineTotal;
      chosenSuppliers.add(product.provider);
      maxDays = Math.max(maxDays, product.deliveryDays);

      const g = grouped[product.provider] || { items: [], subtotal: 0, eta: 'Today', _days: 0 };
      g.items.push(a.query);
      g.subtotal += lineTotal;
      g._days = Math.max(g._days || 0, product.deliveryDays);
      g.eta = etaLabel(g._days);
      grouped[product.provider] = g;

      return {
        query: a.query,
        supplier: product.provider,
        title: product.title,
        image: product.image,
        price: product.price,
        quantity: a.qty,
        lineTotal,
        deliveryDays: product.deliveryDays,
        availability: true,
        reasons,
      };
    });

    const groupedBySupplier: Record<string, BasketSupplierGroup> = {};
    for (const [s, g] of Object.entries(grouped)) {
      groupedBySupplier[s] = { items: g.items, subtotal: Math.round(g.subtotal), eta: g.eta };
    }

    const chosenNet = chosenTotal + penalty * chosenSuppliers.size;
    const otherNet = recommendedPlan === 'split' ? baselineNet : splitNet;
    const estimatedSavings = Number.isFinite(otherNet) ? Math.max(0, Math.round(otherNet - chosenNet)) : 0;
    const savingsFraction = Number.isFinite(otherNet) && otherNet > 0 ? estimatedSavings / (otherNet as number) : 0;
    const confidence = fulfillable.length
      ? Math.round(Math.min(0.98, Math.max(0.5, 0.6 + savingsFraction)) * 100) / 100
      : 0;

    return {
      recommendedPlan,
      items: resultItems,
      groupedBySupplier,
      splitTotal: Math.round(chosenTotal),
      baseline: { supplier: baseline.supplier, total: Math.round(baseline.total) },
      estimatedSavings,
      supplierCount: chosenSuppliers.size,
      estimatedDelivery: fulfillable.length ? etaLabel(maxDays) : '—',
      confidence,
      unfulfillable,
      consolidationPenalty: penalty,
    };
  }

  static async optimize(
    userId: string,
    req: {
      category: string;
      suppliers?: string[];
      items: BasketItemInput[];
      weightProfile?: WeightProfileKey;
      consolidationPenalty?: number;
    },
  ): Promise<BasketOptimizeResponse> {
    const category = req.category;
    if (!category) throw new ApiError(400, 'Category is required');
    const valid = CATEGORY_SUPPLIERS[category];
    if (!valid) throw new ApiError(400, `Unknown category: ${category}`);

    const items = (req.items || []).filter((i) => i.query && i.query.trim());
    if (!items.length) throw new ApiError(400, 'At least one item is required');

    let suppliers = (req.suppliers && req.suppliers.length ? req.suppliers : valid).filter((s) =>
      valid.includes(s),
    );
    if (!suppliers.length) suppliers = valid;

    const weightProfile = req.weightProfile || 'balanced';

    // Fetch every item across suppliers in parallel, reusing the shared adapter gatherer.
    const gathered: BasketItemOptions[] = await Promise.all(
      items.map(async (it) => ({
        query: it.query.trim(),
        quantity: Math.max(1, Math.round(it.quantity || 1)),
        products: await SearchService.gather(it.query.trim(), category, suppliers),
      })),
    );

    const plan = BasketOptimizationService.buildPlan(gathered, req.consolidationPenalty || 0, weightProfile);

    const fulfilledItems = plan.items.filter((i) => i.supplier);
    if (fulfilledItems.length > 0) {
      basketHistoryRepository
        .create({
          userId,
          category,
          suppliers,
          itemCount: items.length,
          items: fulfilledItems.map((i) => ({ query: i.query, quantity: i.quantity, supplier: i.supplier, price: i.price })),
          splitTotal: plan.splitTotal,
          baselineTotal: plan.baseline.total,
          estimatedSavings: plan.estimatedSavings,
          supplierCount: plan.supplierCount,
          recommendedPlan: plan.recommendedPlan,
          weightProfile,
        })
        .catch((e) => logger.error('Failed to persist basket history', e));
    }

    return { category, weightProfile, ...plan };
  }
}
