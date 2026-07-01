export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  businessType?: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  color: string;
  logo?: string;
  enabled: boolean;
}

export type SortOption = 'lowest_price' | 'highest_rating' | 'fastest_delivery' | 'highest_discount';
export type WeightProfileKey = 'balanced' | 'startup' | 'hospital' | 'restaurant';

export interface Product {
  id: string;
  provider: string;
  title: string;
  brand: string;
  category: string;
  image: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviews: number;
  availability: boolean;
  deliveryDate?: string;
  deliveryDays: number;
  warrantyMonths?: number;
  returnPolicyDays?: number;
  productUrl: string;
}

export interface RecommendationFactor {
  label: string;
  weight: number;
  score: number;
}

export interface Recommendation {
  supplier: string;
  product: Product;
  reasons: string[];
  estimatedSavings: number;
  confidence: number;
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
  weights: Record<string, number>;
}

export interface Preferences {
  id?: string;
  defaultCategory: string;
  enabledSuppliers: string[];
  sortPreference: SortOption;
  weightProfile: WeightProfileKey;
  businessType: string;
}

export interface HistoryEntry {
  id: string;
  query: string;
  category: string;
  suppliers: string[];
  resultCount: number;
  recommendedSupplier: string;
  bestPrice: number;
  estimatedSavings: number;
  weightProfile: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalSearches: number;
  procurementRequests: number;
  estimatedMonthlySavings: number;
  totalSavings: number;
  preferredSupplier: string | null;
  topCategory: string | null;
  topCategorySlug: string | null;
  activeCategories: number;
  projectedAnnualSavings: number;
  recentSearches: {
    id: string;
    query: string;
    category: string;
    categorySlug: string;
    suppliers: string[];
    recommendedSupplier: string;
    estimatedSavings: number;
    bestPrice: number;
    timestamp: string;
  }[];
}

export interface Insight {
  icon: string;
  text: string;
  tone: 'success' | 'info' | 'warning';
}

// ---- Split-Cart / Multi-Supplier Basket ----
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

export interface BasketHistoryEntry {
  id: string;
  category: string;
  suppliers: string[];
  itemCount: number;
  items: { query: string; quantity: number; supplier: string; price: number }[];
  splitTotal: number;
  baselineTotal: number;
  estimatedSavings: number;
  supplierCount: number;
  recommendedPlan: 'split' | 'consolidate';
  weightProfile: string;
  createdAt: string;
}
