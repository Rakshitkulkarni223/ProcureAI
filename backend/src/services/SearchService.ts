import { ProviderFactory } from '../adapters/ProviderFactory';
import { ComparisonService } from './ComparisonService';
import { RecommendationService } from './RecommendationService';
import { historyRepository } from '../repositories/HistoryRepository';
import { CATEGORY_SUPPLIERS } from '../config/data';
import { Product, SearchRequest, SearchResponse } from '../types';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/http';

/**
 * Search Service: resolves enabled adapters via the factory, queries every
 * provider in parallel (Promise.allSettled => individual provider failures are
 * tolerated), normalizes, compares, and runs the recommendation engine.
 */
export class SearchService {
  static async search(userId: string, req: SearchRequest): Promise<SearchResponse> {
    const { category, query } = req;
    if (!query?.trim()) throw new ApiError(400, 'Search query is required');
    if (!category) throw new ApiError(400, 'Category is required');

    const validForCategory = CATEGORY_SUPPLIERS[category] || [];
    let suppliers = (req.suppliers && req.suppliers.length ? req.suppliers : validForCategory).filter(
      (s) => validForCategory.includes(s),
    );
    if (!suppliers.length) suppliers = validForCategory;
    if (!suppliers.length) throw new ApiError(400, `Unknown category: ${category}`);

    const products = await SearchService.gather(query, category, suppliers);

    const results = ComparisonService.apply(products, req.sortBy, req.filters);
    const recommendation = RecommendationService.recommend(results, req.weightProfile);

    // Persist search history only when results exist (fire and forget).
    if (results.length > 0) {
      historyRepository
        .create({
          userId,
          query: query.trim(),
          category,
          suppliers,
          resultCount: results.length,
          recommendedSupplier: recommendation?.supplier || '',
          bestPrice: recommendation?.product.price || 0,
          estimatedSavings: recommendation?.estimatedSavings || 0,
          weightProfile: req.weightProfile || 'balanced',
        })
        .catch((e) => logger.error('Failed to persist search history', e));
    }

    return {
      query: query.trim(),
      category,
      count: results.length,
      results,
      recommendation,
    };
  }

  /** Runs the full pipeline WITHOUT persisting history. Used by the seeder. */
  static async searchPreview(
    query: string,
    category: string,
    suppliers: string[],
  ): Promise<SearchResponse> {
    const validForCategory = CATEGORY_SUPPLIERS[category] || [];
    const enabled = suppliers.filter((s) => validForCategory.includes(s));
    const list = enabled.length ? enabled : validForCategory;

    const products = await SearchService.gather(query, category, list);

    const results = ComparisonService.apply(products, 'lowest_price');
    const recommendation = RecommendationService.recommend(results, 'balanced');
    return { query, category, count: results.length, results, recommendation };
  }

  /**
   * Query every supplier's adapter in parallel and collect normalized products.
   * Individual provider failures are tolerated (Promise.allSettled). Shared by
   * search, preview and the basket optimizer.
   */
  static async gather(query: string, category: string, suppliers: string[]): Promise<Product[]> {
    const adapters = suppliers
      .map((name) => ProviderFactory.create(name))
      .filter((a): a is NonNullable<typeof a> => a !== null);

    const settled = await Promise.allSettled(adapters.map((a) => a.search(query, category)));
    const products: Product[] = [];
    settled.forEach((r, idx) => {
      if (r.status === 'fulfilled') products.push(...r.value);
      else logger.warn(`Provider "${adapters[idx].name}" failed`, r.reason);
    });
    return products;
  }
}
