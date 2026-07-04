"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const http_1 = require("../utils/http");
const DashboardService_1 = require("../services/DashboardService");
function parseDateRange(query) {
    try {
        const from = query.from ? new Date(String(query.from)) : undefined;
        const to = query.to ? new Date(String(query.to)) : undefined;
        if (!from && !to)
            return undefined;
        if (to)
            to.setHours(23, 59, 59, 999);
        return { from: from && !isNaN(from.getTime()) ? from : undefined, to: to && !isNaN(to.getTime()) ? to : undefined };
    }
    catch {
        return undefined;
    }
}
exports.DashboardController = {
    summary: (0, http_1.asyncHandler)(async (req, res) => {
        const range = parseDateRange(req.query);
        return (0, http_1.ok)(res, await DashboardService_1.DashboardService.summary(req.user.sub, range));
    }),
    spend: (0, http_1.asyncHandler)(async (req, res) => {
        const range = parseDateRange(req.query);
        return (0, http_1.ok)(res, await DashboardService_1.DashboardService.spend(req.user.sub, range));
    }),
    savings: (0, http_1.asyncHandler)(async (req, res) => {
        const range = parseDateRange(req.query);
        return (0, http_1.ok)(res, await DashboardService_1.DashboardService.savings(req.user.sub, range));
    }),
    insights: (0, http_1.asyncHandler)(async (req, res) => {
        const range = parseDateRange(req.query);
        return (0, http_1.ok)(res, await DashboardService_1.DashboardService.insights(req.user.sub, range));
    }),
    businessImpact: (0, http_1.asyncHandler)(async (req, res) => {
        const range = parseDateRange(req.query);
        return (0, http_1.ok)(res, await DashboardService_1.DashboardService.businessImpact(req.user.sub, range));
    }),
};
