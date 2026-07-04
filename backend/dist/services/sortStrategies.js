"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SORT_STRATEGIES = void 0;
exports.getSortStrategy = getSortStrategy;
exports.SORT_STRATEGIES = {
    lowest_price: (a, b) => a.price - b.price,
    highest_rating: (a, b) => b.rating - a.rating,
    fastest_delivery: (a, b) => a.deliveryDays - b.deliveryDays,
    highest_discount: (a, b) => b.discount - a.discount,
};
function getSortStrategy(option) {
    return exports.SORT_STRATEGIES[option ?? 'lowest_price'] ?? exports.SORT_STRATEGIES.lowest_price;
}
