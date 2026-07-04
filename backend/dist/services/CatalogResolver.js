"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogResolver = void 0;
const catalog_json_1 = __importDefault(require("../mock-data/catalog.json"));
const data_1 = require("../config/data");
const CATALOG = catalog_json_1.default;
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 1);
}
function scoreTemplate(tpl, tokens) {
    const haystack = [tpl.title, tpl.brand, ...tpl.keywords].join(' ').toLowerCase();
    let score = 0;
    for (const tok of tokens) {
        if (tpl.keywords.some((k) => k.toLowerCase() === tok))
            score += 3;
        else if (haystack.includes(tok))
            score += 1.5;
    }
    return score;
}
/**
 * Resolve a search query within a category to a single canonical product.
 * All adapters use this so every supplier prices the SAME product, producing
 * a clean side-by-side supplier comparison. Falls back to a synthetic product
 * (titled by the query) so a search is never empty.
 */
class CatalogResolver {
    static getTemplates(category) {
        return CATALOG[category] || [];
    }
    /**
     * Like resolve(), but returns null when the query has no meaningful match
     * in the catalog (score = 0). Used to avoid returning fake results for
     * gibberish queries.
     */
    static resolveOrNull(category, query) {
        try {
            const tokens = tokenize(query);
            const templates = CATALOG[category] || [];
            let best = null;
            let bestScore = 0;
            for (const tpl of templates) {
                const s = scoreTemplate(tpl, tokens);
                if (s > bestScore) {
                    bestScore = s;
                    best = tpl;
                }
            }
            return best && bestScore > 0 ? best : null;
        }
        catch {
            return null;
        }
    }
    static resolve(category, query) {
        const tokens = tokenize(query);
        const templates = CATALOG[category] || [];
        let best = null;
        let bestScore = 0;
        for (const tpl of templates) {
            const s = scoreTemplate(tpl, tokens);
            if (s > bestScore) {
                bestScore = s;
                best = tpl;
            }
        }
        if (best && bestScore > 0)
            return best;
        const cleanQuery = query.trim() || 'Procurement Item';
        const title = cleanQuery
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
        return {
            id: `generic-${category}-${cleanQuery.toLowerCase().replace(/\s+/g, '-')}`,
            title,
            brand: 'Generic',
            basePrice: data_1.DEFAULT_CATEGORY_BASE_PRICE[category] || 1000,
            image: '',
            keywords: tokens,
        };
    }
}
exports.CatalogResolver = CatalogResolver;
