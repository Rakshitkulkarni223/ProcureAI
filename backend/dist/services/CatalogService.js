"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogService = void 0;
const CatalogRepository_1 = require("../repositories/CatalogRepository");
const http_1 = require("../utils/http");
class CatalogService {
    static listCategories() {
        return CatalogRepository_1.catalogRepository.listCategories();
    }
    static async suppliersForCategory(slug) {
        const category = await CatalogRepository_1.catalogRepository.getCategory(slug);
        if (!category)
            throw new http_1.ApiError(404, `Category not found: ${slug}`);
        return CatalogRepository_1.catalogRepository.suppliersByCategory(slug);
    }
    static listSuppliers() {
        return CatalogRepository_1.catalogRepository.listSuppliers();
    }
    static async toggleSupplier(id, enabled) {
        const supplier = await CatalogRepository_1.catalogRepository.findSupplier(id);
        if (!supplier)
            throw new http_1.ApiError(404, 'Supplier not found');
        supplier.enabled = typeof enabled === 'boolean' ? enabled : !supplier.enabled;
        await supplier.save();
        return supplier;
    }
}
exports.CatalogService = CatalogService;
