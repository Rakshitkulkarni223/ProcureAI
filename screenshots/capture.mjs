/**
 * Capture screenshots for README — covers all pages + AI Assistant
 * Usage: node screenshots/capture.mjs [base_url]
 *
 * Flow mirrors the demo recorder:
 *   1. SplashScreen auto-dismisses in ~3.2s
 *   2. Login page pre-fills credentials — click submit
 *   3. Search page defaults to basket mode with grocery presets
 *   4. data-testid is directly on <input> elements
 */
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.argv[2] || 'https://buywise-compare-1.preview.emergentagent.com';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const shot = async (page, name) => {
  try {
    await page.screenshot({ path: path.join(__dirname, name), fullPage: false });
    console.log(`  ✅ ${name}`);
  } catch (e) {
    console.warn(`  ⚠ ${name}: ${e.message}`);
  }
};

const scroll = async (page, top) => {
  try {
    await page.evaluate((t) => window.scrollTo({ top: t, behavior: 'smooth' }), top);
    await wait(1200);
  } catch { /* ignore */ }
};

const nav = async (page, testid) => {
  try {
    const link = page.locator(`[data-testid="${testid}"]`);
    await link.waitFor({ state: 'visible', timeout: 5000 });
    await link.click();
    await wait(2500);
  } catch (e) {
    console.warn(`  nav(${testid}): ${e.message}`);
  }
};

(async () => {
  console.log(`📸 Capturing screenshots from ${BASE} …\n`);
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(25_000);

  try {
    // ── Login ──
    console.log('▸ Login');
    await page.goto(BASE, { waitUntil: 'load', timeout: 60_000 });
    await wait(5000); // splash screen
    const submitBtn = page.locator('[data-testid="login-submit"]');
    await submitBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await submitBtn.click();
    await page.locator('[data-testid="nav-dashboard"]').waitFor({ state: 'visible', timeout: 20_000 });
    await wait(3000);

    // 1 ── Dashboard ──
    console.log('▸ Dashboard');
    await shot(page, 'dashboard.png');

    // 2 ── Business Impact ──
    console.log('▸ Business Impact');
    await nav(page, 'nav-impact');
    await shot(page, 'business-impact.png');

    // 3 ── ROI Calculator (scroll down) ──
    await scroll(page, 1000);
    await wait(1000);
    await shot(page, 'roi-calculator.png');

    // ═══════════════════════════════════════════════════
    //  SEARCH PAGE — basket first (default), then single
    // ═══════════════════════════════════════════════════
    console.log('▸ Search & Compare');
    await nav(page, 'nav-search');
    await wait(1500);

    // 4 ── Basket Optimization (default mode, grocery presets auto-filled) ──
    console.log('▸ Basket Optimization');
    try {
      await page.locator('[data-testid="basket-optimize-button"]').click();
      await page.locator('[data-testid="basket-results"]').waitFor({ state: 'visible', timeout: 30_000 });
      await wait(1500);
      await shot(page, 'basket-optimization.png');

      // 5 ── Procurement Intelligence Summary ──
      await scroll(page, 600);
      await shot(page, 'procurement-intelligence.png');

      // 6 ── AI Advisor Insights ──
      await scroll(page, 1000);
      await shot(page, 'ai-advisor-insights.png');
    } catch (e) {
      console.warn('  basket:', e.message);
    }

    // 7 ── Single Search ──
    console.log('▸ Single Search');
    await scroll(page, 0);
    await wait(500);
    try {
      await page.locator('[data-testid="mode-single"]').click();
      await wait(1000);

      const searchInput = page.locator('[data-testid="search-input"]');
      await searchInput.click();
      await searchInput.fill('Premium Basmati Rice 10kg');
      await wait(500);
      await page.locator('[data-testid="search-submit-button"]').click();
      await page.locator('text=AI Recommendation').first().waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
      await wait(2000);

      // 8 ── AI Recommendation ──
      await shot(page, 'search-compare.png');

      // 9 ── Procurement Insights + Long-Term Recommendation ──
      await scroll(page, 500);
      await shot(page, 'ai-explanation.png');

      // 10 ── Supplier Comparison Matrix ──
      await scroll(page, 1300);
      await shot(page, 'supplier-comparison.png');
    } catch (e) {
      console.warn('  single search:', e.message);
    }

    // 11 ── AI Assistant ──
    console.log('▸ AI Assistant');
    try {
      const aiBtn = page.locator('button:has-text("Ask ProcureAI")');
      await aiBtn.click({ timeout: 5000 });
      await wait(1500);

      const chatInput = page.locator('textarea[placeholder="Ask about procurement..."]');
      await chatInput.fill('Compare laptop prices across suppliers');
      await wait(500);

      const sendButton = page.locator('button:right-of(textarea) >> visible=true').first();
      await sendButton.click();
      await wait(8000);
      await shot(page, 'ai-assistant.png');

      // Close panel
      const closeBtn = page.locator('button:has(.lucide-x)').first();
      await closeBtn.click();
      await wait(500);
    } catch (e) {
      console.warn('  ai-assistant:', e.message);
    }

    // 12 ── Supplier Hub ──
    console.log('▸ Supplier Hub');
    await nav(page, 'nav-supplier-hub');
    await shot(page, 'supplier-hub.png');

    // 13 ── Analytics ──
    console.log('▸ Analytics');
    await nav(page, 'nav-analytics');
    await shot(page, 'analytics.png');

    // 14 ── Search History ──
    console.log('▸ History');
    await nav(page, 'nav-history');
    await shot(page, 'history.png');

    // 15 ── Watchlist ──
    console.log('▸ Watchlist');
    await nav(page, 'nav-watchlist');
    await shot(page, 'watchlist.png');

    // 16 ── Settings ──
    console.log('▸ Settings');
    await nav(page, 'nav-settings');
    await shot(page, 'settings.png');

    // 17 ── Documentation ──
    console.log('▸ Documentation');
    await nav(page, 'nav-docs');
    await shot(page, 'docs.png');

  } catch (e) {
    console.error('❌ Fatal error:', e.message);
  }

  await browser.close();
  console.log('\n🎉 All screenshots saved to screenshots/');
})();
