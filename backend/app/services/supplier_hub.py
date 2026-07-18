"""
Supplier Hub service — completely independent from existing services.
Uses new MongoDB collections: supplier_hub_suppliers, supplier_hub_products.
"""
from datetime import datetime
from typing import Any, Optional

from bson import ObjectId

from app.database import get_db


def _oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        raise ValueError("Invalid ID format")


def _supplier_to_json(doc: dict) -> dict:
    try:
        return {
            "id": str(doc["_id"]),
            "userId": str(doc.get("userId", "")),
            "name": doc.get("name", ""),
            "supplierType": doc.get("supplierType", ""),
            "businessName": doc.get("businessName"),
            "gstNumber": doc.get("gstNumber"),
            "contactPerson": doc.get("contactPerson"),
            "phone": doc.get("phone"),
            "email": doc.get("email"),
            "address": doc.get("address"),
            "city": doc.get("city"),
            "state": doc.get("state"),
            "country": doc.get("country"),
            "deliveryDays": doc.get("deliveryDays"),
            "creditPeriod": doc.get("creditPeriod"),
            "minimumOrderQuantity": doc.get("minimumOrderQuantity"),
            "deliveryCharges": doc.get("deliveryCharges"),
            "paymentTerms": doc.get("paymentTerms"),
            "reliabilityScore": doc.get("reliabilityScore"),
            "preferredCategories": doc.get("preferredCategories", []),
            "notes": doc.get("notes"),
            "active": doc.get("active", True),
            "createdAt": doc["createdAt"].isoformat() if isinstance(doc.get("createdAt"), datetime) else str(doc.get("createdAt", "")),
            "updatedAt": doc["updatedAt"].isoformat() if isinstance(doc.get("updatedAt"), datetime) else str(doc.get("updatedAt", "")),
        }
    except Exception:
        return {}


def _product_to_json(doc: dict) -> dict:
    try:
        return {
            "id": str(doc["_id"]),
            "supplierId": str(doc.get("supplierId", "")),
            "productName": doc.get("productName", ""),
            "brand": doc.get("brand"),
            "category": doc.get("category"),
            "unit": doc.get("unit"),
            "currentPrice": doc.get("currentPrice"),
            "moq": doc.get("moq"),
            "availability": doc.get("availability"),
            "catalogId": doc.get("catalogId"),
            "notes": doc.get("notes"),
            "createdAt": doc["createdAt"].isoformat() if isinstance(doc.get("createdAt"), datetime) else str(doc.get("createdAt", "")),
            "updatedAt": doc["updatedAt"].isoformat() if isinstance(doc.get("updatedAt"), datetime) else str(doc.get("updatedAt", "")),
        }
    except Exception:
        return {}


class SupplierHubService:
    """All methods are scoped by user_id for security."""

    # ------------------------------------------------------------------
    # Suppliers
    # ------------------------------------------------------------------

    @staticmethod
    async def list_suppliers(user_id: str) -> list[dict]:
        try:
            db = get_db()
            cursor = db.supplier_hub_suppliers.find({"userId": _oid(user_id)}).sort("createdAt", -1)
            docs = await cursor.to_list(length=500)
            return [_supplier_to_json(d) for d in docs]
        except Exception:
            raise

    @staticmethod
    async def get_supplier(user_id: str, supplier_id: str) -> Optional[dict]:
        try:
            db = get_db()
            doc = await db.supplier_hub_suppliers.find_one({
                "_id": _oid(supplier_id),
                "userId": _oid(user_id),
            })
            return _supplier_to_json(doc) if doc else None
        except Exception:
            raise

    @staticmethod
    async def create_supplier(user_id: str, data: dict) -> dict:
        try:
            db = get_db()
            now = datetime.utcnow()
            doc = {
                "userId": _oid(user_id),
                "name": data.get("name", ""),
                "supplierType": data.get("supplierType", ""),
                "businessName": data.get("businessName"),
                "gstNumber": data.get("gstNumber"),
                "contactPerson": data.get("contactPerson"),
                "phone": data.get("phone"),
                "email": data.get("email"),
                "address": data.get("address"),
                "city": data.get("city"),
                "state": data.get("state"),
                "country": data.get("country"),
                "deliveryDays": data.get("deliveryDays"),
                "creditPeriod": data.get("creditPeriod"),
                "minimumOrderQuantity": data.get("minimumOrderQuantity"),
                "deliveryCharges": data.get("deliveryCharges"),
                "paymentTerms": data.get("paymentTerms"),
                "reliabilityScore": data.get("reliabilityScore"),
                "preferredCategories": data.get("preferredCategories", []),
                "notes": data.get("notes"),
                "active": data.get("active", True),
                "createdAt": now,
                "updatedAt": now,
            }
            result = await db.supplier_hub_suppliers.insert_one(doc)
            doc["_id"] = result.inserted_id
            return _supplier_to_json(doc)
        except Exception:
            raise

    @staticmethod
    async def update_supplier(user_id: str, supplier_id: str, data: dict) -> Optional[dict]:
        try:
            db = get_db()
            clean = {k: v for k, v in data.items() if v is not None}
            if not clean:
                doc = await db.supplier_hub_suppliers.find_one({
                    "_id": _oid(supplier_id), "userId": _oid(user_id)
                })
                return _supplier_to_json(doc) if doc else None
            clean["updatedAt"] = datetime.utcnow()
            doc = await db.supplier_hub_suppliers.find_one_and_update(
                {"_id": _oid(supplier_id), "userId": _oid(user_id)},
                {"$set": clean},
                return_document=True,
            )
            return _supplier_to_json(doc) if doc else None
        except Exception:
            raise

    @staticmethod
    async def delete_supplier(user_id: str, supplier_id: str) -> bool:
        try:
            db = get_db()
            result = await db.supplier_hub_suppliers.delete_one({
                "_id": _oid(supplier_id), "userId": _oid(user_id)
            })
            if result.deleted_count:
                await db.supplier_hub_products.delete_many({"supplierId": _oid(supplier_id)})
            return result.deleted_count > 0
        except Exception:
            raise

    # ------------------------------------------------------------------
    # Products
    # ------------------------------------------------------------------

    @staticmethod
    async def list_products(user_id: str, supplier_id: str) -> list[dict]:
        try:
            db = get_db()
            supplier = await db.supplier_hub_suppliers.find_one({
                "_id": _oid(supplier_id), "userId": _oid(user_id)
            })
            if not supplier:
                return []
            cursor = db.supplier_hub_products.find({"supplierId": _oid(supplier_id)}).sort("createdAt", -1)
            docs = await cursor.to_list(length=500)
            return [_product_to_json(d) for d in docs]
        except Exception:
            raise

    @staticmethod
    async def create_product(user_id: str, supplier_id: str, data: dict) -> Optional[dict]:
        try:
            db = get_db()
            supplier = await db.supplier_hub_suppliers.find_one({
                "_id": _oid(supplier_id), "userId": _oid(user_id)
            })
            if not supplier:
                return None
            now = datetime.utcnow()
            doc = {
                "supplierId": _oid(supplier_id),
                "productName": data.get("productName", ""),
                "brand": data.get("brand"),
                "category": data.get("category"),
                "unit": data.get("unit"),
                "currentPrice": data.get("currentPrice"),
                "moq": data.get("moq"),
                "availability": data.get("availability"),
                "catalogId": data.get("catalogId"),
                "notes": data.get("notes"),
                "createdAt": now,
                "updatedAt": now,
            }
            result = await db.supplier_hub_products.insert_one(doc)
            doc["_id"] = result.inserted_id
            return _product_to_json(doc)
        except Exception:
            raise

    @staticmethod
    async def update_product(user_id: str, supplier_id: str, product_id: str, data: dict) -> Optional[dict]:
        try:
            db = get_db()
            supplier = await db.supplier_hub_suppliers.find_one({
                "_id": _oid(supplier_id), "userId": _oid(user_id)
            })
            if not supplier:
                return None
            clean = {k: v for k, v in data.items() if v is not None}
            if not clean:
                doc = await db.supplier_hub_products.find_one({"_id": _oid(product_id)})
                return _product_to_json(doc) if doc else None
            clean["updatedAt"] = datetime.utcnow()
            doc = await db.supplier_hub_products.find_one_and_update(
                {"_id": _oid(product_id), "supplierId": _oid(supplier_id)},
                {"$set": clean},
                return_document=True,
            )
            return _product_to_json(doc) if doc else None
        except Exception:
            raise

    @staticmethod
    async def delete_product(user_id: str, supplier_id: str, product_id: str) -> bool:
        try:
            db = get_db()
            supplier = await db.supplier_hub_suppliers.find_one({
                "_id": _oid(supplier_id), "userId": _oid(user_id)
            })
            if not supplier:
                return False
            result = await db.supplier_hub_products.delete_one({
                "_id": _oid(product_id), "supplierId": _oid(supplier_id)
            })
            return result.deleted_count > 0
        except Exception:
            raise

    # ------------------------------------------------------------------
    # Intelligence & Insights
    # ------------------------------------------------------------------

    @staticmethod
    async def get_intelligence(user_id: str) -> dict:
        try:
            db = get_db()
            suppliers = await db.supplier_hub_suppliers.find({"userId": _oid(user_id)}).to_list(length=500)

            total = len(suppliers)
            active = sum(1 for s in suppliers if s.get("active", True))
            inactive = total - active

            type_counts: dict[str, int] = {}
            category_counts: dict[str, int] = {}
            credit_periods: list[int] = []
            reliability_scores: list[float] = []

            for s in suppliers:
                stype = s.get("supplierType", "unknown")
                type_counts[stype] = type_counts.get(stype, 0) + 1
                for cat in s.get("preferredCategories", []):
                    category_counts[cat] = category_counts.get(cat, 0) + 1
                cp = s.get("creditPeriod")
                if cp is not None:
                    credit_periods.append(cp)
                rs = s.get("reliabilityScore")
                if rs is not None:
                    reliability_scores.append(rs)

            avg_credit = round(sum(credit_periods) / len(credit_periods), 1) if credit_periods else 0
            avg_reliability = round(sum(reliability_scores) / len(reliability_scores), 1) if reliability_scores else 0

            return {
                "totalSuppliers": total,
                "activeSuppliers": active,
                "inactiveSuppliers": inactive,
                "supplierTypes": type_counts,
                "preferredCategories": category_counts,
                "avgCreditPeriod": avg_credit,
                "avgReliability": avg_reliability,
            }
        except Exception:
            raise

    @staticmethod
    async def get_insights(user_id: str) -> list[str]:
        try:
            db = get_db()
            suppliers = await db.supplier_hub_suppliers.find({"userId": _oid(user_id)}).to_list(length=500)
            insights: list[str] = []

            if not suppliers:
                return ["No suppliers yet. Add your first supplier to start building your procurement network."]

            total = len(suppliers)

            # Top supplier type
            type_counts: dict[str, int] = {}
            for s in suppliers:
                stype = s.get("supplierType", "unknown")
                type_counts[stype] = type_counts.get(stype, 0) + 1
            if type_counts:
                top_type = max(type_counts, key=type_counts.get)
                top_type_pct = round(type_counts[top_type] / total * 100)
                insights.append(f"{top_type.replace('_', ' ').title()} suppliers account for {top_type_pct}% of your network.")

            # Top category
            category_counts: dict[str, int] = {}
            for s in suppliers:
                for cat in s.get("preferredCategories", []):
                    category_counts[cat] = category_counts.get(cat, 0) + 1
            if category_counts:
                top_cat = max(category_counts, key=category_counts.get)
                insights.append(f"Most suppliers belong to the {top_cat} category.")

            # Credit period
            credit_periods = [s.get("creditPeriod") for s in suppliers if s.get("creditPeriod") is not None]
            if credit_periods:
                common_credit = max(set(credit_periods), key=credit_periods.count)
                insights.append(f"Majority of suppliers provide {common_credit}-day credit.")

            # Active ratio
            active = sum(1 for s in suppliers if s.get("active", True))
            if active < total:
                insights.append(f"{total - active} supplier(s) are currently inactive.")

            # Channel diversity
            num_types = len(type_counts)
            insights.append(f"You have suppliers across {num_types} procurement channel{'s' if num_types != 1 else ''}.")

            # Reliability
            scores = [s.get("reliabilityScore") for s in suppliers if s.get("reliabilityScore") is not None]
            if scores:
                avg_r = round(sum(scores) / len(scores), 1)
                if avg_r >= 8:
                    insights.append(f"Strong supplier network — average reliability score is {avg_r}/10.")
                elif avg_r >= 6:
                    insights.append(f"Average reliability score is {avg_r}/10 — room for improvement.")
                else:
                    insights.append(f"Low average reliability ({avg_r}/10) — consider evaluating underperforming suppliers.")

            return insights
        except Exception:
            raise
