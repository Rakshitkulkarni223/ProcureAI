"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const ProviderFactory_1 = require("../adapters/ProviderFactory");
const ComparisonService_1 = require("./ComparisonService");
const RecommendationService_1 = require("./RecommendationService");
const HistoryRepository_1 = require("../repositories/HistoryRepository");
const data_1 = require("../config/data");
const logger_1 = require("../utils/logger");
const http_1 = require("../utils/http");
/**
 * Search Service: resolves enabled adapters via the factory, queries every
 * provider in parallel (Promise.allSettled => individual provider failures are
 * tolerated), normalizes, compares, and runs the recommendation engine.
 */
class SearchService {
    static async search(userId, req) {
        const { category, query } = req;
        if (!query?.trim())
            throw new http_1.ApiError(400, 'Search query is required');
        if (!category)
            throw new http_1.ApiError(400, 'Category is required');
        const validForCategory = data_1.CATEGORY_SUPPLIERS[category] || [];
        let suppliers = (req.suppliers && req.suppliers.length ? req.suppliers : validForCategory).filter((s) => validForCategory.includes(s));
        if (!suppliers.length)
            suppliers = validForCategory;
        if (!suppliers.length)
            throw new http_1.ApiError(400, `Unknown category: ${category}`);
        const products = await SearchService.gather(query, category, suppliers);
        const results = ComparisonService_1.ComparisonService.apply(products, req.sortBy, req.filters);
        const recommendation = RecommendationService_1.RecommendationService.recommend(results, req.weightProfile);
        // Persist search history only when results exist (fire and forget).
        if (results.length > 0) {
            HistoryRepository_1.historyRepository
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
                .catch((e) => logger_1.logger.error('Failed to persist search history', e));
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
    static async searchPreview(query, category, suppliers) {
        const validForCategory = data_1.CATEGORY_SUPPLIERS[category] || [];
        const enabled = suppliers.filter((s) => validForCategory.includes(s));
        const list = enabled.length ? enabled : validForCategory;
        const products = await SearchService.gather(query, category, list);
        const results = ComparisonService_1.ComparisonService.apply(products, 'lowest_price');
        const recommendation = RecommendationService_1.RecommendationService.recommend(results, 'balanced');
        return { query, category, count: results.length, results, recommendation };
    }
    /**
     * Query every supplier's adapter in parallel and collect normalized products.
     * Individual provider failures are tolerated (Promise.allSettled). Shared by
     * search, preview and the basket optimizer.
     */
    static async gather(query, category, suppliers) {
        const adapters = suppliers
            .map((name) => ProviderFactory_1.ProviderFactory.create(name))
            .filter((a) => a !== null);
        const settled = await Promise.allSettled(adapters.map((a) => a.search(query, category)));
        const products = [];
        settled.forEach((r, idx) => {
            if (r.status === 'fulfilled')
                products.push(...r.value);
            else
                logger_1.logger.warn(`Provider "${adapters[idx].name}" failed`, r.reason);
        });
        return products;
    }
}
exports.SearchService = SearchService;
