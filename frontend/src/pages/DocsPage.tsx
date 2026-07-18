import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  ShoppingCart,
  BarChart3,
  Settings,
  History,
  Zap,
  Shield,
  Code2,
  Layers,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Terminal,
  Globe,
  Database,
  Cpu,
  FileText,
  Users,
  HelpCircle,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  Package,
  Clock,
  Star,
  LifeBuoy,
  Lightbulb,
  PlayCircle,
  Eye,
  Download,
  Brain,
  Gauge,
  Calculator,
  ArrowDown,
  MapPin,
  Target,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';

type DocMode = 'general' | 'developer';

/* ─── Section data ─── */

interface DocSection {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: { label: string; tone: 'neutral' | 'success' | 'accent' | 'warning' };
  content: React.ReactNode;
}

/* ════════════════════════════════════════════════════════════════
   GENERAL DOCS — written for clients / end-users
   ════════════════════════════════════════════════════════════════ */

const GENERAL_SECTIONS: DocSection[] = [
  /* ── 0. EXECUTIVE SUMMARY — immediate "why" for visitors ── */
  {
    id: 'g-executive-summary',
    title: 'Executive Summary — Why ProcureAI?',
    icon: Zap,
    badge: { label: 'Start here', tone: 'accent' },
    content: (
      <div className="space-y-5 text-sm text-ink-soft leading-relaxed">
        {/* The Problem */}
        <div>
          <h4 className="mb-2 font-semibold text-ink text-base">The Problem</h4>
          <p>
            Businesses spend <strong className="text-ink">hours</strong> comparing suppliers across multiple marketplaces
            and spreadsheets before making procurement decisions.
          </p>
        </div>

        {/* The Solution */}
        <div>
          <h4 className="mb-2 font-semibold text-ink text-base">The Solution</h4>
          <p>
            ProcureAI <strong className="text-ink">automates</strong> supplier discovery, AI-powered comparison,
            basket optimization, and procurement reporting.
          </p>
        </div>

        {/* Business Impact */}
        <div>
          <h4 className="mb-2 font-semibold text-ink text-base">Business Impact</h4>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { icon: '⭐', text: 'Up to 90% faster supplier comparison' },
              { icon: '📉', text: 'Reduce manual procurement work' },
              { icon: '🤖', text: 'AI-powered purchasing recommendations' },
              { icon: '📊', text: 'Business Impact Dashboard' },
              { icon: '💰', text: 'ROI Calculator' },
              { icon: '🧠', text: 'Explainable AI' },
            ].map((p) => (
              <div key={p.text} className="flex items-center gap-2 rounded-md border border-line bg-bg p-3">
                <span className="text-base leading-none">{p.icon}</span>
                <p className="text-xs text-muted">{p.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Who is it for? */}
        <div>
          <h4 className="mb-2 font-semibold text-ink text-base">Who is it for?</h4>
          <div className="grid gap-2 sm:grid-cols-5">
            {['Manufacturers', 'Retailers', 'SMEs', 'Procurement Teams', 'Supply Chain Operations'].map((who) => (
              <div key={who} className="rounded-md border border-line bg-accent-soft px-3 py-2 text-center text-xs font-medium text-accent">
                {who}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  /* ── 1. BUSINESS TRANSFORMATION — detailed before/after ── */
  {
    id: 'g-transformation',
    title: 'Business Transformation',
    icon: Gauge,
    content: (
      <div className="space-y-5 text-sm text-ink-soft leading-relaxed">
        <p>See how ProcureAI transforms manual procurement into an <strong className="text-ink">AI-powered workflow</strong> — measurable gains across every metric.</p>

        {/* Before vs After table */}
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-line bg-bg text-left"><th className="px-3 py-2 font-semibold text-ink">Metric</th><th className="px-3 py-2 font-semibold text-danger/80">Before (Manual)</th><th className="px-3 py-2 font-semibold text-green-600">After (ProcureAI)</th></tr></thead>
            <tbody className="divide-y divide-line">
              {[
                ['Supplier comparison', 'Manual across multiple websites', 'Automated — one click'],
                ['Time per procurement', '45–60 minutes', '3–5 minutes'],
                ['Websites visited', '5–10 per purchase', '1 (ProcureAI)'],
                ['Manual calculations', 'Required (Excel/paper)', 'Eliminated — scoring engine handles it'],
                ['Recommendations', '❌ Not available', '✅ Weighted scoring + explanation'],
                ['Procurement reports', 'Manual preparation', 'One-click CSV & PDF'],
                ['Multi-item optimization', 'Not feasible', '✅ Split-cart optimizer'],
                ['Savings tracking', 'No visibility', '✅ Real-time dashboard'],
              ].map(([metric, before, after]) => (
                <tr key={metric}><td className="px-3 py-2 font-medium text-ink">{metric}</td><td className="px-3 py-2 text-muted">{before}</td><td className="px-3 py-2 text-muted">{after}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Value Delivered */}
        <div>
          <h4 className="mb-2 font-semibold text-ink text-base">Value Delivered</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { icon: DollarSign, title: '~93% Time Reduction', desc: 'Estimated: from 45 min to 3 min per procurement cycle (illustrative scenario).' },
              { icon: Star, title: 'Explainable AI', desc: 'Every recommendation includes a "Why?" panel with radar chart.' },
              { icon: Clock, title: 'Track & Maximize Savings', desc: 'Business Impact dashboard with ROI calculator.' },
              { icon: Package, title: 'One-Click Reports', desc: 'Export comparisons as professional PDF or CSV.' },
            ].map((v) => (
              <div key={v.title} className="flex gap-3 rounded-md border border-line bg-bg p-3">
                <v.icon size={18} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <h5 className="text-xs font-semibold text-ink">{v.title}</h5>
                  <p className="mt-0.5 text-[11px] text-muted">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },

  /* ── 2. PRODUCT DEMO ── */
  {
    id: 'g-demo-video',
    title: 'Product Demo',
    icon: PlayCircle,
    badge: { label: 'Watch', tone: 'accent' },
    content: (
      <div className="space-y-3 text-sm text-ink-soft leading-relaxed">
        <p>
          Watch a <strong className="text-ink">full walkthrough</strong> covering every feature —
          login, AI search, basket optimization, business impact dashboard, analytics, and dark mode.
        </p>
        <div className="overflow-hidden rounded-lg border border-line bg-bg shadow-sm">
          <video controls playsInline preload="metadata" className="w-full" poster="">
            <source src="/procureai-demo.webm" type="video/webm" />
            <source src="/procureai-demo.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <p className="text-xs text-muted">Tip: Click the fullscreen button for the best viewing experience.</p>
      </div>
    ),
  },

  /* ── 3. HOW IT WORKS ── */
  {
    id: 'g-how-it-works',
    title: 'How It Works',
    icon: Layers,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        {/* Visual workflow */}
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-md border border-line bg-bg p-4 text-xs font-medium">
          {['🏢 Business Need', '🤖 ProcureAI', '📊 Recommendation', '💰 Business Impact'].map((s, i, arr) => (
            <React.Fragment key={s}>
              <span className="rounded-md bg-accent-soft px-3 py-1.5 text-accent whitespace-nowrap">{s}</span>
              {i < arr.length - 1 && <ArrowRight size={14} className="text-muted shrink-0" />}
            </React.Fragment>
          ))}
        </div>
        <div className="space-y-3">
          {[
            { step: 1, title: 'Search', desc: 'Type a product name, pick a category — ProcureAI queries all configured suppliers simultaneously.' },
            { step: 2, title: 'Compare', desc: 'Results are normalized and displayed in a sortable comparison table.' },
            { step: 3, title: 'Recommend', desc: 'The decision engine scores every option on price, delivery, rating, discount, warranty, and returns.' },
            { step: 4, title: 'Explain', desc: 'Click "Why this recommendation?" for a radar chart and supplier scoreboard.' },
            { step: 5, title: 'Optimize', desc: 'Add multiple items to a basket for split-cart optimization across suppliers.' },
            { step: 6, title: 'Export & Track', desc: 'Download CSV/PDF reports. Track savings on the Business Impact dashboard.' },
          ].map((s) => (
            <div key={s.step} className="flex gap-4 rounded-md border border-line bg-bg p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white text-sm font-bold">{s.step}</span>
              <div>
                <h4 className="font-semibold text-ink">{s.title}</h4>
                <p className="mt-0.5 text-xs text-muted">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  /* ── 4. SEARCH & COMPARE ── */
  {
    id: 'g-single-search',
    title: 'Search & Compare',
    icon: Search,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>Search for any product and compare all suppliers instantly. The AI-recommended option is highlighted with a confidence score.</p>
        <div className="rounded-md border border-line bg-bg p-4">
          <h4 className="mb-3 font-semibold text-ink">Step-by-step</h4>
          <ol className="space-y-2 text-xs text-muted list-decimal list-inside">
            <li>Go to <strong className="text-ink">Search & Compare</strong> from the sidebar.</li>
            <li>Pick a <strong className="text-ink">category</strong> — Electronics, Fashion, Grocery, etc.</li>
            <li>Choose which <strong className="text-ink">suppliers</strong> to compare (or leave all selected).</li>
            <li>Type your product in the search box and click <strong className="text-ink">Search</strong>.</li>
            <li>Review the comparison table — the AI-recommended option is highlighted.</li>
            <li>Click <strong className="text-ink">"Why this recommendation?"</strong> for the AI explanation panel.</li>
          </ol>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-bg p-3">
            <h5 className="text-xs font-semibold text-ink">Export Options</h5>
            <p className="mt-1 text-[11px] text-muted">Download results as <strong className="text-ink">CSV</strong> (for Excel/Sheets) or <strong className="text-ink">PDF</strong> (styled report with AI summary).</p>
          </div>
          <div className="rounded-md border border-line bg-bg p-3">
            <h5 className="text-xs font-semibold text-ink">Price Watchlist</h5>
            <p className="mt-1 text-[11px] text-muted">Click the <strong className="text-ink">eye icon</strong> to track any product. Set target prices and monitor across sessions.</p>
          </div>
        </div>
        <div className="rounded-md border border-accent/20 bg-accent-soft p-4">
          <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold text-accent"><CheckCircle2 size={14} /> Pro Tip</h4>
          <p className="text-xs text-ink-soft">Be specific with your search. "Samsung Galaxy S24 128GB" gets better results than just "phone".</p>
        </div>
      </div>
    ),
  },

  /* ── 5. AI EXPLANATION ── */
  {
    id: 'g-ai-explanation',
    title: 'AI Explanation Panel',
    icon: Brain,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>
          Every recommendation is <strong className="text-ink">transparent and auditable</strong>. The decision engine uses rule-based weighted scoring, with optional Gemini-generated natural language explanations.
        </p>
        <div className="rounded-md border border-line bg-bg p-4">
          <h4 className="mb-2 font-semibold text-ink">What the Decision Engine Evaluates (7 Factors)</h4>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {[
              { factor: 'Price', desc: 'Unit cost, line total, volume discounts' },
              { factor: 'Delivery', desc: 'Estimated days based on supplier location and your city' },
              { factor: 'Reliability', desc: 'Supplier rating and delivery consistency' },
              { factor: 'Warranty', desc: 'Coverage duration in months' },
              { factor: 'Returns', desc: 'Return policy availability and terms' },
              { factor: 'Risk', desc: 'Composite risk score (price volatility, delivery risk, concentration)' },
              { factor: 'Total Cost', desc: 'Full procurement cost including shipping, handling, and penalties' },
            ].map((f) => (
              <div key={f.factor} className="flex gap-2 rounded border border-line bg-surface px-3 py-2">
                <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-success" />
                <div><span className="text-xs font-semibold text-ink">{f.factor}</span><span className="text-[11px] text-muted"> — {f.desc}</span></div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-bg p-4">
            <h4 className="mb-2 font-semibold text-ink">Radar Chart</h4>
            <p className="text-xs text-muted">Visualizes how the recommended supplier performs across all scoring factors at a glance.</p>
          </div>
          <div className="rounded-md border border-line bg-bg p-4">
            <h4 className="mb-2 font-semibold text-ink">Supplier Scoreboard</h4>
            <p className="text-xs text-muted">A ranked table of all suppliers with color-coded progress bars, weighted scores out of 100, and prices so you can verify the recommendation.</p>
          </div>
        </div>
        <div className="rounded-md border border-line bg-bg p-4">
          <h4 className="mb-2 font-semibold text-ink">What It Produces</h4>
          <ul className="space-y-1 text-xs text-muted">
            <li><CheckCircle2 size={11} className="mr-1 inline text-success" /> <strong className="text-ink">Confidence Score</strong> — how far ahead the top supplier is vs. the runner-up</li>
            <li><CheckCircle2 size={11} className="mr-1 inline text-success" /> <strong className="text-ink">Business Reasoning</strong> — why this supplier was selected (not just "lowest price")</li>
            <li><CheckCircle2 size={11} className="mr-1 inline text-success" /> <strong className="text-ink">Trade-offs</strong> — radar chart showing how the top supplier compares on every dimension</li>
            <li><CheckCircle2 size={11} className="mr-1 inline text-success" /> <strong className="text-ink">Supplier Scoreboard</strong> — all suppliers ranked with scores out of 100</li>
            <li><CheckCircle2 size={11} className="mr-1 inline text-success" /> <strong className="text-ink">Business Impact</strong> — estimated savings vs. the most expensive alternative</li>
          </ul>
        </div>
        <div className="rounded-md border border-accent/20 bg-accent-soft p-4">
          <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold text-accent"><CheckCircle2 size={14} /> Pro Tip</h4>
          <p className="text-xs text-ink-soft">Use this panel when presenting procurement decisions to your team — it provides the evidence behind each recommendation.</p>
        </div>
      </div>
    ),
  },

  /* ── 6. BASKET OPTIMIZATION ── */
  {
    id: 'g-basket',
    title: 'Basket Optimization',
    icon: ShoppingCart,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>
          Need to buy multiple items? Basket Optimization finds the smartest way to <strong className="text-ink">split your order across
          suppliers</strong> — or tells you if buying everything from one place is actually cheaper.
        </p>
        <div className="rounded-md border border-line bg-bg p-4">
          <h4 className="mb-3 font-semibold text-ink">How to use it</h4>
          <ol className="space-y-2 text-xs text-muted list-decimal list-inside">
            <li>Switch to <strong className="text-ink">Basket Optimiser</strong> mode on the Search page.</li>
            <li>Add items one by one — enter the product name and quantity.</li>
            <li>Click <strong className="text-ink">Optimise Basket</strong>.</li>
            <li>Review the recommendation: <strong className="text-ink">Split</strong> (buy from different suppliers) or <strong className="text-ink">Consolidate</strong> (buy all from one).</li>
          </ol>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-bg p-3">
            <h5 className="text-xs font-semibold text-ink">Split Plan</h5>
            <p className="mt-1 text-[11px] text-muted">Each item goes to the cheapest supplier. Best savings, but multiple deliveries.</p>
          </div>
          <div className="rounded-md border border-line bg-bg p-3">
            <h5 className="text-xs font-semibold text-ink">Consolidate Plan</h5>
            <p className="mt-1 text-[11px] text-muted">Everything from one supplier. Simpler logistics, one delivery.</p>
          </div>
        </div>
      </div>
    ),
  },

  /* ── 7. BUSINESS IMPACT DASHBOARD ── */
  {
    id: 'g-business-impact',
    title: 'Business Impact Dashboard',
    icon: TrendingUp,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>
          The <strong className="text-ink">Business Impact</strong> page shows exactly how ProcureAI transforms your procurement —
          measurable savings, time freed, and smarter decisions. Use the date range filter to focus on any period.
        </p>
        <div className="rounded-md border border-line bg-bg p-4">
          <h4 className="mb-3 font-semibold text-ink">Key Metrics</h4>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { title: 'Total Savings', desc: 'Cumulative procurement savings from recommendations.' },
              { title: 'Hours Saved', desc: 'Time saved vs manual comparison (42 min per search).' },
              { title: 'Purchases Optimized', desc: 'Searches where the engine recommended a better supplier.' },
              { title: 'Products Compared', desc: 'Total supplier options evaluated across all searches.' },
              { title: 'Recommendation Accuracy', desc: 'Percentage of searches with a successful recommendation.' },
              { title: 'Efficiency Score', desc: 'Composite score (0–100) measuring procurement performance.' },
            ].map((m) => (
              <div key={m.title} className="rounded-md border border-line bg-surface p-3">
                <h5 className="text-xs font-semibold text-ink">{m.title}</h5>
                <p className="mt-0.5 text-[11px] text-muted">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-bg p-4">
            <h4 className="mb-2 flex items-center gap-2 font-semibold text-ink"><ArrowDown size={14} className="text-green-600" /> Before vs After</h4>
            <p className="text-xs text-muted">Side-by-side visual comparing the <strong className="text-ink">8-step manual process (45–60 min)</strong> with ProcureAI's <strong className="text-ink">5-step AI workflow (3–5 min)</strong> — an estimated ~93% time reduction (illustrative scenario).</p>
          </div>
          <div className="rounded-md border border-line bg-bg p-4">
            <h4 className="mb-2 flex items-center gap-2 font-semibold text-ink"><Calculator size={14} className="text-accent" /> ROI Calculator</h4>
            <p className="text-xs text-muted">Interactive sliders let you input your <strong className="text-ink">purchases/month, hourly cost,</strong> and <strong className="text-ink">comparison times</strong> to estimate monthly hours saved, salary savings, and annual cost reduction.</p>
          </div>
        </div>
        <div className="rounded-md border border-accent/20 bg-accent-soft p-4">
          <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold text-accent"><CheckCircle2 size={14} /> Pro Tip</h4>
          <p className="text-xs text-ink-soft">Use the Business Impact page when presenting procurement ROI to management — it provides concrete numbers on time and cost savings.</p>
        </div>
      </div>
    ),
  },

  /* ── 8. DASHBOARD & ANALYTICS ── */
  {
    id: 'g-dashboard',
    title: 'Dashboard & Analytics',
    icon: BarChart3,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>Your <strong className="text-ink">Dashboard</strong> is the home screen — a snapshot of procurement activity at a glance. The <strong className="text-ink">Analytics</strong> page provides deeper visual insights. Both include a <strong className="text-ink">date range filter</strong> (last 7/30/90 days, this month, or custom).</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-bg p-4">
            <h4 className="mb-2 font-semibold text-ink">Dashboard KPIs</h4>
            <ul className="space-y-1 text-xs text-muted">
              <li>• <strong className="text-ink">Total Searches</strong> — comparisons you've run</li>
              <li>• <strong className="text-ink">Est. Monthly Savings</strong> — adjusts with date range</li>
              <li>• <strong className="text-ink">Top Category</strong> — most searched category</li>
              <li>• <strong className="text-ink">Preferred Supplier</strong> — most recommended</li>
              <li>• <strong className="text-ink">AI Insights</strong> — smart suggestions</li>
            </ul>
          </div>
          <div className="rounded-md border border-line bg-bg p-4">
            <h4 className="mb-2 font-semibold text-ink">Analytics Charts</h4>
            <ul className="space-y-1 text-xs text-muted">
              <li>• <strong className="text-ink">Spend Trend</strong> — monthly spend over time</li>
              <li>• <strong className="text-ink">Category Breakdown</strong> — where budget goes</li>
              <li>• <strong className="text-ink">Supplier Usage</strong> — most recommended vendors</li>
              <li>• <strong className="text-ink">Savings Trend</strong> — cumulative savings for ROI</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },

  /* ── 9. WATCHLIST & HISTORY ── */
  {
    id: 'g-watchlist-history',
    title: 'Watchlist & History',
    icon: Eye,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-bg p-4">
            <h4 className="mb-2 flex items-center gap-2 font-semibold text-ink"><Eye size={14} className="text-accent" /> Price Watchlist</h4>
            <p className="text-xs text-muted mb-2">Track products and set target prices. Persists across sessions.</p>
            <ul className="space-y-1 text-xs text-muted">
              <li><CheckCircle2 size={11} className="mr-1 inline text-success" /> Add products from search results with one click</li>
              <li><CheckCircle2 size={11} className="mr-1 inline text-success" /> Set target prices — editable inline</li>
              <li><CheckCircle2 size={11} className="mr-1 inline text-success" /> Products at target are highlighted green</li>
            </ul>
          </div>
          <div className="rounded-md border border-line bg-bg p-4">
            <h4 className="mb-2 flex items-center gap-2 font-semibold text-ink"><History size={14} className="text-accent" /> Search History</h4>
            <p className="text-xs text-muted mb-2">Only successful searches are saved (15 per page). Failed/empty searches are excluded.</p>
            <ul className="space-y-1 text-xs text-muted">
              <li><CheckCircle2 size={11} className="mr-1 inline text-success" /> View past searches with timestamps</li>
              <li><CheckCircle2 size={11} className="mr-1 inline text-success" /> Expand basket searches for item breakdown</li>
              <li><CheckCircle2 size={11} className="mr-1 inline text-success" /> Delete old entries you no longer need</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },

  /* ── 10. SUPPLIER HUB ── */
  {
    id: 'g-supplier-hub',
    title: 'Supplier Hub',
    icon: Package,
    badge: { label: 'Network', tone: 'success' },
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>
          Build your own <strong className="text-ink">private supplier network</strong> — combine online marketplace data with your trusted offline suppliers.
          Every supplier is searchable and comparable using the same multi-factor decision engine.
        </p>
        <div className="rounded-md border border-line bg-bg p-4">
          <h4 className="mb-3 font-semibold text-ink">Capabilities</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { title: 'Build Your Network', desc: 'Register suppliers with name, contact, city, state, and category.' },
              { title: 'Add Products', desc: 'Add products with pricing, delivery days, warranty, ratings, and stock status.' },
              { title: 'Unified Search', desc: 'Supplier Hub products appear alongside marketplace results in every search.' },
              { title: 'State Filtering', desc: 'Only suppliers from your state are included — ensuring relevant, local results.' },
              { title: 'Same Scoring Engine', desc: 'Your suppliers are scored and ranked by the same decision engine as marketplace suppliers.' },
            ].map((c) => (
              <div key={c.title} className="flex gap-2 rounded border border-line bg-surface px-3 py-2">
                <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-success" />
                <div><span className="text-xs font-semibold text-ink">{c.title}</span><span className="text-[11px] text-muted"> — {c.desc}</span></div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-bg p-3">
            <h5 className="text-xs font-semibold text-ink">Marketplace Sources</h5>
            <ul className="mt-1 space-y-0.5 text-[11px] text-muted">
              <li>• Mock Providers (built-in)</li>
              <li>• Google Shopping (optional, via SerpAPI)</li>
              <li>• Future: Amazon, Udaan, Metro, IndiaMART</li>
            </ul>
          </div>
          <div className="rounded-md border border-line bg-bg p-3">
            <h5 className="text-xs font-semibold text-ink">Your Offline Suppliers</h5>
            <ul className="mt-1 space-y-0.5 text-[11px] text-muted">
              <li>• Your Rice Mill</li>
              <li>• Vegetable Vendor</li>
              <li>• Oil Distributor</li>
              <li>• Local Mandi</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },

  /* ── 11. RECOMMENDATION MODES ── */
  {
    id: 'g-recommendation-modes',
    title: 'Procurement Strategies (6 Modes)',
    icon: Target,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>
          The same supplier may not be the best choice under every business objective. ProcureAI supports <strong className="text-ink">6 recommendation modes</strong> that rerank suppliers based on what matters most.
        </p>
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-line bg-bg text-left"><th className="px-3 py-2 font-semibold text-ink">Mode</th><th className="px-3 py-2 font-semibold text-ink">Optimizes For</th><th className="px-3 py-2 font-semibold text-ink">Best When</th></tr></thead>
            <tbody className="divide-y divide-line">
              {[
                ['Balanced', 'Weighted score across all factors', 'Default — general-purpose procurement'],
                ['Lowest Cost', 'Total procurement cost (price + shipping + handling)', 'Budget is the primary constraint'],
                ['Lowest Risk', 'Composite risk score (price stability, delivery risk)', 'Buying critical or high-value items'],
                ['Fastest Delivery', 'Minimum delivery days', 'Urgent or time-sensitive purchases'],
                ['Highest Reliability', 'Supplier delivery consistency and rating', 'Repeat orders where reliability matters'],
                ['Best Long-Term Value', 'Supplier score (quality + consistency + warranty)', 'Building long-term supplier relationships'],
              ].map(([mode, optimizes, best]) => (
                <tr key={mode}><td className="px-3 py-2 font-medium text-ink">{mode}</td><td className="px-3 py-2 text-muted">{optimizes}</td><td className="px-3 py-2 text-muted">{best}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-md border border-accent/20 bg-accent-soft p-4">
          <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold text-accent"><Lightbulb size={14} /> Key Insight</h4>
          <p className="text-xs text-ink-soft">The recommendation engine <strong className="text-ink">dynamically reranks suppliers</strong> without changing the underlying data — the same product catalog produces different "best" suppliers depending on your business priorities. Each mode generates different business-friendly reasoning.</p>
        </div>
      </div>
    ),
  },

  /* ── 12. LOCATION-AWARE DELIVERY ── */
  {
    id: 'g-location',
    title: 'Location-Aware Delivery',
    icon: MapPin,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>
          Set your <strong className="text-ink">city</strong> in Settings. Delivery estimates auto-calculate based on supplier distance.
          Supplier Hub filters results to your <strong className="text-ink">state</strong>.
        </p>
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-line bg-bg text-left"><th className="px-3 py-2 font-semibold text-ink">Distance</th><th className="px-3 py-2 font-semibold text-ink">Estimated Delivery</th></tr></thead>
            <tbody className="divide-y divide-line">
              {[
                ['Same city', '1 day'],
                ['Same state', '2 days'],
                ['Different state', '4–5 days'],
              ].map(([distance, delivery]) => (
                <tr key={distance}><td className="px-3 py-2 font-medium text-ink">{distance}</td><td className="px-3 py-2 text-muted">{delivery}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted">Change your city in <strong className="text-ink">Settings → Location Preferences</strong>. Supplier Hub suppliers from other states are automatically excluded from search results.</p>
      </div>
    ),
  },

  /* ── 13. SETTINGS & WEIGHT PROFILES ── */
  {
    id: 'g-settings',
    title: 'Settings & Weight Profiles',
    icon: Settings,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>Manage your profile and tell the AI what matters most to <em>your</em> business with weight profiles.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { name: 'Balanced', desc: 'Equal importance to price, speed, and quality. Good default for most purchases.', icon: '⚖️' },
            { name: 'Budget', desc: 'Maximizes cost savings. Best when budget is the #1 priority.', icon: '💰' },
            { name: 'Urgent', desc: 'Prioritizes availability and fast delivery. Critical when stock and speed matter most.', icon: '⚡' },
            { name: 'Fast', desc: 'Fast, reliable delivery. Speed first, price secondary.', icon: '🚀' },
          ].map((p) => (
            <div key={p.name} className="rounded-md border border-line bg-bg p-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{p.icon}</span>
                <h4 className="font-semibold text-ink">{p.name}</h4>
              </div>
              <p className="mt-1 text-xs text-muted">{p.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted">Change your default profile in <strong className="text-ink">Settings → Procurement Preferences</strong>.</p>
      </div>
    ),
  },

  /* ── 11. FAQ & SUPPORT ── */
  {
    id: 'g-faq',
    title: 'FAQ & Support',
    icon: HelpCircle,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        {[
          { q: 'Is my data private?', a: 'Yes. All searches, history, and preferences are tied to your account and not shared.' },
          { q: 'How accurate are the prices?', a: 'Prices are generated by built-in mock providers by default. When SERPAPI_KEY is configured, real-time Google Shopping prices are blended in automatically.' },
          { q: 'Can I add my own suppliers?', a: 'Yes! Use Supplier Hub to register your own offline suppliers with products, pricing, and delivery info. They appear alongside marketplace results in every search.' },
          { q: 'How is "estimated savings" calculated?', a: 'Savings = difference between the most expensive option and the AI-recommended option.' },
          { q: 'Can I use ProcureAI on mobile?', a: 'Yes! The interface is fully responsive and works on phones and tablets.' },
          { q: 'What does the confidence score mean?', a: 'It indicates how sure the AI is. Higher confidence (80%+) means the recommended option is significantly better.' },
        ].map((faq) => (
          <div key={faq.q} className="rounded-md border border-line bg-bg p-4">
            <h4 className="font-semibold text-ink">{faq.q}</h4>
            <p className="mt-1 text-xs text-muted">{faq.a}</p>
          </div>
        ))}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-bg p-4">
            <Package size={20} className="text-accent" />
            <h4 className="mt-2 font-semibold text-ink">Documentation</h4>
            <p className="mt-1 text-xs text-muted">Browse General and Developer guides to learn every feature.</p>
          </div>
          <div className="rounded-md border border-line bg-bg p-4">
            <Globe size={20} className="text-accent" />
            <h4 className="mt-2 font-semibold text-ink">GitHub</h4>
            <p className="mt-1 text-xs text-muted">Report issues or suggest features on our <a href="https://github.com/Rakshitkulkarni223/ProcureAI" target="_blank" rel="noopener noreferrer" className="text-accent underline hover:text-accent-hover">GitHub repository</a>.</p>
          </div>
        </div>
      </div>
    ),
  },
];

/* ════════════════════════════════════════════════════════════════
   DEVELOPER DOCS — technical, API-focused
   ════════════════════════════════════════════════════════════════ */

const DEV_SECTIONS: DocSection[] = [
  {
    id: 'd-architecture',
    title: 'Architecture',
    icon: Layers,
    badge: { label: 'Overview', tone: 'accent' },
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>ProcureAI is a full-stack application with a React/TypeScript frontend and Python/FastAPI backend.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-bg p-4">
            <div className="mb-2 flex items-center gap-2"><Globe size={16} className="text-accent" /><h4 className="font-semibold text-ink">Frontend</h4></div>
            <ul className="space-y-1 text-xs text-muted">
              <li>• React 18 + TypeScript</li>
              <li>• Tailwind CSS with CSS-variable theming</li>
              <li>• React Router v6</li>
              <li>• Context API (Auth, Theme)</li>
              <li>• Recharts (Radar, Area, Bar, Pie)</li>
              <li>• Autocomplete Search </li>
              <li>• CSV/PDF export engine</li>
              <li>• localStorage Watchlist</li>
              <li>• Date range filter (Dashboard, Analytics & Business Impact)</li>
              <li>• Business Impact page (metrics, before/after, ROI calculator)</li>
            </ul>
          </div>
          <div className="rounded-md border border-line bg-bg p-4">
            <div className="mb-2 flex items-center gap-2"><Terminal size={16} className="text-accent" /><h4 className="font-semibold text-ink">Backend</h4></div>
            <ul className="space-y-1 text-xs text-muted">
              <li>• Python 3.13 + FastAPI + Uvicorn</li>
              <li>• MongoDB / Motor (async driver)</li>
              <li>• JWT authentication (PyJWT + bcrypt)</li>
              <li>• Pydantic schema validation</li>
              <li>• Multi-provider mock adapters</li>
              <li>• Optional SerpAPI (live Google Shopping prices)</li>
              <li>• Optional Gemini AI (natural language explanations)</li>
              <li>• Weighted decision engine</li>
              <li>• Date-filtered analytics (from/to query params)</li>
              <li>• Business impact API (hours saved, efficiency, ROI)</li>
            </ul>
          </div>
        </div>
        <div className="rounded-md border border-line bg-bg p-4">
          <h4 className="mb-2 font-semibold text-ink">Request flow</h4>
          <div className="flex items-center gap-2 overflow-x-auto text-xs text-muted">
            {['Client', 'FastAPI Router', 'Route Handlers', 'Services', 'Provider Adapters', 'Response'].map((s, i, arr) => (
              <React.Fragment key={s}>
                <span className="whitespace-nowrap rounded bg-accent-soft px-2 py-1 font-medium text-accent">{s}</span>
                {i < arr.length - 1 && <ArrowRight size={12} className="shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'd-getting-started',
    title: 'Getting Started',
    icon: Terminal,
    badge: { label: 'Setup', tone: 'success' },
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <h4 className="font-semibold text-ink">Prerequisites</h4>
        <ul className="space-y-1 text-muted"><li>• Python 3.11+</li><li>• Node.js 18+ (frontend only)</li><li>• MongoDB 6+ (local or Atlas)</li><li>• Git</li></ul>
        <div className="space-y-3">
          <CodeBlock title="1. Clone & install" code={`git clone https://github.com/Rakshitkulkarni223/ProcureAI.git\ncd ProcureAI\n\n# Backend\ncd backend && pip install -r requirements.txt\n\n# Frontend\ncd ../frontend && npm install`} />
          <CodeBlock title="2. Environment variables" code={`# backend/.env\nMONGO_URL=mongodb://localhost:27017/procureai\nDB_NAME=procureai\nJWT_SECRET=your-secret-key\nPORT=8001\nSERPAPI_KEY=              # Optional — live Google Shopping prices\nGEMINI_API_KEY=           # Optional — AI Procurement Advisor\n\n# frontend/.env (optional)\nREACT_APP_BACKEND_URL=http://localhost:8001`} />
          <CodeBlock title="3. Run" code={`# Terminal 1 — Backend\ncd backend && uvicorn server:app --host 0.0.0.0 --port 8001 --reload\n\n# Terminal 2 — Frontend\ncd frontend && npm start`} />
        </div>
        <p className="text-xs text-muted">Backend: <code className="rounded bg-bg px-1.5 py-0.5 text-accent">localhost:8001</code> · Frontend: <code className="rounded bg-bg px-1.5 py-0.5 text-accent">localhost:3000</code></p>
      </div>
    ),
  },
  {
    id: 'd-project-structure',
    title: 'Project Structure',
    icon: FileText,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <div className="grid gap-4 sm:grid-cols-2">
          <CodeBlock title="backend/" code={`server.py              # FastAPI entry point (Uvicorn)\nrequirements.txt       # Python dependencies\napp/\n  ├── config.py        # env vars, categories, suppliers, catalog\n  ├── database.py      # Motor async MongoDB client\n  ├── auth.py          # JWT + bcrypt, auth dependency\n  ├── schemas.py       # Pydantic validation models\n  ├── routes.py        # All API routes (/api prefix)\n  ├── routes_supplier.py # Supplier Hub CRUD routes\n  ├── seed.py          # DB seeder\n  └── services/\n      ├── core.py      # PRNG, CatalogResolver, Search, Recommendation\n      ├── basket.py    # Basket optimization\n      ├── analytics.py # Dashboard, History, Preferences\n      ├── intelligence.py # Procurement intelligence engine\n      ├── supplier_hub.py # Supplier Hub CRUD service\n      ├── serpapi_adapter.py # Optional live Google Shopping\n      └── llm_advisor.py # Optional Gemini AI advisor`} />
          <CodeBlock title="frontend/" code={`src/\n  ├── components/    # reusable UI\n  │   └── ui/        # Button, Card, Badge…\n  ├── context/       # AuthContext, ThemeContext, LocationContext\n  ├── hooks/         # useSearchSuggestions, useWatchlist\n  ├── lib/           # api, bloomFilter, exportUtils\n  ├── pages/         # route-level pages\n  ├── types.ts       # TypeScript interfaces\n  ├── App.tsx        # router & providers\n  └── index.css      # Tailwind + CSS vars`} />
        </div>
      </div>
    ),
  },
  {
    id: 'd-authentication',
    title: 'Authentication',
    icon: Shield,
    badge: { label: 'Security', tone: 'warning' },
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>JWT-based authentication. All endpoints except login/register require a valid bearer token.</p>
        <div className="rounded-md border border-line bg-bg p-4">
          <h4 className="mb-2 font-semibold text-ink">Auth endpoints</h4>
          <div className="space-y-1 text-xs text-muted font-mono">
            <p><code className="text-accent">POST /api/auth/register</code> — Create account</p>
            <p><code className="text-accent">POST /api/auth/login</code> — Returns JWT token</p>
            <p><code className="text-accent">GET  /api/auth/me</code> — Current user info</p>
          </div>
        </div>
        <CodeBlock title="Usage" code={`// Include in every request:\nAuthorization: Bearer <token>\n\n// Token payload:\n{ userId, email, role, iat, exp }`} />
        <div className="rounded-md border border-line bg-bg p-4">
          <h4 className="mb-2 font-semibold text-ink">Security</h4>
          <ul className="space-y-1 text-xs text-muted">
            <li>• bcrypt (12 salt rounds)</li>
            <li>• Configurable JWT expiry (PyJWT)</li>
            <li>• CORS per environment (FastAPI CORSMiddleware)</li>
            <li>• Pydantic input validation</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'd-api-reference',
    title: 'API Reference',
    icon: Code2,
    badge: { label: 'Reference', tone: 'neutral' },
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>All endpoints prefixed with <code className="rounded bg-bg px-1.5 py-0.5 text-accent">/api</code>.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-line text-left text-muted"><th className="px-3 py-2 font-medium">Method</th><th className="px-3 py-2 font-medium">Endpoint</th><th className="px-3 py-2 font-medium">Auth</th><th className="px-3 py-2 font-medium">Description</th></tr></thead>
            <tbody className="divide-y divide-line font-mono">
              {[
                ['POST', '/auth/register', '✗', 'Create new account'],
                ['POST', '/auth/login', '✗', 'Authenticate & get token'],
                ['GET', '/auth/me', '✓', 'Current user profile'],
                ['POST', '/search', '✓', 'Single product search'],
                ['POST', '/basket/optimize', '✓', 'Basket optimization'],
                ['GET', '/basket/history', '✓', 'Basket search history'],
                ['GET', '/history', '✓', 'Unified search history (paginated)'],
                ['DELETE', '/history/:id', '✓', 'Delete history entry'],
                ['GET', '/dashboard?from=&to=', '✓', 'Dashboard KPIs (date range optional)'],
                ['GET', '/analytics/spend?from=&to=', '✓', 'Spend analytics (date range optional)'],
                ['GET', '/analytics/savings?from=&to=', '✓', 'Savings trend (date range optional)'],
                ['GET', '/insights?from=&to=', '✓', 'AI insights (date range optional)'],
                ['GET', '/business-impact?from=&to=', '✓', 'Business impact metrics (date range optional)'],
                ['GET', '/preferences', '✓', 'Get user preferences'],
                ['PUT', '/preferences', '✓', 'Update preferences'],
                ['GET', '/categories', '✗', 'List product categories'],
                ['GET', '/suppliers/:category', '✓', 'Suppliers for a category'],
                ['GET', '/weight-profiles', '✗', 'Available weight profiles'],
                ['GET', '/recommendation-modes', '✗', 'Available recommendation modes'],
                ['GET', '/cities', '✗', 'Available delivery cities'],
                ['POST', '/suppliers', '✓', 'Add a Supplier Hub supplier'],
                ['GET', '/suppliers/:id/products', '✓', 'List supplier products'],
                ['POST', '/suppliers/:id/products', '✓', 'Add product to supplier'],
              ].map(([method, path, auth, desc]) => (
                <tr key={path}>
                  <td className="px-3 py-2"><span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', method === 'GET' ? 'bg-accent-soft text-accent' : method === 'POST' ? 'bg-success-bg text-success' : method === 'PUT' ? 'bg-warning-bg text-warning' : 'bg-danger/10 text-danger')}>{method}</span></td>
                  <td className="px-3 py-2 text-ink">{path}</td>
                  <td className="px-3 py-2 text-center">{auth}</td>
                  <td className="px-3 py-2 font-sans text-muted">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: 'd-search-api',
    title: 'Search API',
    icon: Search,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <CodeBlock title="POST /api/search — Request" code={`{
  "query": "Laptop",
  "category": "electronics",
  "suppliers": ["amazon", "flipkart"],
  "weightProfile": "balanced"
}`} />
        <CodeBlock title="Response shape" code={`{
  "query": "Laptop",
  "category": "electronics",
  "results": [
    {
      "provider": "amazon",
      "title": "HP Pavilion 15",
      "price": 54999,
      "rating": 4.2,
      "deliveryDays": 3,
      "warranty": "1 year",
      "returnPolicy": "10 days",
      "inStock": true,
      "url": "https://..."
    }
  ],
  "recommendation": {
    "supplier": "amazon",
    "confidence": 0.87,
    "factors": [...],
    "estimatedSavings": 3200
  }
}`} />
      </div>
    ),
  },
  {
    id: 'd-basket-api',
    title: 'Basket API',
    icon: ShoppingCart,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <CodeBlock title="POST /api/basket/optimize — Request" code={`{
  "category": "grocery",
  "items": [
    { "query": "Premium Basmati Rice 10kg", "quantity": 2 },
    { "query": "Sunflower Cooking Oil 5L", "quantity": 1 }
  ],
  "weightProfile": "balanced"
}`} />
        <CodeBlock title="Response shape" code={`{
  "recommendedPlan": "split" | "consolidate",
  "items": [...],
  "groupedBySupplier": { ... },
  "splitTotal": 1250,
  "baseline": { "supplier": "amazon", "total": 1400 },
  "estimatedSavings": 150,
  "supplierCount": 2,
  "estimatedDelivery": "3-5 days",
  "confidence": 0.82,
  "unfulfillable": ["xyzzy"],
  "consolidationPenalty": 50
}`} />
        <div className="rounded-md border border-line bg-bg p-4">
          <h4 className="mb-2 font-semibold text-ink">Algorithm summary</h4>
          <ol className="space-y-1.5 text-xs text-muted list-decimal list-inside">
            <li>Each item queried across all enabled providers in parallel.</li>
            <li>Results normalised to common schema with scoring.</li>
            <li>Split plan: assign each item to cheapest supplier.</li>
            <li>Consolidation plan: single-supplier total + penalty.</li>
            <li>Engine picks whichever plan yields lower total cost.</li>
          </ol>
        </div>
      </div>
    ),
  },
  {
    id: 'd-data-model',
    title: 'Data Model',
    icon: Database,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>Core MongoDB collections:</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { name: 'users', desc: 'Accounts, hashed credentials', fields: 'name, email, password, role (default: user), businessType' },
            { name: 'searchhistories', desc: 'Single search results + recommendations', fields: 'userId, query, category, results[], recommendation, createdAt' },
            { name: 'baskethistories', desc: 'Basket optimizations with item assignments', fields: 'userId, category, items[], splitTotal, baseline, createdAt' },
            { name: 'userpreferences', desc: 'Per-user settings and weight profiles', fields: 'userId, defaultCategory, defaultSort, weightProfile, city, weights' },
            { name: 'categories', desc: 'Product categories (seeded)', fields: 'name, label, icon, suppliers[]' },
            { name: 'suppliers', desc: 'Marketplace supplier definitions (seeded)', fields: 'name, label, category, city, state' },
          ].map((c) => (
            <div key={c.name} className="rounded-md border border-line bg-bg p-3">
              <code className="text-xs font-bold text-accent">{c.name}</code>
              <p className="mt-1 text-[11px] text-muted">{c.desc}</p>
              <p className="mt-1 text-[10px] font-mono text-muted/70">{c.fields}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'd-tech-stack',
    title: 'Technology Stack',
    icon: Cpu,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { category: 'Frontend', items: ['React 18', 'TypeScript', 'Tailwind CSS', 'React Router v6', 'Recharts (Radar)', 'Bloom Filter', 'Framer Motion', 'Lucide Icons'] },
            { category: 'Backend', items: ['Python 3.13', 'FastAPI', 'Uvicorn', 'Motor (async MongoDB)', 'Pydantic', 'PyJWT / bcrypt'] },
            { category: 'Infrastructure', items: ['MongoDB', 'pip', 'npm', 'Pytest (E2E)', 'Git / GitHub'] },
          ].map((group) => (
            <div key={group.category} className="rounded-md border border-line bg-bg p-4">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">{group.category}</h4>
              <ul className="space-y-1">{group.items.map((item) => (<li key={item} className="text-xs text-ink-soft">{item}</li>))}</ul>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'd-testing',
    title: 'Testing',
    icon: CheckCircle2,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>End-to-end tests are written in Python (pytest) and cover all major API flows.</p>
        <CodeBlock title="Run tests" code={`cd backend\npython -m pytest tests/backend_test.py -v`} />
        <div className="rounded-md border border-line bg-bg p-4">
          <h4 className="mb-2 font-semibold text-ink">Test coverage</h4>
          <ul className="space-y-1 text-xs text-muted">
            <li>• Authentication (register, login, protected routes)</li>
            <li>• Single product search with various categories</li>
            <li>• Basket optimization (valid, empty, gibberish items)</li>
            <li>• Basket & unified history (CRUD, pagination)</li>
            <li>• Preferences (get, update)</li>
            <li>• Analytics endpoint</li>
          </ul>
        </div>
      </div>
    ),
  },
];

/* ─── Reusable code block ─── */

function CodeBlock({ title, code }: { title: string; code: string }) {
  try {
    return (
      <div className="rounded-md border border-line overflow-hidden">
        <div className="border-b border-line bg-bg px-3 py-1.5 text-[11px] font-medium text-muted">{title}</div>
        <pre className="overflow-x-auto bg-surface p-3 text-xs text-ink-soft"><code>{code}</code></pre>
      </div>
    );
  } catch {
    return null;
  }
}

/* ─── Collapsible section ─── */

function DocSectionCard({ section, isOpen, onToggle }: { section: DocSection; isOpen: boolean; onToggle: () => void }) {
  try {
    const Icon = section.icon;
    return (
      <div id={section.id}>
        <button onClick={onToggle} className="flex w-full items-center gap-4 rounded-xl border border-line bg-surface px-5 py-4 text-left transition-all hover:border-accent/30 hover:shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-white"><Icon size={20} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-semibold text-ink">{section.title}</h3>
              {section.badge && <Badge tone={section.badge.tone}>{section.badge.label}</Badge>}
            </div>
          </div>
          <span className="shrink-0 text-muted">{isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
        </button>
        {isOpen && (
          <div className="mt-1 rounded-b-xl border border-t-0 border-line bg-surface px-6 py-5">{section.content}</div>
        )}
      </div>
    );
  } catch {
    return null;
  }
}

/* ─── Page ─── */

export function DocsPage() {
  const [mode, setMode] = useState<DocMode>('general');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['g-executive-summary']));

  const sections = mode === 'general' ? GENERAL_SECTIONS : DEV_SECTIONS;

  const switchMode = (m: DocMode) => {
    try {
      setMode(m);
      setOpenSections(new Set([m === 'general' ? 'g-executive-summary' : 'd-architecture']));
    } catch {
      // silent
    }
  };

  const toggle = (id: string) => {
    try {
      setOpenSections((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
    } catch { /* silent */ }
  };

  const expandAll = () => { try { setOpenSections(new Set(sections.map((s) => s.id))); } catch { /* silent */ } };
  const collapseAll = () => { try { setOpenSections(new Set()); } catch { /* silent */ } };

  return (
    <div className="space-y-9">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="label-eyebrow">Reference</div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Documentation</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            {mode === 'general'
              ? 'Discover how ProcureAI transforms procurement — from the business problem we solve to every feature you can use.'
              : 'Technical reference for developers — architecture, APIs, data models, and setup.'}
          </p>
        </div>
        {/* Mode toggle */}
        <div className="inline-flex rounded-md border border-line bg-surface p-1">
          <button
            onClick={() => switchMode('general')}
            className={cn('inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors', mode === 'general' ? 'bg-accent text-white' : 'text-muted hover:text-ink')}
          >
            <Users size={15} /> General
          </button>
          <button
            onClick={() => switchMode('developer')}
            className={cn('inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors', mode === 'developer' ? 'bg-accent text-white' : 'text-muted hover:text-ink')}
          >
            <Code2 size={15} /> Developer
          </button>
        </div>
      </div>

      {/* Table of contents */}
      <Card>
        <CardHeader>
          <h2 className="font-display text-base font-semibold text-ink flex items-center gap-2">
            <FileText size={16} /> {mode === 'general' ? 'User Guide' : 'Developer Guide'} — Table of Contents
          </h2>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((s, i) => {
              const Icon = s.icon;
              return (
                <button key={s.id} onClick={() => { try { setOpenSections((prev) => new Set(prev).add(s.id)); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch { /* silent */ } }} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-bg">
                  <Icon size={14} className="shrink-0 text-accent" />
                  <span className="text-ink-soft"><span className="mr-1.5 text-xs text-muted">{i + 1}.</span>{s.title}</span>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{sections.length} sections</p>
        <div className="flex gap-2">
          <button onClick={expandAll} className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-ink">Expand all</button>
          <button onClick={collapseAll} className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-ink">Collapse all</button>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section) => (
          <DocSectionCard key={section.id} section={section} isOpen={openSections.has(section.id)} onToggle={() => toggle(section.id)} />
        ))}
      </div>

      {/* Footer */}
      <Card>
        <CardBody className="flex flex-col items-center gap-3 py-8 text-center">
          <BookOpen size={24} className="text-accent" />
          <h3 className="font-display text-lg font-bold text-ink">
            {mode === 'general' ? 'Want technical details?' : 'Need the user guide?'}
          </h3>
          <p className="max-w-md text-sm text-muted">
            {mode === 'general'
              ? 'Switch to the Developer tab for API reference, architecture diagrams, and setup instructions.'
              : 'Switch to the General tab for a plain-English guide on how to use every feature.'}
          </p>
          <button
            onClick={() => switchMode(mode === 'general' ? 'developer' : 'general')}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            {mode === 'general' ? 'View Developer Docs' : 'View User Guide'} <ArrowRight size={14} />
          </button>
        </CardBody>
      </Card>
    </div>
  );
}
