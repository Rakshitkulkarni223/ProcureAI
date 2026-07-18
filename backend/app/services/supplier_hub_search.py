"""
Supplier Hub Search Service — fetches Supplier Hub suppliers + their products
for a given user and category, and runs the adapter to produce Product dicts.

Completely independent from existing SearchService. Does not modify it.
"""
from __future__ import annotations

import asyncio
from typing import Optional

from bson import ObjectId

from app.database import get_db
from app.config import get_city_state
from app.services.supplier_hub_adapter import SupplierHubProviderAdapter


def _oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        raise ValueError("Invalid ID format")


class SupplierHubSearchService:
    """Gathers products from Supplier Hub suppliers for the search pipeline."""

    @staticmethod
    async def get_suppliers_for_category(user_id: str, category: str) -> list[dict]:
        """Return active Supplier Hub suppliers whose preferredCategories contains the category slug."""
        try:
            db = get_db()
            cursor = db.supplier_hub_suppliers.find({
                "userId": _oid(user_id),
                "active": True,
                "preferredCategories": category,
            }).sort("name", 1)
            docs = await cursor.to_list(length=500)
            return docs
        except Exception:
            return []

    @staticmethod
    async def get_all_suppliers(user_id: str) -> list[dict]:
        """Return all active Supplier Hub suppliers for a user (all categories)."""
        try:
            db = get_db()
            cursor = db.supplier_hub_suppliers.find({
                "userId": _oid(user_id),
                "active": True,
            }).sort("name", 1)
            docs = await cursor.to_list(length=500)
            return docs
        except Exception:
            return []

    @staticmethod
    async def get_products_for_supplier(supplier_id: ObjectId, category: Optional[str] = None) -> list[dict]:
        """Return products for a supplier, optionally filtered by category."""
        try:
            db = get_db()
            query: dict = {"supplierId": supplier_id}
            if category:
                # Include products where category matches OR is null/empty (supplier may serve multiple categories)
                query["$or"] = [
                    {"category": category},
                    {"category": None},
                    {"category": ""},
                ]
            cursor = db.supplier_hub_products.find(query).sort("createdAt", -1)
            docs = await cursor.to_list(length=500)
            return docs
        except Exception:
            return []

    @staticmethod
    async def gather(user_id: str, query: str, category: str, supplier_names: Optional[list[str]] = None, user_city: str = "") -> list[dict]:
        """
        Fetch Supplier Hub suppliers + products for the user/category,
        run adapters in parallel, and return merged Product dicts.
        """
        try:
            suppliers = await SupplierHubSearchService.get_suppliers_for_category(user_id, category)
            if not suppliers:
                return []

            # Filter by supplier names if provided
            if supplier_names:
                suppliers = [s for s in suppliers if s.get("name", "") in supplier_names]
            if not suppliers:
                return []

            # Filter to suppliers in the same state as the user's city
            if user_city:
                user_state = get_city_state(user_city)
                if user_state:
                    suppliers = [s for s in suppliers if (s.get("state") or "") == user_state]
                if not suppliers:
                    return []

            # Fetch products for each supplier in parallel
            product_tasks = [
                SupplierHubSearchService.get_products_for_supplier(s["_id"], category)
                for s in suppliers
            ]
            product_results = await asyncio.gather(*product_tasks, return_exceptions=True)

            # Build adapters
            adapters: list[SupplierHubProviderAdapter] = []
            for i, supplier in enumerate(suppliers):
                products = product_results[i] if isinstance(product_results[i], list) else []
                if products:
                    adapters.append(SupplierHubProviderAdapter(supplier, products, user_city=user_city))

            if not adapters:
                return []

            # Run all adapters in parallel
            results = await asyncio.gather(
                *[a.search(query, category) for a in adapters],
                return_exceptions=True,
            )

            merged: list[dict] = []
            for i, r in enumerate(results):
                if isinstance(r, list):
                    merged.extend(r)
                else:
                    print(f'SupplierHub adapter "{adapters[i].name}" failed: {r}')

            return merged
        except Exception as e:
            print(f"SupplierHubSearchService.gather failed: {e}")
            return []
