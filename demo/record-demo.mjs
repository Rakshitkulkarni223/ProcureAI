/**
 * ProcureAI — Demo Video Recorder (~4 min)
 *
 * Records a full walkthrough with captions, covering ALL features.
 * Usage:  node demo/record-demo.mjs [base_url]
 * Output: demo/procureai-demo.webm
 *
 * How it works:
 *   1. SplashScreen auto-dismisses in ~3.2s (sessionStorage-gated)
 *   2. Login page pre-fills demo credentials — just click submit
 *   3. Desktop sidebar (visible at lg:1024px+) has NavLink <a> tags
 *      with data-testid="nav-*"
 *   4. SearchSuggestions puts data-testid directly on the <input>, not a wrapper
 *   5. Selecting "grocery" in basket mode auto-fills 3 preset items
 *   6. AI Chat floating button bottom-right, textarea placeholder "Ask about procurement..."
 *   7. Theme toggle: data-testid="theme-toggle" in sidebar bottom
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.argv[2] || 'https://buywise-compare-1.preview.emergentagent.com';
const CREDS = { email: 'demo@procureai.com', password: 'Demo@123' };
const VIDEO_DIR = path.resolve(__dirname);

/* ── Helpers ── */

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function scroll(page, top) {
  try {
    await page.evaluate((t) => window.scrollTo({ top: t, behavior: 'smooth' }), top);
    await wait(1200);
  } catch { /* ignore */ }
}

/** Show Netflix-style caption overlay */
async function caption(page, text, ms = 3500) {
  try {
    await page.evaluate(({ text, ms }) => {
      let el = document.getElementById('__cap');
      if (!el) {
        el = document.createElement('div');
        el.id = '__cap';
        Object.assign(el.style, {
          position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
          zIndex: '999999', background: 'rgba(0,0,0,0.85)', color: '#fff',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: '17px', fontWeight: '600', padding: '12px 28px', borderRadius: '10px',
          textAlign: 'center', maxWidth: '80vw', lineHeight: '1.45', letterSpacing: '0.2px',
          boxShadow: '0 6px 24px rgba(0,0,0,0.5)', transition: 'opacity 0.35s', opacity: '0',
          pointerEvents: 'none',
        });
        document.body.appendChild(el);
      }
      el.textContent = text;
      el.style.opacity = '1';
      setTimeout(() => { el.style.opacity = '0'; }, ms - 350);
    }, { text, ms });
    await wait(ms);
  } catch (e) { console.warn('caption:', e.message); }
}

/** Click a sidebar nav link by its data-testid (e.g. "nav-search") */
async function nav(page, testid) {
  try {
    const link = page.locator(`[data-testid="${testid}"]`);
    await link.waitFor({ state: 'visible', timeout: 5000 });
    await link.click();
    await wait(2500);
  } catch (e) {
    console.warn(`nav(${testid}): ${e.message}`);
  }
}

/* ══════════════════════════════════════════════════════════════════
   MAIN RECORDING FLOW — matches demo/DEMO_SCRIPT.md
   ══════════════════════════════════════════════════════════════════ */
(async () => {
  console.log(`🎬 Recording ProcureAI demo from ${BASE} …`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(25_000);

  try {
    // ─────────────────────── 0:00  SPLASH + LOGIN ───────────────────────
    console.log('▸ Login');
    await page.goto(BASE, { waitUntil: 'load', timeout: 60_000 });

    // SplashScreen replaces entire app for ~3.2s, then login page renders
    await wait(5000);

    // Login page should now be visible with pre-filled credentials
    const submitBtn = page.locator('[data-testid="login-submit"]');
    await submitBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await caption(page, '🔐 Logging in to ProcureAI', 2500);
    await submitBtn.click();

    // Wait for sidebar nav to confirm dashboard loaded (not waitForURL which matches any URL)
    await page.locator('[data-testid="nav-dashboard"]').waitFor({ state: 'visible', timeout: 20_000 });
    await wait(3000);

    // ─────────────────────── 0:10  DASHBOARD ────────────────────────────
    console.log('▸ Dashboard');
    await caption(page, '📊 Dashboard — Real-time KPIs, savings trend, and AI insights', 4500);
    await scroll(page, 350);
    await wait(1500);
    await scroll(page, 0);

    // ─────────────────────── 0:30  BUSINESS IMPACT ──────────────────────
    console.log('▸ Business Impact');
    await nav(page, 'nav-impact');
    await caption(page, '📊 Business Impact — Savings, Hours Saved, AI Accuracy, Efficiency Score', 5000);
    await scroll(page, 500);

    // ROI Calculator
    await scroll(page, 1000);
    await caption(page, '🧮 ROI Calculator — Estimate monthly savings with interactive sliders', 4500);
    try {
      const slider = page.locator('input[type="range"]').first();
      if (await slider.isVisible({ timeout: 2000 })) {
        await slider.fill('500');
        await wait(2000);
      }
    } catch { /* skip */ }

    // ═══════════════════════════════════════════════════════════════════
    //  SEARCH PAGE — opens in basket mode by default with grocery presets
    // ═══════════════════════════════════════════════════════════════════
    console.log('▸ Search & Compare');
    await nav(page, 'nav-search');
    await wait(1500);

    // ── STEP 1: BASKET OPTIMISER (default state) ─────────────────────
    console.log('▸ Basket Optimization');
    try {
      // Page already shows Basket Optimiser with 3 grocery items pre-filled
      await caption(page, '🛒 Basket Optimiser — 3 grocery items pre-filled, ready to optimize', 4000);

      // Click Optimise Basket directly
      await page.locator('[data-testid="basket-optimize-button"]').click();
      await caption(page, '⏳ Searching all suppliers for the best basket split…', 3000);
      // Wait for results to load
      await page.locator('[data-testid="basket-results"]').waitFor({ state: 'visible', timeout: 30_000 });
      await wait(1500);

      // 1a. Show basket summary (savings headline, optimised total, you save)
      await caption(page, '📦 Basket Summary — Optimised total, savings, and delivery estimate', 4500);
      await wait(2000);

      // 1b. Scroll to Procurement Intelligence Summary (8 metric cards)
      await scroll(page, 600);
      await caption(page, '� Procurement Intelligence Summary — Cost, Savings, AI Score, Risk, Delivery', 5000);
      await wait(2500);

      // 1c. Scroll to AI Advisor Insights (INSIGHT / ACTION / OUTLOOK)
      await scroll(page, 1000);
      await caption(page, '� AI Advisor Insights — Strategic Insight · Recommended Action · Forward Outlook', 5000);
      await wait(2500);

      // 1d. Scroll further to see Supplier Intelligence cards
      await scroll(page, 1400);
      await caption(page, '🏢 Supplier Intelligence — Per-supplier reliability, delivery, and cost breakdown', 4500);
      await wait(2500);

      // 1e. Scroll to bottom — Supplier Mix (grouped items by supplier)
      await scroll(page, 1800);
      await caption(page, '📋 Supplier Mix — Which items from which supplier for optimal procurement', 4500);
      await wait(2000);
    } catch (e) { console.warn('basket:', e.message); }

    // ── STEP 2: SINGLE SEARCH ────────────────────────────────────────
    console.log('▸ Single Search');
    await scroll(page, 0);
    await wait(500);

    try {
      // Switch to Single Search mode
      await page.locator('[data-testid="mode-single"]').click();
      await wait(1000);
      await caption(page, '🔍 Single Search — Compare one product across all suppliers', 3500);

      // Type "Premium Basmati Rice 10kg" (data-testid is directly on the <input>)
      const searchInput = page.locator('[data-testid="search-input"]');
      await searchInput.click();
      await searchInput.fill('');
      await wait(200);
      await searchInput.type('Premium Basmati Rice 10kg', { delay: 60 });
      await wait(1000);

      // Click Search & Compare
      await page.locator('[data-testid="search-submit-button"]').click();
      await caption(page, '⏳ Connecting to supplier network…', 3000);
      // Wait for results
      await page.locator('text=AI Recommendation').first().waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
      await wait(2000);

      // 2a. AI Recommendation card (top of results)
      await caption(page, '🏆 AI Recommendation — Best supplier with confidence score and savings', 4500);
      await wait(2000);

      // 2b. Scroll to Intelligence panels (Procurement Insights + Long-Term Recommendation)
      await scroll(page, 500);
      await caption(page, '📊 Procurement Insights — Market trends, health score, and actionable intelligence', 5000);
      await wait(2500);

      // 2c. Long-Term Recommendation
      await scroll(page, 900);
      await caption(page, '🎯 Long-Term Procurement Recommendation — AI picks the best partner for sustained value', 5000);
      await wait(2500);

      // 2d. Supplier Comparison Matrix
      await scroll(page, 1300);
      await caption(page, '📋 Supplier Comparison Matrix — Price, rating, delivery side by side', 4500);
      await wait(2500);

      // 2e. Scroll to bottom — detailed comparison table with export
      await scroll(page, 1700);
      await caption(page, '📊 Full Comparison Table — Sort, filter, export CSV/PDF', 4500);
      await wait(2000);
    } catch (e) { console.warn('single search:', e.message); }

    // ─────────────────────── 2:10  AI ASSISTANT ─────────────────────────
    console.log('▸ AI Assistant');
    try {
      // Click floating "Ask ProcureAI" button
      const aiTrigger = page.locator('button:has-text("Ask ProcureAI")');
      await aiTrigger.click({ timeout: 5000 });
      await wait(1500);
      await caption(page, '🤖 AI Assistant — Chat with your procurement data', 4000);

      // Show the empty state with suggestion cards
      await wait(2000);

      // Type and send a question
      const chatInput = page.locator('textarea[placeholder="Ask about procurement..."]');
      await chatInput.fill('Compare laptop prices across suppliers');
      await wait(500);

      // Click send button (the round button next to textarea)
      const sendButton = page.locator('button:right-of(textarea) >> visible=true').first();
      await sendButton.click();
      await wait(8000);
      await caption(page, '✅ AI fetches real data via 8 backend tools — never hallucinated', 5000);
      await wait(2000);

      // Show conversation history
      try {
        const historyBtn = page.locator('button[title="Chat history"]');
        if (await historyBtn.isVisible({ timeout: 2000 })) {
          await historyBtn.click();
          await wait(1500);
          await caption(page, '💬 Conversation history — Resume any past chat', 3000);
          await wait(1500);
        }
      } catch { /* skip */ }

      // Close the panel via X button in the header
      const closeBtn = page.locator('button:has(.lucide-x)').first();
      await closeBtn.click();
      await wait(500);
    } catch (e) { console.warn('ai-assistant:', e.message); }

    // ─────────────────────── 2:35  SUPPLIER HUB ─────────────────────────
    console.log('▸ Supplier Hub');
    await nav(page, 'nav-supplier-hub');
    await caption(page, '🏢 Supplier Hub — Build your private supplier network', 4000);
    await wait(2500);
    await caption(page, '➕ Add suppliers with delivery details — they appear in search results', 4000);
    await wait(2000);

    // ─────────────────────── 2:55  ANALYTICS ────────────────────────────
    console.log('▸ Analytics');
    await nav(page, 'nav-analytics');
    await caption(page, '📈 Analytics — Spend breakdown, savings trends, supplier performance', 4500);
    await scroll(page, 400);
    await wait(1500);
    await scroll(page, 0);

    // ─────────────────────── 3:15  HISTORY ──────────────────────────────
    console.log('▸ History');
    await nav(page, 'nav-history');
    await caption(page, '📜 Search History — Every procurement search logged with details', 4000);
    await wait(2500);

    // ─────────────────────── 3:20  WATCHLIST ────────────────────────────
    console.log('▸ Watchlist');
    await nav(page, 'nav-watchlist');
    await caption(page, '👁️ Price Watchlist — Track products and set target price alerts', 4000);
    await wait(2500);

    // ─────────────────────── 3:30  SETTINGS & DARK MODE ─────────────────
    console.log('▸ Settings');
    await nav(page, 'nav-settings');
    await caption(page, '⚙️ Settings — Weight profiles, city, recommendation mode preferences', 4500);
    await wait(2500);

    // Toggle dark mode via sidebar button
    try {
      const themeBtn = page.locator('[data-testid="theme-toggle"]');
      await themeBtn.click({ timeout: 3000 });
      await wait(2000);
      await caption(page, '🌙 Dark Mode — Full theme support with CSS variable theming', 4000);
      await wait(1500);

      // Show dashboard in dark mode
      await nav(page, 'nav-dashboard');
      await caption(page, '📊 Dashboard in dark mode — Seamless theme switching', 3500);
      await wait(2000);
    } catch { /* skip */ }

    // ─────────────────────── 3:45  DOCS ─────────────────────────────────
    console.log('▸ Documentation');
    await nav(page, 'nav-docs');
    await caption(page, '📖 Built-in Documentation — User guide + developer API reference', 4000);
    await scroll(page, 300);
    await wait(2000);

    // ─────────────────────── 3:55  OUTRO ────────────────────────────────
    console.log('▸ Outro');
    await nav(page, 'nav-dashboard');
    await caption(page, '✨ ProcureAI — Intelligent Procurement. Smarter decisions. Real savings.', 5000);
    await wait(3500);

  } catch (e) {
    console.error('❌ Fatal error:', e.message);
  }

  await context.close();
  await browser.close();

  console.log('\n✅ Demo recorded! Check demo/ folder for the .webm file.');
})();
