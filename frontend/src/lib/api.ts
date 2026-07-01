import axios from 'axios';
import type {
  BasketHistoryEntry,
  BasketOptimizeResponse,
  Category,
  DashboardSummary,
  HistoryEntry,
  Insight,
  Preferences,
  SearchResponse,
  Supplier,
  User,
  WeightProfile,
} from '../types';

const API = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

const TOKEN_KEY = 'procureai_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

API.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
      tokenStore.clear();
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export function apiError(e: any): string {
  const data = e?.response?.data;
  if (!data) return e?.message || 'Something went wrong. Please try again.';
  if (typeof data.error === 'string') return data.error;
  if (Array.isArray(data.details)) return data.details.map((d: any) => d.message).join(' ');
  return 'Something went wrong. Please try again.';
}

const unwrap = <T>(p: Promise<{ data: { data: T } }>): Promise<T> => p.then((r) => r.data.data);

export const api = {
  // Auth
  register: (body: { name: string; email: string; password: string; businessType?: string }) =>
    unwrap<{ token: string; user: User }>(API.post('/auth/register', body)),
  login: (body: { email: string; password: string }) =>
    unwrap<{ token: string; user: User }>(API.post('/auth/login', body)),
  me: () => unwrap<User>(API.get('/auth/me')),
  logout: () => API.post('/auth/logout'),

  // Catalog
  categories: () => unwrap<Category[]>(API.get('/categories')),
  suppliersForCategory: (slug: string) => unwrap<Supplier[]>(API.get(`/categories/${slug}/suppliers`)),
  suppliers: () => unwrap<Supplier[]>(API.get('/suppliers')),
  toggleSupplier: (id: string, enabled: boolean) => unwrap<Supplier>(API.patch(`/suppliers/${id}`, { enabled })),

  // Search
  search: (body: {
    category: string;
    suppliers: string[];
    query: string;
    sortBy?: string;
    filters?: Record<string, unknown>;
    weightProfile?: string;
  }) => unwrap<SearchResponse>(API.post('/search', body)),

  // Split-cart / basket optimization
  basketOptimize: (body: {
    category: string;
    suppliers: string[];
    items: { query: string; quantity?: number }[];
    weightProfile?: string;
    consolidationPenalty?: number;
  }) => unwrap<BasketOptimizeResponse>(API.post('/basket/optimize', body)),
  basketHistory: () => unwrap<BasketHistoryEntry[]>(API.get('/basket/history')),

  // Preferences
  preferences: () => unwrap<Preferences>(API.get('/preferences')),
  updatePreferences: (body: Partial<Preferences>) => unwrap<Preferences>(API.put('/preferences', body)),
  weightProfiles: () => unwrap<WeightProfile[]>(API.get('/weight-profiles')),

  // History
  history: () => unwrap<HistoryEntry[]>(API.get('/history')),
  deleteHistory: (id: string) => API.delete(`/history/${id}`),

  // Dashboard / analytics
  dashboard: () => unwrap<DashboardSummary>(API.get('/dashboard')),
  spend: () =>
    unwrap<{
      monthlySpend: { month: string; amount: number }[];
      categorySpend: { category: string; amount: number }[];
      supplierUsage: { supplier: string; count: number }[];
    }>(API.get('/analytics/spend')),
  savings: () =>
    unwrap<{ savingsTrend: { month: string; amount: number }[]; totalSavings: number }>(
      API.get('/analytics/savings'),
    ),
  insights: () => unwrap<{ insights: Insight[] }>(API.get('/insights')),
};
