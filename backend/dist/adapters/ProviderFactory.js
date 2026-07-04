"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderFactory = void 0;
const MockProviderAdapter_1 = require("./MockProviderAdapter");
const data_1 = require("../config/data");
/**
 * Factory Pattern: resolves the correct adapter for a supplier by name, with no
 * provider-specific switch statements leaking into the Search Service. Adding a
 * real provider later is a config entry + one adapter class registration here.
 */
class ProviderFactory {
    static create(supplierName) {
        const profile = data_1.SUPPLIER_PROFILES[supplierName];
        if (!profile)
            return null;
        return new MockProviderAdapter_1.MockProviderAdapter(profile);
    }
    static isKnown(supplierName) {
        return Boolean(data_1.SUPPLIER_PROFILES[supplierName]);
    }
}
exports.ProviderFactory = ProviderFactory;
