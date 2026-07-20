import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLocation as useUserLocation } from '../context/LocationContext';
import {
  Search,
  Store,
  CheckCheck,
  Square,
  CheckSquare,
  Sparkles,
  ShoppingBasket,
  Plus,
  Trash2,
  Split,
  Truck,
  TrendingDown,
  Gauge,
  Shield,
  MapPin,
} from 'lucide-react';
import type {
  BasketOptimizeResponse,
  Category,
  RecommendationMode,
  RecommendationModeOption,
  SearchResponse,
  SortOption,
  Supplier,
  WeightProfile,
  WeightProfileKey,
} from '../types';
import type { SupplierHubSupplierSummary } from '../types_supplier';
import { api, apiError } from '../lib/api';
import { formatINR } from '../lib/format';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RecommendationCard } from '../components/RecommendationCard';
import { ComparisonResults } from '../components/ComparisonResults';
import { BasketResults } from '../components/BasketResults';
import { RecommendationModeSelector } from '../components/RecommendationModeSelector';
import { ProcurementInsightsPanel } from '../components/ProcurementInsightsPanel';
import { ProcurementHealthMeter } from '../components/ProcurementHealthMeter';
import { SupplierComparisonMatrix } from '../components/SupplierComparisonMatrix';
import { LongTermRecommendationCard } from '../components/LongTermRecommendationCard';
import { SupplierIntelligenceCard } from '../components/SupplierIntelligenceCard';
import { SupplierSourceSelector } from '../components/SupplierSourceSelector';
import { getIcon } from '../lib/icons';
import { cn } from '../lib/utils';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions';
import { SearchSuggestions } from '../components/SearchSuggestions';

const EXAMPLES: Record<string, string[]> = {
  electronics: ['UltraBook Pro 14 Laptop (16GB/512GB)', 'Galaxy S Smartphone 5G (256GB)', 'Wireless Noise Cancelling Headphones'],
  grocery: ['Premium Basmati Rice 10kg', 'Sunflower Cooking Oil 5L', 'Fresh Vegetables Combo 5kg'],
  fashion: ['Air Zoom Running Shoes', 'Cotton Crew Neck T-Shirt', 'Slim Fit Denim Jeans'],
  furniture: ['Ergonomic Office Chair', 'Height-Adjustable Standing Desk', '3-Seater Fabric Sofa'],
  office: ['A4 Copier Paper (5 Reams)', 'Ballpoint Pens (Pack of 50)', 'All-in-One Inkjet Printer'],
  cleaning: ['Floor Cleaner Disinfectant 5L', 'Hand Sanitizer 5L Refill', 'Tissue Rolls (Pack of 12)'],
  medical: ['3-Ply Surgical Masks (Box of 100)', 'Nitrile Examination Gloves (Box of 100)', 'Fingertip Pulse Oximeter'],
  industrial: ['Cordless Power Drill 20V', 'Safety Helmets (Pack of 10)', 'Adjustable Wrench Set'],
};

const BASKET_PRESETS: Record<string, { query: string; quantity: number }[]> = {
  grocery: [
    { query: 'Premium Basmati Rice 10kg', quantity: 1 },
    { query: 'Sunflower Cooking Oil 5L', quantity: 2 },
    { query: 'Fresh Vegetables Combo 5kg', quantity: 3 },
  ],
  office: [
    { query: 'A4 Copier Paper (5 Reams)', quantity: 2 },
    { query: 'Ballpoint Pens (Pack of 50)', quantity: 1 },
    { query: 'All-in-One Inkjet Printer', quantity: 1 },
  ],
};

type Mode = 'single' | 'basket';
let nextRowId = 0;
const makeRow = (query = '', quantity = 1): BasketRow => ({ id: nextRowId++, query, quantity });

interface BasketRow {
  id: number;
  query: string;
  quantity: number;
}

export function SearchPage() {
  const location = useLocation();
  const preset = location.state as { category?: string; query?: string } | null;
  const { city: userCity } = useUserLocation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [profiles, setProfiles] = useState<WeightProfile[]>([]);
  const [recModes, setRecModes] = useState<RecommendationModeOption[]>([]);
  const [category, setCategory] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierHubSuppliers, setSupplierHubSuppliers] = useState<SupplierHubSupplierSummary[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [weightProfile, setWeightProfile] = useState<WeightProfileKey>('balanced');
  const [recMode, setRecMode] = useState<RecommendationMode>('balanced');
  const [sortPref, setSortPref] = useState<SortOption>('lowest_price');
  const [error, setError] = useState('');

  // Bloom filter powered suggestions
  const suggestions = useSearchSuggestions(category);

  const [mode, setMode] = useState<Mode>('basket');

  // Single search
  const [query, setQuery] = useState(preset?.query || '');
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Basket
  const [basketRows, setBasketRows] = useState<BasketRow[]>(
    BASKET_PRESETS['grocery'].map((p) => makeRow(p.query, p.quantity))
  );
  const [penalty, setPenalty] = useState(0);
  const [basketResult, setBasketResult] = useState<BasketOptimizeResponse | null>(null);
  const [basketLoading, setBasketLoading] = useState(false);

  const autoRan = useRef(false);
  const basketSynced = useRef(false);

  useEffect(() => {
    if (!basketSynced.current && category && !basketResult) {
      basketSynced.current = true;
      if (BASKET_PRESETS[category]) {
        setBasketRows(BASKET_PRESETS[category].map((p) => makeRow(p.query, p.quantity)));
      } else {
        setBasketRows([makeRow()]);
      }
    }
  }, [category, basketResult]);

  useEffect(() => {
    Promise.all([api.categories(), api.weightProfiles(), api.recommendationModes(), api.preferences()])
      .then(([cats, profs, modes, pref]) => {
        setCategories(cats);
        setProfiles(profs);
        setRecModes(modes);
        setWeightProfile(pref.weightProfile);
        setSortPref(pref.sortPreference);
        setCategory(preset?.category || pref.defaultCategory || 'grocery');
      })
      .catch((e) => setError(apiError(e)));
  }, []);

  useEffect(() => {
    if (!category) return;
    let stale = false;
    Promise.all([
      api.suppliersForCategory(category),
      api.supplierHubSuppliersForCategory(category),
    ])
      .then(([s, sh]) => {
        if (stale) return;
        setSuppliers(s);
        setSupplierHubSuppliers(sh);
        const marketplaceSelected = new Set(s.filter((x) => x.enabled).map((x) => x.name));
        const supplierHubSelected = new Set(sh.map((x) => x.name));
        setSelected(new Set([...marketplaceSelected, ...supplierHubSelected]));
      })
      .catch((e) => { if (!stale) setError(apiError(e)); });
    return () => { stale = true; };
  }, [category]);

  const supplierColors = useMemo(
    () => {
      const marketplace: Record<string, string> = Object.fromEntries(suppliers.map((s) => [s.name, s.color]));
      const supplierHub: Record<string, string> = Object.fromEntries(supplierHubSuppliers.map((s) => [s.name, '#64748B']));
      return { ...marketplace, ...supplierHub };
    },
    [suppliers, supplierHubSuppliers],
  );

  const toggleSupplier = useCallback((name: string) => {
    try {
      setSelected((prev) => {
        const next = new Set(prev);
        next.has(name) ? next.delete(name) : next.add(name);
        return next;
      });
    } catch (e) {
      console.error('Failed to toggle supplier', e);
    }
  }, []);

  const activeSuppliersRef = useRef<() => string[]>(() => []);
  activeSuppliersRef.current = () => [...selected];

  const weightProfileRef = useRef(weightProfile);
  weightProfileRef.current = weightProfile;

  const recModeRef = useRef(recMode);
  recModeRef.current = recMode;

  const userCityRef = useRef(userCity);
  userCityRef.current = userCity;

  const runSearch = useCallback(async (overrideQuery?: string, overrideSuppliers?: string[], profileOverride?: WeightProfileKey, modeOverride?: RecommendationMode) => {
    try {
      const q = (overrideQuery ?? query).trim();
      if (!q) {
        setError('Enter a product to search for.');
        return;
      }
      const names = overrideSuppliers ?? activeSuppliersRef.current();
      if (!names.length) {
        setError('Select at least one supplier.');
        return;
      }
      setLoading(true);
      setError('');
      const res = await api.search({
        category,
        suppliers: names,
        query: q,
        weightProfile: profileOverride ?? weightProfileRef.current,
        recommendationMode: modeOverride ?? recModeRef.current,
        sortBy: sortPref,
        includeSupplierHub: true,
        userCity: userCityRef.current,
      });
      setResult(res);
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  }, [query, category, sortPref]);

  useEffect(() => {
    if (autoRan.current) return;
    if (preset?.query && suppliers.length) {
      autoRan.current = true;
      runSearch(preset.query, suppliers.map((s) => s.name));
    }
  }, [suppliers, preset?.query, runSearch]);

  const runOptimize = useCallback(async (profileOverride?: WeightProfileKey, modeOverride?: RecommendationMode) => {
    try {
      const items = basketRows
        .filter((r) => r.query.trim())
        .map((r) => ({ query: r.query.trim(), quantity: Math.max(1, r.quantity || 1) }));
      if (!items.length) {
        setError('Add at least one item to your basket.');
        return;
      }
      const names = activeSuppliersRef.current();
      if (!names.length) {
        setError('Select at least one supplier.');
        return;
      }
      setBasketLoading(true);
      setError('');
      const res = await api.basketOptimize({
        category,
        suppliers: names,
        items,
        weightProfile: profileOverride ?? weightProfileRef.current,
        consolidationPenalty: penalty || 0,
        recommendationMode: modeOverride ?? recModeRef.current,
        includeSupplierHub: true,
        userCity: userCityRef.current,
      });
      setBasketResult(res);
    } catch (e) {
      setError(apiError(e));
    } finally {
      setBasketLoading(false);
    }
  }, [basketRows, category, penalty]);

  const onProfileChange = useCallback((p: WeightProfileKey) => {
    try {
      setWeightProfile(p);
      weightProfileRef.current = p;
      if (mode === 'single' && result) runSearch(result.query, result.results.map((r) => r.provider), p);
      if (mode === 'basket' && basketResult) runOptimize(p);
    } catch (e) {
      console.error('Failed to change profile', e);
    }
  }, [mode, result, basketResult, runSearch, runOptimize]);

  const onRecModeChange = useCallback((m: RecommendationMode) => {
    try {
      setRecMode(m);
      recModeRef.current = m;
      if (mode === 'single' && result) {
        runSearch(result.query, result.results.map((r) => r.provider), undefined, m);
      }
      if (mode === 'basket' && basketResult) {
        runOptimize(undefined, m);
      }
    } catch (e) {
      console.error('Failed to change recommendation mode', e);
    }
  }, [mode, result, basketResult, runSearch, runOptimize]);

  const switchMode = useCallback((m: Mode) => {
    try {
      setMode(m);
      setError('');
    } catch (e) {
      console.error('Failed to switch mode', e);
    }
  }, []);

  const setCat = (slug: string) => {
    setCategory(slug);
    setResult(null);
    setBasketResult(null);
    setQuery('');
    if (BASKET_PRESETS[slug]) setBasketRows(BASKET_PRESETS[slug].map((p) => makeRow(p.query, p.quantity)));
    else setBasketRows([makeRow()]);
  };

  const updateRow = useCallback((i: number, patch: Partial<BasketRow>) =>
    setBasketRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r))), []);
  const addRow = useCallback(() => setBasketRows((rows) => [...rows, makeRow()]), []);
  const removeRow = useCallback((i: number) => setBasketRows((rows) => (rows.length > 1 ? rows.filter((_, idx) => idx !== i) : rows)), []);

  const categoryIcon = categories.find((c) => c.slug === category)?.icon;
  const categoryExamples = EXAMPLES[category] ?? ['Air Zoom Running Shoes', 'UltraBook Pro 14 Laptop (16GB/512GB)', 'Premium Basmati Rice 10kg'];
  const searchPlaceholder = `e.g. ${categoryExamples.join(', ')}…`;
  const basketPlaceholder = (i: number) => `e.g. ${categoryExamples[i % categoryExamples.length]}`;

  return (
    <div className="space-y-7">
      <section className="relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-emerald-400/15 bg-[linear-gradient(120deg,#07111f_0%,#0b2940_58%,#075b53_130%)] p-5 shadow-[0_20px_50px_rgba(15,23,42,0.16)] sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div>
          <div className="label-eyebrow">Procurement</div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Search &amp; Compare</h1>
          <p className="mt-1 text-sm text-muted">
            Compare one product, or optimise a whole basket across multiple suppliers.
          </p>
        </div>
        {/* Mode toggle */}
        <div className="relative inline-flex rounded-xl border border-white/10 bg-slate-950/45 p-1.5 backdrop-blur-sm" data-testid="mode-toggle">
          <button
            data-testid="mode-single"
            onClick={() => switchMode('single')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200',
              mode === 'single' ? 'bg-accent text-white shadow-[0_8px_18px_rgba(34,197,94,0.18)]' : 'text-muted hover:bg-white/5 hover:text-ink',
            )}
          >
            <Search size={15} /> Single Search
          </button>
          <button
            data-testid="mode-basket"
            onClick={() => switchMode('basket')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200',
              mode === 'basket' ? 'bg-accent text-white shadow-[0_8px_18px_rgba(34,197,94,0.18)]' : 'text-muted hover:bg-white/5 hover:text-ink',
            )}
          >
            <ShoppingBasket size={15} /> Basket Optimiser
          </button>
        </div>
      </section>

      {/* Search panel */}
      <Card className="overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-[#111827] via-surface to-slate-950 shadow-[0_16px_40px_rgba(15,23,42,0.14)]">
        <CardBody className="space-y-5 p-4 sm:p-6">
          {/* Categories */}
          <div>
            <div className="label-eyebrow mb-2.5">1 · Category</div>
            <div className="flex flex-wrap gap-2" data-testid="category-selector">
              {categories.map((c) => {
                const Icon = getIcon(c.icon);
                const active = c.slug === category;
                return (
                  <button
                    key={c.slug}
                    data-testid={`category-${c.slug}`}
                    onClick={() => setCat(c.slug)}
                    aria-pressed={active}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
                      active ? 'border-accent bg-accent text-white shadow-[0_8px_18px_rgba(34,197,94,0.18)]' : 'border-line bg-bg text-ink-soft hover:-translate-y-px hover:border-accent/40 hover:bg-surface',
                    )}
                  >
                    <Icon size={15} />
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Suppliers */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <div className="label-eyebrow flex items-center gap-1.5">
                <Store size={12} /> 2 · Suppliers ({selected.size}/{suppliers.length + supplierHubSuppliers.length})
              </div>
              <div className="flex gap-3 text-xs">
                <button
                  data-testid="suppliers-select-all"
                  onClick={() => setSelected(new Set([...suppliers.map((s) => s.name), ...supplierHubSuppliers.map((s) => s.name)]))}
                  className={cn(
                    'inline-flex items-center gap-1 font-medium transition-colors',
                    selected.size === suppliers.length + supplierHubSuppliers.length ? 'text-accent' : 'text-muted hover:text-ink',
                  )}
                >
                  <CheckCheck size={13} /> All
                </button>
                <button
                  data-testid="suppliers-select-none"
                  onClick={() => setSelected(new Set())}
                  className={cn(
                    'inline-flex items-center gap-1 font-medium transition-colors',
                    selected.size === 0 ? 'text-danger' : 'text-muted hover:text-ink',
                  )}
                >
                  {selected.size === 0 ? <CheckSquare size={13} /> : <Square size={13} />} None
                </button>
              </div>
            </div>
            <SupplierSourceSelector
              marketplaceSuppliers={suppliers}
              supplierHubSuppliers={supplierHubSuppliers}
              selected={selected}
              onToggle={toggleSupplier}
              onSelectAllMarketplace={() => setSelected((prev) => new Set([...prev, ...suppliers.map((s) => s.name)]))}
              onSelectNoneMarketplace={() => setSelected((prev) => {
                const next = new Set(prev);
                suppliers.forEach((s) => next.delete(s.name));
                return next;
              })}
              onSelectAllSupplierHub={() => setSelected((prev) => new Set([...prev, ...supplierHubSuppliers.map((s) => s.name)]))}
              onSelectNoneSupplierHub={() => setSelected((prev) => {
                const next = new Set(prev);
                supplierHubSuppliers.forEach((s) => next.delete(s.name));
                return next;
              })}
            />
          </div>

          {/* Query (single) OR Basket rows */}
          {mode === 'single' ? (
            <div>
              <div className="label-eyebrow mb-2.5">3 · What do you need?</div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runSearch();
                }}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <SearchSuggestions
                  data-testid="search-input"
                  value={query}
                  onChange={setQuery}
                  onSelect={(val) => setQuery(val)}
                  suggestions={suggestions.suggest(query)}
                  placeholder={searchPlaceholder}
                  className="flex-1"
                  categoryLabel={suggestions.categoryLabel}
                />
                <Button type="submit" size="lg" variant="accent" loading={loading} data-testid="search-submit-button">
                  <Sparkles size={16} /> Search &amp; Compare
                </Button>
              </form>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted">Try:</span>
                {(EXAMPLES[category] || []).map((ex) => (
                  <button
                    key={ex}
                    data-testid={`example-${ex}`}
                    onClick={() => {
                      setQuery(ex);
                      runSearch(ex);
                    }}
                    className="rounded-full border border-line bg-bg px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent/40 hover:text-ink"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="label-eyebrow mb-2.5 flex items-center gap-1.5">
                <ShoppingBasket size={12} /> 3 · Your shopping list
              </div>
              <div className="space-y-2" data-testid="basket-rows">
                {basketRows.map((row, i) => (
                  <div key={row.id} className="flex items-center gap-2">
                    <SearchSuggestions
                      data-testid={`basket-item-input-${i}`}
                      value={row.query}
                      onChange={(val) => updateRow(i, { query: val })}
                      suggestions={suggestions.suggest(row.query)}
                      placeholder={basketPlaceholder(i)}
                      className="flex-1"
                      inputClassName="!h-11 !pl-9"
                      iconSize={15}
                      categoryLabel={suggestions.categoryLabel}
                    />
                    <input
                      data-testid={`basket-item-qty-${i}`}
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) => updateRow(i, { quantity: parseInt(e.target.value || '1', 10) })}
                      className="h-12 w-16 rounded-xl border border-line bg-bg px-2 text-center text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                    />
                    <button
                      data-testid={`basket-remove-${i}`}
                      onClick={() => removeRow(i)}
                      disabled={basketRows.length <= 1}
                      aria-label={`Remove item ${i + 1}`}
                      className="flex h-12 w-11 items-center justify-center rounded-xl border border-line bg-bg text-muted transition-colors hover:border-danger/40 hover:bg-danger/10 hover:text-danger disabled:opacity-40"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  data-testid="basket-add-item"
                  onClick={addRow}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-line bg-bg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:border-accent/50 hover:text-ink"
                >
                  <Plus size={15} /> Add item
                </button>
                <label className="flex items-center gap-2 text-xs text-muted" title="Delivery/handling cost added per distinct supplier">
                  <Truck size={13} /> Delivery cost / supplier (₹)
                  <input
                    data-testid="basket-penalty-input"
                    type="number"
                    min={0}
                    value={penalty}
                    onChange={(e) => setPenalty(Math.max(0, parseInt(e.target.value || '0', 10)))}
                    className="h-10 w-20 rounded-xl border border-line bg-bg px-2 text-center text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                  />
                </label>
                <Button
                  size="lg"
                  variant="accent"
                  loading={basketLoading}
                  onClick={() => runOptimize()}
                  data-testid="basket-optimize-button"
                >
                  <Split size={16} /> Optimise Basket
                </Button>
              </div>
            </div>
          )}

          {/* AI Procurement Strategy */}
          {recModes.length > 0 && (
            <div>
              <div className="label-eyebrow mb-2.5 flex items-center gap-1.5">
                <Sparkles size={12} className="text-accent" /> AI Procurement Strategy
              </div>
              <RecommendationModeSelector
                modes={recModes}
                selected={recMode}
                onSelect={onRecModeChange}
              />
            </div>
          )}

          {/* Delivery Location (read-only — change via top bar dropdown) */}
          {userCity && (
            <div className="flex items-center gap-2 text-xs text-muted">
              <MapPin size={12} className="text-accent" />
              <span>Delivering to <span className="font-medium text-ink">{userCity}</span></span>
            </div>
          )}

          {/* Quick metrics for basket results */}
          {mode === 'basket' && basketResult && !basketLoading && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl border border-success/30 bg-success-bg/30 p-3 shadow-[0_0_18px_rgba(52,211,153,0.10)]">
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <TrendingDown size={13} />
                  <span className="label-eyebrow text-emerald-700">Est. Savings</span>
                </div>
                <div className="data-num mt-1.5 text-lg font-bold text-success">
                  {formatINR(basketResult.estimatedSavings)}
                </div>
              </div>
              <div className="rounded-xl border border-line bg-bg/70 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20">
                <div className="flex items-center gap-1.5 text-muted">
                  <Gauge size={13} />
                  <span className="label-eyebrow">AI Confidence</span>
                </div>
                <div className="data-num mt-1.5 text-lg font-bold text-ink">
                  {Math.round(basketResult.confidence * 100)}%
                </div>
              </div>
              <div className="rounded-xl border border-line bg-bg/70 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20">
                <div className="flex items-center gap-1.5 text-muted">
                  <Shield size={13} />
                  <span className="label-eyebrow">Risk</span>
                </div>
                <div className={cn(
                  'data-num mt-1.5 text-lg font-bold',
                  basketResult.intelligence?.risk?.level === 'Low' ? 'text-success'
                    : basketResult.intelligence?.risk?.level === 'Medium' ? 'text-amber-600'
                      : 'text-danger',
                )}>
                  {basketResult.intelligence?.risk?.level ?? '—'}
                </div>
              </div>
              <div className="rounded-xl border border-line bg-bg/70 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20">
                <div className="flex items-center gap-1.5 text-muted">
                  <Truck size={13} />
                  <span className="label-eyebrow">Delivery</span>
                </div>
                <div className="data-num mt-1.5 text-lg font-bold text-ink">
                  {basketResult.estimatedDelivery}
                </div>
              </div>
              <div className="rounded-xl border border-accent/30 bg-accent-soft/20 p-3 shadow-[0_0_18px_rgba(52,211,153,0.10)]">
                <div className="flex items-center gap-1.5 text-accent">
                  <Sparkles size={13} />
                  <span className="label-eyebrow text-accent">Strategy</span>
                </div>
                <div className="mt-1.5 text-sm font-bold capitalize text-ink">
                  {basketResult.recommendedPlan === 'split' ? 'Split-Cart' : 'Consolidate'}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger" data-testid="search-error">
              {error}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Results */}
      {mode === 'single' ? (
        <>
          {loading && <SearchLoader />}
          {!loading && result && result.results.length > 0 && (
            <div className="space-y-6 animate-fade-up">
              {result.recommendation && (
                <RecommendationCard rec={result.recommendation} supplierColors={supplierColors} />
              )}

              {/* Intelligence panels: side-by-side on large screens */}
              {result.intelligence && (
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Left: Insights + Health */}
                  <div className="space-y-6">
                    {result.intelligence.insights?.length > 0 && (
                      <ProcurementInsightsPanel insights={result.intelligence.insights} />
                    )}
                    {result.intelligence.healthScore && (
                      <ProcurementHealthMeter health={result.intelligence.healthScore} />
                    )}
                  </div>

                  {/* Right: Long-term rec + Total cost */}
                  <div className="space-y-6">
                    {result.intelligence.longTermRecommendation && (
                      <LongTermRecommendationCard
                        rec={result.intelligence.longTermRecommendation}
                        supplierColors={supplierColors}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Supplier Intelligence Cards */}
              {result.intelligence?.supplierIntelligence &&
                Object.keys(result.intelligence.supplierIntelligence).length > 0 && (
                  <div>
                    <div className="label-eyebrow mb-3">Supplier Intelligence</div>
                    <div className="grid items-start gap-3 sm:grid-cols-2">
                      {Object.entries(result.intelligence.supplierIntelligence).map(([supplier, intel]) => (
                        <SupplierIntelligenceCard
                          key={supplier}
                          supplier={supplier}
                          intelligence={intel}
                          color={supplierColors[supplier]}
                        />
                      ))}
                    </div>
                  </div>
                )}

              {/* Comparison Matrix */}
              {result.intelligence?.comparisonMatrix &&
                result.intelligence.comparisonMatrix.suppliers?.length > 0 && (
                  <SupplierComparisonMatrix
                    matrix={result.intelligence.comparisonMatrix}
                    supplierColors={supplierColors}
                  />
                )}

              <ComparisonResults
                products={result.results}
                recommendedSupplier={result.recommendation?.supplier}
                supplierColors={supplierColors}
                categoryIcon={categoryIcon}
                initialSort={sortPref}
                query={query}
                category={category}
                recommendation={result.recommendation}
                totalCosts={result.intelligence?.totalCosts}
              />
            </div>
          )}
          {!loading && result && result.results.length === 0 && (
            <Card>
              <CardBody className="flex flex-col items-center gap-3 py-14 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
                  <Search size={22} />
                </span>
                <h3 className="font-display text-lg font-semibold text-ink">
                  No results found for "{result.query}"
                </h3>
                <p className="max-w-md text-sm text-muted">
                  We couldn't find any matching products in our catalog. Try a different search term or check the suggested examples above.
                </p>
              </CardBody>
            </Card>
          )}
          {!loading && !result && <EmptyState mode="single" />}
        </>
      ) : (
        <>
          {basketLoading && <SearchLoader basket />}
          {!basketLoading && basketResult && <BasketResults result={basketResult} supplierColors={supplierColors} />}
          {!basketLoading && !basketResult && <EmptyState mode="basket" />}
        </>
      )}
    </div>
  );
}

function EmptyState({ mode }: { mode: Mode }) {
  const basket = mode === 'basket';
  return (
    <Card>
      <CardBody className="flex flex-col items-center gap-3 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-md bg-accent-soft text-accent">
          {basket ? <ShoppingBasket size={22} /> : <Search size={22} />}
        </span>
        <h3 className="font-display text-lg font-semibold text-ink">
          {basket ? 'Build your procurement basket' : 'Run your first comparison'}
        </h3>
        <p className="max-w-md text-sm text-muted">
          {basket
            ? 'Add several items and ProcureAI finds the optimal supplier for each — maximising total savings and telling you exactly what to buy where.'
            : 'ProcureAI queries every selected supplier in parallel, normalizes the results, and returns an explainable recommendation with quantified savings.'}
        </p>
      </CardBody>
    </Card>
  );
}

function SearchLoader({ basket }: { basket?: boolean }) {
  const lines = basket
    ? [
      'Searching all suppliers for your items…',
      'Evaluating price, delivery, and reliability for each option…',
      'Comparing single-supplier vs multi-supplier strategies…',
      'Optimizing your basket for the best procurement outcome…',
    ]
    : [
      'Connecting to supplier network…',
      'Fetching prices and availability across suppliers…',
      'Comparing products and standardizing results…',
      'Ranking suppliers using AI-powered scoring…',
    ];
  return (
    <Card data-testid="search-loader">
      <CardBody className="font-mono text-xs text-muted">
        <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-bg">
          <div className="h-full w-1/3 bg-accent animate-scan" />
        </div>
        {lines.map((l, i) => (
          <div key={i} className="flex items-center gap-2 py-0.5">
            <span className="text-success">▸</span> {l}
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
