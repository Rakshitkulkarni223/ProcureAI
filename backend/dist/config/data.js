"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CATEGORY_BASE_PRICE = exports.WEIGHT_PROFILES = exports.CATEGORY_SUPPLIERS = exports.SUPPLIER_PROFILES = exports.CATEGORIES = void 0;
exports.CATEGORIES = [
    { slug: 'electronics', name: 'Electronics', icon: 'Cpu', description: 'Laptops, phones, peripherals & gadgets' },
    { slug: 'grocery', name: 'Grocery', icon: 'ShoppingBasket', description: 'Staples, pantry & fresh supplies' },
    { slug: 'fashion', name: 'Fashion', icon: 'Shirt', description: 'Apparel, footwear & accessories' },
    { slug: 'furniture', name: 'Furniture', icon: 'Armchair', description: 'Office & workspace furniture' },
    { slug: 'office', name: 'Office Supplies', icon: 'Paperclip', description: 'Stationery, paper & office essentials' },
    { slug: 'cleaning', name: 'Cleaning Supplies', icon: 'SprayCan', description: 'Sanitation & janitorial products' },
    { slug: 'medical', name: 'Medical Supplies', icon: 'Stethoscope', description: 'PPE, devices & consumables' },
    { slug: 'industrial', name: 'Industrial Equipment', icon: 'Wrench', description: 'Tools, safety & hardware' },
];
/** Supplier "personalities" used to generate believable, comparable mock data. */
exports.SUPPLIER_PROFILES = {
    Amazon: { name: 'Amazon', color: '#FF9900', priceFactor: 1.02, baseRating: 4.5, deliveryDays: 2, discountBias: 12, warrantyMonths: 24, returnDays: 10, stockProbability: 0.95 },
    Flipkart: { name: 'Flipkart', color: '#2874F0', priceFactor: 0.98, baseRating: 4.3, deliveryDays: 3, discountBias: 18, warrantyMonths: 18, returnDays: 7, stockProbability: 0.92 },
    Croma: { name: 'Croma', color: '#12B3A6', priceFactor: 1.05, baseRating: 4.2, deliveryDays: 4, discountBias: 8, warrantyMonths: 24, returnDays: 10, stockProbability: 0.85 },
    'Reliance Digital': { name: 'Reliance Digital', color: '#E5202E', priceFactor: 1.03, baseRating: 4.1, deliveryDays: 5, discountBias: 10, warrantyMonths: 24, returnDays: 7, stockProbability: 0.85 },
    Blinkit: { name: 'Blinkit', color: '#F8CB46', priceFactor: 1.0, baseRating: 4.5, deliveryDays: 0, discountBias: 12, warrantyMonths: 0, returnDays: 2, stockProbability: 0.9 },
    Zepto: { name: 'Zepto', color: '#7E3FF2', priceFactor: 1.0, baseRating: 4.4, deliveryDays: 0, discountBias: 12, warrantyMonths: 0, returnDays: 2, stockProbability: 0.9 },
    BigBasket: { name: 'BigBasket', color: '#84C225', priceFactor: 0.97, baseRating: 4.5, deliveryDays: 1, discountBias: 16, warrantyMonths: 0, returnDays: 3, stockProbability: 0.93 },
    JioMart: { name: 'JioMart', color: '#008ECC', priceFactor: 0.97, baseRating: 4.5, deliveryDays: 1, discountBias: 15, warrantyMonths: 0, returnDays: 5, stockProbability: 0.93 },
    Instamart: { name: 'Instamart', color: '#FC8019', priceFactor: 0.98, baseRating: 4.4, deliveryDays: 0, discountBias: 13, warrantyMonths: 0, returnDays: 2, stockProbability: 0.9 },
    Myntra: { name: 'Myntra', color: '#FF3F6C', priceFactor: 1.0, baseRating: 4.4, deliveryDays: 4, discountBias: 30, warrantyMonths: 0, returnDays: 14, stockProbability: 0.9 },
    Ajio: { name: 'Ajio', color: '#2C4152', priceFactor: 0.95, baseRating: 4.2, deliveryDays: 5, discountBias: 35, warrantyMonths: 0, returnDays: 14, stockProbability: 0.88 },
    'Tata CLiQ': { name: 'Tata CLiQ', color: '#D4AF37', priceFactor: 1.04, baseRating: 4.3, deliveryDays: 4, discountBias: 22, warrantyMonths: 12, returnDays: 10, stockProbability: 0.85 },
    Pepperfry: { name: 'Pepperfry', color: '#F16521', priceFactor: 1.0, baseRating: 4.1, deliveryDays: 7, discountBias: 25, warrantyMonths: 12, returnDays: 7, stockProbability: 0.8 },
    'Urban Ladder': { name: 'Urban Ladder', color: '#1A1A1A', priceFactor: 1.06, baseRating: 4.3, deliveryDays: 8, discountBias: 15, warrantyMonths: 36, returnDays: 7, stockProbability: 0.82 },
    IKEA: { name: 'IKEA', color: '#0058A3', priceFactor: 0.97, baseRating: 4.5, deliveryDays: 6, discountBias: 10, warrantyMonths: 24, returnDays: 14, stockProbability: 0.85 },
    'Local Suppliers': { name: 'Local Suppliers', color: '#64748B', priceFactor: 0.9, baseRating: 3.9, deliveryDays: 3, discountBias: 8, warrantyMonths: 6, returnDays: 5, stockProbability: 0.8 },
    'Pharmacy Vendors': { name: 'Pharmacy Vendors', color: '#16A34A', priceFactor: 1.0, baseRating: 4.2, deliveryDays: 2, discountBias: 10, warrantyMonths: 0, returnDays: 3, stockProbability: 0.9 },
    'Medical Equipment Suppliers': { name: 'Medical Equipment Suppliers', color: '#0EA5E9', priceFactor: 1.08, baseRating: 4.4, deliveryDays: 5, discountBias: 5, warrantyMonths: 12, returnDays: 7, stockProbability: 0.85 },
    'Apollo Pharmacy': { name: 'Apollo Pharmacy', color: '#1AA34A', priceFactor: 1.02, baseRating: 4.5, deliveryDays: 1, discountBias: 12, warrantyMonths: 0, returnDays: 5, stockProbability: 0.92 },
    Netmeds: { name: 'Netmeds', color: '#34A853', priceFactor: 0.95, baseRating: 4.3, deliveryDays: 2, discountBias: 18, warrantyMonths: 0, returnDays: 5, stockProbability: 0.9 },
    'Industrial Tools Co': { name: 'Industrial Tools Co', color: '#B45309', priceFactor: 1.0, baseRating: 4.2, deliveryDays: 6, discountBias: 8, warrantyMonths: 12, returnDays: 7, stockProbability: 0.82 },
    'Amazon Business': { name: 'Amazon Business', color: '#146EB4', priceFactor: 1.01, baseRating: 4.5, deliveryDays: 3, discountBias: 12, warrantyMonths: 24, returnDays: 10, stockProbability: 0.9 },
};
/** Which suppliers serve each category. */
exports.CATEGORY_SUPPLIERS = {
    electronics: ['Amazon', 'Flipkart', 'Croma', 'Reliance Digital'],
    grocery: ['Blinkit', 'Zepto', 'BigBasket', 'JioMart', 'Instamart'],
    fashion: ['Myntra', 'Ajio', 'Amazon', 'Flipkart', 'Tata CLiQ'],
    furniture: ['Pepperfry', 'Urban Ladder', 'IKEA'],
    office: ['Amazon', 'Flipkart', 'Local Suppliers'],
    cleaning: ['Amazon', 'BigBasket', 'JioMart', 'Local Suppliers'],
    medical: ['Apollo Pharmacy', 'Netmeds', 'Pharmacy Vendors', 'Medical Equipment Suppliers'],
    industrial: ['Amazon Business', 'Industrial Tools Co', 'Local Suppliers'],
};
/** Configurable AI weight profiles (per business type). */
exports.WEIGHT_PROFILES = {
    balanced: {
        key: 'balanced',
        label: 'Balanced',
        description: 'Even consideration of price, speed, reliability and value.',
        weights: { price: 0.3, delivery: 0.2, rating: 0.2, discount: 0.1, availability: 0.1, warranty: 0.05, returnPolicy: 0.05 },
    },
    startup: {
        key: 'startup',
        label: 'Startup',
        description: 'Cost-first. Prioritises the lowest price with decent ratings.',
        weights: { price: 0.6, delivery: 0.2, rating: 0.2, discount: 0, availability: 0, warranty: 0, returnPolicy: 0 },
    },
    hospital: {
        key: 'hospital',
        label: 'Hospital',
        description: 'Availability & speed critical. Stock and delivery dominate.',
        weights: { price: 0.2, delivery: 0.4, rating: 0, discount: 0, availability: 0.4, warranty: 0, returnPolicy: 0 },
    },
    restaurant: {
        key: 'restaurant',
        label: 'Restaurant',
        description: 'Fast, reliable delivery for perishables; price secondary.',
        weights: { price: 0.3, delivery: 0.5, rating: 0, discount: 0, availability: 0.2, warranty: 0, returnPolicy: 0 },
    },
};
exports.DEFAULT_CATEGORY_BASE_PRICE = {
    electronics: 24000,
    grocery: 600,
    fashion: 2500,
    furniture: 15000,
    office: 1500,
    cleaning: 700,
    medical: 900,
    industrial: 3500,
};
