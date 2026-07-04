import { Types } from 'mongoose';
import fs from 'fs';
import path from 'path';
import { Category } from '../models/Category';
import { Supplier } from '../models/Supplier';
import { SearchHistory } from '../models/SearchHistory';
import { User } from '../models/User';
import { UserPreference } from '../models/UserPreference';
import { CATEGORIES, CATEGORY_SUPPLIERS, SUPPLIER_PROFILES } from './data';
import { env } from './env';
import { hashPassword, verifyPassword } from '../utils/password';
import { SearchService } from '../services/SearchService';
import { logger } from '../utils/logger';

async function seedCategories() {
  for (const c of CATEGORIES) {
    await Category.updateOne(
      { slug: c.slug },
      { $set: { name: c.name, icon: c.icon, description: c.description, enabled: true } },
      { upsert: true },
    );
  }
}

async function seedSuppliers() {
  for (const [category, suppliers] of Object.entries(CATEGORY_SUPPLIERS)) {
    for (const name of suppliers) {
      const profile = SUPPLIER_PROFILES[name];
      await Supplier.updateOne(
        { name, category },
        { $set: { color: profile?.color || '#64748B', enabled: true } },
        { upsert: true },
      );
    }
  }
}

async function seedUser(email: string, password: string, name: string) {
  try {
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const passwordHash = await hashPassword(password);
      user = await User.create({ email: email.toLowerCase(), passwordHash, name, role: 'user' });
      logger.info(`Seeded user: ${email}`);
    } else {
      const same = await verifyPassword(password, user.passwordHash);
      if (!same) {
        user.passwordHash = await hashPassword(password);
        await user.save();
        logger.info(`Updated password for ${email}`);
      }
    }
    await UserPreference.updateOne(
      { userId: user._id },
      { $setOnInsert: { businessType: 'general' } },
      { upsert: true },
    );
    return user;
  } catch (e) {
    logger.error('Failed to seed user', e);
    throw e;
  }
}

async function seedSampleHistory(userId: Types.ObjectId) {
  const existing = await SearchHistory.countDocuments({ userId });
  if (existing > 0) return;

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
    const result = await SearchService.searchPreview(s.query, s.category, s.suppliers);
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
    await SearchHistory.collection.insertMany(docs as any);
    logger.info(`Seeded ${docs.length} sample searches for demo dashboard`);
  }
}

function writeTestCredentials() {
  const dir = '/app/memory';
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const content = `# Test Credentials — ProcureAI

## Demo Account
- Email: ${env.demoEmail}
- Password: ${env.demoPassword}

## Auth
- Tokens are JWT (Bearer). Login returns { token, user }. Send \`Authorization: Bearer <token>\`.
- Endpoints: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout

## Notes
- Backend: Node.js + Express + TypeScript on internal port 8002, fronted by a FastAPI proxy on 8001.
- All API routes are prefixed with /api.
- The demo account is seeded with ~9 sample searches so the dashboard/analytics are populated.
`;
    fs.writeFileSync(path.join(dir, 'test_credentials.md'), content, 'utf-8');
  } catch (e) {
    logger.warn('Could not write test_credentials.md', e);
  }
}

export async function runSeed() {
  await seedCategories();
  await seedSuppliers();
  const demoUser = await seedUser(env.demoEmail, env.demoPassword, env.demoName);
  await seedSampleHistory(demoUser._id as Types.ObjectId);
  writeTestCredentials();
  logger.info('Seed complete');
}
