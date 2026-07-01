import test from 'node:test';
import assert from 'node:assert/strict';
import { BasketOptimizationService, BasketItemOptions } from '../BasketOptimizationService';
import { Product } from '../../types';

let idc = 0;
function prod(provider: string, price: number, o: Partial<Product> = {}): Product {
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
function threeItemBasket(): BasketItemOptions[] {
  return [
    { query: 'Rice', quantity: 1, products: [prod('X', 100), prod('Y', 120), prod('Z', 130)] },
    { query: 'Oil', quantity: 1, products: [prod('X', 260), prod('Y', 200), prod('Z', 210)] },
    { query: 'Veg', quantity: 1, products: [prod('X', 95), prod('Y', 100), prod('Z', 90)] },
  ];
}
// Split best: X=100, Y=200, Z=90 => 390 across {X,Y,Z}
// Baseline single supplier totals: X=455, Y=420, Z=430 => baseline Y=420

test('split beats single-supplier baseline when there is no consolidation penalty', () => {
  const plan = BasketOptimizationService.buildPlan(threeItemBasket(), 0, 'balanced');
  assert.equal(plan.recommendedPlan, 'split');
  assert.equal(plan.supplierCount, 3);
  assert.equal(plan.splitTotal, 390);
  assert.equal(plan.baseline.supplier, 'Y');
  assert.equal(plan.baseline.total, 420);
  assert.equal(plan.estimatedSavings, 30); // 420 - 390
  assert.ok(plan.confidence >= 0.5 && plan.confidence <= 0.98);
  assert.equal(plan.unfulfillable.length, 0);
});

test('consolidation penalty tips the decision from split to single-supplier', () => {
  // splitNet = 390 + 3P ; baselineNet = 420 + P ; consolidate when 420+P < 390+3P => P > 15
  const stillSplit = BasketOptimizationService.buildPlan(threeItemBasket(), 10, 'balanced');
  assert.equal(stillSplit.recommendedPlan, 'split');
  assert.equal(stillSplit.supplierCount, 3);

  const consolidated = BasketOptimizationService.buildPlan(threeItemBasket(), 30, 'balanced');
  assert.equal(consolidated.recommendedPlan, 'consolidate');
  assert.equal(consolidated.supplierCount, 1);
  assert.equal(consolidated.splitTotal, 420); // everything bought at baseline supplier Y
  assert.equal(consolidated.baseline.supplier, 'Y');
  // savings = splitNet(480) - baselineNet(450) = 30
  assert.equal(consolidated.estimatedSavings, 30);
});

test('all-out-of-stock basket does not throw and reports every item unfulfillable', () => {
  const basket: BasketItemOptions[] = [
    { query: 'Rice', quantity: 2, products: [prod('X', 100, { availability: false }), prod('Y', 120, { availability: false })] },
    { query: 'Oil', quantity: 1, products: [prod('X', 200, { availability: false })] },
  ];
  const plan = BasketOptimizationService.buildPlan(basket, 0, 'balanced');
  assert.equal(plan.unfulfillable.length, 2);
  assert.equal(plan.splitTotal, 0);
  assert.equal(plan.supplierCount, 0);
  assert.equal(plan.baseline.supplier, null);
  assert.equal(plan.estimatedSavings, 0);
  assert.equal(plan.items.every((i) => i.supplier === null && i.availability === false), true);
});

test('partial stock: unavailable item is skipped, remaining items still optimized', () => {
  const basket: BasketItemOptions[] = [
    { query: 'Rice', quantity: 1, products: [prod('X', 100), prod('Y', 120)] },
    { query: 'Oil', quantity: 1, products: [prod('X', 200, { availability: false }), prod('Y', 999, { availability: false })] },
    { query: 'Veg', quantity: 3, products: [prod('X', 40), prod('Y', 30)] },
  ];
  const plan = BasketOptimizationService.buildPlan(basket, 0, 'balanced');
  assert.deepEqual(plan.unfulfillable, ['Oil']);
  // Rice -> X(100), Veg -> Y(30)*3=90 => split 190
  assert.equal(plan.splitTotal, 190);
  assert.ok(plan.supplierCount >= 1);
  const oil = plan.items.find((i) => i.query === 'Oil');
  assert.equal(oil?.supplier, null);
});

test('quantity multiplies line totals correctly', () => {
  const basket: BasketItemOptions[] = [
    { query: 'Oil', quantity: 2, products: [prod('X', 100), prod('Y', 150)] },
  ];
  const plan = BasketOptimizationService.buildPlan(basket, 0, 'balanced');
  const oil = plan.items.find((i) => i.query === 'Oil')!;
  assert.equal(oil.price, 100);
  assert.equal(oil.quantity, 2);
  assert.equal(oil.lineTotal, 200);
  assert.equal(plan.splitTotal, 200);
});
