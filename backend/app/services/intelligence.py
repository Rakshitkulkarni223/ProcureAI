"""
Procurement Intelligence Services.

All metrics are simulated from existing supplier profile data and product
attributes. Every value is labelled "Estimated" or "Demo Data" in the UI.
Designed so each function can later be replaced with real API calls
(ERP, supplier review, delivery tracking, etc.) without changing the
response shape.
"""
from __future__ import annotations

import math
from typing import Any, Optional

from app.config import SUPPLIER_PROFILES, clamp, format_inr


# ===================================================================
# SupplierIntelligenceService
# Generates per-supplier intelligence metrics from profile + product data.
# ===================================================================

class SupplierIntelligenceService:
    @staticmethod
    def compute(product: dict) -> dict:
        """Compute intelligence metrics for a single supplier from their product."""
        try:
            profile = SUPPLIER_PROFILES.get(product["provider"], {})
            rating = product.get("rating", 4.0)
            delivery_days = product.get("deliveryDays", 5)
            warranty = product.get("warrantyMonths") or 0
            return_days = product.get("returnPolicyDays") or 0
            availability = product.get("availability", False)
            stock_prob = profile.get("stockProbability", 0.85)

            # Delivery reliability: higher rating + lower delivery days = more reliable
            delivery_reliability = round(
                clamp(
                    (rating / 5) * 60 + (1 - min(delivery_days, 10) / 10) * 30 + stock_prob * 10,
                    50, 99,
                )
            )

            # On-time delivery rate: closely related to delivery reliability
            on_time_rate = round(clamp(delivery_reliability + (stock_prob - 0.85) * 20, 50, 99))

            # Quality consistency: based on rating
            quality_score = clamp((rating - 3) / 2, 0, 1)
            quality_label = "High" if quality_score >= 0.6 else "Medium" if quality_score >= 0.3 else "Low"

            # Business stability: based on rating, warranty, return policy
            stability_raw = (rating / 5) * 40 + min(warranty, 36) / 36 * 30 + min(return_days, 14) / 14 * 30
            stability_score = clamp(stability_raw, 0, 100)
            stability_label = "Strong" if stability_score >= 70 else "Moderate" if stability_score >= 50 else "Weak"

            # Overall supplier score (0-100)
            supplier_score = round(
                clamp(
                    delivery_reliability * 0.3
                    + quality_score * 100 * 0.25
                    + stability_score * 0.25
                    + (stock_prob * 100) * 0.2,
                    0, 100,
                )
            )

            # Risk level
            risk_score = 100 - supplier_score
            if risk_score < 25:
                risk_level = "Low"
            elif risk_score < 50:
                risk_level = "Medium"
            else:
                risk_level = "High"

            # Preferred supplier: score >= 85
            preferred = supplier_score >= 85

            # Confidence in the intelligence assessment
            confidence = round(clamp(supplier_score * 0.9 + 5, 50, 98))

            return {
                "supplierScore": supplier_score,
                "riskLevel": risk_level,
                "riskScore": round(risk_score),
                "deliveryReliability": delivery_reliability,
                "onTimeDeliveryRate": on_time_rate,
                "qualityConsistency": quality_label,
                "businessStability": stability_label,
                "stabilityScore": round(stability_score),
                "preferredSupplier": preferred,
                "confidence": confidence,
                "isEstimated": True,
            }
        except Exception:
            return {
                "supplierScore": 0, "riskLevel": "Medium", "riskScore": 50,
                "deliveryReliability": 0, "onTimeDeliveryRate": 0,
                "qualityConsistency": "Medium", "businessStability": "Moderate",
                "stabilityScore": 50, "preferredSupplier": False, "confidence": 0,
                "isEstimated": True,
            }

    @staticmethod
    def compute_for_all(products: list[dict]) -> dict[str, dict]:
        """Compute intelligence for every supplier in the results."""
        try:
            out: dict[str, dict] = {}
            for p in products:
                supplier = p["provider"]
                if supplier not in out:
                    out[supplier] = SupplierIntelligenceService.compute(p)
            return out
        except Exception:
            return {}


# ===================================================================
# TotalCostService
# Computes Total Procurement Cost (product + shipping + processing + handling + hidden)
# ===================================================================

class TotalCostService:
    @staticmethod
    def compute(product: dict) -> dict:
        """Compute total procurement cost for a single product."""
        try:
            price = product.get("price", 0)
            delivery_days = product.get("deliveryDays", 5)
            profile = SUPPLIER_PROFILES.get(product["provider"], {})

            # Estimated shipping: higher for longer delivery, min flat fee
            shipping = round(clamp(50 + delivery_days * 30, 50, 800))

            # Processing cost: small flat percentage of price
            processing = round(clamp(price * 0.003, 50, 500))

            # Handling cost: based on supplier type
            handling = round(clamp(30 + (1 - profile.get("stockProbability", 0.85)) * 200, 20, 300))

            # Hidden cost: returns, delays, quality issues — estimated from risk
            intel = SupplierIntelligenceService.compute(product)
            hidden = round(clamp(
                (100 - intel["deliveryReliability"]) * 5
                + (100 - intel["supplierScore"]) * 3,
                0, 2000,
            ))

            total = price + shipping + processing + handling + hidden

            return {
                "productPrice": price,
                "shipping": shipping,
                "processing": processing,
                "handling": handling,
                "hiddenCost": hidden,
                "totalProcurementCost": total,
                "isEstimated": True,
            }
        except Exception:
            return {
                "productPrice": 0, "shipping": 0, "processing": 0,
                "handling": 0, "hiddenCost": 0, "totalProcurementCost": 0,
                "isEstimated": True,
            }

    @staticmethod
    def compute_for_all(products: list[dict]) -> list[dict]:
        """Compute total cost for each product, sorted by total cost ascending."""
        try:
            out = []
            for p in products:
                tc = TotalCostService.compute(p)
                out.append({
                    "supplier": p["provider"],
                    "productId": p["id"],
                    **tc,
                })
            out.sort(key=lambda x: x["totalProcurementCost"])
            return out
        except Exception:
            return []


# ===================================================================
# RiskScoreService
# Generates a procurement risk score using multiple factors.
# ===================================================================

class RiskScoreService:
    @staticmethod
    def compute(product: dict) -> dict:
        """Compute vendor risk score for a single product."""
        try:
            delivery_days = product.get("deliveryDays", 5)
            rating = product.get("rating", 4.0)
            warranty = product.get("warrantyMonths") or 0
            return_days = product.get("returnPolicyDays") or 0
            availability = product.get("availability", False)
            profile = SUPPLIER_PROFILES.get(product["provider"], {})
            stock_prob = profile.get("stockProbability", 0.85)

            intel = SupplierIntelligenceService.compute(product)
            stability = intel["stabilityScore"]
            quality = intel["supplierScore"]

            # Weighted risk factors (0-100, higher = riskier)
            delivery_risk = clamp((delivery_days / 10) * 100, 0, 100)
            rating_risk = clamp((1 - rating / 5) * 100, 0, 100)
            warranty_risk = clamp((1 - min(warranty, 36) / 36) * 100, 0, 100)
            return_risk = clamp((1 - min(return_days, 14) / 14) * 100, 0, 100)
            stock_risk = clamp((1 - stock_prob) * 100, 0, 100)
            stability_risk = clamp(100 - stability, 0, 100)
            quality_risk = clamp(100 - quality, 0, 100)

            # Weighted composite
            risk_score = round(clamp(
                delivery_risk * 0.15
                + rating_risk * 0.15
                + warranty_risk * 0.10
                + return_risk * 0.10
                + stock_risk * 0.15
                + stability_risk * 0.20
                + quality_risk * 0.15,
                0, 100,
            ))

            if risk_score < 25:
                level = "Low"
                badge = "🟢"
            elif risk_score < 50:
                level = "Medium"
                badge = "🟡"
            else:
                level = "High"
                badge = "🔴"

            return {
                "riskScore": risk_score,
                "riskLevel": level,
                "riskBadge": badge,
                "factors": {
                    "deliveryRisk": round(delivery_risk),
                    "ratingRisk": round(rating_risk),
                    "warrantyRisk": round(warranty_risk),
                    "returnRisk": round(return_risk),
                    "stockRisk": round(stock_risk),
                    "stabilityRisk": round(stability_risk),
                    "qualityRisk": round(quality_risk),
                },
                "isEstimated": True,
            }
        except Exception:
            return {
                "riskScore": 50, "riskLevel": "Medium", "riskBadge": "🟡",
                "factors": {}, "isEstimated": True,
            }

    @staticmethod
    def compute_for_all(products: list[dict]) -> dict[str, dict]:
        try:
            out: dict[str, dict] = {}
            for p in products:
                out[p["provider"]] = RiskScoreService.compute(p)
            return out
        except Exception:
            return {}


# ===================================================================
# InsightsService
# Generates 5-6 business insights from search results.
# ===================================================================

class InsightsService:
    @staticmethod
    def generate(products: list[dict], total_costs: list[dict],
                 intelligence: dict[str, dict], risk_scores: dict[str, dict],
                 recommendation: Optional[dict] = None) -> list[dict]:
        try:
            insights: list[dict] = []
            if not products:
                return insights

            prices = [p["price"] for p in products]
            avg_price = sum(prices) / len(prices) if prices else 0
            cheapest = min(products, key=lambda p: p["price"])
            priciest = max(products, key=lambda p: p["price"])
            fastest = min(products, key=lambda p: p["deliveryDays"])
            best_rated = max(products, key=lambda p: p["rating"])

            # 1. Cheapest vs market average
            if avg_price > 0:
                pct = round((1 - cheapest["price"] / avg_price) * 100)
                if pct > 0:
                    insights.append({
                        "icon": "TrendingDown",
                        "text": f"{cheapest['provider']} is {pct}% cheaper than the market average ({format_inr(avg_price)}).",
                        "tone": "success",
                    })

            # 2. Fastest delivery
            insights.append({
                "icon": "Truck",
                "text": f"{fastest['provider']} has the fastest delivery at {fastest['deliveryDays']} day{'s' if fastest['deliveryDays'] != 1 else ''}.",
                "tone": "info",
            })

            # 3. Best long-term value (highest supplier score)
            if intelligence:
                best_supplier = max(intelligence.items(), key=lambda x: x[1]["supplierScore"])
                insights.append({
                    "icon": "Award",
                    "text": f"{best_supplier[0]} offers the best long-term value with a supplier score of {best_supplier[1]['supplierScore']}/100.",
                    "tone": "success",
                })

            # 4. Lowest risk
            if risk_scores:
                lowest_risk = min(risk_scores.items(), key=lambda x: x[1]["riskScore"])
                insights.append({
                    "icon": "ShieldCheck",
                    "text": f"{lowest_risk[0]} has the lowest procurement risk ({lowest_risk[1]['riskLevel']}, score: {lowest_risk[1]['riskScore']}/100).",
                    "tone": "success",
                })

            # 5. Total cost vs product price difference
            if total_costs and len(total_costs) >= 2:
                lowest_tc = total_costs[0]
                highest_tc = total_costs[-1]
                diff = highest_tc["totalProcurementCost"] - lowest_tc["totalProcurementCost"]
                if diff > 0:
                    insights.append({
                        "icon": "Calculator",
                        "text": f"Total procurement cost varies by {format_inr(diff)} between suppliers. {lowest_tc['supplier']} has the lowest total cost.",
                        "tone": "info",
                    })

            # 6. Highest reliability
            if intelligence:
                most_reliable = max(intelligence.items(), key=lambda x: x[1]["deliveryReliability"])
                insights.append({
                    "icon": "Gauge",
                    "text": f"{most_reliable[0]} has the highest delivery reliability at {most_reliable[1]['deliveryReliability']}%.",
                    "tone": "info",
                })

            return insights[:6]
        except Exception:
            return []


# ===================================================================
# HealthScoreService
# Computes a procurement health score (0-100) for the dashboard.
# ===================================================================

class HealthScoreService:
    @staticmethod
    def compute(products: list[dict], intelligence: dict[str, dict],
                risk_scores: dict[str, dict], recommendation: Optional[dict] = None,
                estimated_savings: float = 0) -> dict:
        try:
            if not products:
                return {"score": 0, "status": "Needs Attention", "statusBadge": "🔴",
                        "factors": {}, "isEstimated": True}

            # Cost savings factor (0-100): savings relative to max price
            prices = [p["price"] for p in products]
            max_price = max(prices) if prices else 0
            savings_factor = clamp((estimated_savings / max_price) * 100 * 2, 0, 100) if max_price > 0 else 50

            # Supplier risk factor: average inverse risk
            avg_risk = sum(r["riskScore"] for r in risk_scores.values()) / len(risk_scores) if risk_scores else 50
            risk_factor = clamp(100 - avg_risk, 0, 100)

            # Supplier diversity: more suppliers = better diversity
            supplier_count = len(set(p["provider"] for p in products))
            diversity_factor = clamp(supplier_count / 5 * 100, 0, 100)

            # Delivery performance: average of delivery reliability
            avg_reliability = sum(i["deliveryReliability"] for i in intelligence.values()) / len(intelligence) if intelligence else 50
            delivery_factor = avg_reliability

            # Procurement efficiency: based on confidence and availability
            available_count = sum(1 for p in products if p.get("availability"))
            availability_ratio = available_count / len(products) if products else 0
            confidence = recommendation.get("confidence", 0.7) if recommendation else 0.7
            efficiency_factor = clamp(availability_ratio * 60 + confidence * 40, 0, 100)

            # Weighted composite
            score = round(clamp(
                savings_factor * 0.25
                + risk_factor * 0.25
                + diversity_factor * 0.15
                + delivery_factor * 0.20
                + efficiency_factor * 0.15,
                0, 100,
            ))

            if score >= 80:
                status = "Excellent"
                badge = "🟢"
            elif score >= 65:
                status = "Good"
                badge = "🟢"
            elif score >= 45:
                status = "Average"
                badge = "🟡"
            else:
                status = "Needs Attention"
                badge = "🔴"

            return {
                "score": score,
                "status": status,
                "statusBadge": badge,
                "factors": {
                    "costSavings": round(savings_factor),
                    "supplierRisk": round(risk_factor),
                    "supplierDiversity": round(diversity_factor),
                    "deliveryPerformance": round(delivery_factor),
                    "procurementEfficiency": round(efficiency_factor),
                },
                "isEstimated": True,
            }
        except Exception:
            return {"score": 0, "status": "Needs Attention", "statusBadge": "🔴",
                    "factors": {}, "isEstimated": True}


# ===================================================================
# LongTermRecommendationService
# Picks the best long-term supplier (not always cheapest).
# ===================================================================

class LongTermRecommendationService:
    @staticmethod
    def compute(products: list[dict], intelligence: dict[str, dict],
                risk_scores: dict[str, dict], total_costs: list[dict]) -> Optional[dict]:
        try:
            if not products:
                return None

            # Build per-supplier composite for long-term value
            candidates = []
            for p in products:
                supplier = p["provider"]
                intel = intelligence.get(supplier, {})
                risk = risk_scores.get(supplier, {})
                tc = next((t for t in total_costs if t["supplier"] == supplier), None)

                supplier_score = intel.get("supplierScore", 50)
                risk_score = risk.get("riskScore", 50)
                reliability = intel.get("deliveryReliability", 50)
                stability = intel.get("stabilityScore", 50)
                total_cost = tc["totalProcurementCost"] if tc else p["price"]

                # Long-term value score: weighted towards reliability, stability, low risk
                # Cost matters but is NOT the primary factor
                prices = [pp["price"] for pp in products]
                min_price = min(prices) if prices else 1
                max_price = max(prices) if prices else 1
                cost_norm = 1 - clamp((total_cost - min_price) / (max_price - min_price), 0, 1) if max_price > min_price else 0.5

                lt_score = (
                    reliability * 0.25
                    + supplier_score * 0.20
                    + (100 - risk_score) * 0.20
                    + stability * 0.15
                    + cost_norm * 100 * 0.20
                )

                candidates.append({
                    "supplier": supplier,
                    "product": p,
                    "longTermScore": round(lt_score),
                    "supplierScore": supplier_score,
                    "riskScore": risk_score,
                    "riskLevel": risk.get("riskLevel", "Medium"),
                    "deliveryReliability": reliability,
                    "stabilityScore": stability,
                    "totalProcurementCost": total_cost,
                })

            candidates.sort(key=lambda x: -x["longTermScore"])
            best = candidates[0]
            runner_up = candidates[1] if len(candidates) > 1 else None

            # Build business-friendly explanation
            reasons = []
            if runner_up:
                cost_diff = best["totalProcurementCost"] - runner_up["totalProcurementCost"]
                if cost_diff > 0:
                    reasons.append(
                        f"Although {runner_up['supplier']} costs {format_inr(cost_diff)} less, "
                        f"{best['supplier']} has higher delivery reliability "
                        f"({best['deliveryReliability']}% vs {runner_up['deliveryReliability']}%), "
                        f"stronger business stability, and lower procurement risk."
                    )
                else:
                    reasons.append(
                        f"{best['supplier']} offers both the lowest total procurement cost "
                        f"and superior long-term reliability."
                    )
            else:
                reasons.append(f"{best['supplier']} is the recommended long-term procurement partner.")

            reasons.append(
                f"Supplier score: {best['supplierScore']}/100, "
                f"Risk level: {best['riskLevel']}, "
                f"Delivery reliability: {best['deliveryReliability']}%."
            )
            reasons.append(
                "This recommendation balances cost, quality, logistics, and supplier stability "
                "for sustained procurement value."
            )

            return {
                "supplier": best["supplier"],
                "product": best["product"],
                "longTermScore": best["longTermScore"],
                "reasons": reasons,
                "supplierScore": best["supplierScore"],
                "riskLevel": best["riskLevel"],
                "deliveryReliability": best["deliveryReliability"],
                "totalProcurementCost": best["totalProcurementCost"],
                "isEstimated": True,
            }
        except Exception:
            return None


# ===================================================================
# ComparisonMatrixService
# Builds a supplier comparison matrix.
# ===================================================================

class ComparisonMatrixService:
    @staticmethod
    def build(products: list[dict], total_costs: list[dict],
              intelligence: dict[str, dict], risk_scores: dict[str, dict]) -> dict:
        try:
            if not products:
                return {"criteria": [], "suppliers": [], "matrix": {}}

            suppliers = list(dict.fromkeys(p["provider"] for p in products))

            # Find best values for each criterion
            cheapest = min(products, key=lambda p: p["price"])["provider"]
            lowest_tc = min(total_costs, key=lambda t: t["totalProcurementCost"])["supplier"] if total_costs else None
            fastest = min(products, key=lambda p: p["deliveryDays"])["provider"]
            lowest_risk = min(risk_scores.items(), key=lambda x: x[1]["riskScore"])[0] if risk_scores else None
            best_warranty = max(products, key=lambda p: p.get("warrantyMonths") or 0)["provider"]
            most_reliable = max(intelligence.items(), key=lambda x: x[1]["deliveryReliability"])[0] if intelligence else None

            # Long-term value: highest supplier score
            best_lt = max(intelligence.items(), key=lambda x: x[1]["supplierScore"])[0] if intelligence else None

            criteria = [
                "Price",
                "Total Cost",
                "Delivery",
                "Risk",
                "Warranty",
                "Reliability",
                "Long-Term Value",
            ]

            matrix: dict[str, dict[str, bool]] = {}
            for supplier in suppliers:
                matrix[supplier] = {
                    "Price": supplier == cheapest,
                    "Total Cost": supplier == lowest_tc,
                    "Delivery": supplier == fastest,
                    "Risk": supplier == lowest_risk,
                    "Warranty": supplier == best_warranty,
                    "Reliability": supplier == most_reliable,
                    "Long-Term Value": supplier == best_lt,
                }

            return {
                "criteria": criteria,
                "suppliers": suppliers,
                "matrix": matrix,
                "isEstimated": True,
            }
        except Exception:
            return {"criteria": [], "suppliers": [], "matrix": {}, "isEstimated": True}


# ===================================================================
# ProcurementIntelligenceService
# Orchestrates all intelligence services and returns a unified payload.
# ===================================================================

class ProcurementIntelligenceService:
    @staticmethod
    def compute_all(products: list[dict], recommendation: Optional[dict] = None) -> dict:
        """Compute all intelligence metrics for a set of search results."""
        try:
            intelligence = SupplierIntelligenceService.compute_for_all(products)
            total_costs = TotalCostService.compute_for_all(products)
            risk_scores = RiskScoreService.compute_for_all(products)
            insights = InsightsService.generate(
                products, total_costs, intelligence, risk_scores, recommendation
            )
            health = HealthScoreService.compute(
                products, intelligence, risk_scores, recommendation,
                recommendation.get("estimatedSavings", 0) if recommendation else 0,
            )
            long_term = LongTermRecommendationService.compute(
                products, intelligence, risk_scores, total_costs
            )
            matrix = ComparisonMatrixService.build(
                products, total_costs, intelligence, risk_scores
            )

            return {
                "supplierIntelligence": intelligence,
                "totalCosts": total_costs,
                "riskScores": risk_scores,
                "insights": insights,
                "healthScore": health,
                "longTermRecommendation": long_term,
                "comparisonMatrix": matrix,
            }
        except Exception:
            return {
                "supplierIntelligence": {},
                "totalCosts": [],
                "riskScores": {},
                "insights": [],
                "healthScore": None,
                "longTermRecommendation": None,
                "comparisonMatrix": {},
            }

    # Alias for backward compat
    compute = compute_all


# ===================================================================
# BasketIntelligenceService
# Computes 15 procurement intelligence metrics for basket plans.
# ===================================================================

class BasketIntelligenceService:
    @staticmethod
    def compute(
        plan: dict,
        analyses: list[dict],
        all_supplier_products: dict[str, list[dict]],
    ) -> dict:
        """Compute all basket intelligence metrics from the optimization plan."""
        try:
            result_items = plan.get("items", [])
            fulfillable = [i for i in result_items if i.get("availability")]
            if not fulfillable:
                return {}

            chosen_products = []
            for item in fulfillable:
                p = {
                    "id": item.get("title", ""),
                    "provider": item["supplier"],
                    "title": item["title"],
                    "price": item["price"],
                    "deliveryDays": item.get("deliveryDays", 5),
                    "rating": 4.0,
                    "availability": True,
                    "warrantyMonths": 6,
                    "returnPolicyDays": 7,
                    "discount": 0,
                }
                # Try to find original product for richer data
                prods = all_supplier_products.get(item["supplier"], [])
                match = next((pr for pr in prods if pr.get("title") == item["title"]), None)
                if match:
                    p.update({
                        "rating": match.get("rating", 4.0),
                        "warrantyMonths": match.get("warrantyMonths", 6),
                        "returnPolicyDays": match.get("returnPolicyDays", 7),
                        "discount": match.get("discount", 0),
                    })
                chosen_products.append(p)

            # Reuse existing intelligence
            base_intel = ProcurementIntelligenceService.compute_all(chosen_products)

            # --- 1. Total Procurement Cost ---
            total_procurement_cost = sum(
                tc["totalProcurementCost"] for tc in base_intel.get("totalCosts", [])
            )
            product_cost = sum(i["lineTotal"] for i in fulfillable)
            logistics_cost = total_procurement_cost - product_cost

            # --- 2. Total Savings ---
            market_cost = plan.get("baseline", {}).get("total", 0) or product_cost
            optimized_cost = plan.get("splitTotal", 0)
            savings = plan.get("estimatedSavings", 0)
            savings_pct = round((savings / market_cost) * 100, 1) if market_cost > 0 else 0

            # --- 3. Supplier Count ---
            supplier_count = plan.get("supplierCount", 0)

            # --- 4. Supplier Consolidation Score ---
            if supplier_count <= 1:
                consolidation_score = 5
                consolidation_label = "Excellent Consolidation"
            elif supplier_count == 2:
                consolidation_score = 4
                consolidation_label = "Good Consolidation"
            elif supplier_count == 3:
                consolidation_score = 3
                consolidation_label = "Moderate Consolidation"
            elif supplier_count == 4:
                consolidation_score = 2
                consolidation_label = "Fragmented"
            else:
                consolidation_score = 1
                consolidation_label = "Highly Fragmented"

            # --- 5. Delivery Window ---
            delivery_days = [i.get("deliveryDays", 0) for i in fulfillable if i.get("deliveryDays")]
            earliest_delivery = min(delivery_days) if delivery_days else 0
            latest_delivery = max(delivery_days) if delivery_days else 0

            # --- 6. Procurement Complexity Score ---
            complexity_factors = {
                "supplierCount": supplier_count,
                "deliveryCount": len(set(delivery_days)),
                "invoiceCount": supplier_count,
            }
            complexity_raw = (
                supplier_count * 20
                + len(set(delivery_days)) * 10
                + supplier_count * 10
            )
            if complexity_raw <= 30:
                complexity_level = "Very Easy"
            elif complexity_raw <= 50:
                complexity_level = "Easy"
            elif complexity_raw <= 70:
                complexity_level = "Medium"
            elif complexity_raw <= 90:
                complexity_level = "High"
            else:
                complexity_level = "Very High"

            # --- 7. Logistics Cost Breakdown ---
            total_shipping = sum(tc["shipping"] for tc in base_intel.get("totalCosts", []))
            total_handling = sum(tc["handling"] for tc in base_intel.get("totalCosts", []))
            total_processing = sum(tc["processing"] for tc in base_intel.get("totalCosts", []))
            total_hidden = sum(tc["hiddenCost"] for tc in base_intel.get("totalCosts", []))

            # --- 8. AI Recommendation Score ---
            avg_supplier_score = 50
            if base_intel.get("supplierIntelligence"):
                scores = [s["supplierScore"] for s in base_intel["supplierIntelligence"].values()]
                avg_supplier_score = sum(scores) / len(scores) if scores else 50

            avg_risk = 50
            if base_intel.get("riskScores"):
                risks = [r["riskScore"] for r in base_intel["riskScores"].values()]
                avg_risk = sum(risks) / len(risks) if risks else 50

            savings_norm = clamp(savings_pct * 5, 0, 100)
            delivery_norm = clamp(100 - latest_delivery * 10, 0, 100)
            consolidation_norm = consolidation_score * 20
            risk_norm = 100 - avg_risk

            ai_score = round(clamp(
                savings_norm * 0.25
                + delivery_norm * 0.20
                + avg_supplier_score * 0.20
                + risk_norm * 0.15
                + consolidation_norm * 0.10
                + plan.get("confidence", 0.7) * 100 * 0.10,
                0, 100,
            ))

            # --- 9. Confidence Score with reason ---
            confidence = plan.get("confidence", 0.7)
            confidence_pct = round(confidence * 100)
            if confidence >= 0.8:
                confidence_label = "High Confidence"
                confidence_reason = "Consistent pricing and reliable supplier data across the basket."
            elif confidence >= 0.6:
                confidence_label = "Moderate Confidence"
                confidence_reason = "Some variance in supplier pricing or delivery estimates."
            else:
                confidence_label = "Low Confidence"
                confidence_reason = "High variability in pricing or limited supplier coverage."

            # --- 10. Procurement Risk Score ---
            risk_level = "Low"
            risk_score = avg_risk
            if base_intel.get("riskScores"):
                risk_levels = [r["riskLevel"] for r in base_intel["riskScores"].values()]
                if "High" in risk_levels:
                    risk_level = "High"
                elif "Medium" in risk_levels:
                    risk_level = "Medium"
                else:
                    risk_level = "Low"

            # --- 11. Cost vs Convenience Recommendation ---
            cost_vs_convenience = BasketIntelligenceService._cost_vs_convenience(
                plan, supplier_count, savings, consolidation_score
            )

            # --- 12. Supplier Dependency ---
            supplier_dependency = {}
            total_spend = sum(i["lineTotal"] for i in fulfillable)
            for item in fulfillable:
                s = item["supplier"]
                supplier_dependency[s] = supplier_dependency.get(s, 0) + item["lineTotal"]
            supplier_dependency = {
                s: {
                    "amount": round(amt),
                    "percentage": round((amt / total_spend) * 100, 1) if total_spend > 0 else 0,
                }
                for s, amt in supplier_dependency.items()
            }
            # Check for dominance
            dominant_supplier = None
            for s, dep in supplier_dependency.items():
                if dep["percentage"] > 70:
                    dominant_supplier = s
                    break

            # --- 13. Category Spend (per-item) ---
            category_spend = []
            for item in fulfillable:
                category_spend.append({
                    "item": item["title"],
                    "query": item["query"],
                    "supplier": item["supplier"],
                    "amount": round(item["lineTotal"]),
                })

            # --- 14. Expected Monthly / Yearly Savings ---
            monthly_savings = savings * 30  # Assuming daily basket
            yearly_savings = savings * 365

            # --- 15. AI Procurement Summary ---
            summary = BasketIntelligenceService._generate_summary(
                supplier_count, savings, savings_pct, risk_level,
                latest_delivery, complexity_level, ai_score,
                dominant_supplier, consolidation_label,
            )

            return {
                # Existing intelligence (for supplier intelligence cards etc.)
                "supplierIntelligence": base_intel.get("supplierIntelligence", {}),
                "totalCosts": base_intel.get("totalCosts", []),
                "riskScores": base_intel.get("riskScores", {}),
                # New basket-specific metrics
                "totalProcurementCost": round(total_procurement_cost),
                "productCost": round(product_cost),
                "logisticsCost": round(logistics_cost),
                "logisticsBreakdown": {
                    "shipping": round(total_shipping),
                    "transport": round(total_processing),
                    "handling": round(total_handling),
                    "hidden": round(total_hidden),
                    "total": round(total_shipping + total_processing + total_handling + total_hidden),
                },
                "savings": {
                    "marketCost": round(market_cost),
                    "optimizedCost": round(optimized_cost),
                    "amount": round(savings),
                    "percentage": savings_pct,
                },
                "supplierCount": supplier_count,
                "consolidationScore": {
                    "score": consolidation_score,
                    "label": consolidation_label,
                    "stars": "★" * consolidation_score + "☆" * (5 - consolidation_score),
                },
                "deliveryWindow": {
                    "earliest": earliest_delivery,
                    "latest": latest_delivery,
                    "complete": latest_delivery,
                    "earliestLabel": _days_label(earliest_delivery),
                    "latestLabel": _days_label(latest_delivery),
                },
                "complexity": {
                    "level": complexity_level,
                    "factors": complexity_factors,
                },
                "aiScore": ai_score,
                "confidence": {
                    "percentage": confidence_pct,
                    "label": confidence_label,
                    "reason": confidence_reason,
                },
                "risk": {
                    "level": risk_level,
                    "score": round(risk_score),
                },
                "costVsConvenience": cost_vs_convenience,
                "supplierDependency": supplier_dependency,
                "dominantSupplier": dominant_supplier,
                "categorySpend": category_spend,
                "expectedSavings": {
                    "perBasket": round(savings),
                    "monthly": round(monthly_savings),
                    "yearly": round(yearly_savings),
                },
                "aiSummary": summary,
                "isEstimated": True,
            }
        except Exception:
            return {}

    @staticmethod
    def _cost_vs_convenience(plan: dict, supplier_count: int,
                             savings: float, consolidation_score: int) -> dict:
        try:
            is_split = plan.get("recommendedPlan") == "split"
            baseline = plan.get("baseline", {})
            split_total = plan.get("splitTotal", 0)
            baseline_total = baseline.get("total", 0)
            baseline_supplier = baseline.get("supplier")

            if is_split and baseline_supplier:
                cost_diff = baseline_total - split_total
                if cost_diff > 0 and supplier_count > 1:
                    extra_suppliers = supplier_count - 1
                    per_supplier_saving = cost_diff / supplier_count if supplier_count else 0
                    if per_supplier_saving < 500 and extra_suppliers >= 2:
                        return {
                            "recommended": "consolidate",
                            "reason": (
                                f"Only {format_inr(cost_diff)} saved by splitting across "
                                f"{supplier_count} suppliers. Consolidating at {baseline_supplier} "
                                f"saves {extra_suppliers} extra deliveries, invoices, and vendor follow-ups."
                            ),
                            "splitCost": round(split_total),
                            "consolidateCost": round(baseline_total),
                            "extraCost": round(baseline_total - split_total),
                        }
                    else:
                        return {
                            "recommended": "split",
                            "reason": (
                                f"Splitting saves {format_inr(cost_diff)} across {supplier_count} suppliers. "
                                f"The cost benefit justifies the additional coordination."
                            ),
                            "splitCost": round(split_total),
                            "consolidateCost": round(baseline_total),
                            "extraCost": round(baseline_total - split_total),
                        }

            return {
                "recommended": plan.get("recommendedPlan", "split"),
                "reason": "Current plan offers the best balance of cost and convenience.",
                "splitCost": round(split_total),
                "consolidateCost": round(baseline_total) if baseline_supplier else 0,
                "extraCost": 0,
            }
        except Exception:
            return {"recommended": "split", "reason": "", "splitCost": 0, "consolidateCost": 0, "extraCost": 0}

    @staticmethod
    def _generate_summary(supplier_count: int, savings: float, savings_pct: float,
                          risk_level: str, latest_delivery: int, complexity_level: str,
                          ai_score: int, dominant_supplier: Optional[str],
                          consolidation_label: str) -> str:
        try:
            parts: list[str] = []

            # INSIGHT — strategic observation
            if dominant_supplier:
                parts.append(
                    f"INSIGHT: {dominant_supplier} holds the entire basket spend, "
                    f"creating single-supplier dependency risk despite "
                    f"{consolidation_label.lower()}."
                )
            elif supplier_count > 2:
                parts.append(
                    f"INSIGHT: Basket is distributed across {supplier_count} suppliers, "
                    f"improving resilience but increasing procurement overhead."
                )
            else:
                parts.append(
                    f"INSIGHT: With {consolidation_label.lower()} and "
                    f"{risk_level.lower()} risk, this basket balances cost efficiency "
                    f"and supply chain stability well."
                )

            # ACTION — what to do next
            if ai_score >= 80:
                parts.append(
                    "ACTION: Proceed confidently — this basket scores well "
                    "across all key procurement metrics."
                )
            elif dominant_supplier:
                parts.append(
                    f"ACTION: Consider adding a secondary supplier to reduce "
                    f"dependency on {dominant_supplier} before finalizing."
                )
            elif ai_score >= 60:
                parts.append(
                    "ACTION: Review the cost-delivery trade-offs and proceed "
                    "if the delivery timeline meets your needs."
                )
            else:
                parts.append(
                    "ACTION: Explore alternative suppliers or adjust quantities "
                    "to improve the overall procurement score."
                )

            # OUTLOOK — forward-looking projection
            if savings > 0:
                monthly = savings * 30
                parts.append(
                    f"OUTLOOK: At current volumes, this optimization pattern "
                    f"could yield ~{format_inr(monthly)}/month in sustained savings."
                )
            else:
                parts.append(
                    "OUTLOOK: Monitor market prices — supplier pricing fluctuations "
                    "could create savings opportunities in the next cycle."
                )

            return "\n".join(parts)
        except Exception:
            return ""


def _days_label(days: int) -> str:
    try:
        if days <= 0:
            return "Today"
        if days == 1:
            return "1 day"
        return f"{days} days"
    except Exception:
        return "—"
