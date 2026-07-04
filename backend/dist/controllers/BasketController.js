"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasketController = void 0;
const http_1 = require("../utils/http");
const BasketOptimizationService_1 = require("../services/BasketOptimizationService");
const BasketHistoryRepository_1 = require("../repositories/BasketHistoryRepository");
const schemas_1 = require("../validators/schemas");
function parsePagination(query) {
    try {
        const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '20'), 10) || 20));
        return { page, limit };
    }
    catch (e) {
        return { page: 1, limit: 20 };
    }
}
exports.BasketController = {
    optimize: (0, http_1.asyncHandler)(async (req, res) => {
        const input = schemas_1.basketSchema.parse(req.body);
        const result = await BasketOptimizationService_1.BasketOptimizationService.optimize(req.user.sub, input);
        return (0, http_1.ok)(res, result);
    }),
    history: (0, http_1.asyncHandler)(async (req, res) => {
        const { page, limit } = parsePagination(req.query);
        return (0, http_1.ok)(res, await BasketHistoryRepository_1.basketHistoryRepository.paginatedByUser(req.user.sub, page, limit));
    }),
};
