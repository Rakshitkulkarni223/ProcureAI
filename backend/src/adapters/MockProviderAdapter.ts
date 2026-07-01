import { ProviderAdapter } from '../interfaces/ProviderAdapter';
import { Product } from '../types';
import { SupplierProfile } from '../config/data';
import { SeededRandom } from '../utils/prng';
import { CatalogResolver } from '../services/CatalogResolver';
import { clamp } from '../utils/currency';

/**
 * Mock provider adapter. Produces deterministic, believable product offers from
 * a supplier "profile". In Phase 2 each real source gets its own adapter (e.g.
 * AmazonApiAdapter) implementing the same ProviderAdapter interface — no change
 * to Search / Comparison / Recommendation services.
 */
export class MockProviderAdapter implements ProviderAdapter {
  readonly name: string;
  private profile: SupplierProfile;

  constructor(profile: SupplierProfile) {
    this.profile = profile;
    this.name = profile.name;
  }

  async search(query: string, category: string): Promise<Product[]> {
    // Simulate network latency of an external provider call.
    await new Promise((r) => setTimeout(r, 40 + Math.random() * 120));

    const tpl = CatalogResolver.resolve(category, query);
    const rng = new SeededRandom(`${query.toLowerCase().trim()}#${tpl.id}#${this.name}`);
    const p = this.profile;

    const priceJitter = rng.range(0.8, 1.2);
    const price = Math.round((tpl.basePrice * p.priceFactor * priceJitter) / 10) * 10;

    const discount = clamp(Math.round(p.discountBias + rng.range(-6, 8)), 0, 70);
    const originalPrice = Math.round(price / (1 - discount / 100) / 10) * 10;

    const rating = Math.round(clamp(p.baseRating + rng.range(-0.4, 0.3), 3, 5) * 10) / 10;
    const reviews = rng.int(60, 9000);
    const availability = rng.chance(p.stockProbability);

    const deliveryDays = Math.max(0, p.deliveryDays + rng.int(-1, 1));
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);

    const product: Product = {
      id: `${this.name.toLowerCase().replace(/\s+/g, '-')}-${tpl.id}`,
      provider: this.name,
      title: tpl.title,
      brand: tpl.brand,
      category,
      image: tpl.image,
      price,
      originalPrice,
      discount,
      rating,
      reviews,
      availability,
      deliveryDays,
      deliveryDate: deliveryDate.toISOString(),
      warrantyMonths: p.warrantyMonths || undefined,
      returnPolicyDays: p.returnDays,
      productUrl: `https://example.com/${this.name.toLowerCase().replace(/\s+/g, '')}/product/${tpl.id}`,
    };

    return [product];
  }
}
