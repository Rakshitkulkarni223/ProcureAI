import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  Store,
  CheckCheck,
  Square,
  Sparkles,
  ShoppingBasket,
  Plus,
  Trash2,
  Split,
  Truck,
  TrendingDown,
  Gauge,
  Shield,
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
import { api, apiError } from '../lib/api';
import { formatINR } from '../lib/format';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Switch } from '../components/ui/Switch';
import { RecommendationCard } from '../components/RecommendationCard';
import { ComparisonResults } from '../components/ComparisonResults';
import { BasketResults } from '../components/BasketResults';
import { RecommendationModeSelector } from '../components/RecommendationModeSelector';
import { ProcurementInsightsPanel } from '../components/ProcurementInsightsPanel';
import { ProcurementHealthMeter } from '../components/ProcurementHealthMeter';
import { SupplierComparisonMatrix } from '../components/SupplierComparisonMatrix';
import { TotalCostBreakdownPanel } from '../components/TotalCostBreakdownPanel';
import { LongTermRecommendationCard } from '../components/LongTermRecommendationCard';
import { SupplierIntelligenceCard } from '../components/SupplierIntelligenceCard';
import { getIcon } from '../lib/icons';
import { cn } from '../lib/utils';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions';
import { SearchSuggestions } from '../components/SearchSuggestions';

const EXAMPLES: Record<string, string[]> = {
  electronics: ['UltraBook Laptop', 'Galaxy Smartphone', 'Noise Cancelling Headphones'],
  grocery: ['Basmati Rice', 'Cooking Oil', 'Fresh Vegetables'],
  fashion: ['Nike Shoes', 'Cotton T-Shirt', 'Denim Jeans'],
  furniture: ['Office Chair', 'Standing Desk', 'Fabric Sofa'],
  office: ['A4 Copier Paper', 'Ballpoint Pens', 'Inkjet Printer'],
  cleaning: ['Floor Cleaner', 'Hand Sanitizer', 'Tissue Rolls'],
  medical: ['Surgical Masks', 'Nitrile Gloves', 'Pulse Oximeter'],
  industrial: ['Power Drill', 'Safety Helmets', 'Wrench Set'],
};

const BASKET_PRESETS: Record<string, { query: string; quantity: number }[]> = {
  grocery: [
    { query: 'Basmati Rice', quantity: 1 },
    { query: 'Cooking Oil', quantity: 2 },
    { query: 'Fresh Vegetables', quantity: 3 },
  ],
  office: [
    { query: 'A4 Copier Paper', quantity: 2 },
    { query: 'Ballpoint Pens', quantity: 1 },
    { query: 'Inkjet Printer', quantity: 1 },
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

  const [categories, setCategories] = useState<Category[]>([]);
  const [profiles, setProfiles] = useState<WeightProfile[]>([]);
  const [recModes, setRecModes] = useState<RecommendationModeOption[]>([]);
  const [category, setCategory] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
    api
      .suppliersForCategory(category)
      .then((s) => {
        if (stale) return;
        setSuppliers(s);
        setSelected(new Set(s.filter((x) => x.enabled).map((x) => x.name)));
      })
      .catch((e) => { if (!stale) setError(apiError(e)); });
    return () => { stale = true; };
  }, [category]);

  const supplierColors = useMemo(
    () => Object.fromEntries(suppliers.map((s) => [s.name, s.color])),
    [suppliers],
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
  activeSuppliersRef.current = () => (selected.size ? [...selected] : suppliers.map((s) => s.name));

  const weightProfileRef = useRef(weightProfile);
  weightProfileRef.current = weightProfile;

  const recModeRef = useRef(recMode);
  recModeRef.current = recMode;

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
  const categoryExamples = EXAMPLES[category] ?? ['Nike Shoes', 'UltraBook Laptop', 'Basmati Rice'];
  const searchPlaceholder = `e.g. ${categoryExamples.join(', ')}…`;
  const basketPlaceholder = (i: number) => `e.g. ${categoryExamples[i % categoryExamples.length]}`;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label-eyebrow">Procurement</div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Search &amp; Compare</h1>
          <p className="mt-1 text-sm text-muted">
            Compare one product, or optimise a whole basket across multiple suppliers.
          </p>
        </div>
        {/* Mode toggle */}
        <div className="inline-flex rounded-md border border-line bg-surface p-1" data-testid="mode-toggle">
          <button
            data-testid="mode-single"
            onClick={() => switchMode('single')}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors',
              mode === 'single' ? 'bg-accent text-white' : 'text-muted hover:text-ink',
            )}
          >
            <Search size={15} /> Single Search
          </button>
          <button
            data-testid="mode-basket"
            onClick={() => switchMode('basket')}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors',
              mode === 'basket' ? 'bg-accent text-white' : 'text-muted hover:text-ink',
            )}
          >
            <ShoppingBasket size={15} /> Basket Optimiser
          </button>
        </div>
      </div>

      {/* Search panel */}
      <Card>
        <CardBody className="space-y-6">
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
                      'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors duration-200',
                      active ? 'border-accent bg-accent text-white' : 'border-line bg-surface text-ink-soft hover:border-accent/40',
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
                <Store size={12} /> 2 · Suppliers ({selected.size}/{suppliers.length})
              </div>
              <div className="flex gap-3 text-xs">
                <button
                  data-testid="suppliers-select-all"
                  onClick={() => setSelected(new Set(suppliers.map((s) => s.name)))}
                  className="inline-flex items-center gap-1 font-medium text-muted hover:text-ink"
                >
                  <CheckCheck size={13} /> All
                </button>
                <button
                  data-testid="suppliers-select-none"
                  onClick={() => setSelected(new Set())}
                  className="inline-flex items-center gap-1 font-medium text-muted hover:text-ink"
                >
                  <Square size={13} /> None
                </button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" data-testid="supplier-toggles">
              {suppliers.map((s) => (
                <label
                  key={s.id}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2.5 transition-colors',
                    selected.has(s.name) ? 'border-ink/30 bg-bg' : 'border-line bg-surface',
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-sm font-medium text-ink">{s.name}</span>
                  </span>
                  <Switch
                    checked={selected.has(s.name)}
                    onCheckedChange={() => toggleSupplier(s.name)}
                    data-testid={`supplier-toggle-${s.name}`}
                  />
                </label>
              ))}
            </div>
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
                    className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-muted transition-colors hover:border-ink/40 hover:text-ink"
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
                      className="h-11 w-16 rounded-md border border-line bg-surface px-2 text-center text-sm text-ink focus:border-ink focus:outline-none"
                    />
                    <button
                      data-testid={`basket-remove-${i}`}
                      onClick={() => removeRow(i)}
                      disabled={basketRows.length <= 1}
                      aria-label={`Remove item ${i + 1}`}
                      className="flex h-11 w-11 items-center justify-center rounded-md border border-line text-muted transition-colors hover:border-danger/40 hover:text-danger disabled:opacity-40"
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
                  className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-line px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-ink/40 hover:text-ink"
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
                    className="h-9 w-20 rounded-md border border-line bg-surface px-2 text-center text-sm text-ink focus:border-ink focus:outline-none"
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

          {/* Quick metrics for basket results */}
          {mode === 'basket' && basketResult && !basketLoading && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-lg border border-success/30 bg-success-bg/30 p-3">
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <TrendingDown size={13} />
                  <span className="label-eyebrow text-emerald-700">Est. Savings</span>
                </div>
                <div className="data-num mt-1.5 text-lg font-bold text-success">
                  {formatINR(basketResult.estimatedSavings)}
                </div>
              </div>
              <div className="rounded-lg border border-line bg-surface p-3">
                <div className="flex items-center gap-1.5 text-muted">
                  <Gauge size={13} />
                  <span className="label-eyebrow">AI Confidence</span>
                </div>
                <div className="data-num mt-1.5 text-lg font-bold text-ink">
                  {Math.round(basketResult.confidence * 100)}%
                </div>
              </div>
              <div className="rounded-lg border border-line bg-surface p-3">
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
              <div className="rounded-lg border border-line bg-surface p-3">
                <div className="flex items-center gap-1.5 text-muted">
                  <Truck size={13} />
                  <span className="label-eyebrow">Delivery</span>
                </div>
                <div className="data-num mt-1.5 text-lg font-bold text-ink">
                  {basketResult.estimatedDelivery}
                </div>
              </div>
              <div className="rounded-lg border border-accent/30 bg-accent-soft/20 p-3">
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
                    {result.intelligence.totalCosts?.length > 0 && (
                      <TotalCostBreakdownPanel
                        totalCosts={result.intelligence.totalCosts}
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
        'Fetching every item across suppliers in parallel…',
        'Scoring each item × supplier with the weighted engine…',
        'Comparing split-optimal vs single-supplier baseline…',
        'Balancing item savings against delivery consolidation…',
      ]
    : [
        'Resolving enabled provider adapters…',
        'Querying suppliers in parallel (Promise.allSettled)…',
        'Normalizing products to common schema…',
        'Scoring suppliers with weighted decision engine…',
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
