"""
Core search pipeline: PRNG, CatalogResolver, MockProviderAdapter,
ComparisonService, RecommendationService, SearchService.

Faithfully replicates the Node.js/TypeScript logic so the API produces
identical results for the same inputs.
"""
from __future__ import annotations

import asyncio
import math
import random
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from app.config import (
    CATALOG,
    CATEGORY_SUPPLIERS,
    DEFAULT_CATEGORY_BASE_PRICE,
    RECOMMENDATION_MODES,
    SUPPLIER_PROFILES,
    WEIGHT_PROFILES,
    clamp,
    format_inr,
)
from app.services.intelligence import (
    ProcurementIntelligenceService,
    RiskScoreService,
    SupplierIntelligenceService,
    TotalCostService,
)


# ===================================================================
# Seeded PRNG (port of utils/prng.ts)
# ===================================================================

def _xfnv1a(s: str) -> int:
    try:
        h = 2166136261
        for ch in s:
            h = (h ^ ord(ch)) & 0xFFFFFFFF
            h = (h * 16777619) & 0xFFFFFFFF
        return h
    except Exception:
        return 0


def _mulberry32(seed: int):
    a = seed & 0xFFFFFFFF

    def _next():
        nonlocal a
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        t = a
        t = ((t ^ (t >> 15)) * (1 | t)) & 0xFFFFFFFF
        t2 = (t + (((t ^ (t >> 7)) * (61 | t)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        t2 = t2 ^ t
        return ((t2 ^ (t2 >> 14)) & 0xFFFFFFFF) / 4294967296
    return _next


class SeededRandom:
    def __init__(self, seed_string: str):
        try:
            self._rng = _mulberry32(_xfnv1a(seed_string))
        except Exception:
            self._rng = lambda: random.random()

    def next(self) -> float:
        return self._rng()

    def range(self, mn: float, mx: float) -> float:
        return mn + self._rng() * (mx - mn)

    def int(self, mn: int, mx: int) -> int:
        return math.floor(self.range(mn, mx + 1))

    def chance(self, probability: float) -> bool:
        return self._rng() < probability


# ===================================================================
# CatalogResolver (port of services/CatalogResolver.ts)
# ===================================================================

def _tokenize(text: str) -> list[str]:
    try:
        cleaned = re.sub(r"[^a-z0-9\s]", " ", text.lower())
        return [t for t in cleaned.split() if len(t) > 1]
    except Exception:
        return []


def _score_template(tpl: dict, tokens: list[str]) -> float:
    try:
        haystack = " ".join([tpl["title"], tpl["brand"]] + tpl["keywords"]).lower()
        score = 0.0
        for tok in tokens:
            if any(k.lower() == tok for k in tpl["keywords"]):
                score += 3
            elif tok in haystack:
                score += 1.5
        return score
    except Exception:
        return 0.0


class CatalogResolver:
    @staticmethod
    def resolve_or_null(category: str, query: str) -> Optional[dict]:
        try:
            tokens = _tokenize(query)
            templates = CATALOG.get(category, [])
            best, best_score = None, 0.0
            for tpl in templates:
                s = _score_template(tpl, tokens)
                if s > best_score:
                    best_score = s
                    best = tpl
            return best if best and best_score > 0 else None
        except Exception:
            return None

    @staticmethod
    def best_matching_category(query: str) -> Optional[str]:
        try:
            tokens = _tokenize(query)
            best_category, best_score = None, 0.0
            for category, templates in CATALOG.items():
                for template in templates:
                    score = _score_template(template, tokens)
                    if score > best_score:
                        best_category, best_score = category, score
            return best_category if best_score > 0 else None
        except Exception:
            return None

    @staticmethod
    def resolve(category: str, query: str) -> dict:
        try:
            tokens = _tokenize(query)
            templates = CATALOG.get(category, [])
            best, best_score = None, 0.0
            for tpl in templates:
                s = _score_template(tpl, tokens)
                if s > best_score:
                    best_score = s
                    best = tpl
            if best and best_score > 0:
                return best
            clean_query = query.strip() or "Procurement Item"
            title = " ".join(w.capitalize() for w in clean_query.split())
            return {
                "id": f"generic-{category}-{clean_query.lower().replace(' ', '-')}",
                "title": title,
                "brand": "Generic",
                "basePrice": DEFAULT_CATEGORY_BASE_PRICE.get(category, 1000),
                "image": "",
                "keywords": tokens,
            }
        except Exception:
            return {"id": "generic-fallback", "title": query, "brand": "Generic", "basePrice": 1000, "image": "", "keywords": []}


# ===================================================================
# MockProviderAdapter (port of adapters/MockProviderAdapter.ts)
# ===================================================================

class MockProviderAdapter:
    def __init__(self, profile: dict):
        try:
            self.profile = profile
            self.name: str = profile["name"]
        except Exception:
            raise

    async def search(self, query: str, category: str) -> list[dict]:
        try:
            await asyncio.sleep(0.04 + random.random() * 0.12)
            tpl = CatalogResolver.resolve_or_null(category, query)
            if not tpl:
                return []
            rng = SeededRandom(f"{query.lower().strip()}#{tpl['id']}#{self.name}")
            p = self.profile

            price_jitter = rng.range(0.8, 1.2)
            price = round((tpl["basePrice"] * p["priceFactor"] * price_jitter) / 10) * 10

            discount = int(clamp(round(p["discountBias"] + rng.range(-6, 8)), 0, 70))
            original_price = round(price / (1 - discount / 100) / 10) * 10

            rating = round(clamp(p["baseRating"] + rng.range(-0.4, 0.3), 3, 5) * 10) / 10
            reviews = rng.int(60, 9000)
            availability = rng.chance(p["stockProbability"])

            delivery_days = max(0, p["deliveryDays"] + rng.int(-1, 1))
            delivery_date = datetime.now(timezone.utc) + timedelta(days=delivery_days)

            return [{
                "id": f"{self.name.lower().replace(' ', '-')}-{tpl['id']}",
                "provider": self.name,
                "title": tpl["title"],
                "brand": tpl["brand"],
                "category": category,
                "image": tpl["image"],
                "price": price,
                "originalPrice": original_price,
                "discount": discount,
                "rating": rating,
                "reviews": reviews,
                "availability": availability,
                "deliveryDays": delivery_days,
                "deliveryDate": delivery_date.isoformat(),
                "warrantyMonths": p.get("warrantyMonths") or None,
                "returnPolicyDays": p.get("returnDays"),
                "productUrl": f"https://example.com/{self.name.lower().replace(' ', '')}/product/{tpl['id']}",
                "supplierSource": "marketplace",
            }]
        except Exception as e:
            print(f"MockProviderAdapter[{self.name}] search failed: {e}")
            return []


# ===================================================================
# ProviderFactory
# ===================================================================

class ProviderFactory:
    @staticmethod
    def create(supplier_name: str) -> Optional[MockProviderAdapter]:
        try:
            profile = SUPPLIER_PROFILES.get(supplier_name)
            if not profile:
                return None
            return MockProviderAdapter(profile)
        except Exception:
            return None


# ===================================================================
# ComparisonService (port of services/ComparisonService.ts)
# ===================================================================

def _sort_key(sort_by: Optional[str]):
    try:
        if sort_by == "highest_rating":
            return lambda p: -p["rating"]
        if sort_by == "fastest_delivery":
            return lambda p: p["deliveryDays"]
        if sort_by == "highest_discount":
            return lambda p: -p["discount"]
        return lambda p: p["price"]  # lowest_price default
    except Exception:
        return lambda p: p.get("price", 0)


class ComparisonService:
    @staticmethod
    def apply(products: list[dict], sort_by: Optional[str] = None, filters: Optional[dict] = None) -> list[dict]:
        try:
            deduped = ComparisonService._dedupe(products)
            filtered = ComparisonService._filter(deduped, filters)
            filtered.sort(key=_sort_key(sort_by))
            return filtered
        except Exception:
            return products

    @staticmethod
    def _dedupe(products: list[dict]) -> list[dict]:
        try:
            seen: set[str] = set()
            out: list[dict] = []
            for p in products:
                if p["id"] in seen:
                    continue
                seen.add(p["id"])
                out.append(p)
            return out
        except Exception:
            return products

    @staticmethod
    def _filter(products: list[dict], filters: Optional[dict]) -> list[dict]:
        try:
            if not filters:
                return products
            out = []
            for p in products:
                if filters.get("brand") and filters["brand"].lower() not in p.get("brand", "").lower():
                    continue
                if filters.get("supplier") and p.get("provider") != filters["supplier"]:
                    continue
                if filters.get("minRating") is not None and p.get("rating", 0) < filters["minRating"]:
                    continue
                if filters.get("maxPrice") is not None and p.get("price", 0) > filters["maxPrice"]:
                    continue
                if filters.get("inStockOnly") and not p.get("availability"):
                    continue
                out.append(p)
            return out
        except Exception:
            return products


# ===================================================================
# RecommendationService (port of services/RecommendationService.ts)
# ===================================================================

class RecommendationService:
    @staticmethod
    def recommend(products: list[dict], profile_key: str = "balanced") -> Optional[dict]:
        try:
            if not products:
                return None

            profile = WEIGHT_PROFILES.get(profile_key, WEIGHT_PROFILES["balanced"])
            w = profile["weights"]
            weight_sum = (
                w["price"] + w["delivery"] + w["rating"] + w["discount"]
                + w["availability"] + w["warranty"] + w["returnPolicy"]
            ) or 1

            prices = [p["price"] for p in products]
            days = [p["deliveryDays"] for p in products]
            warranties = [p.get("warrantyMonths") or 0 for p in products]
            returns = [p.get("returnPolicyDays") or 0 for p in products]

            min_price, max_price = min(prices), max(prices)
            min_days, max_days = min(days), max(days)
            max_warranty = max(warranties)
            max_return = max(returns)

            def norm(val, mn, mx, invert=False):
                if mx == mn:
                    return 1
                s = (val - mn) / (mx - mn)
                return 1 - s if invert else s

            scored = []
            for p in products:
                ps = norm(p["price"], min_price, max_price, invert=True)
                ds = norm(p["deliveryDays"], min_days, max_days, invert=True)
                rs = p["rating"] / 5
                disc_s = clamp(p["discount"] / 100, 0, 1)
                avail_s = 1 if p["availability"] else 0
                war_s = ((p.get("warrantyMonths") or 0) / max_warranty) if max_warranty > 0 else 0
                ret_s = ((p.get("returnPolicyDays") or 0) / max_return) if max_return > 0 else 0

                factors = [
                    {"label": "Price", "weight": w["price"], "score": ps},
                    {"label": "Delivery", "weight": w["delivery"], "score": ds},
                    {"label": "Rating", "weight": w["rating"], "score": rs},
                    {"label": "Discount", "weight": w["discount"], "score": disc_s},
                    {"label": "Availability", "weight": w["availability"], "score": avail_s},
                    {"label": "Warranty", "weight": w["warranty"], "score": war_s},
                    {"label": "Return Policy", "weight": w["returnPolicy"], "score": ret_s},
                ]

                score = (
                    w["price"] * ps + w["delivery"] * ds + w["rating"] * rs
                    + w["discount"] * disc_s + w["availability"] * avail_s
                    + w["warranty"] * war_s + w["returnPolicy"] * ret_s
                ) / weight_sum

                scored.append({
                    "product": p,
                    "score": score,
                    "factors": [f for f in factors if f["weight"] > 0],
                })

            scored.sort(key=lambda x: -x["score"])
            top = scored[0]
            runner_up = scored[1] if len(scored) > 1 else None

            confidence = (
                clamp((top["score"] - runner_up["score"]) / top["score"], 0, 1)
                if runner_up and top["score"] > 0
                else 0.7
            )

            estimated_savings = max(0, max_price - top["product"]["price"])

            return {
                "supplier": top["product"]["provider"],
                "product": top["product"],
                "reasons": RecommendationService._build_reasons(
                    top["product"], products, min_price, max_price, min_days, max_warranty
                ),
                "estimatedSavings": estimated_savings,
                "confidence": round(confidence * 100) / 100,
                "weightProfile": profile_key,
                "factors": top["factors"],
                "scoreboard": [
                    {"supplier": s["product"]["provider"], "score": round(s["score"] * 1000) / 1000, "price": s["product"]["price"]}
                    for s in scored
                ],
            }
        except Exception:
            return None

    @staticmethod
    def recommend_by_mode(products: list[dict], mode: str = "balanced") -> Optional[dict]:
        """Recommend using a smart recommendation mode that leverages intelligence data."""
        try:
            if not products:
                return None

            mode_config = RECOMMENDATION_MODES.get(mode, RECOMMENDATION_MODES["balanced"])
            sort_by = mode_config.get("sortBy", "balanced")
            weight_profile = mode_config.get("weightProfile", "balanced")

            # Compute intelligence data for all products
            intel = SupplierIntelligenceService.compute_for_all(products)
            total_costs = TotalCostService.compute_for_all(products)
            risk_scores = RiskScoreService.compute_for_all(products)

            # Base recommendation from weighted scoring
            base_rec = RecommendationService.recommend(products, weight_profile)
            if not base_rec:
                return None

            # Re-rank based on the mode's sort criteria
            if sort_by == "total_cost":
                # Pick supplier with lowest total procurement cost
                if total_costs:
                    best_supplier = total_costs[0]["supplier"]
                    best_product = next((p for p in products if p["provider"] == best_supplier), products[0])
                else:
                    best_product = base_rec["product"]
            elif sort_by == "risk":
                # Pick supplier with lowest risk score
                if risk_scores:
                    best_supplier = min(risk_scores.items(), key=lambda x: x[1]["riskScore"])[0]
                    best_product = next((p for p in products if p["provider"] == best_supplier), products[0])
                else:
                    best_product = base_rec["product"]
            elif sort_by == "delivery":
                # Pick supplier with fastest delivery
                best_product = min(products, key=lambda p: p["deliveryDays"])
            elif sort_by == "reliability":
                # Pick supplier with highest delivery reliability
                if intel:
                    best_supplier = max(intel.items(), key=lambda x: x[1]["deliveryReliability"])[0]
                    best_product = next((p for p in products if p["provider"] == best_supplier), products[0])
                else:
                    best_product = base_rec["product"]
            elif sort_by == "long_term":
                # Pick supplier with highest supplier score (long-term value)
                if intel:
                    best_supplier = max(intel.items(), key=lambda x: x[1]["supplierScore"])[0]
                    best_product = next((p for p in products if p["provider"] == best_supplier), products[0])
                else:
                    best_product = base_rec["product"]
            else:
                # balanced: use base recommendation
                best_product = base_rec["product"]

            # Build enhanced business-friendly reasons
            prices = [p["price"] for p in products]
            min_price, max_price = min(prices), max(prices)
            min_days = min(p["deliveryDays"] for p in products)
            max_warranty = max(p.get("warrantyMonths") or 0 for p in products)

            reasons = RecommendationService._build_business_reasons(
                best_product, products, intel, risk_scores, total_costs, mode, min_price, max_price
            )

            # Compute confidence based on margin vs runner-up
            other_products = [p for p in products if p["provider"] != best_product["provider"]]
            if other_products:
                if sort_by == "total_cost" and total_costs:
                    best_tc = next((t["totalProcurementCost"] for t in total_costs if t["supplier"] == best_product["provider"]), best_product["price"])
                    second_tc = sorted([t["totalProcurementCost"] for t in total_costs])[1] if len(total_costs) > 1 else best_tc
                    confidence = clamp(1 - (second_tc - best_tc) / (best_tc + 1), 0.5, 0.98) if best_tc > 0 else 0.7
                elif sort_by == "risk" and risk_scores:
                    best_risk = risk_scores.get(best_product["provider"], {}).get("riskScore", 50)
                    other_risks = [r["riskScore"] for s, r in risk_scores.items() if s != best_product["provider"]]
                    if other_risks:
                        confidence = clamp(1 - best_risk / 200, 0.5, 0.98)
                    else:
                        confidence = 0.7
                else:
                    confidence = base_rec.get("confidence", 0.7)
            else:
                confidence = 0.7

            estimated_savings = max(0, max_price - best_product["price"])

            # Build scoreboard with intelligence data
            scoreboard = []
            for p in products:
                tc = next((t for t in total_costs if t["supplier"] == p["provider"]), None)
                ri = risk_scores.get(p["provider"], {})
                si = intel.get(p["provider"], {})
                scoreboard.append({
                    "supplier": p["provider"],
                    "score": round(base_rec.get("confidence", 0.7) * 1000) / 1000,
                    "price": p["price"],
                    "totalProcurementCost": tc["totalProcurementCost"] if tc else p["price"],
                    "riskScore": ri.get("riskScore", 0),
                    "riskLevel": ri.get("riskLevel", "Medium"),
                    "supplierScore": si.get("supplierScore", 0),
                    "deliveryReliability": si.get("deliveryReliability", 0),
                    "deliveryDays": p.get("deliveryDays", 0),
                    "city": p.get("city", ""),
                    "distanceKm": p.get("distanceKm", 0),
                })

            return {
                "supplier": best_product["provider"],
                "product": best_product,
                "reasons": reasons,
                "estimatedSavings": estimated_savings,
                "confidence": round(confidence * 100) / 100,
                "weightProfile": weight_profile,
                "recommendationMode": mode,
                "factors": base_rec.get("factors", []),
                "scoreboard": scoreboard,
            }
        except Exception:
            return None

    @staticmethod
    def _build_business_reasons(best: dict, all_products: list[dict],
                                intel: dict, risk_scores: dict, total_costs: list[dict],
                                mode: str, min_price, max_price) -> list[str]:
        """Generate business-friendly reasoning instead of simple score-based explanations."""
        try:
            reasons: list[str] = []
            supplier = best["provider"]
            si = intel.get(supplier, {})
            ri = risk_scores.get(supplier, {})
            tc = next((t for t in total_costs if t["supplier"] == supplier), None)
            others = [p for p in all_products if p["provider"] != supplier]

            best_city = best.get("city") or ""
            best_distance = best.get("distanceKm") or 0
            best_days = best["deliveryDays"]

            # Mode-specific primary reason
            if mode == "lowest_cost":
                if tc:
                    reasons.append(
                        f"{supplier} is recommended because it offers the lowest total procurement cost "
                        f"of {format_inr(tc['totalProcurementCost'])}, including shipping and handling."
                    )
            elif mode == "lowest_risk":
                reasons.append(
                    f"{supplier} is recommended because it has the lowest procurement risk "
                    f"({ri.get('riskLevel', 'Medium')}, score: {ri.get('riskScore', 50)}/100), "
                    f"ensuring stable and reliable sourcing."
                )
            elif mode == "fastest_delivery":
                d = best["deliveryDays"]
                loc_str = f" from {best_city}" if best_city else ""
                reasons.append(
                    f"{supplier} is recommended for urgent procurement with delivery in {d} day{'s' if d != 1 else ''}"
                    f"{loc_str}, reducing stock-out risk and enabling just-in-time inventory."
                )
            elif mode == "highest_reliability":
                reasons.append(
                    f"{supplier} is recommended because it has the highest delivery reliability "
                    f"at {si.get('deliveryReliability', 0)}%, minimising supply chain disruptions."
                )
            elif mode == "best_long_term_value":
                reasons.append(
                    f"{supplier} is recommended for long-term procurement due to its strong supplier score "
                    f"({si.get('supplierScore', 0)}/100), low risk, and consistent delivery reliability."
                )
            else:
                # balanced
                loc_str = f" based in {best_city}" if best_city else ""
                reasons.append(
                    f"{supplier}{loc_str} is recommended because it offers the best balance of "
                    f"total procurement cost, delivery reliability, and low operational risk."
                )

            # Comparative insight — intelligent cost vs delivery trade-off
            if others:
                cheaper = next((p for p in others if p["price"] < best["price"]), None)
                if cheaper and mode != "lowest_cost":
                    diff = best["price"] - cheaper["price"]
                    cheaper_days = cheaper["deliveryDays"]
                    cheaper_city = cheaper.get("city") or ""
                    cheaper_distance = cheaper.get("distanceKm") or 0
                    cheaper_risk = risk_scores.get(cheaper["provider"], {}).get("riskLevel", "Medium")
                    cheaper_rel = intel.get(cheaper["provider"], {}).get("deliveryReliability", 0)

                    # Build trade-off message based on what matters
                    trade_offs = []
                    if best_days < cheaper_days:
                        day_diff = cheaper_days - best_days
                        trade_offs.append(f"delivers {day_diff} day{'s' if day_diff != 1 else ''} faster")
                    if best_distance < cheaper_distance and best_distance > 0:
                        trade_offs.append(f"is {cheaper_distance - best_distance}km closer (lower logistics cost)")
                    if cheaper_rel < si.get("deliveryReliability", 0):
                        trade_offs.append(f"has {round(si.get('deliveryReliability', 0) - cheaper_rel, 1)}% higher delivery reliability")

                    if trade_offs:
                        trade_off_text = ", ".join(trade_offs)
                        cheaper_loc = f" ({cheaper_city})" if cheaper_city else ""
                        reasons.append(
                            f"Although {cheaper['provider']}{cheaper_loc} is {format_inr(diff)} cheaper, "
                            f"{supplier} {trade_off_text}, reducing stock-out risk and total cost of ownership."
                        )
                    else:
                        reasons.append(
                            f"{cheaper['provider']} is {format_inr(diff)} cheaper but has lower reliability "
                            f"({cheaper_rel}%) and {cheaper_risk.lower()} risk, increasing long-term procurement risk."
                        )
                elif not cheaper and mode != "lowest_cost":
                    # We are the cheapest — mention it
                    reasons.append(f"{supplier} also offers the lowest price at {format_inr(best['price'])}.")

                # If someone else is faster but we're chosen for cost
                faster = next((p for p in others if p["deliveryDays"] < best_days), None)
                if faster and mode in ("lowest_cost", "balanced"):
                    day_diff = best_days - faster["deliveryDays"]
                    faster_city = faster.get("city") or ""
                    faster_loc = f" ({faster_city})" if faster_city else ""
                    price_adv = faster["price"] - best["price"]
                    if price_adv > 0:
                        reasons.append(
                            f"{faster['provider']}{faster_loc} delivers {day_diff} day{'s' if day_diff != 1 else ''} faster "
                            f"but costs {format_inr(price_adv)} more — {supplier} provides better value."
                        )

            # Location context
            if best_city and best_distance > 0:
                reasons.append(
                    f"Located in {best_city} ({best_distance}km from your location) — "
                    f"proximity reduces transit risk and logistics costs."
                )
            elif best_city:
                reasons.append(f"Local supplier in {best_city} — minimises delivery time and logistics overhead.")

            # Reliability and risk context
            if si.get("deliveryReliability", 0) >= 90:
                reasons.append(
                    f"High delivery reliability at {si['deliveryReliability']}% ensures consistent fulfilment."
                )

            # Delivery and stock
            if best["deliveryDays"] == 0:
                reasons.append("Same-day delivery available")
            elif best["deliveryDays"] == min(p["deliveryDays"] for p in all_products):
                reasons.append(f"Fastest delivery at {best['deliveryDays']} day{'s' if best['deliveryDays'] != 1 else ''}")

            if best.get("warrantyMonths") and best["warrantyMonths"] > 0:
                reasons.append(f"{best['warrantyMonths']}-month warranty included")

            return reasons[:6]
        except Exception:
            return []

    @staticmethod
    def _build_reasons(best: dict, all_products: list[dict], min_price, max_price, min_days, max_warranty) -> list[str]:
        try:
            reasons: list[str] = []
            others = [p for p in all_products if p["provider"] != best["provider"]]

            if best["price"] == min_price and others:
                priciest = max(all_products, key=lambda p: p["price"])
                diff = max_price - best["price"]
                if diff > 0:
                    reasons.append(f"{format_inr(diff)} cheaper than {priciest['provider']} (highest priced)")
                else:
                    reasons.append("Lowest price across all suppliers")
            elif others:
                cheaper = next((p for p in all_products if p["price"] < best["price"]), None)
                if cheaper:
                    reasons.append(f"Competitive price at {format_inr(best['price'])}")

            if best["deliveryDays"] == 0:
                reasons.append("Same-day delivery available")
            elif best["deliveryDays"] == min_days:
                d = best["deliveryDays"]
                reasons.append(f"Fastest delivery \u2014 {d} day{'s' if d > 1 else ''}")
            else:
                reasons.append(f"Delivery in {best['deliveryDays']} days")

            reviews = best["reviews"]
            reasons.append(f"Supplier rating {best['rating']}/5 ({reviews:,} reviews)")

            if best["discount"] > 0:
                reasons.append(f"{best['discount']}% discount applied")

            reasons.append("In stock and ready to ship" if best["availability"] else "Currently low on stock")

            wm = best.get("warrantyMonths")
            if wm and wm > 0:
                reasons.append(f"{wm}-month warranty included")

            return reasons[:5]
        except Exception:
            return []


# ===================================================================
# SearchService (port of services/SearchService.ts)
# ===================================================================

class SearchService:
    @staticmethod
    async def gather(query: str, category: str, suppliers: list[str], user_id: str | None = None, include_supplier_hub: bool = False, user_city: str = "") -> list[dict]:
        """Query every supplier adapter in parallel. Optionally also query Supplier Hub suppliers."""
        try:
            adapters = [
                a for a in (ProviderFactory.create(name) for name in suppliers) if a is not None
            ]
            # Build task list: marketplace adapters + optional supplier hub gather + optional SerpAPI
            tasks = [a.search(query, category) for a in adapters]
            if include_supplier_hub and user_id:
                from app.services.supplier_hub_search import SupplierHubSearchService
                # Determine which supplier names are marketplace vs supplier hub
                marketplace_names = {a.name for a in adapters}
                # Supplier Hub names = selected names that aren't marketplace suppliers
                sh_names = [s for s in suppliers if s not in marketplace_names]
                # Always query Supplier Hub when flag is set; pass sh_names to filter (None = all)
                tasks.append(SupplierHubSearchService.gather(user_id, query, category, sh_names if sh_names else None, user_city=user_city))

            # SerpAPI: silently fetch real Google Shopping results when API key is set
            try:
                from app.config import env as _env
                if _env.SERPAPI_KEY:
                    from app.services.serpapi_adapter import SerpAPIProviderAdapter
                    tasks.append(SerpAPIProviderAdapter(allowed_suppliers=suppliers).search(query, category))
            except Exception:
                pass

            results = await asyncio.gather(*tasks, return_exceptions=True)
            products: list[dict] = []
            for i, r in enumerate(results):
                if isinstance(r, list):
                    products.extend(r)
                elif i < len(adapters):
                    print(f'Provider "{adapters[i].name}" failed: {r}')
                else:
                    print(f'Background data source failed: {r}')
            return products
        except Exception:
            return []

    @staticmethod
    async def search(user_id: str, req: dict) -> dict:
        try:
            category = req.get("category", "")
            query = req.get("query", "").strip()
            if not query:
                raise ValueError("Search query is required")
            if not category:
                raise ValueError("Category is required")

            valid = CATEGORY_SUPPLIERS.get(category, [])
            requested = req.get("suppliers") or []
            # Keep marketplace suppliers that are valid, plus any non-marketplace names (Supplier Hub)
            marketplace_selected = [s for s in requested if s in valid]
            supplier_hub_selected = [s for s in requested if s not in valid]
            suppliers = marketplace_selected + supplier_hub_selected if requested else []
            if not suppliers:
                suppliers = valid
            if not suppliers:
                raise ValueError(f"Unknown category: {category}")

            include_supplier_hub = req.get("includeSupplierHub", True)
            user_city = req.get("userCity") or ""
            products = await SearchService.gather(query, category, suppliers, user_id=user_id, include_supplier_hub=include_supplier_hub, user_city=user_city)
            results = ComparisonService.apply(
                products, req.get("sortBy"), req.get("filters")
            )

            # Determine recommendation mode (falls back to weightProfile for backward compat)
            mode = req.get("recommendationMode") or "balanced"
            weight_profile = req.get("weightProfile", "balanced")

            # Use mode-based recommendation if a mode is specified, otherwise use weight profile
            if mode and mode != "balanced":
                recommendation = RecommendationService.recommend_by_mode(results, mode)
            else:
                recommendation = RecommendationService.recommend(results, weight_profile)

            # Compute procurement intelligence payload
            intelligence = ProcurementIntelligenceService.compute_all(results, recommendation)

            # Generate LLM-powered AI explanation (non-blocking, never fails)
            ai_explanation = ""
            lt_explanation = ""
            long_term = intelligence.get("longTermRecommendation")
            advisor_tasks = []
            try:
                from app.services.llm_advisor import generate_explanation, generate_longterm_explanation
                if recommendation:
                    advisor_tasks.append(("recommendation", generate_explanation(recommendation, results, mode)))
                if long_term:
                    advisor_tasks.append(("long_term", generate_longterm_explanation(long_term, results)))
                if advisor_tasks:
                    advisor_results = await asyncio.gather(
                        *(task for _, task in advisor_tasks),
                        return_exceptions=True,
                    )
                    for (advisor_type, _), advisor_result in zip(advisor_tasks, advisor_results):
                        if isinstance(advisor_result, Exception):
                            print(f"[WARN] LLM {advisor_type} advisor skipped: {advisor_result}")
                        elif advisor_type == "recommendation":
                            ai_explanation = advisor_result
                        else:
                            lt_explanation = advisor_result
            except Exception as advisor_err:
                print(f"[WARN] LLM advisors skipped: {advisor_err}")

            if recommendation and ai_explanation:
                recommendation["aiExplanation"] = ai_explanation

            if long_term and lt_explanation:
                long_term["aiExplanation"] = lt_explanation

            return {
                "query": query,
                "category": category,
                "count": len(results),
                "results": results,
                "recommendation": recommendation,
                "intelligence": intelligence,
            }
        except Exception:
            raise

    @staticmethod
    async def search_preview(query: str, category: str, suppliers: list[str]) -> dict:
        """Like search() but without history persistence. Used by the seeder."""
        try:
            valid = CATEGORY_SUPPLIERS.get(category, [])
            enabled = [s for s in suppliers if s in valid]
            supplier_list = enabled if enabled else valid

            products = await SearchService.gather(query, category, supplier_list)
            results = ComparisonService.apply(products, "lowest_price")
            recommendation = RecommendationService.recommend(results, "balanced")
            return {"query": query, "category": category, "count": len(results), "results": results, "recommendation": recommendation}
        except Exception:
            return {"query": query, "category": category, "count": 0, "results": [], "recommendation": None}
