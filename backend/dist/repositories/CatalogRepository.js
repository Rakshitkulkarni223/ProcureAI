"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogRepository = exports.CatalogRepository = void 0;
const Category_1 = require("../models/Category");
const Supplier_1 = require("../models/Supplier");
class CatalogRepository {
    listCategories() {
        return Category_1.Category.find({ enabled: true }).sort({ name: 1 });
    }
    getCategory(slug) {
        return Category_1.Category.findOne({ slug });
    }
    listSuppliers() {
        return Supplier_1.Supplier.find().sort({ category: 1, name: 1 });
    }
    suppliersByCategory(category) {
        return Supplier_1.Supplier.find({ category }).sort({ name: 1 });
    }
    findSupplier(id) {
        return Supplier_1.Supplier.findById(id);
    }
}
exports.CatalogRepository = CatalogRepository;
exports.catalogRepository = new CatalogRepository();
