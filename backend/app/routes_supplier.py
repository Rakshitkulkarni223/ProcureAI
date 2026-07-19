"""
Supplier Hub API routes — completely independent from existing routes.
All endpoints under /api/supplier-hub prefix. Auth required for all.
"""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user
from app.schemas_supplier import (
    SupplierHubCreate,
    SupplierHubUpdate,
    SupplierProductCreate,
    SupplierProductUpdate,
)
from app.services.supplier_hub import SupplierHubService
from app.services.supplier_hub_search import SupplierHubSearchService

router = APIRouter(prefix="/supplier-hub")


def ok(data: Any) -> dict:
    return {"success": True, "data": data}


# ---------------------------------------------------------------------------
# Suppliers — static routes (MUST come before parameterized {supplier_id})
# ---------------------------------------------------------------------------

@router.get("/suppliers/cities")
async def get_supplier_cities(user: dict = Depends(get_current_user)):
    try:
        docs = await SupplierHubSearchService.get_all_suppliers(user["sub"])
        cities = set()
        for d in docs:
            city = d.get("city")
            state = d.get("state")
            if city:
                cities.add(f"{city}, {state}" if state else city)
        return ok(sorted(list(cities)))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/suppliers/by-category/{category}")
async def suppliers_by_category(category: str, user: dict = Depends(get_current_user)):
    try:
        docs = await SupplierHubSearchService.get_suppliers_for_category(user["sub"], category)
        data = [
            {
                "id": str(d.get("_id", "")),
                "name": d.get("name", ""),
                "supplierType": d.get("supplierType", ""),
                "city": d.get("city"),
                "state": d.get("state"),
                "deliveryDays": d.get("deliveryDays"),
                "creditPeriod": d.get("creditPeriod"),
                "reliabilityScore": d.get("reliabilityScore"),
                "preferredCategories": d.get("preferredCategories", []),
                "active": d.get("active", True),
            }
            for d in docs
        ]
        return ok(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Suppliers CRUD
# ---------------------------------------------------------------------------

@router.get("/suppliers")
async def list_suppliers(user: dict = Depends(get_current_user)):
    try:
        data = await SupplierHubService.list_suppliers(user["sub"])
        return ok(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suppliers")
async def create_supplier(body: SupplierHubCreate, user: dict = Depends(get_current_user)):
    try:
        data = await SupplierHubService.create_supplier(user["sub"], body.model_dump())
        return ok(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/suppliers/{supplier_id}")
async def get_supplier(supplier_id: str, user: dict = Depends(get_current_user)):
    try:
        data = await SupplierHubService.get_supplier(user["sub"], supplier_id)
        if not data:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return ok(data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/suppliers/{supplier_id}")
async def update_supplier(supplier_id: str, body: SupplierHubUpdate, user: dict = Depends(get_current_user)):
    try:
        data = await SupplierHubService.update_supplier(user["sub"], supplier_id, body.model_dump(exclude_unset=True))
        if not data:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return ok(data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: str, user: dict = Depends(get_current_user)):
    try:
        deleted = await SupplierHubService.delete_supplier(user["sub"], supplier_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return ok({"deleted": True})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Supplier Products CRUD
# ---------------------------------------------------------------------------

@router.get("/suppliers/{supplier_id}/products")
async def list_products(supplier_id: str, user: dict = Depends(get_current_user)):
    try:
        data = await SupplierHubService.list_products(user["sub"], supplier_id)
        return ok(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suppliers/{supplier_id}/products")
async def create_product(supplier_id: str, body: SupplierProductCreate, user: dict = Depends(get_current_user)):
    try:
        data = await SupplierHubService.create_product(user["sub"], supplier_id, body.model_dump())
        if not data:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return ok(data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/suppliers/{supplier_id}/products/{product_id}")
async def update_product(supplier_id: str, product_id: str, body: SupplierProductUpdate, user: dict = Depends(get_current_user)):
    try:
        data = await SupplierHubService.update_product(user["sub"], supplier_id, product_id, body.model_dump(exclude_unset=True))
        if not data:
            raise HTTPException(status_code=404, detail="Product not found")
        return ok(data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/suppliers/{supplier_id}/products/{product_id}")
async def delete_product(supplier_id: str, product_id: str, user: dict = Depends(get_current_user)):
    try:
        deleted = await SupplierHubService.delete_product(user["sub"], supplier_id, product_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Product not found")
        return ok({"deleted": True})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Intelligence & Insights
# ---------------------------------------------------------------------------

@router.get("/intelligence")
async def get_intelligence(user: dict = Depends(get_current_user)):
    try:
        data = await SupplierHubService.get_intelligence(user["sub"])
        return ok(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights")
async def get_insights(user: dict = Depends(get_current_user)):
    try:
        data = await SupplierHubService.get_insights(user["sub"])
        return ok(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
