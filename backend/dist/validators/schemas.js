"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.basketSchema = exports.preferenceSchema = exports.recommendationSchema = exports.searchSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(80),
    email: zod_1.z.string().email('A valid email is required'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters').max(128),
    businessType: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('A valid email is required'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.searchSchema = zod_1.z.object({
    category: zod_1.z.string().min(1, 'Category is required'),
    suppliers: zod_1.z.array(zod_1.z.string()).optional().default([]),
    query: zod_1.z.string().min(1, 'Search query is required'),
    sortBy: zod_1.z.enum(['lowest_price', 'highest_rating', 'fastest_delivery', 'highest_discount']).optional(),
    filters: zod_1.z
        .object({
        brand: zod_1.z.string().optional(),
        supplier: zod_1.z.string().optional(),
        minRating: zod_1.z.number().min(0).max(5).optional(),
        maxPrice: zod_1.z.number().min(0).optional(),
        inStockOnly: zod_1.z.boolean().optional(),
    })
        .optional(),
    weightProfile: zod_1.z.enum(['balanced', 'startup', 'hospital', 'restaurant']).optional(),
});
exports.recommendationSchema = zod_1.z.object({
    products: zod_1.z.array(zod_1.z.any()).min(1, 'At least one product is required'),
    weightProfile: zod_1.z.enum(['balanced', 'startup', 'hospital', 'restaurant']).optional(),
});
exports.preferenceSchema = zod_1.z.object({
    defaultCategory: zod_1.z.string().optional(),
    enabledSuppliers: zod_1.z.array(zod_1.z.string()).optional(),
    sortPreference: zod_1.z.enum(['lowest_price', 'highest_rating', 'fastest_delivery', 'highest_discount']).optional(),
    weightProfile: zod_1.z.enum(['balanced', 'startup', 'hospital', 'restaurant']).optional(),
    businessType: zod_1.z.string().optional(),
});
exports.basketSchema = zod_1.z.object({
    category: zod_1.z.string().min(1, 'Category is required'),
    suppliers: zod_1.z.array(zod_1.z.string()).optional().default([]),
    items: zod_1.z
        .array(zod_1.z.object({
        query: zod_1.z.string().min(1, 'Item name is required'),
        quantity: zod_1.z.number().int().positive().max(999).optional(),
    }))
        .min(1, 'Add at least one item to your basket'),
    weightProfile: zod_1.z.enum(['balanced', 'startup', 'hospital', 'restaurant']).optional(),
    consolidationPenalty: zod_1.z.number().min(0).max(100000).optional(),
});
