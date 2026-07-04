"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.basketHistoryRepository = exports.BasketHistoryRepository = void 0;
const BasketHistory_1 = require("../models/BasketHistory");
class BasketHistoryRepository {
    create(data) {
        try {
            return BasketHistory_1.BasketHistory.create(data);
        }
        catch (e) {
            throw e;
        }
    }
    listByUser(userId, limit = 50) {
        try {
            return BasketHistory_1.BasketHistory.find({ userId }).sort({ createdAt: -1 }).limit(limit);
        }
        catch (e) {
            throw e;
        }
    }
    async paginatedByUser(userId, page, limit) {
        try {
            const skip = (page - 1) * limit;
            const [items, total] = await Promise.all([
                BasketHistory_1.BasketHistory.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
                BasketHistory_1.BasketHistory.countDocuments({ userId }),
            ]);
            return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
        }
        catch (e) {
            throw e;
        }
    }
}
exports.BasketHistoryRepository = BasketHistoryRepository;
exports.basketHistoryRepository = new BasketHistoryRepository();
