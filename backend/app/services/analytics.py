"""
Dashboard, History, Preference, and Catalog services.
Port of DashboardService, HistoryService, PreferenceService, CatalogService.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from bson import ObjectId
from pymongo import ReturnDocument

from app.config import CATEGORIES, WEIGHT_PROFILES, format_inr
from app.database import get_db


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _doc_to_json(doc: dict, exclude_fields: Optional[set] = None) -> dict:
    """Convert a MongoDB document to JSON-safe dict (ObjectId -> str, _id -> id)."""
    try:
        if doc is None:
            return {}
        out = {}
        for k, v in doc.items():
            if exclude_fields and k in exclude_fields:
                continue
            if k == "_id":
                out["id"] = str(v)
            elif k == "__v":
                continue
            elif isinstance(v, ObjectId):
                out[k] = str(v)
            elif isinstance(v, datetime):
                out[k] = v.isoformat()
            else:
                out[k] = v
        return out
    except Exception:
        return doc


def _category_name(slug: str) -> str:
    try:
        for c in CATEGORIES:
            if c["slug"] == slug:
                return c["name"]
        return slug
    except Exception:
        return slug


def _top_by_count(items: list[str]) -> tuple[Optional[str], dict[str, int]]:
    try:
        counts: dict[str, int] = {}
        for it in items:
            if not it:
                continue
            counts[it] = counts.get(it, 0) + 1
        best, mx = None, 0
        for k, v in counts.items():
            if v > mx:
                mx = v
                best = k
        return best, counts
    except Exception:
        return None, {}


def _month_key(d: datetime) -> str:
    try:
        return d.strftime("%b '%y")
    except Exception:
        return "Unknown"


# ===================================================================
# CatalogService
# ===================================================================

class CatalogService:
    @staticmethod
    async def list_categories() -> list[dict]:
        try:
            db = get_db()
            cursor = db.categories.find({"enabled": True}).sort("name", 1)
            docs = await cursor.to_list(length=500)
            return [_doc_to_json(d) for d in docs]
        except Exception:
            raise

    @staticmethod
    async def suppliers_for_category(slug: str) -> list[dict]:
        try:
            db = get_db()
            cat = await db.categories.find_one({"slug": slug})
            if not cat:
                raise ValueError(f"Category not found: {slug}")
            cursor = db.suppliers.find({"category": slug}).sort("name", 1)
            docs = await cursor.to_list(length=500)
            return [_doc_to_json(d) for d in docs]
        except Exception:
            raise

    @staticmethod
    async def list_suppliers() -> list[dict]:
        try:
            db = get_db()
            cursor = db.suppliers.find().sort([("category", 1), ("name", 1)])
            docs = await cursor.to_list(length=500)
            return [_doc_to_json(d) for d in docs]
        except Exception:
            raise

    @staticmethod
    async def toggle_supplier(supplier_id: str, enabled: Optional[bool] = None) -> dict:
        try:
            db = get_db()
            doc = await db.suppliers.find_one({"_id": ObjectId(supplier_id)})
            if not doc:
                raise ValueError("Supplier not found")
            new_enabled = enabled if isinstance(enabled, bool) else (not doc.get("enabled", True))
            await db.suppliers.update_one(
                {"_id": ObjectId(supplier_id)},
                {"$set": {"enabled": new_enabled, "updatedAt": datetime.utcnow()}},
            )
            doc["enabled"] = new_enabled
            return _doc_to_json(doc)
        except Exception:
            raise


# ===================================================================
# PreferenceService
# ===================================================================

class PreferenceService:
    @staticmethod
    async def get(user_id: str) -> dict:
        try:
            db = get_db()
            pref = await db.userpreferences.find_one({"userId": ObjectId(user_id)})
            if not pref:
                pref = await PreferenceService._upsert(user_id, {})
            return _doc_to_json(pref)
        except Exception:
            raise

    @staticmethod
    async def update(user_id: str, data: dict) -> dict:
        try:
            allowed = {"defaultCategory", "enabledSuppliers", "sortPreference", "weightProfile", "businessType", "city"}
            clean = {k: v for k, v in data.items() if k in allowed and v is not None}
            pref = await PreferenceService._upsert(user_id, clean)
            return _doc_to_json(pref)
        except Exception:
            raise

    @staticmethod
    async def _upsert(user_id: str, data: dict) -> dict:
        try:
            db = get_db()
            result = await db.userpreferences.find_one_and_update(
                {"userId": ObjectId(user_id)},
                {"$set": {**data, "updatedAt": datetime.utcnow()}},
                upsert=True,
                return_document=ReturnDocument.AFTER,
            )
            return result
        except Exception:
            raise

    @staticmethod
    def weight_profiles() -> list[dict]:
        try:
            return list(WEIGHT_PROFILES.values())
        except Exception:
            return []


# ===================================================================
# HistoryService
# ===================================================================

class HistoryService:
    @staticmethod
    async def paginated(user_id: str, page: int, limit: int) -> dict:
        try:
            db = get_db()
            uid = ObjectId(user_id)
            skip = (page - 1) * limit

            search_docs, basket_docs, search_count, basket_count = await _parallel(
                db.searchhistories.find({"userId": uid}).sort("createdAt", -1).to_list(length=10000),
                db.baskethistories.find({"userId": uid}).sort("createdAt", -1).to_list(length=10000),
                db.searchhistories.count_documents({"userId": uid}),
                db.baskethistories.count_documents({"userId": uid}),
            )

            search_items = []
            for d in search_docs:
                search_items.append({
                    "id": str(d["_id"]),
                    "type": "single",
                    "query": d.get("query", ""),
                    "category": d.get("category", ""),
                    "suppliers": d.get("suppliers", []),
                    "resultCount": d.get("resultCount", 0),
                    "recommendedSupplier": d.get("recommendedSupplier", ""),
                    "bestPrice": d.get("bestPrice", 0),
                    "estimatedSavings": d.get("estimatedSavings", 0),
                    "weightProfile": d.get("weightProfile", "balanced"),
                    "createdAt": d.get("createdAt", datetime.utcnow()).isoformat() if isinstance(d.get("createdAt"), datetime) else str(d.get("createdAt", "")),
                })

            basket_items = []
            for d in basket_docs:
                ic = d.get("itemCount", 0)
                basket_items.append({
                    "id": str(d["_id"]),
                    "type": "basket",
                    "query": f"Basket ({ic} item{'s' if ic != 1 else ''})",
                    "category": d.get("category", ""),
                    "suppliers": d.get("suppliers", []),
                    "resultCount": ic,
                    "recommendedSupplier": "",
                    "bestPrice": d.get("splitTotal", 0),
                    "estimatedSavings": d.get("estimatedSavings", 0),
                    "weightProfile": d.get("weightProfile", "balanced"),
                    "createdAt": d.get("createdAt", datetime.utcnow()).isoformat() if isinstance(d.get("createdAt"), datetime) else str(d.get("createdAt", "")),
                    "basketItems": [
                        {"query": i.get("query"), "quantity": i.get("quantity"), "supplier": i.get("supplier"), "price": i.get("price")}
                        for i in (d.get("items") or [])
                    ],
                    "recommendedPlan": d.get("recommendedPlan", "split"),
                    "supplierCount": d.get("supplierCount", 0),
                    "splitTotal": d.get("splitTotal", 0),
                    "baselineTotal": d.get("baselineTotal", 0),
                })

            all_items = sorted(
                search_items + basket_items,
                key=lambda x: x["createdAt"],
                reverse=True,
            )

            total = search_count + basket_count
            total_pages = max(1, -(-total // limit))  # ceil division
            items = all_items[skip: skip + limit]

            return {"items": items, "total": total, "page": page, "limit": limit, "totalPages": total_pages}
        except Exception:
            raise

    @staticmethod
    async def remove(user_id: str, entry_id: str) -> Optional[dict]:
        try:
            db = get_db()
            uid = ObjectId(user_id)
            oid = ObjectId(entry_id)
            r1 = await db.searchhistories.find_one_and_delete({"_id": oid, "userId": uid})
            if r1:
                return _doc_to_json(r1)
            r2 = await db.baskethistories.find_one_and_delete({"_id": oid, "userId": uid})
            return _doc_to_json(r2) if r2 else None
        except Exception:
            raise


# ===================================================================
# DashboardService
# ===================================================================

class DashboardService:
    @staticmethod
    async def _get_history(user_id: str, from_date: Optional[datetime] = None, to_date: Optional[datetime] = None) -> list[dict]:
        try:
            db = get_db()
            filt: dict[str, Any] = {"userId": ObjectId(user_id)}
            if from_date or to_date:
                date_filt: dict[str, Any] = {}
                if from_date:
                    date_filt["$gte"] = from_date
                if to_date:
                    date_filt["$lte"] = to_date
                filt["createdAt"] = date_filt
            cursor = db.searchhistories.find(filt).sort("createdAt", -1)
            return await cursor.to_list(length=10000)
        except Exception:
            return []

    @staticmethod
    async def summary(user_id: str, from_date: Optional[datetime] = None, to_date: Optional[datetime] = None) -> dict:
        try:
            history = await DashboardService._get_history(user_id, from_date, to_date)
            now = datetime.utcnow()
            total_savings = sum(h.get("estimatedSavings", 0) for h in history)

            if from_date or to_date:
                earliest = from_date or (history[-1].get("createdAt", now) if history else now)
                latest = to_date or now
                diff_ms = max((latest - earliest).total_seconds(), 1)
                months = max(diff_ms / (60 * 60 * 24 * 30), 1)
                monthly_savings = total_savings / months
            else:
                this_month = now.month
                this_year = now.year
                monthly_savings = sum(
                    h.get("estimatedSavings", 0)
                    for h in history
                    if h.get("createdAt") and h["createdAt"].month == this_month and h["createdAt"].year == this_year
                )

            supplier_val, _ = _top_by_count([h.get("recommendedSupplier", "") for h in history if h.get("recommendedSupplier")])
            category_val, _ = _top_by_count([h.get("category", "") for h in history if h.get("category")])
            active_categories = len(set(h.get("category", "") for h in history))

            recent = history[:6]
            recent_searches = []
            for h in recent:
                recent_searches.append({
                    "id": str(h.get("_id", "")),
                    "query": h.get("query", ""),
                    "category": _category_name(h.get("category", "")),
                    "categorySlug": h.get("category", ""),
                    "suppliers": h.get("suppliers", []),
                    "recommendedSupplier": h.get("recommendedSupplier", ""),
                    "estimatedSavings": h.get("estimatedSavings", 0),
                    "bestPrice": h.get("bestPrice", 0),
                    "timestamp": h.get("createdAt").isoformat() if isinstance(h.get("createdAt"), datetime) else str(h.get("createdAt", "")),
                })

            return {
                "totalSearches": len(history),
                "procurementRequests": len([h for h in history if h.get("recommendedSupplier")]),
                "estimatedMonthlySavings": round(monthly_savings),
                "totalSavings": round(total_savings),
                "preferredSupplier": supplier_val,
                "topCategory": _category_name(category_val) if category_val else None,
                "topCategorySlug": category_val,
                "activeCategories": active_categories,
                "projectedAnnualSavings": round(monthly_savings * 12),
                "recentSearches": recent_searches,
            }
        except Exception:
            raise

    @staticmethod
    async def spend(user_id: str, from_date: Optional[datetime] = None, to_date: Optional[datetime] = None) -> dict:
        try:
            history = await DashboardService._get_history(user_id, from_date, to_date)
            by_month: dict[str, float] = {}
            by_category: dict[str, float] = {}
            by_supplier: dict[str, int] = {}

            for h in history:
                d = h.get("createdAt", datetime.utcnow())
                mk = _month_key(d)
                by_month[mk] = by_month.get(mk, 0) + (h.get("bestPrice", 0) or 0)
                c_name = _category_name(h.get("category", ""))
                by_category[c_name] = by_category.get(c_name, 0) + (h.get("bestPrice", 0) or 0)
                rs = h.get("recommendedSupplier")
                if rs:
                    by_supplier[rs] = by_supplier.get(rs, 0) + 1

            return {
                "monthlySpend": [{"month": m, "amount": round(a)} for m, a in by_month.items()],
                "categorySpend": sorted(
                    [{"category": c, "amount": round(a)} for c, a in by_category.items()],
                    key=lambda x: -x["amount"],
                ),
                "supplierUsage": sorted(
                    [{"supplier": s, "count": c} for s, c in by_supplier.items()],
                    key=lambda x: -x["count"],
                ),
            }
        except Exception:
            raise

    @staticmethod
    async def savings(user_id: str, from_date: Optional[datetime] = None, to_date: Optional[datetime] = None) -> dict:
        try:
            history = await DashboardService._get_history(user_id, from_date, to_date)
            by_month: dict[str, float] = {}
            for h in history:
                d = h.get("createdAt", datetime.utcnow())
                mk = _month_key(d)
                by_month[mk] = by_month.get(mk, 0) + (h.get("estimatedSavings", 0) or 0)
            return {
                "savingsTrend": [{"month": m, "amount": round(a)} for m, a in by_month.items()],
                "totalSavings": round(sum(h.get("estimatedSavings", 0) for h in history)),
            }
        except Exception:
            raise

    @staticmethod
    async def insights(user_id: str, from_date: Optional[datetime] = None, to_date: Optional[datetime] = None) -> dict:
        try:
            history = await DashboardService._get_history(user_id, from_date, to_date)
            insights: list[dict] = []

            if not history:
                return {"insights": [{"icon": "Sparkles", "text": "Run your first search to unlock AI-generated procurement insights.", "tone": "info"}]}

            total_savings = sum(h.get("estimatedSavings", 0) for h in history)
            now = datetime.utcnow()

            if from_date or to_date:
                earliest = from_date or (history[-1].get("createdAt", now) if history else now)
                latest = to_date or now
                months = max((latest - earliest).total_seconds() / (60 * 60 * 24 * 30), 1)
                period_savings = total_savings / months
                period_label = "per month in this period"
            else:
                period_savings = sum(
                    h.get("estimatedSavings", 0)
                    for h in history
                    if h.get("createdAt") and h["createdAt"].month == now.month and h["createdAt"].year == now.year
                )
                period_label = "this month"

            if period_savings > 0:
                insights.append({"icon": "TrendingUp", "text": f"You saved {format_inr(period_savings)} {period_label} by following AI recommendations.", "tone": "success"})
                insights.append({"icon": "PiggyBank", "text": f"At this rate your business could save approximately {format_inr(period_savings * 12)} annually by switching to recommended suppliers.", "tone": "success"})

            supplier_val, supplier_counts = _top_by_count([h.get("recommendedSupplier", "") for h in history if h.get("recommendedSupplier")])
            if supplier_val:
                insights.append({"icon": "Award", "text": f"{supplier_val} is your most frequently recommended supplier \u2014 it wins on your priorities most often.", "tone": "info"})

            cat_val, cat_counts = _top_by_count([h.get("category", "") for h in history if h.get("category")])
            if cat_val:
                insights.append({"icon": "Layers", "text": f"{_category_name(cat_val)} is your most active procurement category with {cat_counts[cat_val]} searches.", "tone": "info"})

            return {"insights": insights}
        except Exception:
            raise

    @staticmethod
    async def business_impact(user_id: str, from_date: Optional[datetime] = None, to_date: Optional[datetime] = None) -> dict:
        try:
            history = await DashboardService._get_history(user_id, from_date, to_date)
            now = datetime.utcnow()

            total_searches = len(history)
            total_savings = sum(h.get("estimatedSavings", 0) for h in history)
            optimized = [h for h in history if h.get("recommendedSupplier")]
            optimized_purchases = len(optimized)
            unique_suppliers = len(set(h.get("recommendedSupplier") for h in history if h.get("recommendedSupplier")))
            total_products_compared = sum(len(h.get("suppliers", [])) for h in history)

            MANUAL_MINUTES = 45
            AI_MINUTES = 3
            minutes_saved = total_searches * (MANUAL_MINUTES - AI_MINUTES)
            hours_saved = round(minutes_saved / 60)

            avg_saving = round(total_savings / optimized_purchases) if optimized_purchases > 0 else 0

            if from_date or to_date:
                earliest = from_date or (history[-1].get("createdAt", now) if history else now)
                latest = to_date or now
                months = max((latest - earliest).total_seconds() / (60 * 60 * 24 * 30), 1)
                monthly_savings = total_savings / months
            else:
                this_month = now.month
                this_year = now.year
                monthly_savings = sum(
                    h.get("estimatedSavings", 0)
                    for h in history
                    if h.get("createdAt") and h["createdAt"].month == this_month and h["createdAt"].year == this_year
                )

            accuracy_pct = round((optimized_purchases / total_searches) * 100) if total_searches > 0 else 0
            manual_eliminated_pct = round(((MANUAL_MINUTES - AI_MINUTES) / MANUAL_MINUTES) * 100) if total_searches > 0 else 0

            return {
                "totalSavings": round(total_savings),
                "monthlySavings": round(monthly_savings),
                "annualProjection": round(monthly_savings * 12),
                "totalSearches": total_searches,
                "optimizedPurchases": optimized_purchases,
                "hoursSaved": hours_saved,
                "avgSavingPerPurchase": avg_saving,
                "suppliersCompared": unique_suppliers,
                "productsCompared": total_products_compared,
                "aiAccuracyPct": accuracy_pct,
                "manualEliminatedPct": manual_eliminated_pct,
                "efficiencyScore": min(100, round(accuracy_pct * 0.4 + manual_eliminated_pct * 0.3 + min(total_searches, 100) * 0.3)),
            }
        except Exception:
            raise


# ---------------------------------------------------------------------------
# Async parallel helper
# ---------------------------------------------------------------------------

import asyncio

async def _parallel(*coros):
    try:
        return await asyncio.gather(*coros)
    except Exception:
        raise
