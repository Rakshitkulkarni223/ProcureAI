"""
Database seeder: categories, suppliers, demo user, sample search history.
Port of config/seed.ts.
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta

from bson import ObjectId

from app.auth import hash_password, verify_password
from app.config import (
    CATEGORIES,
    CATEGORY_SUPPLIERS,
    SUPPLIER_PROFILES,
    env,
)
from app.database import get_db
from app.services.core import SearchService


async def _seed_categories() -> None:
    try:
        db = get_db()
        for c in CATEGORIES:
            await db.categories.update_one(
                {"slug": c["slug"]},
                {"$set": {"name": c["name"], "icon": c["icon"], "description": c["description"], "enabled": True, "updatedAt": datetime.utcnow()},
                 "$setOnInsert": {"createdAt": datetime.utcnow()}},
                upsert=True,
            )
    except Exception as e:
        print(f"[WARN] seed categories failed: {e}")


async def _seed_suppliers() -> None:
    try:
        db = get_db()
        for category, suppliers in CATEGORY_SUPPLIERS.items():
            for name in suppliers:
                profile = SUPPLIER_PROFILES.get(name, {})
                await db.suppliers.update_one(
                    {"name": name, "category": category},
                    {"$set": {"color": profile.get("color", "#64748B"), "enabled": True, "updatedAt": datetime.utcnow()},
                     "$setOnInsert": {"createdAt": datetime.utcnow()}},
                    upsert=True,
                )
    except Exception as e:
        print(f"[WARN] seed suppliers failed: {e}")


async def _seed_user(email: str, password: str, name: str) -> dict:
    try:
        db = get_db()
        user = await db.users.find_one({"email": email.lower()})
        if not user:
            pw_hash = hash_password(password)
            result = await db.users.insert_one({
                "email": email.lower(),
                "passwordHash": pw_hash,
                "name": name,
                "role": "user",
                "businessType": "general",
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            })
            user = await db.users.find_one({"_id": result.inserted_id})
            print(f"[INFO] Seeded user: {email}")
        else:
            if not verify_password(password, user.get("passwordHash", "")):
                pw_hash = hash_password(password)
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"passwordHash": pw_hash, "updatedAt": datetime.utcnow()}},
                )
                print(f"[INFO] Updated password for {email}")

        await db.userpreferences.update_one(
            {"userId": user["_id"]},
            {"$setOnInsert": {"businessType": "general", "createdAt": datetime.utcnow(), "updatedAt": datetime.utcnow()}},
            upsert=True,
        )
        return user
    except Exception as e:
        print(f"[ERROR] Failed to seed user: {e}")
        raise


async def _seed_sample_history(user_id: ObjectId) -> None:
    try:
        db = get_db()
        existing = await db.searchhistories.count_documents({"userId": user_id})
        if existing > 0:
            return

        samples = [
            {"category": "fashion", "query": "Nike Running Shoes", "suppliers": ["Myntra", "Ajio", "Amazon", "Flipkart"], "daysAgo": 2},
            {"category": "fashion", "query": "Formal Suit Set", "suppliers": ["Myntra", "Ajio", "Amazon"], "daysAgo": 18},
            {"category": "electronics", "query": "Wireless Headphones", "suppliers": ["Amazon", "Flipkart", "Croma"], "daysAgo": 5},
            {"category": "grocery", "query": "Basmati Rice 25kg", "suppliers": ["Blinkit", "Zepto", "BigBasket", "JioMart"], "daysAgo": 9},
            {"category": "grocery", "query": "Premium Cooking Oil Pack", "suppliers": ["BigBasket", "JioMart", "Blinkit"], "daysAgo": 30},
            {"category": "grocery", "query": "Organic Spice Bundle", "suppliers": ["BigBasket", "Amazon", "JioMart"], "daysAgo": 52},
            {"category": "furniture", "query": "Ergonomic Office Chair", "suppliers": ["Pepperfry", "Urban Ladder", "IKEA"], "daysAgo": 14},
            {"category": "furniture", "query": "Standing Desk", "suppliers": ["IKEA", "Pepperfry", "Amazon"], "daysAgo": 38},
            {"category": "office", "query": "Printer Toner Cartridge", "suppliers": ["Amazon", "Flipkart"], "daysAgo": 21},
            {"category": "office", "query": "A4 Copier Paper Bulk", "suppliers": ["Amazon", "Flipkart"], "daysAgo": 45},
            {"category": "medical", "query": "First Aid Kit Professional", "suppliers": ["Apollo Pharmacy", "Netmeds", "Amazon"], "daysAgo": 33},
            {"category": "medical", "query": "Digital Blood Pressure Monitor", "suppliers": ["Apollo Pharmacy", "Amazon", "Flipkart"], "daysAgo": 55},
            {"category": "cleaning", "query": "Industrial Floor Cleaner", "suppliers": ["Amazon", "BigBasket", "JioMart"], "daysAgo": 41},
            {"category": "cleaning", "query": "Commercial Vacuum Cleaner", "suppliers": ["Amazon", "Flipkart", "Croma"], "daysAgo": 60},
        ]

        docs = []
        for s in samples:
            result = await SearchService.search_preview(s["query"], s["category"], s["suppliers"])
            date = datetime.utcnow() - timedelta(days=s["daysAgo"])
            docs.append({
                "userId": user_id,
                "query": s["query"],
                "category": s["category"],
                "suppliers": s["suppliers"],
                "resultCount": result["count"],
                "recommendedSupplier": result["recommendation"]["supplier"] if result.get("recommendation") else "",
                "bestPrice": result["recommendation"]["product"]["price"] if result.get("recommendation") else 0,
                "estimatedSavings": result["recommendation"]["estimatedSavings"] if result.get("recommendation") else 0,
                "weightProfile": "balanced",
                "createdAt": date,
                "updatedAt": date,
            })

        if docs:
            await db.searchhistories.insert_many(docs)
            print(f"[INFO] Seeded {len(docs)} sample searches for demo dashboard")
    except Exception as e:
        print(f"[WARN] seed sample history failed: {e}")


async def _seed_supplier_hub_demo(user_id: ObjectId) -> None:
    """Seed demo Supplier Hub suppliers and products for the demo user."""
    try:
        db = get_db()
        existing = await db.supplier_hub_suppliers.count_documents({"userId": user_id})
        if existing > 0:
            return

        now = datetime.utcnow()

        # --- Demo suppliers ---
        demo_suppliers = [
            {
                "name": "Sharma Wholesale Traders",
                "supplierType": "wholesaler",
                "businessName": "Sharma Wholesale Traders Pvt Ltd",
                "gstNumber": "27ABCDE1234F1Z5",
                "contactPerson": "Rajesh Sharma",
                "phone": "+91 98765 43210",
                "email": "rajesh@sharmawholesale.in",
                "address": "Plot 12, Industrial Area, Phase II",
                "city": "Pune",
                "state": "Maharashtra",
                "country": "India",
                "deliveryDays": 4,
                "creditPeriod": 30,
                "minimumOrderQuantity": 10,
                "deliveryCharges": 150,
                "paymentTerms": "Net 30",
                "reliabilityScore": 8.5,
                "preferredCategories": ["grocery", "cleaning"],
                "notes": "Reliable wholesale supplier for bulk grocery and cleaning supplies.",
                "active": True,
            },
            {
                "name": "TechDistribute India",
                "supplierType": "distributor",
                "businessName": "TechDistribute India LLP",
                "gstNumber": "29XYZAB5678G2H1",
                "contactPerson": "Priya Nair",
                "phone": "+91 90000 11111",
                "email": "priya@techdistribute.in",
                "address": "Tech Park, Whitefield Road",
                "city": "Bengaluru",
                "state": "Karnataka",
                "country": "India",
                "deliveryDays": 3,
                "creditPeriod": 15,
                "minimumOrderQuantity": 5,
                "deliveryCharges": 200,
                "paymentTerms": "Net 15",
                "reliabilityScore": 9.0,
                "preferredCategories": ["electronics", "office"],
                "notes": "Authorized distributor for major electronics brands.",
                "active": True,
            },
            {
                "name": "Anand FPO Collective",
                "supplierType": "farmer_fpo",
                "businessName": "Anand Farmer Producer Organisation",
                "gstNumber": "24FGHIJ9012K3L6",
                "contactPerson": "Anand Patel",
                "phone": "+91 80000 22222",
                "email": "anand@anandfpo.in",
                "address": "Village Anand, Taluka Borsad",
                "city": "Anand",
                "state": "Gujarat",
                "country": "India",
                "deliveryDays": 5,
                "creditPeriod": 0,
                "minimumOrderQuantity": 20,
                "deliveryCharges": 100,
                "paymentTerms": "Advance",
                "reliabilityScore": 7.5,
                "preferredCategories": ["grocery"],
                "notes": "Direct-from-farm collective. Best prices on staples.",
                "active": True,
            },
            {
                "name": "Metro Garments Mfg",
                "supplierType": "manufacturer",
                "businessName": "Metro Garments Manufacturing Co",
                "gstNumber": "07LMNOP3456Q7R8",
                "contactPerson": "Suresh Mittal",
                "phone": "+91 70000 33333",
                "email": "suresh@metrogarments.in",
                "address": "Industrial Estate, Sector 18",
                "city": "Noida",
                "state": "Uttar Pradesh",
                "country": "India",
                "deliveryDays": 7,
                "creditPeriod": 45,
                "minimumOrderQuantity": 50,
                "deliveryCharges": 300,
                "paymentTerms": "Net 45",
                "reliabilityScore": 8.0,
                "preferredCategories": ["fashion"],
                "notes": "Direct manufacturer for bulk apparel orders.",
                "active": True,
            },
            {
                "name": "MediSafe Supplies",
                "supplierType": "distributor",
                "businessName": "MediSafe Supplies Pvt Ltd",
                "gstNumber": "33STUVW7890X1Y2",
                "contactPerson": "Dr. Lakshmi Rao",
                "phone": "+91 60000 44444",
                "email": "lakshmi@medisafe.in",
                "address": "Medical Complex, T Nagar",
                "city": "Chennai",
                "state": "Tamil Nadu",
                "country": "India",
                "deliveryDays": 2,
                "creditPeriod": 30,
                "minimumOrderQuantity": 5,
                "deliveryCharges": 250,
                "paymentTerms": "Net 30",
                "reliabilityScore": 9.2,
                "preferredCategories": ["medical", "cleaning"],
                "notes": "Certified medical supplies distributor with cold-chain capability.",
                "active": True,
            },
            {
                "name": "Bharat Industrial Tools",
                "supplierType": "manufacturer",
                "businessName": "Bharat Industrial Tools Ltd",
                "gstNumber": "09ZZABC1234D5E7",
                "contactPerson": "Vikram Singh",
                "phone": "+91 50000 55555",
                "email": "vikram@bharatindustrial.in",
                "address": "Industrial Zone, Surajpur",
                "city": "Greater Noida",
                "state": "Uttar Pradesh",
                "country": "India",
                "deliveryDays": 6,
                "creditPeriod": 30,
                "minimumOrderQuantity": 2,
                "deliveryCharges": 400,
                "paymentTerms": "Net 30",
                "reliabilityScore": 8.8,
                "preferredCategories": ["industrial", "office"],
                "notes": "Heavy-duty industrial tools and safety equipment manufacturer.",
                "active": True,
            },
        ]

        supplier_ids: list[ObjectId] = []
        for s in demo_suppliers:
            s["userId"] = user_id
            s["createdAt"] = now
            s["updatedAt"] = now
            result = await db.supplier_hub_suppliers.insert_one(s)
            supplier_ids.append(result.inserted_id)

        # --- Demo products ---
        demo_products = [
            # Sharma Wholesale Traders (grocery, cleaning)
            {"supplierIdx": 0, "productName": "Basmati Rice Premium 25kg", "brand": "India Gate", "category": "grocery", "unit": "bag", "currentPrice": 1850, "moq": 10, "availability": "In Stock"},
            {"supplierIdx": 0, "productName": "Sunflower Cooking Oil 15L", "brand": "Fortune", "category": "grocery", "unit": "tin", "currentPrice": 1450, "moq": 5, "availability": "In Stock"},
            {"supplierIdx": 0, "productName": "Toor Dal Yellow 10kg", "brand": "Tata Sampann", "category": "grocery", "unit": "bag", "currentPrice": 980, "moq": 10, "availability": "In Stock"},
            {"supplierIdx": 0, "productName": "Floor Cleaner Concentrate 5L", "brand": "Lizol", "category": "cleaning", "unit": "bottle", "currentPrice": 320, "moq": 12, "availability": "In Stock"},
            {"supplierIdx": 0, "productName": "Hand Sanitizer Bulk 1L", "brand": "Dettol", "category": "cleaning", "unit": "bottle", "currentPrice": 180, "moq": 20, "availability": "In Stock"},

            # TechDistribute India (electronics, office)
            {"supplierIdx": 1, "productName": "UltraBook Pro Laptop i7", "brand": "Lenovo", "category": "electronics", "unit": "unit", "currentPrice": 68500, "moq": 5, "availability": "In Stock"},
            {"supplierIdx": 1, "productName": "Wireless Mouse Combo", "brand": "Logitech", "category": "electronics", "unit": "set", "currentPrice": 850, "moq": 10, "availability": "In Stock"},
            {"supplierIdx": 1, "productName": "USB-C Hub 7-in-1", "brand": "Anker", "category": "electronics", "unit": "unit", "currentPrice": 1200, "moq": 5, "availability": "In Stock"},
            {"supplierIdx": 1, "productName": "A4 Copier Paper 500 sheets", "brand": "JK Copier", "category": "office", "unit": "ream", "currentPrice": 240, "moq": 20, "availability": "In Stock"},
            {"supplierIdx": 1, "productName": "Ballpoint Pens Blue Pack 50", "brand": "Reynolds", "category": "office", "unit": "pack", "currentPrice": 350, "moq": 10, "availability": "In Stock"},

            # Anand FPO Collective (grocery)
            {"supplierIdx": 2, "productName": "Organic Basmati Rice 25kg", "brand": "Anand Organic", "category": "grocery", "unit": "bag", "currentPrice": 1650, "moq": 20, "availability": "In Stock"},
            {"supplierIdx": 2, "productName": "Fresh Onions 20kg", "brand": "Anand FPO", "category": "grocery", "unit": "sack", "currentPrice": 480, "moq": 20, "availability": "In Stock"},
            {"supplierIdx": 2, "productName": "Organic Turmeric Powder 5kg", "brand": "Anand Organic", "category": "grocery", "unit": "bag", "currentPrice": 720, "moq": 10, "availability": "Limited Stock"},

            # Metro Garments Mfg (fashion)
            {"supplierIdx": 3, "productName": "Cotton T-Shirt Bulk Pack 50", "brand": "Metro Basics", "category": "fashion", "unit": "pack", "currentPrice": 4200, "moq": 50, "availability": "In Stock"},
            {"supplierIdx": 3, "productName": "Denim Jeans Assorted 30pcs", "brand": "Metro Denim", "category": "fashion", "unit": "lot", "currentPrice": 9800, "moq": 30, "availability": "In Stock"},
            {"supplierIdx": 3, "productName": "Formal Shirt Pack 20", "brand": "Metro Formal", "category": "fashion", "unit": "pack", "currentPrice": 5600, "moq": 20, "availability": "In Stock"},

            # MediSafe Supplies (medical, cleaning)
            {"supplierIdx": 4, "productName": "Surgical Masks 3-Ply Box 2000", "brand": "MediSafe", "category": "medical", "unit": "box", "currentPrice": 2800, "moq": 5, "availability": "In Stock"},
            {"supplierIdx": 4, "productName": "Nitrile Gloves Box 100", "brand": "MediSafe", "category": "medical", "unit": "box", "currentPrice": 450, "moq": 10, "availability": "In Stock"},
            {"supplierIdx": 4, "productName": "Pulse Oximeter Fingertip", "brand": "Dr. Trust", "category": "medical", "unit": "unit", "currentPrice": 980, "moq": 5, "availability": "In Stock"},
            {"supplierIdx": 4, "productName": "Surface Disinfectant 5L", "brand": "Dettol Pro", "category": "cleaning", "unit": "can", "currentPrice": 380, "moq": 10, "availability": "In Stock"},

            # Bharat Industrial Tools (industrial, office)
            {"supplierIdx": 5, "productName": "Power Drill 13mm Corded", "brand": "Bosch", "category": "industrial", "unit": "unit", "currentPrice": 3200, "moq": 2, "availability": "In Stock"},
            {"supplierIdx": 5, "productName": "Safety Helmet ISI Marked", "brand": "Karam", "category": "industrial", "unit": "unit", "currentPrice": 280, "moq": 10, "availability": "In Stock"},
            {"supplierIdx": 5, "productName": "Wrench Set 12-piece", "brand": "Taparia", "category": "industrial", "unit": "set", "currentPrice": 1450, "moq": 5, "availability": "In Stock"},
            {"supplierIdx": 5, "productName": "Office Chair Ergonomic", "brand": "Bharat Seating", "category": "office", "unit": "unit", "currentPrice": 3800, "moq": 2, "availability": "In Stock"},
        ]

        product_docs = []
        for p in demo_products:
            supplier_id = supplier_ids[p["supplierIdx"]]
            product_docs.append({
                "supplierId": supplier_id,
                "userId": user_id,
                "productName": p["productName"],
                "brand": p.get("brand"),
                "category": p.get("category"),
                "unit": p.get("unit"),
                "currentPrice": p.get("currentPrice"),
                "moq": p.get("moq"),
                "availability": p.get("availability", "In Stock"),
                "notes": None,
                "createdAt": now,
                "updatedAt": now,
            })

        if product_docs:
            await db.supplier_hub_products.insert_many(product_docs)
            print(f"[INFO] Seeded {len(demo_suppliers)} Supplier Hub suppliers and {len(product_docs)} products for demo")

    except Exception as e:
        print(f"[WARN] seed supplier hub demo failed: {e}")


def _write_test_credentials() -> None:
    try:
        d = "/app/memory"
        if not os.path.exists(d):
            os.makedirs(d, exist_ok=True)
        content = f"""# Test Credentials \u2014 ProcureAI

## Demo Account
- Email: {env.DEMO_EMAIL}
- Password: {env.DEMO_PASSWORD}

## Auth
- Tokens are JWT (Bearer). Login returns {{ token, user }}. Send `Authorization: Bearer <token>`.
- Endpoints: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout

## Notes
- Backend: Python FastAPI on port {env.PORT}.
- All API routes are prefixed with /api.
- The demo account is seeded with ~14 sample searches so the dashboard/analytics are populated.
"""
        with open(os.path.join(d, "test_credentials.md"), "w") as f:
            f.write(content)
    except Exception as e:
        print(f"[WARN] Could not write test_credentials.md: {e}")


async def run_seed() -> None:
    try:
        await _seed_categories()
        await _seed_suppliers()
        demo_user = await _seed_user(env.DEMO_EMAIL, env.DEMO_PASSWORD, env.DEMO_NAME)
        await _seed_sample_history(demo_user["_id"])
        await _seed_supplier_hub_demo(demo_user["_id"])
        _write_test_credentials()
        print("[INFO] Seed complete")
    except Exception as e:
        print(f"[ERROR] Seed failed: {e}")
