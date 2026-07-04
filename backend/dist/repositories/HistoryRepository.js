"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyRepository = exports.HistoryRepository = void 0;
const SearchHistory_1 = require("../models/SearchHistory");
class HistoryRepository {
    create(data) {
        try {
            return SearchHistory_1.SearchHistory.create(data);
        }
        catch (e) {
            throw e;
        }
    }
    listByUser(userId, limit = 50) {
        try {
            return SearchHistory_1.SearchHistory.find({ userId }).sort({ createdAt: -1 }).limit(limit);
        }
        catch (e) {
            throw e;
        }
    }
    async paginatedByUser(userId, page, limit) {
        try {
            const skip = (page - 1) * limit;
            const [items, total] = await Promise.all([
                SearchHistory_1.SearchHistory.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
                SearchHistory_1.SearchHistory.countDocuments({ userId }),
            ]);
            return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
        }
        catch (e) {
            throw e;
        }
    }
    deleteById(userId, id) {
        try {
            return SearchHistory_1.SearchHistory.findOneAndDelete({ _id: id, userId });
        }
        catch (e) {
            throw e;
        }
    }
    countByUser(userId) {
        try {
            return SearchHistory_1.SearchHistory.countDocuments({ userId });
        }
        catch (e) {
            throw e;
        }
    }
    allByUser(userId, from, to) {
        try {
            const filter = { userId };
            if (from || to) {
                const dateFilter = {};
                if (from)
                    dateFilter.$gte = from;
                if (to)
                    dateFilter.$lte = to;
                filter.createdAt = dateFilter;
            }
            return SearchHistory_1.SearchHistory.find(filter).sort({ createdAt: -1 });
        }
        catch (e) {
            throw e;
        }
    }
}
exports.HistoryRepository = HistoryRepository;
exports.historyRepository = new HistoryRepository();
