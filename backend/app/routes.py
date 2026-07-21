"""
All API routes. Mirrors the Express routes so the frontend API contract is
identical: every response is wrapped in {"success": true, "data": ...}.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from bson import ObjectId
from fastapi import APIRouter, Body, Depends, HTTPException, Query

from app.auth import get_current_user, hash_password, sign_token, verify_password
from app.database import get_db
from app.schemas import (
    BasketInput,
    CurrentBasketInput,
    LoginInput,
    PreferenceInput,
    RecommendationInput,
    RegisterInput,
    SearchInput,
)
from app.config import RECOMMENDATION_MODES, WEIGHT_PROFILES
from app.services.analytics import (
    CatalogService,
    DashboardService,
    HistoryService,
    PreferenceService,
)
from app.services.basket import BasketOptimizationService
from app.services.core import RecommendationService, SearchService

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def ok(data: Any, status_code: int = 200) -> dict:
    try:
        return {"success": True, "data": data}
    except Exception:
        return {"success": True, "data": data}


def _user_json(doc: dict) -> dict:
    """Convert a user MongoDB document to a safe JSON dict (no passwordHash)."""
    try:
        return {
            "id": str(doc["_id"]),
            "name": doc.get("name", ""),
            "email": doc.get("email", ""),
            "role": doc.get("role", "user"),
            "businessType": doc.get("businessType", "general"),
            "createdAt": doc["createdAt"].isoformat() if isinstance(doc.get("createdAt"), datetime) else str(doc.get("createdAt", "")),
            "updatedAt": doc["updatedAt"].isoformat() if isinstance(doc.get("updatedAt"), datetime) else str(doc.get("updatedAt", "")),
        }
    except Exception:
        return {"id": str(doc.get("_id", "")), "name": doc.get("name", ""), "email": doc.get("email", "")}


def _parse_date(val: Optional[str]) -> Optional[datetime]:
    try:
        if not val:
            return None
        dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
        return dt
    except Exception:
        return None


# ===================================================================
# Auth
# ===================================================================

@router.post("/auth/register", status_code=201)
async def register(body: RegisterInput):
    try:
        db = get_db()
        existing = await db.users.find_one({"email": body.email.lower().strip()})
        if existing:
            raise HTTPException(status_code=409, detail="An account with this email already exists")

        pw_hash = hash_password(body.password)
        now = datetime.utcnow()
        result = await db.users.insert_one({
            "name": body.name,
            "email": body.email.lower().strip(),
            "passwordHash": pw_hash,
            "role": "user",
            "businessType": body.businessType or "general",
            "createdAt": now,
            "updatedAt": now,
        })
        user = await db.users.find_one({"_id": result.inserted_id})

        await db.userpreferences.find_one_and_update(
            {"userId": user["_id"]},
            {"$set": {"businessType": body.businessType or "general", "updatedAt": now},
             "$setOnInsert": {"createdAt": now}},
            upsert=True,
        )

        token = sign_token({
            "sub": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user.get("role", "user"),
        })
        return ok({"token": token, "user": _user_json(user)})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/login")
async def login(body: LoginInput):
    try:
        db = get_db()
        user = await db.users.find_one({"email": body.email.lower().strip()})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not verify_password(body.password, user.get("passwordHash", "")):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        token = sign_token({
            "sub": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user.get("role", "user"),
        })
        return ok({"token": token, "user": _user_json(user)})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    try:
        db = get_db()
        doc = await db.users.find_one({"_id": ObjectId(user["sub"])})
        if not doc:
            raise HTTPException(status_code=404, detail="User not found")
        return ok(_user_json(doc))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/logout")
async def logout(user: dict = Depends(get_current_user)):
    try:
        return ok({"message": "Logged out"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===================================================================
# Catalog
# ===================================================================

@router.get("/categories")
async def list_categories(user: dict = Depends(get_current_user)):
    try:
        data = await CatalogService.list_categories()
        return ok(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories/{cat_id}/suppliers")
async def suppliers_for_category(cat_id: str, user: dict = Depends(get_current_user)):
    try:
        data = await CatalogService.suppliers_for_category(cat_id)
        return ok(data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/suppliers")
async def list_suppliers(user: dict = Depends(get_current_user)):
    try:
        data = await CatalogService.list_suppliers()
        return ok(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/suppliers/{supplier_id}")
async def toggle_supplier(supplier_id: str, body: dict = Body(default={}), user: dict = Depends(get_current_user)):
    try:
        enabled = body.get("enabled")
        data = await CatalogService.toggle_supplier(supplier_id, enabled)
        return ok(data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===================================================================
# Search
# ===================================================================

@router.post("/search")
async def search(body: SearchInput, user: dict = Depends(get_current_user)):
    try:
        req = body.model_dump()
        req["filters"] = body.filters.model_dump() if body.filters else None
        result = await SearchService.search(user["sub"], req)

        # Persist search history (fire and forget)
        if result["count"] > 0:
            try:
                db = get_db()
                rec = result.get("recommendation")
                doc = {
                    "userId": ObjectId(user["sub"]),
                    "query": result["query"],
                    "category": result["category"],
                    "suppliers": req.get("suppliers", []),
                    "resultCount": result["count"],
                    "recommendedSupplier": rec["supplier"] if rec else "",
                    "bestPrice": rec["product"]["price"] if rec else 0,
                    "estimatedSavings": rec["estimatedSavings"] if rec else 0,
                    "weightProfile": req.get("recommendationMode") or req.get("weightProfile") or "balanced",
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow(),
                }
                await db.searchhistories.insert_one(doc)
                print(f"[INFO] Search history saved: query='{result['query']}' category='{result['category']}' count={result['count']}")
            except Exception as he:
                print(f"[WARN] Failed to persist search history: {he}")

        return ok(result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommendations")
async def recommend(body: RecommendationInput, user: dict = Depends(get_current_user)):
    try:
        mode = body.recommendationMode
        if mode and mode != "balanced":
            recommendation = RecommendationService.recommend_by_mode(body.products, mode)
        else:
            recommendation = RecommendationService.recommend(body.products, body.weightProfile or "balanced")

        # Generate LLM-powered AI explanation
        if recommendation:
            try:
                from app.services.llm_advisor import generate_explanation
                ai_text = await generate_explanation(recommendation, body.products, mode or "balanced")
                if ai_text:
                    recommendation["aiExplanation"] = ai_text
            except Exception as llm_err:
                print(f"[WARN] LLM advisor skipped: {llm_err}")

        return ok({"recommendation": recommendation})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendation-modes")
async def recommendation_modes(user: dict = Depends(get_current_user)):
    try:
        modes = [
            {"key": v["key"], "label": v["label"], "description": v["description"]}
            for v in RECOMMENDATION_MODES.values()
        ]
        return ok(modes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===================================================================
# Basket
# ===================================================================

@router.get("/basket/current")
async def get_current_basket(
    category: str = Query(..., min_length=1),
    user: dict = Depends(get_current_user),
):
    try:
        db = get_db()
        doc = await db.currentbaskets.find_one({
            "userId": ObjectId(user["sub"]),
            "category": category,
        })
        return ok({
            "category": category,
            "items": doc.get("items", []) if doc else [],
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/basket/current")
async def update_current_basket(body: CurrentBasketInput, user: dict = Depends(get_current_user)):
    try:
        db = get_db()
        items = [
            {"query": item.query.strip(), "quantity": item.quantity or 1}
            for item in body.items if item.query.strip()
        ]
        await db.currentbaskets.update_one(
            {"userId": ObjectId(user["sub"]), "category": body.category},
            {"$set": {"items": items, "updatedAt": datetime.utcnow()}},
            upsert=True,
        )
        return ok({"category": body.category, "items": items})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/basket/optimize")
async def basket_optimize(body: BasketInput, user: dict = Depends(get_current_user)):
    try:
        req = {
            "category": body.category,
            "suppliers": body.suppliers,
            "items": [{"query": i.query, "quantity": i.quantity or 1} for i in body.items],
            "weightProfile": body.weightProfile or "balanced",
            "consolidationPenalty": body.consolidationPenalty or 0,
            "recommendationMode": body.recommendationMode or "balanced",
            "includeSupplierHub": body.includeSupplierHub if body.includeSupplierHub is not None else True,
            "userCity": body.userCity or "",
        }
        result = await BasketOptimizationService.optimize(user["sub"], req)

        # Persist basket history (fire and forget)
        try:
            db = get_db()
            now = datetime.utcnow()
            fulfilled = [i for i in result.get("items", []) if i.get("supplier")]
            if fulfilled:
                await db.baskethistories.insert_one({
                    "userId": ObjectId(user["sub"]),
                    "category": body.category,
                    "suppliers": body.suppliers,
                    "itemCount": len(body.items),
                    "items": [{"query": i["query"], "quantity": i["quantity"], "supplier": i["supplier"], "price": i["price"]} for i in fulfilled],
                    "splitTotal": result.get("splitTotal", 0),
                    "baselineTotal": result.get("baseline", {}).get("total", 0),
                    "estimatedSavings": result.get("estimatedSavings", 0),
                    "supplierCount": result.get("supplierCount", 0),
                    "recommendedPlan": result.get("recommendedPlan", "split"),
                    "weightProfile": body.recommendationMode or body.weightProfile or "balanced",
                    "createdAt": now,
                    "updatedAt": now,
                })
                # Record one searchhistories entry for the whole basket so it counts as 1 search in dashboard
                basket_query = f"Basket ({len(fulfilled)} items)"
                top_item = min(fulfilled, key=lambda x: x.get("price", 0))
                total_savings = result.get("estimatedSavings", 0)
                await db.searchhistories.insert_one({
                    "userId": ObjectId(user["sub"]),
                    "query": basket_query,
                    "category": body.category,
                    "suppliers": body.suppliers,
                    "resultCount": len(fulfilled),
                    "recommendedSupplier": top_item.get("supplier", ""),
                    "bestPrice": result.get("splitTotal", 0),
                    "estimatedSavings": total_savings,
                    "weightProfile": body.recommendationMode or body.weightProfile or "balanced",
                    "isBasket": True,
                    "createdAt": now,
                    "updatedAt": now,
                })
                print(f"[INFO] Basket search history saved: 1 entry ({len(fulfilled)} items) for category='{body.category}'")
        except Exception as he:
            print(f"[WARN] Failed to persist basket history: {he}")

        return ok(result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/basket/history")
async def basket_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: dict = Depends(get_current_user),
):
    try:
        from app.services.analytics import _doc_to_json
        db = get_db()
        uid = ObjectId(user["sub"])
        skip = (page - 1) * limit
        cursor = db.baskethistories.find({"userId": uid}).sort("createdAt", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        total = await db.baskethistories.count_documents({"userId": uid})
        items = [_doc_to_json(d) for d in docs]
        total_pages = max(1, -(-total // limit))
        return ok({"items": items, "total": total, "page": page, "limit": limit, "totalPages": total_pages})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===================================================================
# Preferences
# ===================================================================

@router.get("/preferences")
async def get_preferences(user: dict = Depends(get_current_user)):
    try:
        data = await PreferenceService.get(user["sub"])
        return ok(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/preferences")
async def update_preferences(body: PreferenceInput, user: dict = Depends(get_current_user)):
    try:
        data = await PreferenceService.update(user["sub"], body.model_dump(exclude_none=True))
        return ok(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/weight-profiles")
async def weight_profiles(user: dict = Depends(get_current_user)):
    try:
        return ok(PreferenceService.weight_profiles())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cities")
async def list_cities(user: dict = Depends(get_current_user)):
    try:
        from app.config import AVAILABLE_CITIES, DEFAULT_USER_CITY
        return ok({"cities": AVAILABLE_CITIES, "default": DEFAULT_USER_CITY})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===================================================================
# History
# ===================================================================

@router.get("/history")
async def list_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: dict = Depends(get_current_user),
):
    try:
        data = await HistoryService.paginated(user["sub"], page, limit)
        return ok(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/history/{entry_id}")
async def remove_history(entry_id: str, user: dict = Depends(get_current_user)):
    try:
        await HistoryService.remove(user["sub"], entry_id)
        return ok({"message": "Deleted"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===================================================================
# Dashboard / Analytics
# ===================================================================

@router.get("/dashboard")
async def dashboard_summary(
    user: dict = Depends(get_current_user),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
):
    try:
        f, t = _parse_date(from_date), _parse_date(to_date)
        if t:
            t = t.replace(hour=23, minute=59, second=59, microsecond=999999)
        data = await DashboardService.summary(user["sub"], f, t)
        return ok(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/spend")
async def analytics_spend(
    user: dict = Depends(get_current_user),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
):
    try:
        f, t = _parse_date(from_date), _parse_date(to_date)
        if t:
            t = t.replace(hour=23, minute=59, second=59, microsecond=999999)
        data = await DashboardService.spend(user["sub"], f, t)
        return ok(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/savings")
async def analytics_savings(
    user: dict = Depends(get_current_user),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
):
    try:
        f, t = _parse_date(from_date), _parse_date(to_date)
        if t:
            t = t.replace(hour=23, minute=59, second=59, microsecond=999999)
        data = await DashboardService.savings(user["sub"], f, t)
        return ok(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights")
async def insights(
    user: dict = Depends(get_current_user),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
):
    try:
        f, t = _parse_date(from_date), _parse_date(to_date)
        if t:
            t = t.replace(hour=23, minute=59, second=59, microsecond=999999)
        data = await DashboardService.insights(user["sub"], f, t)
        return ok(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/business-impact")
async def business_impact(
    user: dict = Depends(get_current_user),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
):
    try:
        f, t = _parse_date(from_date), _parse_date(to_date)
        if t:
            t = t.replace(hour=23, minute=59, second=59, microsecond=999999)
        data = await DashboardService.business_impact(user["sub"], f, t)
        return ok(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===================================================================
# Health (under /api prefix)
# ===================================================================

@router.get("/health")
async def api_health():
    try:
        return {"success": True, "status": "ok", "service": "procureai-api"}
    except Exception:
        return {"success": True, "status": "ok", "service": "procureai-api"}
