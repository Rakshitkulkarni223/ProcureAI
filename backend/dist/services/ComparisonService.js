"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComparisonService = void 0;
const sortStrategies_1 = require("./sortStrategies");
/**
 * Comparison Service: filters, de-duplicates and sorts the normalized product
 * list produced by the provider adapters.
 */
class ComparisonService {
    static apply(products, sortBy, filters) {
        let list = ComparisonService.dedupe(products);
        list = ComparisonService.filter(list, filters);
        list.sort((0, sortStrategies_1.getSortStrategy)(sortBy));
        return list;
    }
    static dedupe(products) {
        const seen = new Set();
        const out = [];
        for (const p of products) {
            if (seen.has(p.id))
                continue;
            seen.add(p.id);
            out.push(p);
        }
        return out;
    }
    static filter(products, filters) {
        if (!filters)
            return products;
        return products.filter((p) => {
            if (filters.brand && !p.brand.toLowerCase().includes(filters.brand.toLowerCase()))
                return false;
            if (filters.supplier && p.provider !== filters.supplier)
                return false;
            if (typeof filters.minRating === 'number' && p.rating < filters.minRating)
                return false;
            if (typeof filters.maxPrice === 'number' && p.price > filters.maxPrice)
                return false;
            if (filters.inStockOnly && !p.availability)
                return false;
            return true;
        });
    }
}
exports.ComparisonService = ComparisonService;
