"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogController = void 0;
const http_1 = require("../utils/http");
const CatalogService_1 = require("../services/CatalogService");
exports.CatalogController = {
    listCategories: (0, http_1.asyncHandler)(async (_req, res) => {
        return (0, http_1.ok)(res, await CatalogService_1.CatalogService.listCategories());
    }),
    suppliersForCategory: (0, http_1.asyncHandler)(async (req, res) => {
        return (0, http_1.ok)(res, await CatalogService_1.CatalogService.suppliersForCategory(req.params.id));
    }),
    listSuppliers: (0, http_1.asyncHandler)(async (_req, res) => {
        return (0, http_1.ok)(res, await CatalogService_1.CatalogService.listSuppliers());
    }),
    toggleSupplier: (0, http_1.asyncHandler)(async (req, res) => {
        const { enabled } = req.body || {};
        return (0, http_1.ok)(res, await CatalogService_1.CatalogService.toggleSupplier(req.params.id, enabled));
    }),
};
