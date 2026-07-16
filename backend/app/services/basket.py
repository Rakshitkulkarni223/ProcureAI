"""
Split-Cart Optimizer (Multi-Supplier Basket).
Port of services/BasketOptimizationService.ts.
"""
from __future__ import annotations

from typing import Any, Optional

from app.config import CATEGORY_SUPPLIERS, clamp
from app.services.core import RecommendationService, SearchService
from app.services.intelligence import ProcurementIntelligenceService, BasketIntelligenceService


def _eta_label(days: int) -> str:
    try:
        if days <= 0:
            return "Today"
        if days == 1:
            return "Tomorrow"
        return f"In {days} days"
    except Exception:
        return "—"


class BasketOptimizationService:
    @staticmethod
    def build_plan(
        items: list[dict],
        consolidation_penalty: float = 0,
        weight_profile: str = "balanced",
        recommendation_mode: str = "balanced",
    ) -> dict:
        """Pure function: no I/O. Produces the optimal plan from pre-gathered items."""
        try:
            penalty = max(0, consolidation_penalty or 0)
            unfulfillable: list[str] = []

            # --- Per-item analysis ---
            analyses = []
            for item in items:
                qty = max(1, round(item.get("quantity", 1) or 1))
                in_stock = [p for p in item["products"] if p["availability"]]
                by_supplier: dict[str, dict] = {}
                for p in in_stock:
                    existing = by_supplier.get(p["provider"])
                    if not existing or p["price"] < existing["price"]:
                        by_supplier[p["provider"]] = p

                best: Optional[dict] = None
                reasons: list[str] = []
                if by_supplier:
                    rec = RecommendationService.recommend_by_mode(list(by_supplier.values()), recommendation_mode)
                    if rec:
                        best = rec["product"]
                        reasons = rec["reasons"][:3]
                if not best:
                    unfulfillable.append(item["query"])
                analyses.append({"query": item["query"], "qty": qty, "bySupplier": by_supplier, "best": best, "reasons": reasons})

            fulfillable = [a for a in analyses if a["best"]]

            # --- Split-optimal plan ---
            split_items_total = sum(a["best"]["price"] * a["qty"] for a in fulfillable)
            split_suppliers = set(a["best"]["provider"] for a in fulfillable)
            split_net = split_items_total + penalty * len(split_suppliers)

            # --- Baseline plan (single supplier) ---
            all_suppliers: set[str] = set()
            for a in fulfillable:
                for s in a["bySupplier"]:
                    all_suppliers.add(s)

            baseline = {"supplier": None, "total": 0, "coverage": 0}
            for s in all_suppliers:
                coverage = 0
                total = 0
                for a in fulfillable:
                    p = a["bySupplier"].get(s)
                    if p:
                        coverage += 1
                        total += p["price"] * a["qty"]
                better = (
                    coverage > baseline["coverage"]
                    or (coverage == baseline["coverage"] and (baseline["supplier"] is None or total < baseline["total"]))
                )
                if better:
                    baseline = {"supplier": s, "total": total, "coverage": coverage}

            baseline_net = baseline["total"] + penalty if baseline["supplier"] else float("inf")
            can_consolidate = bool(baseline["supplier"]) and baseline["coverage"] == len(fulfillable) and len(fulfillable) > 0

            recommended_plan = "consolidate" if can_consolidate and baseline_net < split_net else "split"

            # --- Materialize ---
            grouped: dict[str, dict] = {}
            chosen_total = 0
            chosen_suppliers: set[str] = set()
            max_days = 0

            result_items = []
            for a in analyses:
                if not a["best"]:
                    result_items.append({
                        "query": a["query"], "supplier": None, "title": a["query"],
                        "image": "", "price": 0, "quantity": a["qty"], "lineTotal": 0,
                        "deliveryDays": 0, "availability": False, "reasons": ["Not found in catalog"],
                    })
                    continue

                product = a["best"]
                reasons = a["reasons"]
                if recommended_plan == "consolidate" and baseline["supplier"]:
                    product = a["bySupplier"].get(baseline["supplier"], a["best"])
                    reasons = [
                        f"Bundled at {baseline['supplier']} to save on delivery",
                        f"{product['discount']}% off" if product.get("discount", 0) > 0 else "In stock",
                    ]

                line_total = product["price"] * a["qty"]
                chosen_total += line_total
                chosen_suppliers.add(product["provider"])
                max_days = max(max_days, product["deliveryDays"])

                g = grouped.get(product["provider"], {"items": [], "subtotal": 0, "eta": "Today", "_days": 0})
                g["items"].append(a["query"])
                g["subtotal"] += line_total
                g["_days"] = max(g.get("_days", 0), product["deliveryDays"])
                g["eta"] = _eta_label(g["_days"])
                grouped[product["provider"]] = g

                result_items.append({
                    "query": a["query"], "supplier": product["provider"],
                    "title": product["title"], "image": product["image"],
                    "price": product["price"], "quantity": a["qty"],
                    "lineTotal": line_total, "deliveryDays": product["deliveryDays"],
                    "availability": True, "reasons": reasons,
                })

            grouped_by_supplier = {}
            for s, g in grouped.items():
                grouped_by_supplier[s] = {"items": g["items"], "subtotal": round(g["subtotal"]), "eta": g["eta"]}

            chosen_net = chosen_total + penalty * len(chosen_suppliers)
            other_net = baseline_net if recommended_plan == "split" else split_net
            estimated_savings = max(0, round(other_net - chosen_net)) if other_net != float("inf") else 0
            savings_fraction = estimated_savings / other_net if other_net not in (0, float("inf")) else 0
            confidence = (
                round(min(0.98, max(0.5, 0.6 + savings_fraction)) * 100) / 100
                if fulfillable else 0
            )

            # --- Intelligence on chosen products ---
            chosen_products = []
            all_supplier_products: dict[str, list[dict]] = {}
            for a in analyses:
                if a["best"]:
                    product = a["best"]
                    if recommended_plan == "consolidate" and baseline["supplier"]:
                        product = a["bySupplier"].get(baseline["supplier"], a["best"])
                    chosen_products.append(product)
                    s = product["provider"]
                    all_supplier_products.setdefault(s, [])
                    all_supplier_products[s].extend(a["bySupplier"].values())

            # Build plan dict for intelligence service
            plan_for_intel = {
                "items": result_items,
                "recommendedPlan": recommended_plan,
                "splitTotal": round(chosen_total),
                "baseline": {"supplier": baseline["supplier"], "total": round(baseline["total"])},
                "estimatedSavings": estimated_savings,
                "supplierCount": len(chosen_suppliers),
                "confidence": confidence,
            }

            intelligence = {}
            try:
                if chosen_products:
                    intelligence = BasketIntelligenceService.compute(
                        plan_for_intel, analyses, all_supplier_products
                    )
            except Exception:
                pass

            return {
                "recommendedPlan": recommended_plan,
                "items": result_items,
                "groupedBySupplier": grouped_by_supplier,
                "splitTotal": round(chosen_total),
                "baseline": {"supplier": baseline["supplier"], "total": round(baseline["total"])},
                "estimatedSavings": estimated_savings,
                "supplierCount": len(chosen_suppliers),
                "estimatedDelivery": _eta_label(max_days) if fulfillable else "—",
                "confidence": confidence,
                "unfulfillable": unfulfillable,
                "consolidationPenalty": penalty,
                "intelligence": intelligence,
            }
        except Exception:
            raise

    @staticmethod
    async def optimize(user_id: str, req: dict) -> dict:
        try:
            category = req.get("category", "")
            if not category:
                raise ValueError("Category is required")
            valid = CATEGORY_SUPPLIERS.get(category)
            if not valid:
                raise ValueError(f"Unknown category: {category}")

            items = [i for i in (req.get("items") or []) if i.get("query", "").strip()]
            if not items:
                raise ValueError("At least one item is required")

            suppliers = req.get("suppliers") or []
            suppliers = [s for s in suppliers if s in valid] if suppliers else []
            if not suppliers:
                suppliers = valid

            weight_profile = req.get("weightProfile", "balanced")
            recommendation_mode = req.get("recommendationMode", "balanced")

            import asyncio
            gathered = await asyncio.gather(*[
                BasketOptimizationService._gather_item(it, category, suppliers)
                for it in items
            ])

            plan = BasketOptimizationService.build_plan(
                list(gathered), req.get("consolidationPenalty", 0) or 0, weight_profile, recommendation_mode
            )
            return {"category": category, "weightProfile": weight_profile, **plan}
        except Exception:
            raise

    @staticmethod
    async def _gather_item(item: dict, category: str, suppliers: list[str]) -> dict:
        try:
            query = item["query"].strip()
            qty = max(1, round(item.get("quantity", 1) or 1))
            products = await SearchService.gather(query, category, suppliers)
            return {"query": query, "quantity": qty, "products": products}
        except Exception:
            return {"query": item.get("query", ""), "quantity": 1, "products": []}
