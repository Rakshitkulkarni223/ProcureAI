"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryController = void 0;
const http_1 = require("../utils/http");
const HistoryService_1 = require("../services/HistoryService");
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
exports.HistoryController = {
    list: (0, http_1.asyncHandler)(async (req, res) => {
        const { page, limit } = parsePagination(req.query);
        return (0, http_1.ok)(res, await HistoryService_1.HistoryService.paginated(req.user.sub, page, limit));
    }),
    remove: (0, http_1.asyncHandler)(async (req, res) => {
        await HistoryService_1.HistoryService.remove(req.user.sub, req.params.id);
        return (0, http_1.ok)(res, { message: 'Deleted' });
    }),
};
