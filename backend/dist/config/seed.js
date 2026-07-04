"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSeed = runSeed;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Category_1 = require("../models/Category");
const Supplier_1 = require("../models/Supplier");
const SearchHistory_1 = require("../models/SearchHistory");
const User_1 = require("../models/User");
const UserPreference_1 = require("../models/UserPreference");
const data_1 = require("./data");
const env_1 = require("./env");
const password_1 = require("../utils/password");
const SearchService_1 = require("../services/SearchService");
const logger_1 = require("../utils/logger");
async function seedCategories() {
    for (const c of data_1.CATEGORIES) {
        await Category_1.Category.updateOne({ slug: c.slug }, { $set: { name: c.name, icon: c.icon, description: c.description, enabled: true } }, { upsert: true });
    }
}
async function seedSuppliers() {
    for (const [category, suppliers] of Object.entries(data_1.CATEGORY_SUPPLIERS)) {
        for (const name of suppliers) {
            const profile = data_1.SUPPLIER_PROFILES[name];
            await Supplier_1.Supplier.updateOne({ name, category }, { $set: { color: profile?.color || '#64748B', enabled: true } }, { upsert: true });
        }
    }
}
async function seedUser(email, password, name) {
    try {
        let user = await User_1.User.findOne({ email: email.toLowerCase() });
        if (!user) {
            const passwordHash = await (0, password_1.hashPassword)(password);
            user = await User_1.User.create({ email: email.toLowerCase(), passwordHash, name, role: 'user' });
            logger_1.logger.info(`Seeded user: ${email}`);
        }
        else {
            const same = await (0, password_1.verifyPassword)(password, user.passwordHash);
            if (!same) {
                user.passwordHash = await (0, password_1.hashPassword)(password);
                await user.save();
                logger_1.logger.info(`Updated password for ${email}`);
            }
        }
        await UserPreference_1.UserPreference.updateOne({ userId: user._id }, { $setOnInsert: { businessType: 'general' } }, { upsert: true });
        return user;
    }
    catch (e) {
        logger_1.logger.error('Failed to seed user', e);
        throw e;
    }
}
async function seedSampleHistory(userId) {
    const existing = await SearchHistory_1.SearchHistory.countDocuments({ userId });
    if (existing > 0)
        return;
    const samples = [
        { category: 'fashion', query: 'Nike Running Shoes', suppliers: ['Myntra', 'Ajio', 'Amazon', 'Flipkart'], daysAgo: 2 },
        { category: 'electronics', query: 'UltraBook Laptop', suppliers: ['Amazon', 'Flipkart', 'Croma', 'Reliance Digital'], daysAgo: 5 },
        { category: 'grocery', query: 'Basmati Rice', suppliers: ['Blinkit', 'Zepto', 'BigBasket', 'JioMart'], daysAgo: 9 },
        { category: 'electronics', query: 'Galaxy Smartphone', suppliers: ['Amazon', 'Flipkart', 'Croma'], daysAgo: 14 },
        { category: 'furniture', query: 'Ergonomic Office Chair', suppliers: ['Pepperfry', 'Urban Ladder', 'IKEA'], daysAgo: 21 },
        { category: 'office', query: 'A4 Copier Paper', suppliers: ['Amazon', 'Flipkart', 'Local Suppliers'], daysAgo: 33 },
        { category: 'medical', query: 'Surgical Masks', suppliers: ['Apollo Pharmacy', 'Netmeds', 'Pharmacy Vendors'], daysAgo: 41 },
        { category: 'grocery', query: 'Cooking Oil', suppliers: ['BigBasket', 'JioMart', 'Blinkit'], daysAgo: 52 },
        { category: 'cleaning', query: 'Floor Cleaner', suppliers: ['Amazon', 'BigBasket', 'JioMart'], daysAgo: 64 },
    ];
    const docs = [];
    for (const s of samples) {
        const result = await SearchService_1.SearchService.searchPreview(s.query, s.category, s.suppliers);
        const date = new Date();
        date.setDate(date.getDate() - s.daysAgo);
        docs.push({
            userId,
            query: s.query,
            category: s.category,
            suppliers: s.suppliers,
            resultCount: result.count,
            recommendedSupplier: result.recommendation?.supplier || '',
            bestPrice: result.recommendation?.product.price || 0,
            estimatedSavings: result.recommendation?.estimatedSavings || 0,
            weightProfile: 'balanced',
            createdAt: date,
            updatedAt: date,
        });
    }
    if (docs.length) {
        await SearchHistory_1.SearchHistory.collection.insertMany(docs);
        logger_1.logger.info(`Seeded ${docs.length} sample searches for demo dashboard`);
    }
}
function writeTestCredentials() {
    const dir = '/app/memory';
    try {
        if (!fs_1.default.existsSync(dir))
            fs_1.default.mkdirSync(dir, { recursive: true });
        const content = `# Test Credentials — ProcureAI

## Demo Account
- Email: ${env_1.env.demoEmail}
- Password: ${env_1.env.demoPassword}

## Auth
- Tokens are JWT (Bearer). Login returns { token, user }. Send \`Authorization: Bearer <token>\`.
- Endpoints: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout

## Notes
- Backend: Node.js + Express + TypeScript on internal port 8002, fronted by a FastAPI proxy on 8001.
- All API routes are prefixed with /api.
- The demo account is seeded with ~9 sample searches so the dashboard/analytics are populated.
`;
        fs_1.default.writeFileSync(path_1.default.join(dir, 'test_credentials.md'), content, 'utf-8');
    }
    catch (e) {
        logger_1.logger.warn('Could not write test_credentials.md', e);
    }
}
async function runSeed() {
    await seedCategories();
    await seedSuppliers();
    const demoUser = await seedUser(env_1.env.demoEmail, env_1.env.demoPassword, env_1.env.demoName);
    await seedSampleHistory(demoUser._id);
    writeTestCredentials();
    logger_1.logger.info('Seed complete');
}
