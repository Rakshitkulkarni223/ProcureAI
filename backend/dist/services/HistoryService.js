"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryService = void 0;
const HistoryRepository_1 = require("../repositories/HistoryRepository");
const SearchHistory_1 = require("../models/SearchHistory");
const BasketHistory_1 = require("../models/BasketHistory");
class HistoryService {
    static list(userId) {
        try {
            return HistoryRepository_1.historyRepository.listByUser(userId);
        }
        catch (e) {
            throw e;
        }
    }
    static async paginated(userId, page, limit) {
        try {
            const skip = (page - 1) * limit;
            // Fetch both collections in parallel
            const [searchDocs, basketDocs, searchCount, basketCount] = await Promise.all([
                SearchHistory_1.SearchHistory.find({ userId }).sort({ createdAt: -1 }).lean(),
                BasketHistory_1.BasketHistory.find({ userId }).sort({ createdAt: -1 }).lean(),
                SearchHistory_1.SearchHistory.countDocuments({ userId }),
                BasketHistory_1.BasketHistory.countDocuments({ userId }),
            ]);
            // Tag and normalize each entry
            const searchItems = searchDocs.map((d) => ({
                id: d._id,
                type: 'single',
                query: d.query,
                category: d.category,
                suppliers: d.suppliers,
                resultCount: d.resultCount,
                recommendedSupplier: d.recommendedSupplier,
                bestPrice: d.bestPrice,
                estimatedSavings: d.estimatedSavings,
                weightProfile: d.weightProfile,
                createdAt: d.createdAt,
            }));
            const basketItems = basketDocs.map((d) => ({
                id: d._id,
                type: 'basket',
                query: `Basket (${d.itemCount} item${d.itemCount !== 1 ? 's' : ''})`,
                category: d.category,
                suppliers: d.suppliers,
                resultCount: d.itemCount,
                recommendedSupplier: '',
                bestPrice: d.splitTotal,
                estimatedSavings: d.estimatedSavings,
                weightProfile: d.weightProfile,
                createdAt: d.createdAt,
                basketItems: (d.items || []).map((i) => ({
                    query: i.query,
                    quantity: i.quantity,
                    supplier: i.supplier,
                    price: i.price,
                })),
                recommendedPlan: d.recommendedPlan,
                supplierCount: d.supplierCount,
                splitTotal: d.splitTotal,
                baselineTotal: d.baselineTotal,
            }));
            // Merge, sort by createdAt desc, then paginate in-memory
            const all = [...searchItems, ...basketItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const total = searchCount + basketCount;
            const totalPages = Math.ceil(total / limit) || 1;
            const items = all.slice(skip, skip + limit);
            return { items, total, page, limit, totalPages };
        }
        catch (e) {
            throw e;
        }
    }
    static async remove(userId, id) {
        try {
            // Try deleting from both collections — one will match
            const [searchResult, basketResult] = await Promise.all([
                SearchHistory_1.SearchHistory.findOneAndDelete({ _id: id, userId }),
                BasketHistory_1.BasketHistory.findOneAndDelete({ _id: id, userId }),
            ]);
            return searchResult || basketResult;
        }
        catch (e) {
            throw e;
        }
    }
}
exports.HistoryService = HistoryService;
