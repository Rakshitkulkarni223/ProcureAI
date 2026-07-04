"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatINR = formatINR;
exports.round2 = round2;
exports.clamp = clamp;
/** Format a number as Indian Rupees, e.g. 1234.5 -> "₹1,235". */
function formatINR(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(Math.round(amount));
}
function round2(n) {
    return Math.round(n * 100) / 100;
}
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
