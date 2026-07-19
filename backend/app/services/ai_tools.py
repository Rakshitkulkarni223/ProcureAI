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
            "description": "Search and compare products across marketplace suppliers. Returns product listings with prices, delivery times, ratings, and AI recommendation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Product search query (e.g. 'laptop', 'basmati rice 5kg')"
                    },
                    "category": {
                        "type": "string",
                        "description": "Product category slug",
                        "enum": [c["slug"] for c in CATEGORIES]
                    },
                    "suppliers": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Optional list of specific suppliers to search. If omitted, searches all suppliers in the category."
                    },
                    "recommendation_mode": {
                        "type": "string",
                        "description": "Recommendation strategy",
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
            "description": "Get an AI-powered supplier recommendation for a specific product query. Includes scoring, reasons, and confidence level.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Product to get recommendation for"
                    },
                    "category": {
                        "type": "string",
                        "description": "Product category slug",
                        "enum": [c["slug"] for c in CATEGORIES]
                    },
                    "mode": {
                        "type": "string",
                        "description": "Recommendation mode",
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
            "description": "Optimize a multi-item procurement basket. Finds the best combination of suppliers to minimize cost while considering delivery and reliability.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "Product category slug",
                        "enum": [c["slug"] for c in CATEGORIES]
                    },
                    "items": {
                        "type": "array",
                        "description": "List of items to procure",
                        "items": {
                            "type": "object",
                            "properties": {
                                "query": {"type": "string", "description": "Product name"},
                                "quantity": {"type": "integer", "description": "Quantity needed", "default": 1}
                            },
                            "required": ["query"]
                        }
                    },
                    "mode": {
                        "type": "string",
                        "description": "Optimization strategy",
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
            "description": "Get procurement analytics: dashboard summary, spend breakdown, savings trends, or AI insights.",
            "parameters": {
                "type": "object",
                "properties": {
                    "metric": {
                        "type": "string",
                        "description": "Which analytics to retrieve",
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
            "description": "Get business impact metrics: total savings, hours saved, AI accuracy, efficiency score, and annual projections.",
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
            "description": "List the user's private Supplier Hub suppliers.",
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
            "name": "get_history",
            "description": "Get the user's recent procurement search history.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Number of recent entries to return (default 10)",
                        "default": 10
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
        products = result.get("results", [])[:8]  # Top 8
        summary_products = []
        for p in products:
            summary_products.append({
                "supplier": p.get("provider", ""),
                "title": p.get("title", "")[:80],
                "price": p.get("price", 0),
                "delivery_days": p.get("deliveryDays", 0),
                "rating": p.get("rating", 0),
                "discount": p.get("discount", 0),
                "availability": p.get("availability", False),
            })

        rec = result.get("recommendation")
        recommendation_summary = None
        if rec:
            recommendation_summary = {
                "supplier": rec.get("supplier", ""),
                "price": rec.get("product", {}).get("price", 0),
                "savings": rec.get("estimatedSavings", 0),
                "confidence": rec.get("confidence", 0),
                "reasons": rec.get("reasons", [])[:3],
                "mode": rec.get("recommendationMode", mode),
            }

        return {
            "query": query,
            "category": category,
            "total_results": result.get("count", 0),
            "products": summary_products,
            "recommendation": recommendation_summary,
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
            "reasons": rec.get("reasons", [])[:5],
            "ai_explanation": rec.get("aiExplanation", ""),
            "scoreboard": [
                {"supplier": s.get("supplier"), "price": s.get("price"), "score": s.get("score")}
                for s in rec.get("scoreboard", [])[:5]
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
        if not items:
            return {"error": "At least one item is required"}

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

        # Summarise
        fulfilled = [i for i in result.get("items", []) if i.get("supplier")]
        intel = result.get("intelligence", {})

        return {
            "plan": result.get("recommendedPlan", "split"),
            "total_cost": result.get("splitTotal", 0),
            "suppliers_used": result.get("supplierCount", 0),
            "savings": result.get("estimatedSavings", 0),
            "delivery": result.get("estimatedDelivery", ""),
            "items": [
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
        }
    except Exception as e:
        return {"error": f"Basket optimization failed: {str(e)}"}


async def _tool_get_analytics(args: dict, user_id: str) -> dict:
    """Get analytics data from DashboardService."""
    try:
        from app.services.analytics import DashboardService

        metric = args.get("metric", "summary")

        if metric == "summary":
            return await DashboardService.summary(user_id)
        elif metric == "spend":
            return await DashboardService.spend(user_id)
        elif metric == "savings":
            return await DashboardService.savings(user_id)
        elif metric == "insights":
            return await DashboardService.insights(user_id)
        else:
            return {"error": f"Unknown metric: {metric}"}
    except Exception as e:
        return {"error": f"Analytics failed: {str(e)}"}


async def _tool_get_business_impact(user_id: str) -> dict:
    """Get business impact metrics."""
    try:
        from app.services.analytics import DashboardService
        return await DashboardService.business_impact(user_id)
    except Exception as e:
        return {"error": f"Business impact failed: {str(e)}"}


async def _tool_list_suppliers(user_id: str) -> dict:
    """List user's Supplier Hub suppliers."""
    try:
        from app.services.supplier_hub import SupplierHubService
        suppliers = await SupplierHubService.list_suppliers(user_id)
        return {
            "count": len(suppliers),
            "suppliers": [
                {
                    "name": s.get("name", ""),
                    "type": s.get("supplierType", ""),
                    "city": s.get("city", ""),
                    "active": s.get("active", True),
                    "delivery_days": s.get("deliveryDays"),
                    "reliability": s.get("reliabilityScore"),
                }
                for s in suppliers[:20]
            ]
        }
    except Exception as e:
        return {"error": f"Supplier Hub failed: {str(e)}"}


async def _tool_get_history(args: dict, user_id: str) -> dict:
    """Get recent search history."""
    try:
        from app.services.analytics import HistoryService
        limit = min(args.get("limit", 10), 20)
        data = await HistoryService.paginated(user_id, page=1, limit=limit)
        return {
            "total": data.get("total", 0),
            "recent": [
                {
                    "query": i.get("query", ""),
                    "category": i.get("category", ""),
                    "supplier": i.get("recommendedSupplier", ""),
                    "price": i.get("bestPrice", 0),
                    "savings": i.get("estimatedSavings", 0),
                    "date": i.get("createdAt", ""),
                }
                for i in data.get("items", [])[:limit]
            ]
        }
    except Exception as e:
        return {"error": f"History failed: {str(e)}"}
