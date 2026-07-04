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
  {
    id: 'g-demo-video',
    title: 'Product Demo',
    icon: PlayCircle,
    badge: { label: 'Watch', tone: 'accent' },
    content: (
      <div className="space-y-3 text-sm text-ink-soft leading-relaxed">
        <p>
          Watch a <strong className="text-ink">full walkthrough</strong> covering every feature —
          login, smart search suggestions, export reports, AI explanation panel, watchlist, basket optimization, analytics, and dark mode.
        </p>
        <div className="overflow-hidden rounded-lg border border-line bg-bg shadow-sm">
          <video
            controls
            playsInline
            preload="metadata"
            className="w-full"
            poster=""
          >
            <source src="/procureai-demo.webm" type="video/webm" />
            <source src="/procureai-demo.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <p className="text-xs text-muted">Tip: Click the fullscreen button for the best viewing experience.</p>
      </div>
    ),
  },
  {
    id: 'g-what-is',
    title: 'What is ProcureAI?',
    icon: Lightbulb,
    badge: { label: 'Start here', tone: 'accent' },
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>
          <strong className="text-ink">ProcureAI</strong> is a smart procurement platform that helps your business find
          the best deals across multiple suppliers — automatically. Instead of manually comparing prices on different
          websites, ProcureAI does it all for you in seconds.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: DollarSign, title: 'Save Money', desc: 'AI finds the cheapest supplier or the optimal split across vendors.' },
            { icon: Clock, title: 'Save Time', desc: 'Compare dozens of suppliers in one click instead of hours of manual work.' },
            { icon: Star, title: 'Better Decisions', desc: 'Factor in ratings, delivery speed, warranty — not just price.' },
          ].map((f) => (
            <div key={f.title} className="rounded-md border border-line bg-bg p-4 text-center">
              <f.icon size={24} className="mx-auto text-accent" />
              <h4 className="mt-2 font-semibold text-ink">{f.title}</h4>
              <p className="mt-1 text-xs text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'g-how-it-works',
    title: 'How It Works',
    icon: Zap,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>ProcureAI follows a simple 4-step process:</p>
        <div className="space-y-3">
          {[
            { step: 1, title: 'Tell us what you need', desc: 'Type a product name (e.g., "Laptop", "Basmati Rice") and pick a category.' },
            { step: 2, title: 'We search everywhere', desc: 'ProcureAI queries Amazon, Flipkart, and other suppliers simultaneously.' },
            { step: 3, title: 'AI picks the best option', desc: 'Our algorithm scores every option on price, delivery, rating, and more.' },
            { step: 4, title: 'You save money', desc: 'See the recommended supplier, estimated savings, and make a confident decision.' },
          ].map((s) => (
            <div key={s.step} className="flex gap-4 rounded-md border border-line bg-bg p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white text-sm font-bold">
                {s.step}
              </span>
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
  {
    id: 'g-single-search',
    title: 'Searching for a Product',
    icon: Search,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>The simplest way to use ProcureAI — search for one product and compare all suppliers instantly.</p>
        <div className="rounded-md border border-line bg-bg p-4">
          <h4 className="mb-3 font-semibold text-ink">Step-by-step</h4>
          <ol className="space-y-2 text-xs text-muted list-decimal list-inside">
            <li>Go to <strong className="text-ink">Search & Compare</strong> from the sidebar.</li>
            <li>Make sure <strong className="text-ink">Single Search</strong> mode is selected (top toggle).</li>
            <li>Pick a <strong className="text-ink">category</strong> — Electronics, Fashion, Grocery, etc.</li>
            <li>Choose which <strong className="text-ink">suppliers</strong> you want to compare (or leave all selected).</li>
            <li>Type your product in the search box and click <strong className="text-ink">Search</strong>.</li>
            <li>Review the comparison table — the AI-recommended option is highlighted.</li>
          </ol>
        </div>
        <div className="rounded-md border border-accent/20 bg-accent-soft p-4">
          <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold text-accent"><CheckCircle2 size={14} /> Pro Tip</h4>
          <p className="text-xs text-ink-soft">Be specific with your search. "Samsung Galaxy S24 128GB" gets better results than just "phone".</p>
        </div>
      </div>
    ),
  },
  {
    id: 'g-basket',
    title: 'Basket Optimization',
    icon: ShoppingCart,
    badge: { label: 'Popular', tone: 'success' },
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>
          Need to buy multiple items? Basket Optimization finds the smartest way to split your order across
          suppliers — or tells you if buying everything from one place is actually cheaper.
        </p>
        <div className="rounded-md border border-line bg-bg p-4">
          <h4 className="mb-3 font-semibold text-ink">How to use it</h4>
          <ol className="space-y-2 text-xs text-muted list-decimal list-inside">
            <li>Switch to <strong className="text-ink">Basket Optimiser</strong> mode on the Search page.</li>
            <li>Add items one by one — enter the product name and quantity.</li>
            <li>Click <strong className="text-ink">Optimise Basket</strong>.</li>
            <li>Review the recommendation: <strong className="text-ink">Split</strong> (buy from different suppliers) or <strong className="text-ink">Consolidate</strong> (buy all from one).</li>
            <li>See the per-item breakdown showing which supplier each item should come from.</li>
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
  {
    id: 'g-weight-profiles',
    title: 'Choosing a Weight Profile',
    icon: Settings,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>
          Weight profiles tell the AI what matters most to <em>your</em> business. Different industries have different priorities.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { name: 'Balanced', desc: 'Equal importance to price, speed, and quality. Good default for most businesses.', icon: '⚖️' },
            { name: 'Startup', desc: 'Maximises cost savings. Best when budget is the #1 priority.', icon: '💰' },
            { name: 'Hospital', desc: 'Prioritises availability and fast delivery. Critical for medical supplies.', icon: '🏥' },
            { name: 'Restaurant', desc: 'Fast, reliable delivery for perishables. Freshness and speed first.', icon: '🍽️' },
          ].map((p) => (
            <div key={p.name} className="rounded-md border border-line bg-bg p-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">{p.icon}</span>
                <h4 className="font-semibold text-ink">{p.name}</h4>
              </div>
              <p className="mt-1 text-xs text-muted">{p.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted">
          You can change your default profile in <strong className="text-ink">Settings → Procurement Preferences</strong>.
        </p>
      </div>
    ),
  },
  {
    id: 'g-dashboard',
    title: 'Understanding the Dashboard',
    icon: BarChart3,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>Your Dashboard is the home screen — a snapshot of your procurement activity at a glance. Use the <strong className="text-ink">date range filter</strong> at the top to view data for a specific period (last 7/30/90 days, this month, or custom). All KPIs, charts, and AI insights update accordingly. Default: All Time.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: 'Total Searches', desc: 'How many product comparisons you\'ve run.' },
            { title: 'Est. Monthly Savings', desc: 'Average monthly savings — adjusts dynamically based on the selected date range.' },
            { title: 'Top Category', desc: 'The product category you search for most often.' },
            { title: 'Preferred Supplier', desc: 'The supplier recommended to you most frequently.' },
            { title: 'Recent Searches', desc: 'Your latest comparisons with quick re-run capability.' },
            { title: 'AI Insights', desc: 'Smart suggestions based on your procurement patterns.' },
          ].map((m) => (
            <div key={m.title} className="rounded-md border border-line bg-bg p-3">
              <h5 className="text-xs font-semibold text-ink">{m.title}</h5>
              <p className="mt-0.5 text-[11px] text-muted">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'g-analytics',
    title: 'Reading Your Analytics',
    icon: TrendingUp,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>The Analytics page shows visual charts that help you understand your spending patterns over time. Like the Dashboard, it includes a <strong className="text-ink">date range filter</strong> so you can focus on any time period.</p>
        <div className="space-y-3">
          {[
            { title: 'Spend Trend', desc: 'A line chart showing how your total procurement spend changes month by month. Look for upward trends — they might mean it\'s time to renegotiate with suppliers.' },
            { title: 'Category Breakdown', desc: 'A pie chart showing where your budget goes. If 80% goes to one category, you might benefit from bulk deals there.' },
            { title: 'Supplier Usage', desc: 'A bar chart showing which suppliers the AI recommends most. Useful for building long-term relationships with top vendors.' },
            { title: 'Savings Trend', desc: 'Shows your cumulative savings from using AI recommendations. Great for reporting ROI to management.' },
          ].map((c) => (
            <div key={c.title} className="rounded-md border border-line bg-bg p-4">
              <h4 className="font-semibold text-ink">{c.title}</h4>
              <p className="mt-1 text-xs text-muted">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'g-history',
    title: 'Search History',
    icon: History,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>Successful searches are automatically saved. Failed or empty searches (no results found) are excluded to keep your history clean. You can browse, review, and delete past searches.</p>
        <div className="rounded-md border border-line bg-bg p-4">
          <h4 className="mb-2 font-semibold text-ink">What you can do</h4>
          <ul className="space-y-1.5 text-xs text-muted">
            <li><CheckCircle2 size={12} className="mr-1 inline text-success" /> View all past searches with timestamps</li>
            <li><CheckCircle2 size={12} className="mr-1 inline text-success" /> See the category and query for each search</li>
            <li><CheckCircle2 size={12} className="mr-1 inline text-success" /> Expand basket searches to see item-by-item breakdown</li>
            <li><CheckCircle2 size={12} className="mr-1 inline text-success" /> Delete searches you no longer need</li>
            <li><CheckCircle2 size={12} className="mr-1 inline text-success" /> Navigate through pages if you have many searches</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'g-export',
    title: 'Export Reports (CSV & PDF)',
    icon: Download,

    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>
          After running a search, you can <strong className="text-ink">export the comparison results</strong> as a CSV spreadsheet
          or a professional PDF report — perfect for sharing with your team or archiving procurement decisions.
        </p>
        <div className="rounded-md border border-line bg-bg p-4">
          <h4 className="mb-3 font-semibold text-ink">How to export</h4>
          <ol className="space-y-2 text-xs text-muted list-decimal list-inside">
            <li>Run a product search from the <strong className="text-ink">Search & Compare</strong> page.</li>
            <li>In the comparison table toolbar, click <strong className="text-ink">CSV</strong> to download a spreadsheet.</li>
            <li>Or click <strong className="text-ink">PDF</strong> to open a styled, print-ready report in a new tab.</li>
            <li>Use your browser's <strong className="text-ink">Print → Save as PDF</strong> to save permanently.</li>
          </ol>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-bg p-3">
            <h5 className="text-xs font-semibold text-ink">CSV Export</h5>
            <p className="mt-1 text-[11px] text-muted">Includes supplier, product, price, discount, rating, delivery, and stock status. Open in Excel or Google Sheets.</p>
          </div>
          <div className="rounded-md border border-line bg-bg p-3">
            <h5 className="text-xs font-semibold text-ink">PDF Report</h5>
            <p className="mt-1 text-[11px] text-muted">Beautifully formatted report with AI recommendation summary, comparison table, and generation timestamp.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'g-ai-explanation',
    title: 'AI Explanation Panel',
    icon: Brain,
    
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>
          Ever wonder <strong className="text-ink">why the AI recommended a particular supplier</strong>? The Explanation Panel
          makes every AI decision transparent and auditable.
        </p>
        <div className="rounded-md border border-line bg-bg p-4">
          <h4 className="mb-3 font-semibold text-ink">How to use it</h4>
          <ol className="space-y-2 text-xs text-muted list-decimal list-inside">
            <li>Run a product search — the AI Recommendation card appears at the top.</li>
            <li>Click <strong className="text-ink">"Why this recommendation?"</strong> at the bottom of the card.</li>
            <li>A panel expands showing a <strong className="text-ink">radar chart</strong> of the winning supplier's factor scores.</li>
            <li>A <strong className="text-ink">scoreboard table</strong> ranks every supplier with their weighted score and price.</li>
          </ol>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-bg p-3">
            <h5 className="text-xs font-semibold text-ink">Radar Chart</h5>
            <p className="mt-1 text-[11px] text-muted">Visualises how the recommended supplier performs across price, delivery, rating, discount, and availability.</p>
          </div>
          <div className="rounded-md border border-line bg-bg p-3">
            <h5 className="text-xs font-semibold text-ink">Supplier Scoreboard</h5>
            <p className="mt-1 text-[11px] text-muted">A ranked table of all suppliers with progress bars and prices so you can verify the AI's choice.</p>
          </div>
        </div>
        <div className="rounded-md border border-accent/20 bg-accent-soft p-4">
          <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold text-accent"><CheckCircle2 size={14} /> Pro Tip</h4>
          <p className="text-xs text-ink-soft">Use this panel when presenting procurement decisions to your team — it provides the evidence behind each recommendation.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'g-watchlist',
    title: 'Price Watchlist',
    icon: Eye,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>
          Track products you're interested in and set <strong className="text-ink">target prices</strong>. The watchlist
          persists across sessions and tells you when products hit your desired price point.
        </p>
        <div className="rounded-md border border-line bg-bg p-4">
          <h4 className="mb-3 font-semibold text-ink">How to use it</h4>
          <ol className="space-y-2 text-xs text-muted list-decimal list-inside">
            <li>Run a product search from the <strong className="text-ink">Search & Compare</strong> page.</li>
            <li>In the comparison table, click the <strong className="text-ink">eye icon</strong> next to any product to add it to your watchlist.</li>
            <li>A target price (10% below current) is automatically set — click it to edit.</li>
            <li>Navigate to <strong className="text-ink">Watchlist</strong> from the sidebar to see all tracked products.</li>
            <li>Products at or below your target are highlighted in green with a "At target" badge.</li>
          </ol>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-line bg-bg p-3 text-center">
            <Eye size={20} className="mx-auto text-accent" />
            <h5 className="mt-2 text-xs font-semibold text-ink">Track</h5>
            <p className="mt-1 text-[11px] text-muted">Add products from any search result with one click.</p>
          </div>
          <div className="rounded-md border border-line bg-bg p-3 text-center">
            <DollarSign size={20} className="mx-auto text-accent" />
            <h5 className="mt-2 text-xs font-semibold text-ink">Target</h5>
            <p className="mt-1 text-[11px] text-muted">Set your desired price — editable inline anytime.</p>
          </div>
          <div className="rounded-md border border-line bg-bg p-3 text-center">
            <TrendingUp size={20} className="mx-auto text-accent" />
            <h5 className="mt-2 text-xs font-semibold text-ink">Monitor</h5>
            <p className="mt-1 text-[11px] text-muted">Summary cards show how many items are at or above target.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'g-business-impact',
    title: 'Business Impact',
    icon: Gauge,
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
              { title: 'Total Savings', desc: 'Cumulative procurement savings from AI recommendations.' },
              { title: 'Hours Saved', desc: 'Time saved vs manual comparison (42 min per search).' },
              { title: 'Purchases Optimized', desc: 'Searches where AI recommended a better supplier.' },
              { title: 'Products Compared', desc: 'Total supplier options evaluated across all searches.' },
              { title: 'AI Accuracy', desc: 'Percentage of searches with a successful recommendation.' },
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
            <p className="text-xs text-muted">Side-by-side visual comparing the <strong className="text-ink">8-step manual process (45–60 min)</strong> with ProcureAI's <strong className="text-ink">5-step AI workflow (3–5 min)</strong> — a 93% time reduction.</p>
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
  {
    id: 'g-account',
    title: 'Account & Settings',
    icon: Users,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>Manage your profile and procurement preferences from the Settings page.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-bg p-4">
            <h4 className="mb-2 font-semibold text-ink">Profile</h4>
            <ul className="space-y-1 text-xs text-muted">
              <li>• View your name and email</li>
              <li>• All users share the same feature set</li>
            </ul>
          </div>
          <div className="rounded-md border border-line bg-bg p-4">
            <h4 className="mb-2 font-semibold text-ink">Preferences</h4>
            <ul className="space-y-1 text-xs text-muted">
              <li>• Set default product category</li>
              <li>• Choose default sort order</li>
              <li>• Select preferred weight profile</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'g-faq',
    title: 'Frequently Asked Questions',
    icon: HelpCircle,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        {[
          { q: 'Is my data private?', a: 'Yes. All your searches, history, and preferences are tied to your account and are not shared with anyone.' },
          { q: 'How accurate are the prices?', a: 'Prices are fetched in real-time from supplier websites. They reflect the current listed price at the time of your search.' },
          { q: 'Can I add my own suppliers?', a: 'The platform currently supports pre-configured supplier adapters. Contact your admin to request new supplier integrations.' },
          { q: 'How is "estimated savings" calculated?', a: 'Savings = the difference between the most expensive option and the AI-recommended option for the same product.' },
          { q: 'Can I use ProcureAI on mobile?', a: 'Yes! The interface is fully responsive and works on phones and tablets.' },
          { q: 'What does the confidence score mean?', a: 'It indicates how sure the AI is about its recommendation. Higher confidence (80%+) means the recommended option is significantly better than alternatives.' },
        ].map((faq) => (
          <div key={faq.q} className="rounded-md border border-line bg-bg p-4">
            <h4 className="font-semibold text-ink">{faq.q}</h4>
            <p className="mt-1 text-xs text-muted">{faq.a}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'g-support',
    title: 'Getting Help',
    icon: LifeBuoy,
    content: (
      <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
        <p>Need help? Here are your options:</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-bg p-4">
            <Package size={20} className="text-accent" />
            <h4 className="mt-2 font-semibold text-ink">Documentation</h4>
            <p className="mt-1 text-xs text-muted">Browse the General and Developer guides above to learn every feature.</p>
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
        <p>ProcureAI is a full-stack TypeScript application with a clear separation of concerns.</p>
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
              <li>• Node.js + Express + TypeScript</li>
              <li>• MongoDB / Mongoose ODM</li>
              <li>• JWT authentication (bcrypt)</li>
              <li>• Zod schema validation</li>
              <li>• Multi-provider scraping adapters</li>
              <li>• Weighted decision engine</li>
              <li>• Date-filtered analytics (from/to query params)</li>
              <li>• Business impact API (hours saved, efficiency, ROI)</li>
            </ul>
          </div>
        </div>
        <div className="rounded-md border border-line bg-bg p-4">
          <h4 className="mb-2 font-semibold text-ink">Request flow</h4>
          <div className="flex items-center gap-2 overflow-x-auto text-xs text-muted">
            {['Client', 'API Gateway', 'Controllers', 'Services', 'Provider Adapters', 'Response'].map((s, i, arr) => (
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
        <ul className="space-y-1 text-muted"><li>• Node.js 18+</li><li>• MongoDB 6+ (local or Atlas)</li><li>• Git</li></ul>
        <div className="space-y-3">
          <CodeBlock title="1. Clone & install" code={`git clone https://github.com/Rakshitkulkarni223/ProcureAI.git\ncd ProcureAI\n\n# Backend\ncd backend && npm install\n\n# Frontend\ncd ../frontend && npm install`} />
          <CodeBlock title="2. Environment variables" code={`# backend/.env\nMONGO_URI=mongodb://localhost:27017/procureai\nJWT_SECRET=your-secret-key\nPORT=8002\n\n# frontend/.env (optional)\nREACT_APP_API_URL=http://localhost:8002/api`} />
          <CodeBlock title="3. Run" code={`# Terminal 1 — Backend\ncd backend && npm run dev\n\n# Terminal 2 — Frontend\ncd frontend && npm start`} />
        </div>
        <p className="text-xs text-muted">Backend: <code className="rounded bg-bg px-1.5 py-0.5 text-accent">localhost:8002</code> · Frontend: <code className="rounded bg-bg px-1.5 py-0.5 text-accent">localhost:3000</code></p>
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
          <CodeBlock title="backend/" code={`src/\n  ├── config/        # env, DB connection\n  ├── controllers/   # route handlers\n  ├── middleware/     # auth, validation\n  ├── models/         # Mongoose schemas\n  ├── routes/         # Express routers\n  ├── services/       # business logic\n  ├── providers/      # supplier adapters\n  ├── validators/     # Zod schemas\n  └── app.ts          # Express app entry`} />
          <CodeBlock title="frontend/" code={`src/\n  ├── components/    # reusable UI\n  │   └── ui/        # Button, Card, Badge…\n  ├── context/       # AuthContext, ThemeContext\n  ├── hooks/         # useSearchSuggestions, useWatchlist\n  ├── lib/           # api, bloomFilter, exportUtils\n  ├── pages/         # route-level pages\n  ├── types.ts       # TypeScript interfaces\n  ├── App.tsx        # router & providers\n  └── index.css      # Tailwind + CSS vars`} />
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
            <li>• Configurable JWT expiry</li>
            <li>• Rate limiting on auth routes</li>
            <li>• CORS per environment</li>
            <li>• Zod input validation</li>
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
    { "query": "Basmati Rice", "quantity": 2 },
    { "query": "Cooking Oil", "quantity": 1 }
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
            { name: 'preferences', desc: 'Per-user settings and weight profiles', fields: 'userId, defaultCategory, defaultSort, weightProfile, weights' },
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
            { category: 'Backend', items: ['Node.js', 'Express', 'TypeScript', 'Mongoose', 'Zod', 'JWT / bcrypt'] },
            { category: 'Infrastructure', items: ['MongoDB', 'npm', 'ESLint', 'Prettier', 'Pytest (E2E)', 'Git / GitHub'] },
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
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['g-demo-video']));

  const sections = mode === 'general' ? GENERAL_SECTIONS : DEV_SECTIONS;

  const switchMode = (m: DocMode) => {
    try {
      setMode(m);
      setOpenSections(new Set([m === 'general' ? 'g-what-is' : 'd-architecture']));
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
              ? 'Learn how to use ProcureAI to compare suppliers and save money on every purchase.'
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
