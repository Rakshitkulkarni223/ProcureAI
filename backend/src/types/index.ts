/** Normalized product model shared across all provider adapters. */
export interface Product {
  id: string;
  provider: string;
  title: string;
  brand: string;
  category: string;
  image: string;
  price: number;
  originalPrice: number;
  discount: number; // percent
  rating: number; // 0..5
  reviews: number;
  availability: boolean;
  deliveryDate?: string; // ISO date
  deliveryDays: number;
  warrantyMonths?: number;
  returnPolicyDays?: number;
  productUrl: string;
}

export type SortOption =
  | 'lowest_price'
  | 'highest_rating'
  | 'fastest_delivery'
  | 'highest_discount';

export type WeightProfileKey =
  | 'balanced'
  | 'startup'
  | 'hospital'
  | 'restaurant';

export interface SearchFilters {
  brand?: string;
  supplier?: string;
  minRating?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
}

export interface SearchRequest {
  category: string;
  suppliers: string[];
  query: string;
  sortBy?: SortOption;
  filters?: SearchFilters;
  weightProfile?: WeightProfileKey;
}

export interface RecommendationFactor {
  label: string;
  weight: number;
  score: number; // 0..1
}

export interface Recommendation {
  supplier: string;
  product: Product;
  reasons: string[];
  estimatedSavings: number;
  confidence: number; // 0..1
  weightProfile: WeightProfileKey;
  factors: RecommendationFactor[];
  scoreboard: { supplier: string; score: number; price: number }[];
}

export interface SearchResponse {
  query: string;
  category: string;
  count: number;
  results: Product[];
  recommendation: Recommendation | null;
}

export interface WeightProfile {
  key: WeightProfileKey;
  label: string;
  description: string;
  weights: {
    price: number;
    delivery: number;
    rating: number;
    discount: number;
    availability: number;
    warranty: number;
    returnPolicy: number;
  };
}

// ---- Split-Cart / Multi-Supplier Basket ----
export interface BasketItemInput {
  query: string;
  quantity?: number;
}

export interface BasketItemResult {
  query: string;
  supplier: string | null;
  title: string;
  image: string;
  price: number;
  quantity: number;
  lineTotal: number;
  deliveryDays: number;
  availability: boolean;
  reasons: string[];
}

export interface BasketSupplierGroup {
  items: string[];
  subtotal: number;
  eta: string;
}

export interface BasketOptimizeResponse {
  category: string;
  weightProfile: WeightProfileKey;
  recommendedPlan: 'split' | 'consolidate';
  items: BasketItemResult[];
  groupedBySupplier: Record<string, BasketSupplierGroup>;
  splitTotal: number;
  baseline: { supplier: string | null; total: number };
  estimatedSavings: number;
  supplierCount: number;
  estimatedDelivery: string;
  confidence: number;
  unfulfillable: string[];
  consolidationPenalty: number;
}
