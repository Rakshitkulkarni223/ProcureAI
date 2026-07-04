"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const HistoryRepository_1 = require("../repositories/HistoryRepository");
const currency_1 = require("../utils/currency");
const data_1 = require("../config/data");
function topByCount(items) {
    const counts = {};
    for (const it of items) {
        if (!it)
            continue;
        counts[it] = (counts[it] || 0) + 1;
    }
    let best = null;
    let max = 0;
    for (const [k, v] of Object.entries(counts)) {
        if (v > max) {
            max = v;
            best = k;
        }
    }
    return { value: best, counts };
}
function monthKey(d) {
    return d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
}
const categoryName = (slug) => data_1.CATEGORIES.find((c) => c.slug === slug)?.name || slug;
class DashboardService {
    static async summary(userId, range) {
        const history = await HistoryRepository_1.historyRepository.allByUser(userId, range?.from, range?.to);
        const now = new Date();
        const totalSavings = history.reduce((sum, h) => sum + (h.estimatedSavings || 0), 0);
        let monthlySavings;
        if (range?.from || range?.to) {
            // Date range selected: compute average monthly savings over the span
            const earliest = range.from || (history.length ? new Date(history[history.length - 1].createdAt) : now);
            const latest = range.to || now;
            const diffMs = Math.max(latest.getTime() - earliest.getTime(), 1);
            const months = Math.max(diffMs / (1000 * 60 * 60 * 24 * 30), 1);
            monthlySavings = totalSavings / months;
        }
        else {
            // No range: use current calendar month
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();
            monthlySavings = history
                .filter((h) => {
                const d = new Date(h.createdAt);
                return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
            })
                .reduce((sum, h) => sum + (h.estimatedSavings || 0), 0);
        }
        const supplier = topByCount(history.map((h) => h.recommendedSupplier).filter(Boolean));
        const category = topByCount(history.map((h) => h.category).filter(Boolean));
        const activeCategories = new Set(history.map((h) => h.category)).size;
        return {
            totalSearches: history.length,
            procurementRequests: history.filter((h) => h.recommendedSupplier).length,
            estimatedMonthlySavings: Math.round(monthlySavings),
            totalSavings: Math.round(totalSavings),
            preferredSupplier: supplier.value,
            topCategory: category.value ? categoryName(category.value) : null,
            topCategorySlug: category.value,
            activeCategories,
            projectedAnnualSavings: Math.round(monthlySavings * 12),
            recentSearches: history.slice(0, 6).map((h) => ({
                id: h.id || String(h._id),
                query: h.query,
                category: categoryName(h.category),
                categorySlug: h.category,
                suppliers: h.suppliers,
                recommendedSupplier: h.recommendedSupplier,
                estimatedSavings: h.estimatedSavings,
                bestPrice: h.bestPrice,
                timestamp: h.createdAt,
            })),
        };
    }
    static async spend(userId, range) {
        const history = await HistoryRepository_1.historyRepository.allByUser(userId, range?.from, range?.to);
        const byMonth = {};
        const byCategory = {};
        const bySupplier = {};
        for (const h of history) {
            const d = new Date(h.createdAt);
            const mk = monthKey(d);
            byMonth[mk] = (byMonth[mk] || 0) + (h.bestPrice || 0);
            const cName = categoryName(h.category);
            byCategory[cName] = (byCategory[cName] || 0) + (h.bestPrice || 0);
            if (h.recommendedSupplier) {
                bySupplier[h.recommendedSupplier] = (bySupplier[h.recommendedSupplier] || 0) + 1;
            }
        }
        return {
            monthlySpend: Object.entries(byMonth).map(([month, amount]) => ({ month, amount: Math.round(amount) })),
            categorySpend: Object.entries(byCategory)
                .map(([category, amount]) => ({ category, amount: Math.round(amount) }))
                .sort((a, b) => b.amount - a.amount),
            supplierUsage: Object.entries(bySupplier)
                .map(([supplier, count]) => ({ supplier, count }))
                .sort((a, b) => b.count - a.count),
        };
    }
    static async savings(userId, range) {
        const history = await HistoryRepository_1.historyRepository.allByUser(userId, range?.from, range?.to);
        const byMonth = {};
        for (const h of history) {
            const d = new Date(h.createdAt);
            const mk = monthKey(d);
            byMonth[mk] = (byMonth[mk] || 0) + (h.estimatedSavings || 0);
        }
        return {
            savingsTrend: Object.entries(byMonth).map(([month, amount]) => ({ month, amount: Math.round(amount) })),
            totalSavings: Math.round(history.reduce((s, h) => s + (h.estimatedSavings || 0), 0)),
        };
    }
    static async insights(userId, range) {
        const history = await HistoryRepository_1.historyRepository.allByUser(userId, range?.from, range?.to);
        const insights = [];
        if (!history.length) {
            return {
                insights: [
                    { icon: 'Sparkles', text: 'Run your first search to unlock AI-generated procurement insights.', tone: 'info' },
                ],
            };
        }
        const totalSavings = history.reduce((s, h) => s + (h.estimatedSavings || 0), 0);
        let periodSavings;
        let periodLabel;
        if (range?.from || range?.to) {
            const now = new Date();
            const earliest = range.from || (history.length ? new Date(history[history.length - 1].createdAt) : now);
            const latest = range.to || now;
            const diffMs = Math.max(latest.getTime() - earliest.getTime(), 1);
            const months = Math.max(diffMs / (1000 * 60 * 60 * 24 * 30), 1);
            periodSavings = totalSavings / months;
            periodLabel = 'per month in this period';
        }
        else {
            const now = new Date();
            periodSavings = history
                .filter((h) => {
                const d = new Date(h.createdAt);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            })
                .reduce((s, h) => s + (h.estimatedSavings || 0), 0);
            periodLabel = 'this month';
        }
        if (periodSavings > 0) {
            insights.push({
                icon: 'TrendingUp',
                text: `You saved ${(0, currency_1.formatINR)(periodSavings)} ${periodLabel} by following AI recommendations.`,
                tone: 'success',
            });
            insights.push({
                icon: 'PiggyBank',
                text: `At this rate your business could save approximately ${(0, currency_1.formatINR)(periodSavings * 12)} annually by switching to recommended suppliers.`,
                tone: 'success',
            });
        }
        // Best-priced supplier per category (by avg bestPrice).
        const supplierWins = topByCount(history.map((h) => h.recommendedSupplier).filter(Boolean));
        if (supplierWins.value) {
            insights.push({
                icon: 'Award',
                text: `${supplierWins.value} is your most frequently recommended supplier — it wins on your priorities most often.`,
                tone: 'info',
            });
        }
        const cat = topByCount(history.map((h) => h.category).filter(Boolean));
        if (cat.value) {
            insights.push({
                icon: 'Layers',
                text: `${categoryName(cat.value)} is your most active procurement category with ${cat.counts[cat.value]} searches.`,
                tone: 'info',
            });
        }
        return { insights };
    }
    static async businessImpact(userId, range) {
        try {
            const history = await HistoryRepository_1.historyRepository.allByUser(userId, range?.from, range?.to);
            const now = new Date();
            const totalSearches = history.length;
            const totalSavings = history.reduce((s, h) => s + (h.estimatedSavings || 0), 0);
            const optimizedPurchases = history.filter((h) => h.recommendedSupplier).length;
            const uniqueSuppliers = new Set(history.map((h) => h.recommendedSupplier).filter(Boolean)).size;
            const totalProductsCompared = history.reduce((s, h) => s + (h.suppliers?.length || 0), 0);
            // Avg time per manual comparison: ~45 min; ProcureAI: ~3 min => 42 min saved each
            const MANUAL_MINUTES = 45;
            const AI_MINUTES = 3;
            const minutesSaved = totalSearches * (MANUAL_MINUTES - AI_MINUTES);
            const hoursSaved = Math.round(minutesSaved / 60);
            const avgSavingPerPurchase = optimizedPurchases > 0 ? Math.round(totalSavings / optimizedPurchases) : 0;
            // Monthly savings
            let monthlySavings;
            if (range?.from || range?.to) {
                const earliest = range.from || (history.length ? new Date(history[history.length - 1].createdAt) : now);
                const latest = range.to || now;
                const months = Math.max((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24 * 30), 1);
                monthlySavings = totalSavings / months;
            }
            else {
                const thisMonth = now.getMonth();
                const thisYear = now.getFullYear();
                monthlySavings = history
                    .filter((h) => {
                    const d = new Date(h.createdAt);
                    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
                })
                    .reduce((s, h) => s + (h.estimatedSavings || 0), 0);
            }
            // AI recommendation accuracy (% searches that had a recommendation)
            const accuracyPct = totalSearches > 0 ? Math.round((optimizedPurchases / totalSearches) * 100) : 0;
            // Procurement efficiency = manual work eliminated %
            const manualEliminatedPct = totalSearches > 0 ? Math.round(((MANUAL_MINUTES - AI_MINUTES) / MANUAL_MINUTES) * 100) : 0;
            return {
                totalSavings: Math.round(totalSavings),
                monthlySavings: Math.round(monthlySavings),
                annualProjection: Math.round(monthlySavings * 12),
                totalSearches,
                optimizedPurchases,
                hoursSaved,
                avgSavingPerPurchase,
                suppliersCompared: uniqueSuppliers,
                productsCompared: totalProductsCompared,
                aiAccuracyPct: accuracyPct,
                manualEliminatedPct,
                efficiencyScore: Math.min(100, Math.round((accuracyPct * 0.4) + (manualEliminatedPct * 0.3) + (Math.min(totalSearches, 100) * 0.3))),
            };
        }
        catch (e) {
            throw e;
        }
    }
}
exports.DashboardService = DashboardService;
