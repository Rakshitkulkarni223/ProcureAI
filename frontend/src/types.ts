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
export type WeightProfileKey = 'balanced' | 'budget' | 'urgent' | 'fast';
export type RecommendationMode =
  | 'balanced'
  | 'lowest_cost'
  | 'lowest_risk'
  | 'fastest_delivery'
  | 'highest_reliability'
  | 'best_long_term_value';

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
  supplierSource?: 'marketplace' | 'supplier_hub' | 'google_shopping';
  city?: string;
  state?: string;
  distanceKm?: number;
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
  recommendationMode?: RecommendationMode;
  factors: RecommendationFactor[];
  scoreboard: {
    supplier: string;
    score: number;
    price: number;
    totalProcurementCost?: number;
    riskScore?: number;
    riskLevel?: string;
    supplierScore?: number;
    deliveryReliability?: number;
    deliveryDays?: number;
    city?: string;
    distanceKm?: number;
  }[];
}

export interface SearchResponse {
  query: string;
  category: string;
  count: number;
  results: Product[];
  recommendation: Recommendation | null;
  intelligence?: ProcurementIntelligence;
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
  city?: string;
}

export interface HistoryEntry {
  id: string;
  type?: 'single' | 'basket';
  query: string;
  category: string;
  suppliers: string[];
  resultCount: number;
  recommendedSupplier: string;
  bestPrice: number;
  estimatedSavings: number;
  weightProfile: string;
  createdAt: string;
  // Basket-specific fields
  basketItems?: { query: string; quantity: number; supplier: string; price: number }[];
  recommendedPlan?: 'split' | 'consolidate';
  supplierCount?: number;
  splitTotal?: number;
  baselineTotal?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

export interface BusinessImpact {
  totalSavings: number;
  monthlySavings: number;
  annualProjection: number;
  totalSearches: number;
  optimizedPurchases: number;
  hoursSaved: number;
  avgSavingPerPurchase: number;
  suppliersCompared: number;
  productsCompared: number;
  aiAccuracyPct: number;
  manualEliminatedPct: number;
  efficiencyScore: number;
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
  supplierSource?: 'marketplace' | 'supplier_hub';
  city?: string;
  state?: string;
  distanceKm?: number;
}

export interface BasketSupplierGroup {
  items: string[];
  subtotal: number;
  eta: string;
  supplierSource?: 'marketplace' | 'supplier_hub';
  city?: string;
  distanceKm?: number;
}

export interface BasketComparisonSupplier {
  supplier: string;
  price: number;
  lineTotal: number;
  deliveryDays: number;
  rating: number;
  supplierSource: 'marketplace' | 'supplier_hub';
  city?: string;
  state?: string;
  distanceKm?: number;
}

export interface BasketComparison {
  query: string;
  suppliers: BasketComparisonSupplier[];
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
  intelligence?: BasketIntelligence;
  comparisons?: BasketComparison[];
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

// ---- Procurement Intelligence ----

export interface SupplierIntelligence {
  supplierScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  riskScore: number;
  deliveryReliability: number;
  onTimeDeliveryRate: number;
  qualityConsistency: 'High' | 'Medium' | 'Low';
  businessStability: 'Strong' | 'Moderate' | 'Weak';
  stabilityScore: number;
  preferredSupplier: boolean;
  confidence: number;
  isEstimated: boolean;
}

export interface TotalCostBreakdown {
  supplier: string;
  productId: string;
  productPrice: number;
  shipping: number;
  processing: number;
  handling: number;
  hiddenCost: number;
  totalProcurementCost: number;
  isEstimated: boolean;
}

export interface RiskScore {
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  riskBadge: string;
  factors: {
    deliveryRisk: number;
    ratingRisk: number;
    warrantyRisk: number;
    returnRisk: number;
    stockRisk: number;
    stabilityRisk: number;
    qualityRisk: number;
  };
  isEstimated: boolean;
}

export interface ProcurementInsight {
  icon: string;
  text: string;
  tone: 'success' | 'info' | 'warning';
}

export interface HealthScore {
  score: number;
  status: 'Excellent' | 'Good' | 'Average' | 'Needs Attention';
  statusBadge: string;
  factors: {
    costSavings: number;
    supplierRisk: number;
    supplierDiversity: number;
    deliveryPerformance: number;
    procurementEfficiency: number;
  };
  isEstimated: boolean;
}

export interface LongTermRecommendation {
  supplier: string;
  product: Product;
  longTermScore: number;
  reasons: string[];
  supplierScore: number;
  riskLevel: string;
  deliveryReliability: number;
  totalProcurementCost: number;
  isEstimated: boolean;
}

export interface ComparisonMatrix {
  criteria: string[];
  suppliers: string[];
  matrix: Record<string, Record<string, boolean>>;
  isEstimated: boolean;
}

export interface ProcurementIntelligence {
  supplierIntelligence: Record<string, SupplierIntelligence>;
  totalCosts: TotalCostBreakdown[];
  riskScores: Record<string, RiskScore>;
  insights: ProcurementInsight[];
  healthScore: HealthScore | null;
  longTermRecommendation: LongTermRecommendation | null;
  comparisonMatrix: ComparisonMatrix;
}

export interface RecommendationModeOption {
  key: RecommendationMode;
  label: string;
  description: string;
}

// ---- Basket Intelligence ----

export interface BasketLogisticsBreakdown {
  shipping: number;
  transport: number;
  handling: number;
  hidden: number;
  total: number;
}

export interface BasketSavings {
  marketCost: number;
  optimizedCost: number;
  amount: number;
  percentage: number;
}

export interface BasketConsolidationScore {
  score: number;
  label: string;
  stars: string;
}

export interface BasketDeliveryWindow {
  earliest: number;
  latest: number;
  complete: number;
  earliestLabel: string;
  latestLabel: string;
}

export interface BasketComplexity {
  level: 'Very Easy' | 'Easy' | 'Medium' | 'High' | 'Very High';
  factors: {
    supplierCount: number;
    deliveryCount: number;
    invoiceCount: number;
  };
}

export interface BasketConfidence {
  percentage: number;
  label: string;
  reason: string;
}

export interface BasketRisk {
  level: 'Low' | 'Medium' | 'High';
  score: number;
}

export interface CostVsConvenience {
  recommended: 'split' | 'consolidate';
  reason: string;
  splitCost: number;
  consolidateCost: number;
  extraCost: number;
}

export interface SupplierDependency {
  amount: number;
  percentage: number;
}

export interface CategorySpendItem {
  item: string;
  query: string;
  supplier: string;
  amount: number;
}

export interface ExpectedSavings {
  perBasket: number;
  monthly: number;
  yearly: number;
}

export interface BasketIntelligence {
  // Base intelligence (reused)
  supplierIntelligence: Record<string, SupplierIntelligence>;
  totalCosts: TotalCostBreakdown[];
  riskScores: Record<string, RiskScore>;
  // New basket metrics
  totalProcurementCost: number;
  productCost: number;
  logisticsCost: number;
  logisticsBreakdown: BasketLogisticsBreakdown;
  savings: BasketSavings;
  supplierCount: number;
  consolidationScore: BasketConsolidationScore;
  deliveryWindow: BasketDeliveryWindow;
  complexity: BasketComplexity;
  aiScore: number;
  confidence: BasketConfidence;
  risk: BasketRisk;
  costVsConvenience: CostVsConvenience;
  supplierDependency: Record<string, SupplierDependency>;
  dominantSupplier: string | null;
  categorySpend: CategorySpendItem[];
  expectedSavings: ExpectedSavings;
  aiSummary: string;
  isEstimated: boolean;
}
