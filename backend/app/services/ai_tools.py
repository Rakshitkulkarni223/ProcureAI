"""
AI Procurement Assistant — Tool definitions and handlers.

Each tool wraps an existing service call so the LLM can invoke them
via function calling. Tools return structured dicts which the AI service
serialises to the LLM as tool-call results.
"""
from __future__ import annotations

import json
from typing import Any

from app.config import CATEGORIES, CATEGORY_SUPPLIERS


# ---------------------------------------------------------------------------
# Tool JSON Schema definitions (OpenAI function-calling format)
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "search_products",
            "description": "Search products across suppliers.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Product query"
                    },
                    "category": {
                        "type": "string",
                        "description": "Category slug",
                        "enum": [c["slug"] for c in CATEGORIES]
                    },
                    "suppliers": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Optional supplier filter"
                    },
                    "recommendation_mode": {
                        "type": "string",
                        "description": "Strategy",
                        "enum": ["balanced", "lowest_cost", "lowest_risk", "fastest_delivery", "highest_reliability", "best_long_term_value"]
                    }
                },
                "required": ["query", "category"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_recommendation",
            "description": "Recommend the best supplier for a product.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Product query"
                    },
                    "category": {
                        "type": "string",
                        "description": "Category slug",
                        "enum": [c["slug"] for c in CATEGORIES]
                    },
                    "mode": {
                        "type": "string",
                        "description": "Strategy",
                        "enum": ["balanced", "lowest_cost", "lowest_risk", "fastest_delivery", "highest_reliability", "best_long_term_value"]
                    }
                },
                "required": ["query", "category"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "optimize_basket",
            "description": "Optimize a multi-item basket across suppliers.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "Category slug",
                        "enum": [c["slug"] for c in CATEGORIES]
                    },
                    "items": {
                        "type": "array",
                        "description": "Items to procure",
                        "items": {
                            "type": "object",
                            "properties": {
                                "query": {"type": "string", "description": "Product"},
                                "quantity": {"type": "integer", "description": "Quantity", "default": 1}
                            },
                            "required": ["query"]
                        }
                    },
                    "mode": {
                        "type": "string",
                        "description": "Strategy",
                        "enum": ["balanced", "lowest_cost", "fastest_delivery"]
                    }
                },
                "required": ["category", "items"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_analytics",
            "description": "Get procurement analytics.",
            "parameters": {
                "type": "object",
                "properties": {
                    "metric": {
                        "type": "string",
                        "description": "Metric to retrieve",
                        "enum": ["summary", "spend", "savings", "insights"]
                    }
                },
                "required": ["metric"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_business_impact",
            "description": "Get business impact metrics.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_suppliers",
            "description": "List the user's suppliers (name, city, reliability, delivery, categories). Use for supplier questions.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_basket_history",
            "description": "Get recent basket history. Call before answering basket-content questions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Entries to return",
                        "default": 5
                    },
                    "category": {
                        "type": "string",
                        "description": "Category slug filter"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_history",
            "description": "Get recent search history.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Entries to return",
                        "default": 5
                    }
                },
                "required": []
            }
        }
    },
]


# ---------------------------------------------------------------------------
# Tool handler dispatch — calls into existing services
# ---------------------------------------------------------------------------

async def execute_tool(tool_name: str, arguments: dict[str, Any], user_id: str) -> dict[str, Any]:
    """Execute a tool by name and return the result dict.

    All tools are scoped by user_id for security. Results are truncated
    to keep within token limits.
    """
    try:
        if tool_name == "search_products":
            return await _tool_search_products(arguments, user_id)
        elif tool_name == "get_recommendation":
            return await _tool_get_recommendation(arguments, user_id)
        elif tool_name == "optimize_basket":
            return await _tool_optimize_basket(arguments, user_id)
        elif tool_name == "get_analytics":
            return await _tool_get_analytics(arguments, user_id)
        elif tool_name == "get_business_impact":
            return await _tool_get_business_impact(user_id)
        elif tool_name == "list_suppliers":
            return await _tool_list_suppliers(user_id)
        elif tool_name == "get_basket_history":
            return await _tool_get_basket_history(arguments, user_id)
        elif tool_name == "get_history":
            return await _tool_get_history(arguments, user_id)
        else:
            return {"error": f"Unknown tool: {tool_name}"}
    except Exception as e:
        return {"error": f"Tool '{tool_name}' failed: {str(e)}"}


# ---------------------------------------------------------------------------
# Individual tool implementations
# ---------------------------------------------------------------------------

async def _tool_search_products(args: dict, user_id: str) -> dict:
    """Search products via SearchService and return a concise summary."""
    try:
        from app.services.core import SearchService

        query = args.get("query", "")
        category = args.get("category", "")
        suppliers = args.get("suppliers") or []
        mode = args.get("recommendation_mode", "balanced")

        if not query or not category:
            return {"error": "Both 'query' and 'category' are required"}

        req = {
            "query": query,
            "category": category,
            "suppliers": suppliers if suppliers else None,
            "recommendationMode": mode,
            "includeSupplierHub": True,
        }
        result = await SearchService.search(user_id, req)

        # Summarise for the LLM (keep token count manageable)
        products = result.get("results", [])[:5]  # Top 5
        summary_products = []
        for p in products:
            summary_products.append({
                "supplier": p.get("provider", ""),
                "title": p.get("title", "")[:60],
                "price": p.get("price", 0),
                "delivery_days": p.get("deliveryDays", 0),
                "rating": p.get("rating", 0),
                "availability": p.get("availability", False),
            })

        # Compact headline summary so the model can answer without scanning rows
        rec = result.get("recommendation")
        best_supplier = rec.get("supplier", "") if rec else (summary_products[0]["supplier"] if summary_products else "")
        lowest_price = min((p["price"] for p in summary_products), default=0)
        highest_rating = max((p["rating"] for p in summary_products), default=0)

        return {
            "summary": {
                "total_results": result.get("count", 0),
                "best_supplier": best_supplier,
                "lowest_price": lowest_price,
                "highest_rating": highest_rating,
                "savings": rec.get("estimatedSavings", 0) if rec else 0,
            },
            "products": summary_products,
            "_note": "Use only these values. Do not invent or modify them.",
        }
    except Exception as e:
        return {"error": f"Search failed: {str(e)}"}


async def _tool_get_recommendation(args: dict, user_id: str) -> dict:
    """Get recommendation for a product query."""
    try:
        from app.services.core import SearchService

        query = args.get("query", "")
        category = args.get("category", "")
        mode = args.get("mode", "balanced")

        if not query or not category:
            return {"error": "Both 'query' and 'category' are required"}

        req = {
            "query": query,
            "category": category,
            "recommendationMode": mode,
            "includeSupplierHub": True,
        }
        result = await SearchService.search(user_id, req)
        rec = result.get("recommendation")
        if not rec:
            return {"message": "No recommendation available for this query."}

        return {
            "supplier": rec.get("supplier", ""),
            "product": rec.get("product", {}).get("title", ""),
            "price": rec.get("product", {}).get("price", 0),
            "delivery_days": rec.get("product", {}).get("deliveryDays", 0),
            "savings": rec.get("estimatedSavings", 0),
            "confidence": f"{round(rec.get('confidence', 0) * 100)}%",
            "mode": rec.get("recommendationMode", mode),
            "reasons": rec.get("reasons", [])[:3],
            "ai_explanation": rec.get("aiExplanation", ""),
            "scoreboard": [
                {"supplier": s.get("supplier"), "price": s.get("price"), "score": s.get("score")}
                for s in rec.get("scoreboard", [])[:3]
            ],
        }
    except Exception as e:
        return {"error": f"Recommendation failed: {str(e)}"}


async def _tool_optimize_basket(args: dict, user_id: str) -> dict:
    """Optimize a multi-item basket."""
    try:
        from app.services.basket import BasketOptimizationService

        category = args.get("category", "")
        items = args.get("items", [])
        mode = args.get("mode", "balanced")

        if not category:
            return {"error": "'category' is required"}

        # Fetch existing basket items from history — use ONLY those
        try:
            from bson import ObjectId
            from app.database import get_db
            db = get_db()
            latest_basket = await db.baskethistories.find_one(
                {"userId": ObjectId(user_id), "category": category},
                sort=[("createdAt", -1)],
            )
            if latest_basket and latest_basket.get("items"):
                items = [
                    {"query": i.get("query", ""), "quantity": i.get("quantity", 1)}
                    for i in latest_basket["items"] if i.get("query")
                ]
        except Exception:
            pass  # If history fetch fails, use whatever items were passed

        if not items:
            return {"message": f"Your {category} basket is empty. Add items via the Search page first, then come back to optimize."}

        suppliers = CATEGORY_SUPPLIERS.get(category, [])
        req = {
            "category": category,
            "suppliers": suppliers,
            "items": [{"query": i.get("query", ""), "quantity": i.get("quantity", 1)} for i in items],
            "weightProfile": "balanced",
            "recommendationMode": mode,
            "consolidationPenalty": 0,
            "includeSupplierHub": True,
        }
        result = await BasketOptimizationService.optimize(user_id, req)

        # Separate found vs not-found items
        all_items = result.get("items", [])
        fulfilled = [i for i in all_items if i.get("supplier")]
        not_found = [i for i in all_items if not i.get("supplier")]
        intel = result.get("intelligence", {})

        # Build supplier name list
        supplier_names = list({i.get("supplier", "") for i in fulfilled if i.get("supplier")})

        response: dict[str, Any] = {
            "plan": result.get("recommendedPlan", "split"),
            "total_cost": result.get("splitTotal", 0),
            "baseline_cost": result.get("baseline", {}).get("total", 0),
            "suppliers_used": result.get("supplierCount", 0),
            "supplier_names": supplier_names,
            "savings": result.get("estimatedSavings", 0),
            "savings_pct": round(result.get("estimatedSavings", 0) / max(result.get("baseline", {}).get("total", 1), 1) * 100, 1),
            "delivery": result.get("estimatedDelivery", ""),
            "found_items": [
                {
                    "product": i.get("query", ""),
                    "supplier": i.get("supplier", ""),
                    "price": i.get("price", 0),
                    "quantity": i.get("quantity", 1),
                }
                for i in fulfilled[:10]
            ],
            "ai_summary": intel.get("aiSummary", ""),
            "risk_level": intel.get("risk", {}).get("level", ""),
            "risk_detail": intel.get("risk", {}).get("detail", ""),
            "action": intel.get("risk", {}).get("recommendation", ""),
            "outlook": intel.get("outlook", ""),
        }

        if not_found:
            response["not_found_items"] = [
                {"product": i.get("query", ""), "note": "NOT FOUND in catalog — do not make up a price or supplier"}
                for i in not_found
            ]
            response["warning"] = f"{len(not_found)} item(s) were NOT found in the catalog. Report them as unavailable."

        return response
    except Exception as e:
        return {"error": f"Basket optimization failed: {str(e)}"}


def _filter_analytics(metric: str, data: dict) -> dict:
    """Trim heavy analytics payloads to the fields the model needs.

    DashboardService returns full arrays (recent searches, per-month/category/
    supplier breakdowns) meant for charts. For the AI we keep only compact,
    bounded summaries to reduce tokens, cost, and hallucination surface.
    """
    try:
        if not isinstance(data, dict):
            return data

        if metric == "summary":
            return {
                "totalSearches": data.get("totalSearches", 0),
                "procurementRequests": data.get("procurementRequests", 0),
                "estimatedMonthlySavings": data.get("estimatedMonthlySavings", 0),
                "totalSavings": data.get("totalSavings", 0),
                "projectedAnnualSavings": data.get("projectedAnnualSavings", 0),
                "preferredSupplier": data.get("preferredSupplier"),
                "topCategory": data.get("topCategory"),
                "activeCategories": data.get("activeCategories", 0),
            }

        if metric == "spend":
            return {
                "monthlySpend": data.get("monthlySpend", [])[-12:],
                "categorySpend": data.get("categorySpend", [])[:6],
                "topSuppliers": data.get("supplierUsage", [])[:8],
            }

        if metric == "savings":
            return {
                "savingsTrend": data.get("savingsTrend", [])[-12:],
                "totalSavings": data.get("totalSavings", 0),
            }

        if metric == "insights":
            return {
                "insights": [i.get("text", "") for i in data.get("insights", [])[:6]],
            }

        return data
    except Exception:
        return data


async def _tool_get_analytics(args: dict, user_id: str) -> dict:
    """Get analytics data from DashboardService (filtered for the AI)."""
    try:
        from app.services.analytics import DashboardService

        metric = args.get("metric", "summary")

        if metric == "summary":
            raw = await DashboardService.summary(user_id)
        elif metric == "spend":
            raw = await DashboardService.spend(user_id)
        elif metric == "savings":
            raw = await DashboardService.savings(user_id)
        elif metric == "insights":
            raw = await DashboardService.insights(user_id)
        else:
            return {"error": f"Unknown metric: {metric}"}

        return _filter_analytics(metric, raw)
    except Exception as e:
        return {"error": f"Analytics failed: {str(e)}"}


async def _tool_get_business_impact(user_id: str) -> dict:
    """Get business impact metrics (core KPIs only)."""
    try:
        from app.services.analytics import DashboardService
        data = await DashboardService.business_impact(user_id)
        return {
            "total_savings": data.get("totalSavings", 0),
            "hours_saved": data.get("hoursSaved", 0),
            "manual_work_reduced": data.get("manualEliminatedPct", 0),
            "annual_projection": data.get("annualProjection", 0),
        }
    except Exception as e:
        return {"error": f"Business impact failed: {str(e)}"}


async def _tool_list_suppliers(user_id: str) -> dict:
    """List user's Supplier Hub suppliers with full details."""
    try:
        from app.services.supplier_hub import SupplierHubService
        suppliers = await SupplierHubService.list_suppliers(user_id)

        if not suppliers:
            return {"count": 0, "suppliers": [], "message": "No suppliers in your Supplier Hub yet. Add suppliers from the Supplier Hub page."}

        supplier_list = []
        for s in suppliers[:10]:
            entry: dict[str, Any] = {
                "name": s.get("name", ""),
                "city": s.get("city", ""),
                "reliability": s.get("reliabilityScore"),
                "delivery_days": s.get("deliveryDays"),
                "categories": s.get("preferredCategories", []),
            }
            supplier_list.append(entry)

        # Sort by reliability score (highest first) for "best supplier" queries
        supplier_list.sort(key=lambda x: x.get("reliability") or 0, reverse=True)

        return {
            "count": len(supplier_list),
            "suppliers": supplier_list,
            "_note": "Rank by reliability (0-10). Use city for proximity. For contact/payment details, the user must ask.",
        }
    except Exception as e:
        return {"error": f"Supplier Hub failed: {str(e)}"}


async def _tool_get_basket_history(args: dict, user_id: str) -> dict:
    """Get recent basket optimization history from MongoDB."""
    try:
        from bson import ObjectId
        from app.database import get_db

        db = get_db()
        limit = min(args.get("limit", 5), 10)
        query: dict = {"userId": ObjectId(user_id)}
        category = args.get("category")
        if category:
            query["category"] = category

        cursor = db.baskethistories.find(query).sort("createdAt", -1).limit(limit)
        docs = await cursor.to_list(length=limit)

        if not docs:
            return {"message": "No basket history found. The user hasn't optimized any baskets yet.", "baskets": []}

        baskets = []
        for d in docs:
            baskets.append({
                "category": d.get("category", ""),
                "item_count": d.get("itemCount", 0),
                "items": [
                    {
                        "product": i.get("query", ""),
                        "quantity": i.get("quantity", 1),
                        "supplier": i.get("supplier", ""),
                        "price": i.get("price", 0),
                    }
                    for i in d.get("items", [])[:10]
                ],
                "total_cost": d.get("splitTotal", 0),
                "savings": d.get("estimatedSavings", 0),
                "suppliers_used": d.get("supplierCount", 0),
                "plan": d.get("recommendedPlan", ""),
                "date": d.get("createdAt", "").isoformat() if hasattr(d.get("createdAt", ""), "isoformat") else str(d.get("createdAt", "")),
            })

        return {"total": len(baskets), "baskets": baskets}
    except Exception as e:
        return {"error": f"Basket history failed: {str(e)}"}


async def _tool_get_history(args: dict, user_id: str) -> dict:
    """Get recent search history (compact, capped at 5)."""
    try:
        from app.services.analytics import HistoryService
        limit = min(args.get("limit", 5), 10)
        data = await HistoryService.paginated(user_id, page=1, limit=limit)
        return {
            "total": data.get("total", 0),
            "recent": [
                {
                    "query": i.get("query", ""),
                    "category": i.get("category", ""),
                    "supplier": i.get("recommendedSupplier", ""),
                }
                for i in data.get("items", [])[:5]
            ]
        }
    except Exception as e:
        return {"error": f"History failed: {str(e)}"}
