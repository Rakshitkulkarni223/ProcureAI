import axios from 'axios';
import type {
  SupplierHubSupplier,
  SupplierHubProduct,
  SupplierHubIntelligence,
} from '../types_supplier';

const API = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

const TOKEN_KEY = 'procureai_token';

API.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

const unwrap = <T>(p: Promise<{ data: { data: T } }>): Promise<T> => p.then((r) => r.data.data);

export function supplierHubApiError(e: any): string {
  try {
    const data = e?.response?.data;
    if (!data) return e?.message || 'Something went wrong.';
    if (typeof data.detail === 'string') return data.detail;
    // Handle Pydantic 422 validation errors (detail is an array)
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      return data.detail
        .map((err: any) => {
          const field = (err.loc || []).filter((l: any) => l !== 'body').join('.');
          return field ? `${field}: ${err.msg}` : err.msg;
        })
        .join('; ');
    }
    if (typeof data.error === 'string') return data.error;
    return 'Something went wrong.';
  } catch {
    return 'Something went wrong.';
  }
}

export const supplierHubApi = {
  // Suppliers
  listSuppliers: () => unwrap<SupplierHubSupplier[]>(API.get('/supplier-hub/suppliers')),
  getSupplier: (id: string) => unwrap<SupplierHubSupplier>(API.get(`/supplier-hub/suppliers/${id}`)),
  createSupplier: (body: Partial<SupplierHubSupplier>) =>
    unwrap<SupplierHubSupplier>(API.post('/supplier-hub/suppliers', body)),
  updateSupplier: (id: string, body: Partial<SupplierHubSupplier>) =>
    unwrap<SupplierHubSupplier>(API.put(`/supplier-hub/suppliers/${id}`, body)),
  deleteSupplier: (id: string) => unwrap<{ deleted: boolean }>(API.delete(`/supplier-hub/suppliers/${id}`)),

  // Products
  listProducts: (supplierId: string) =>
    unwrap<SupplierHubProduct[]>(API.get(`/supplier-hub/suppliers/${supplierId}/products`)),
  createProduct: (supplierId: string, body: Partial<SupplierHubProduct>) =>
    unwrap<SupplierHubProduct>(API.post(`/supplier-hub/suppliers/${supplierId}/products`, body)),
  updateProduct: (supplierId: string, productId: string, body: Partial<SupplierHubProduct>) =>
    unwrap<SupplierHubProduct>(API.put(`/supplier-hub/suppliers/${supplierId}/products/${productId}`, body)),
  deleteProduct: (supplierId: string, productId: string) =>
    unwrap<{ deleted: boolean }>(API.delete(`/supplier-hub/suppliers/${supplierId}/products/${productId}`)),

  // Intelligence & Insights
  getIntelligence: () => unwrap<SupplierHubIntelligence>(API.get('/supplier-hub/intelligence')),
  getInsights: () => unwrap<string[]>(API.get('/supplier-hub/insights')),
};
