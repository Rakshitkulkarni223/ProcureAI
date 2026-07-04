"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const BasketOptimizationService_1 = require("../BasketOptimizationService");
let idc = 0;
function prod(provider, price, o = {}) {
    return {
        id: `p${idc++}`,
        provider,
        title: o.title ?? 'Item',
        brand: 'Brand',
        category: 'grocery',
        image: '',
        price,
        originalPrice: price,
        discount: o.discount ?? 0,
        rating: o.rating ?? 4.5,
        reviews: 100,
        availability: o.availability ?? true,
        deliveryDays: o.deliveryDays ?? 1,
        warrantyMonths: 0,
        returnPolicyDays: 5,
        productUrl: '#',
    };
}
// Items differ only in price so the weighted engine deterministically picks the cheapest per item.
function threeItemBasket() {
    return [
        { query: 'Rice', quantity: 1, products: [prod('X', 100), prod('Y', 120), prod('Z', 130)] },
        { query: 'Oil', quantity: 1, products: [prod('X', 260), prod('Y', 200), prod('Z', 210)] },
        { query: 'Veg', quantity: 1, products: [prod('X', 95), prod('Y', 100), prod('Z', 90)] },
    ];
}
// Split best: X=100, Y=200, Z=90 => 390 across {X,Y,Z}
// Baseline single supplier totals: X=455, Y=420, Z=430 => baseline Y=420
(0, node_test_1.default)('split beats single-supplier baseline when there is no consolidation penalty', () => {
    const plan = BasketOptimizationService_1.BasketOptimizationService.buildPlan(threeItemBasket(), 0, 'balanced');
    strict_1.default.equal(plan.recommendedPlan, 'split');
    strict_1.default.equal(plan.supplierCount, 3);
    strict_1.default.equal(plan.splitTotal, 390);
    strict_1.default.equal(plan.baseline.supplier, 'Y');
    strict_1.default.equal(plan.baseline.total, 420);
    strict_1.default.equal(plan.estimatedSavings, 30); // 420 - 390
    strict_1.default.ok(plan.confidence >= 0.5 && plan.confidence <= 0.98);
    strict_1.default.equal(plan.unfulfillable.length, 0);
});
(0, node_test_1.default)('consolidation penalty tips the decision from split to single-supplier', () => {
    // splitNet = 390 + 3P ; baselineNet = 420 + P ; consolidate when 420+P < 390+3P => P > 15
    const stillSplit = BasketOptimizationService_1.BasketOptimizationService.buildPlan(threeItemBasket(), 10, 'balanced');
    strict_1.default.equal(stillSplit.recommendedPlan, 'split');
    strict_1.default.equal(stillSplit.supplierCount, 3);
    const consolidated = BasketOptimizationService_1.BasketOptimizationService.buildPlan(threeItemBasket(), 30, 'balanced');
    strict_1.default.equal(consolidated.recommendedPlan, 'consolidate');
    strict_1.default.equal(consolidated.supplierCount, 1);
    strict_1.default.equal(consolidated.splitTotal, 420); // everything bought at baseline supplier Y
    strict_1.default.equal(consolidated.baseline.supplier, 'Y');
    // savings = splitNet(480) - baselineNet(450) = 30
    strict_1.default.equal(consolidated.estimatedSavings, 30);
});
(0, node_test_1.default)('all-out-of-stock basket does not throw and reports every item unfulfillable', () => {
    const basket = [
        { query: 'Rice', quantity: 2, products: [prod('X', 100, { availability: false }), prod('Y', 120, { availability: false })] },
        { query: 'Oil', quantity: 1, products: [prod('X', 200, { availability: false })] },
    ];
    const plan = BasketOptimizationService_1.BasketOptimizationService.buildPlan(basket, 0, 'balanced');
    strict_1.default.equal(plan.unfulfillable.length, 2);
    strict_1.default.equal(plan.splitTotal, 0);
    strict_1.default.equal(plan.supplierCount, 0);
    strict_1.default.equal(plan.baseline.supplier, null);
    strict_1.default.equal(plan.estimatedSavings, 0);
    strict_1.default.equal(plan.items.every((i) => i.supplier === null && i.availability === false), true);
});
(0, node_test_1.default)('partial stock: unavailable item is skipped, remaining items still optimized', () => {
    const basket = [
        { query: 'Rice', quantity: 1, products: [prod('X', 100), prod('Y', 120)] },
        { query: 'Oil', quantity: 1, products: [prod('X', 200, { availability: false }), prod('Y', 999, { availability: false })] },
        { query: 'Veg', quantity: 3, products: [prod('X', 40), prod('Y', 30)] },
    ];
    const plan = BasketOptimizationService_1.BasketOptimizationService.buildPlan(basket, 0, 'balanced');
    strict_1.default.deepEqual(plan.unfulfillable, ['Oil']);
    // Rice -> X(100), Veg -> Y(30)*3=90 => split 190
    strict_1.default.equal(plan.splitTotal, 190);
    strict_1.default.ok(plan.supplierCount >= 1);
    const oil = plan.items.find((i) => i.query === 'Oil');
    strict_1.default.equal(oil?.supplier, null);
});
(0, node_test_1.default)('quantity multiplies line totals correctly', () => {
    const basket = [
        { query: 'Oil', quantity: 2, products: [prod('X', 100), prod('Y', 150)] },
    ];
    const plan = BasketOptimizationService_1.BasketOptimizationService.buildPlan(basket, 0, 'balanced');
    const oil = plan.items.find((i) => i.query === 'Oil');
    strict_1.default.equal(oil.price, 100);
    strict_1.default.equal(oil.quantity, 2);
    strict_1.default.equal(oil.lineTotal, 200);
    strict_1.default.equal(plan.splitTotal, 200);
});
