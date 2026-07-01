import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().email('A valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  businessType: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const searchSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  suppliers: z.array(z.string()).optional().default([]),
  query: z.string().min(1, 'Search query is required'),
  sortBy: z.enum(['lowest_price', 'highest_rating', 'fastest_delivery', 'highest_discount']).optional(),
  filters: z
    .object({
      brand: z.string().optional(),
      supplier: z.string().optional(),
      minRating: z.number().min(0).max(5).optional(),
      maxPrice: z.number().min(0).optional(),
      inStockOnly: z.boolean().optional(),
    })
    .optional(),
  weightProfile: z.enum(['balanced', 'startup', 'hospital', 'restaurant']).optional(),
});

export const recommendationSchema = z.object({
  products: z.array(z.any()).min(1, 'At least one product is required'),
  weightProfile: z.enum(['balanced', 'startup', 'hospital', 'restaurant']).optional(),
});

export const preferenceSchema = z.object({
  defaultCategory: z.string().optional(),
  enabledSuppliers: z.array(z.string()).optional(),
  sortPreference: z.enum(['lowest_price', 'highest_rating', 'fastest_delivery', 'highest_discount']).optional(),
  weightProfile: z.enum(['balanced', 'startup', 'hospital', 'restaurant']).optional(),
  businessType: z.string().optional(),
});

export const basketSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  suppliers: z.array(z.string()).optional().default([]),
  items: z
    .array(
      z.object({
        query: z.string().min(1, 'Item name is required'),
        quantity: z.number().int().positive().max(999).optional(),
      }),
    )
    .min(1, 'Add at least one item to your basket'),
  weightProfile: z.enum(['balanced', 'startup', 'hospital', 'restaurant']).optional(),
  consolidationPenalty: z.number().min(0).max(100000).optional(),
});
