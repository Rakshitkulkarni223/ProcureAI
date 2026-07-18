"""
Supplier Hub Provider Adapter — wraps Supplier Hub supplier + product data
into the standard Product dict format used by the search/comparison pipeline.

This is completely independent from MockProviderAdapter and does not modify it.
"""
from __future__ import annotations

import asyncio
import re
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.config import CATALOG


def _tokenize(text: str) -> list[str]:
    try:
        cleaned = re.sub(r"[^a-z0-9\s]", " ", (text or "").lower())
        return [t for t in cleaned.split() if len(t) > 1]
    except Exception:
        return []


def _score_product(product_name: str, brand: str, query_tokens: list[str]) -> float:
    try:
        haystack = " ".join([product_name or "", brand or ""]).lower()
        score = 0.0
        for tok in query_tokens:
            if tok in (product_name or "").lower():
                score += 3
            elif tok in haystack:
                score += 1.5
        return score
    except Exception:
        return 0.0


class SupplierHubProviderAdapter:
    """Adapts a Supplier Hub supplier + its products into the standard Product format."""

    def __init__(self, supplier_doc: dict, product_docs: list[dict]):
        try:
            self.supplier = supplier_doc
            self.name: str = supplier_doc.get("name", "Unknown Supplier")
            self.products = product_docs or []
        except Exception:
            self.supplier = {}
            self.name = "Unknown Supplier"
            self.products = []

    async def search(self, query: str, category: str) -> list[dict]:
        try:
            await asyncio.sleep(0.02 + __import__("random").random() * 0.06)
            query_tokens = _tokenize(query)
            if not query_tokens:
                return []

            results: list[dict] = []
            s = self.supplier
            supplier_name = s.get("name", "Unknown Supplier")
            supplier_id = str(s.get("_id", ""))
            delivery_days = max(0, s.get("deliveryDays") or 3)
            reliability = s.get("reliabilityScore")
            # Scale reliability (0-10) to rating (0-5)
            if reliability is not None:
                rating = round(max(0, min(5, reliability / 2.0)) * 10) / 10
            else:
                rating = 4.0

            delivery_date = datetime.now(timezone.utc) + timedelta(days=delivery_days)

            for prod in self.products:
                try:
                    prod_name = prod.get("productName", "")
                    prod_brand = prod.get("brand") or ""
                    prod_category = prod.get("category") or ""
                    catalog_id = prod.get("catalogId")

                    # Score against query — use catalog keywords if available for better matching
                    score = _score_product(prod_name, prod_brand, query_tokens)
                    if score <= 0 and catalog_id:
                        # Try matching against catalog keywords across all categories
                        for cat_entries in CATALOG.values():
                            for entry in cat_entries:
                                if entry.get("id") == catalog_id:
                                    keywords = entry.get("keywords", [])
                                    kw_text = " ".join(keywords)
                                    for tok in query_tokens:
                                        if tok in kw_text:
                                            score += 1.5
                                    break
                            if score > 0:
                                break
                    if score <= 0:
                        continue

                    price = prod.get("currentPrice")
                    if price is None or price <= 0:
                        continue

                    price = round(price)
                    availability_str = (prod.get("availability") or "").lower()
                    availability = availability_str not in ("out of stock", "unavailable", "no", "false", "0")

                    product_id = f"sh-{supplier_id}-{str(prod.get('_id', ''))}"

                    results.append({
                        "id": product_id,
                        "provider": supplier_name,
                        "title": prod_name,
                        "brand": prod_brand or "Generic",
                        "category": category,
                        "image": "",
                        "price": price,
                        "originalPrice": price,
                        "discount": 0,
                        "rating": rating,
                        "reviews": 0,
                        "availability": availability,
                        "deliveryDays": delivery_days,
                        "deliveryDate": delivery_date.isoformat(),
                        "warrantyMonths": None,
                        "returnPolicyDays": None,
                        "productUrl": "",
                        "supplierSource": "supplier_hub",
                    })
                except Exception:
                    continue

            return results
        except Exception as e:
            print(f"SupplierHubProviderAdapter[{self.name}] search failed: {e}")
            return []
