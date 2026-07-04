import { useMemo } from 'react';
import { BloomFilter } from '../lib/bloomFilter';

/**
 * Product catalog per category — used to populate the Bloom filter
 * and serve as the candidate list for prefix matching.
 */
const PRODUCT_CATALOG: Record<string, string[]> = {
  electronics: [
    'Laptop', 'UltraBook Laptop', 'Gaming Laptop', 'Chromebook',
    'Smartphone', 'Galaxy Smartphone', 'iPhone', 'Pixel Phone',
    'Headphones', 'Noise Cancelling Headphones', 'Wireless Earbuds', 'AirPods',
    'Tablet', 'iPad', 'Samsung Tab', 'Kindle',
    'Monitor', '4K Monitor', 'Curved Monitor', 'Ultrawide Monitor',
    'Keyboard', 'Mechanical Keyboard', 'Wireless Keyboard',
    'Mouse', 'Gaming Mouse', 'Wireless Mouse', 'Trackpad',
    'Webcam', 'USB Hub', 'Power Bank', 'Charger', 'USB-C Cable',
    'Smart Watch', 'Fitness Tracker', 'Bluetooth Speaker',
    'External Hard Drive', 'SSD', 'RAM', 'Graphics Card',
    'Printer', 'Scanner', 'Projector', 'Router', 'Wi-Fi Extender',
  ],
  grocery: [
    'Basmati Rice', 'Brown Rice', 'Jasmine Rice', 'Quinoa',
    'Cooking Oil', 'Olive Oil', 'Coconut Oil', 'Sunflower Oil', 'Mustard Oil',
    'Fresh Vegetables', 'Tomatoes', 'Onions', 'Potatoes', 'Spinach', 'Broccoli',
    'Fresh Fruits', 'Apples', 'Bananas', 'Oranges', 'Mangoes', 'Grapes',
    'Milk', 'Butter', 'Cheese', 'Yogurt', 'Eggs',
    'Wheat Flour', 'Sugar', 'Salt', 'Pepper', 'Turmeric',
    'Chicken', 'Fish', 'Paneer', 'Tofu',
    'Tea', 'Coffee', 'Green Tea', 'Juice', 'Water',
    'Bread', 'Pasta', 'Noodles', 'Cereal', 'Oats',
    'Honey', 'Jam', 'Peanut Butter', 'Ketchup', 'Mayonnaise',
  ],
  fashion: [
    'Nike Shoes', 'Running Shoes', 'Sneakers', 'Formal Shoes', 'Sandals', 'Loafers', 'Boots',
    'Cotton T-Shirt', 'Polo T-Shirt', 'Graphic Tee', 'Henley', 'Tank Top', 'Crop Top',
    'Denim Jeans', 'Slim Fit Jeans', 'Cargo Pants', 'Chinos', 'Trousers', 'Joggers', 'Shorts',
    'Jacket', 'Hoodie', 'Sweatshirt', 'Blazer', 'Leather Jacket', 'Windbreaker',
    'Dress', 'Maxi Dress', 'Party Dress', 'Skirt', 'Kurta', 'Saree', 'Lehenga',
    'Co-ord Set', 'Co-ord Outfit', 'Matching Set', 'Twin Set',
    'Sunglasses', 'Watch', 'Belt', 'Wallet', 'Backpack', 'Handbag', 'Clutch', 'Tote Bag',
    'Socks', 'Cap', 'Scarf', 'Gloves', 'Tie', 'Bow Tie', 'Cufflinks',
    'Swimwear', 'Activewear', 'Tracksuit', 'Sports Bra', 'Leggings',
  ],
  furniture: [
    'Office Chair', 'Ergonomic Chair', 'Gaming Chair', 'Stool',
    'Standing Desk', 'Computer Desk', 'L-Shaped Desk', 'Writing Desk',
    'Fabric Sofa', 'Leather Sofa', 'Recliner', 'Bean Bag',
    'Bookshelf', 'TV Stand', 'Coffee Table', 'Dining Table',
    'Bed Frame', 'Mattress', 'Wardrobe', 'Nightstand',
    'Shoe Rack', 'Storage Cabinet', 'Filing Cabinet',
  ],
  office: [
    'A4 Copier Paper', 'Legal Pad', 'Notebook', 'Sticky Notes', 'Envelopes',
    'Ballpoint Pens', 'Gel Pens', 'Markers', 'Highlighters', 'Pencils',
    'Inkjet Printer', 'Laser Printer', 'Toner Cartridge', 'Ink Cartridge',
    'Stapler', 'Paper Clips', 'Binder Clips', 'Scissors', 'Tape',
    'Whiteboard', 'Whiteboard Markers', 'Desk Organizer', 'File Folders',
    'Calculator', 'Shredder', 'Laminator',
  ],
  cleaning: [
    'Floor Cleaner', 'Glass Cleaner', 'Bathroom Cleaner', 'Kitchen Cleaner',
    'Hand Sanitizer', 'Liquid Soap', 'Dishwashing Liquid', 'Laundry Detergent',
    'Tissue Rolls', 'Paper Towels', 'Trash Bags', 'Mop', 'Broom',
    'Disinfectant Spray', 'Bleach', 'Air Freshener', 'Wipes',
    'Vacuum Cleaner', 'Sponge', 'Scrub Brush', 'Dustpan',
  ],
  medical: [
    'Surgical Masks', 'N95 Masks', 'Face Shields',
    'Nitrile Gloves', 'Latex Gloves', 'Vinyl Gloves',
    'Pulse Oximeter', 'Thermometer', 'Blood Pressure Monitor',
    'First Aid Kit', 'Bandages', 'Gauze', 'Antiseptic Solution',
    'Stethoscope', 'Syringe', 'IV Set', 'Wheelchair',
    'Sanitizer', 'PPE Kit', 'Hand Wash', 'Cotton Swabs',
  ],
  industrial: [
    'Power Drill', 'Cordless Drill', 'Impact Driver',
    'Safety Helmets', 'Safety Goggles', 'Ear Plugs', 'Safety Vest',
    'Wrench Set', 'Socket Set', 'Screwdriver Set', 'Pliers',
    'Measuring Tape', 'Level', 'Wire Cutter', 'Utility Knife',
    'Welding Machine', 'Angle Grinder', 'Circular Saw', 'Jigsaw',
    'Work Boots', 'Tool Box', 'Extension Cord', 'Cable Ties',
  ],
};

interface SuggestionEngine {
  /** Get top suggestions for a given input prefix */
  suggest: (input: string, limit?: number) => string[];
  /** Check if prefix might have any matches (Bloom filter test) */
  mightHaveMatches: (input: string) => boolean;
  /** Human-readable category name */
  categoryLabel: string;
}

/**
 * Hook that builds a Bloom filter + candidate list for a given category.
 * Returns a `suggest(input)` function for instant autocomplete.
 */
export function useSearchSuggestions(category: string): SuggestionEngine {
  return useMemo(() => {
    try {
      const products = PRODUCT_CATALOG[category] || [];
      const filter = new BloomFilter(products.length * 10, 0.01);

      // Insert every product and all its prefixes into the Bloom filter
      for (const product of products) {
        filter.addWithPrefixes(product);
      }

      /**
       * Word-boundary matching: each query token must match the start of at
       * least one word in the product name.  "co" matches "Co-ord" but NOT
       * "Cotton" ("co" != start-of-word "C-o-t-t-o-n" — "Cot" would match).
       */
      const wordBoundaryMatch = (product: string, query: string): boolean => {
        try {
          const words = product.toLowerCase().split(/[\s\-_/]+/);
          const tokens = query.split(/[\s\-_/]+/).filter(Boolean);
          return tokens.every((token) =>
            words.some((word) => word.startsWith(token)),
          );
        } catch {
          return false;
        }
      };

      const suggest = (input: string, limit = 8): string[] => {
        try {
          const trimmed = input.trim().toLowerCase();
          if (!trimmed || trimmed.length < 1) return [];

          // Fast Bloom filter pre-check — if definitely no match, return empty
          if (!filter.mightContain(trimmed)) return [];

          // Bloom says "maybe" → do real word-boundary matching
          return products
            .filter((p) => wordBoundaryMatch(p, trimmed))
            .sort((a, b) => {
              // Prioritize starts-with over word-boundary match
              const aStarts = a.toLowerCase().startsWith(trimmed) ? 0 : 1;
              const bStarts = b.toLowerCase().startsWith(trimmed) ? 0 : 1;
              return aStarts - bStarts || a.length - b.length;
            })
            .slice(0, limit);
        } catch {
          return [];
        }
      };

      const mightHaveMatches = (input: string): boolean => {
        try {
          return filter.mightContain(input.trim().toLowerCase());
        } catch {
          return true;
        }
      };

      const CATEGORY_LABELS: Record<string, string> = {
        electronics: 'Electronics',
        grocery: 'Grocery',
        fashion: 'Fashion',
        furniture: 'Furniture',
        office: 'Office',
        cleaning: 'Cleaning',
        medical: 'Medical',
        industrial: 'Industrial',
      };

      return { suggest, mightHaveMatches, categoryLabel: CATEGORY_LABELS[category] || category };
    } catch {
      return {
        suggest: () => [],
        mightHaveMatches: () => true,
        categoryLabel: category,
      };
    }
  }, [category]);
}
