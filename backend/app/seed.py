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
            {"category": "grocery", "query": "Premium Basmati Rice 10kg", "suppliers": ["Blinkit", "Zepto", "BigBasket", "JioMart"], "daysAgo": 9},
            {"category": "grocery", "query": "Sunflower Cooking Oil 5L", "suppliers": ["BigBasket", "JioMart", "Blinkit"], "daysAgo": 30},
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
    """Seed demo Supplier Hub suppliers and products for the demo user.

    Products are named to match marketplace catalog keywords so they appear
    in search results alongside marketplace products.
    """
    try:
        db = get_db()
        # Drop old Supplier Hub data to ensure fresh products with catalogId
        await db.supplier_hub_products.delete_many({"userId": user_id})
        await db.supplier_hub_suppliers.delete_many({"userId": user_id})

        now = datetime.utcnow()

        # --- Demo suppliers (10 suppliers covering all 8 categories) ---
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
                "city": "Pune", "state": "Maharashtra", "country": "India",
                "deliveryDays": 4, "creditPeriod": 30, "minimumOrderQuantity": 10,
                "deliveryCharges": 150, "paymentTerms": "Net 30",
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
                "city": "Bengaluru", "state": "Karnataka", "country": "India",
                "deliveryDays": 3, "creditPeriod": 15, "minimumOrderQuantity": 5,
                "deliveryCharges": 200, "paymentTerms": "Net 15",
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
                "city": "Anand", "state": "Gujarat", "country": "India",
                "deliveryDays": 5, "creditPeriod": 0, "minimumOrderQuantity": 20,
                "deliveryCharges": 100, "paymentTerms": "Advance",
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
                "city": "Noida", "state": "Uttar Pradesh", "country": "India",
                "deliveryDays": 7, "creditPeriod": 45, "minimumOrderQuantity": 50,
                "deliveryCharges": 300, "paymentTerms": "Net 45",
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
                "city": "Chennai", "state": "Tamil Nadu", "country": "India",
                "deliveryDays": 2, "creditPeriod": 30, "minimumOrderQuantity": 5,
                "deliveryCharges": 250, "paymentTerms": "Net 30",
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
                "city": "Greater Noida", "state": "Uttar Pradesh", "country": "India",
                "deliveryDays": 6, "creditPeriod": 30, "minimumOrderQuantity": 2,
                "deliveryCharges": 400, "paymentTerms": "Net 30",
                "reliabilityScore": 8.8,
                "preferredCategories": ["industrial", "office"],
                "notes": "Heavy-duty industrial tools and safety equipment manufacturer.",
                "active": True,
            },
            {
                "name": "Furniture Craft Works",
                "supplierType": "manufacturer",
                "businessName": "Furniture Craft Works Pvt Ltd",
                "gstNumber": "36QWERT5678Y9Z0",
                "contactPerson": "Arjun Reddy",
                "phone": "+91 95000 66666",
                "email": "arjun@furniturecraft.in",
                "address": "Wood Industries Hub, Jeedimetla",
                "city": "Hyderabad", "state": "Telangana", "country": "India",
                "deliveryDays": 8, "creditPeriod": 30, "minimumOrderQuantity": 2,
                "deliveryCharges": 500, "paymentTerms": "Net 30",
                "reliabilityScore": 8.3,
                "preferredCategories": ["furniture", "office"],
                "notes": "Custom furniture manufacturer for office and institutional buyers.",
                "active": True,
            },
            {
                "name": "Krishna Electronics Distributors",
                "supplierType": "distributor",
                "businessName": "Krishna Electronics Distributors Pvt Ltd",
                "gstNumber": "27PQRST9012A3B4",
                "contactPerson": "Krishna Deshpande",
                "phone": "+91 94000 77777",
                "email": "krishna@kedistributors.in",
                "address": "Electronics Market, Lamington Road",
                "city": "Mumbai", "state": "Maharashtra", "country": "India",
                "deliveryDays": 3, "creditPeriod": 21, "minimumOrderQuantity": 3,
                "deliveryCharges": 180, "paymentTerms": "Net 21",
                "reliabilityScore": 8.7,
                "preferredCategories": ["electronics"],
                "notes": "Bulk electronics distributor with competitive pricing on laptops and peripherals.",
                "active": True,
            },
            {
                "name": "PureClean Hygiene Co",
                "supplierType": "wholesaler",
                "businessName": "PureClean Hygiene Products Co",
                "gstNumber": "07MNOPQ3456R7S8",
                "contactPerson": "Deepak Aggarwal",
                "phone": "+91 93000 88888",
                "email": "deepak@pureclean.in",
                "address": "Sanitation Supplies Market, Sector 62",
                "city": "Faridabad", "state": "Haryana", "country": "India",
                "deliveryDays": 3, "creditPeriod": 30, "minimumOrderQuantity": 10,
                "deliveryCharges": 120, "paymentTerms": "Net 30",
                "reliabilityScore": 8.1,
                "preferredCategories": ["cleaning", "medical"],
                "notes": "Bulk supplier of cleaning and hygiene products for institutions.",
                "active": True,
            },
            {
                "name": "StyleCraft Apparel House",
                "supplierType": "wholesaler",
                "businessName": "StyleCraft Apparel House LLP",
                "gstNumber": "33UVWXY7890Z1A2",
                "contactPerson": "Meera Krishnan",
                "phone": "+91 92000 99999",
                "email": "meera@stylecraft.in",
                "address": "Textile Hub, Erode Road",
                "city": "Tirupur", "state": "Tamil Nadu", "country": "India",
                "deliveryDays": 5, "creditPeriod": 30, "minimumOrderQuantity": 30,
                "deliveryCharges": 200, "paymentTerms": "Net 30",
                "reliabilityScore": 8.4,
                "preferredCategories": ["fashion"],
                "notes": "Wholesale apparel supplier specializing in branded clothing lots.",
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
        # Product names match marketplace catalog keywords so they appear in search results.
        # Prices are set competitively vs marketplace base prices to make comparison meaningful.
        demo_products = [
            # 0: Sharma Wholesale Traders (grocery, cleaning)
            {"supplierIdx": 0, "productName": "Premium Basmati Rice 10kg", "brand": "India Gate", "category": "grocery", "unit": "bag", "currentPrice": 920, "moq": 10, "availability": "In Stock", "catalogId": "groc-rice"},
            {"supplierIdx": 0, "productName": "Sunflower Cooking Oil 5L", "brand": "Fortune", "category": "grocery", "unit": "jerrycan", "currentPrice": 720, "moq": 5, "availability": "In Stock", "catalogId": "groc-oil"},
            {"supplierIdx": 0, "productName": "Whole Wheat Atta 10kg", "brand": "Aashirvaad", "category": "grocery", "unit": "bag", "currentPrice": 460, "moq": 10, "availability": "In Stock", "catalogId": "groc-atta"},
            {"supplierIdx": 0, "productName": "Refined Sugar 5kg", "brand": "Madhur", "category": "grocery", "unit": "bag", "currentPrice": 230, "moq": 10, "availability": "In Stock", "catalogId": "groc-sugar"},
            {"supplierIdx": 0, "productName": "Floor Cleaner Disinfectant 5L", "brand": "Lizol", "category": "cleaning", "unit": "can", "currentPrice": 520, "moq": 12, "availability": "In Stock", "catalogId": "clean-floor"},
            {"supplierIdx": 0, "productName": "Hand Sanitizer 5L Refill", "brand": "Dettol", "category": "cleaning", "unit": "can", "currentPrice": 750, "moq": 6, "availability": "In Stock", "catalogId": "clean-sanitizer"},
            {"supplierIdx": 0, "productName": "Tissue Rolls (Pack of 12)", "brand": "Origami", "category": "cleaning", "unit": "pack", "currentPrice": 410, "moq": 10, "availability": "In Stock", "catalogId": "clean-tissue"},

            # 1: TechDistribute India (electronics, office)
            {"supplierIdx": 1, "productName": "UltraBook Pro 14 Laptop (16GB/512GB)", "brand": "Dell", "category": "electronics", "unit": "unit", "currentPrice": 72000, "moq": 5, "availability": "In Stock", "catalogId": "elec-laptop-ultrabook"},
            {"supplierIdx": 1, "productName": "ProBook Air 13 Slim Laptop", "brand": "HP", "category": "electronics", "unit": "unit", "currentPrice": 59000, "moq": 5, "availability": "In Stock", "catalogId": "elec-laptop-air"},
            {"supplierIdx": 1, "productName": "Wireless Noise Cancelling Headphones", "brand": "Sony", "category": "electronics", "unit": "unit", "currentPrice": 21000, "moq": 5, "availability": "In Stock", "catalogId": "elec-headphones"},
            {"supplierIdx": 1, "productName": "27-inch 4K UHD Monitor", "brand": "LG", "category": "electronics", "unit": "unit", "currentPrice": 28500, "moq": 3, "availability": "In Stock", "catalogId": "elec-monitor"},
            {"supplierIdx": 1, "productName": "A4 Copier Paper (5 Reams)", "brand": "JK Copier", "category": "office", "unit": "pack", "currentPrice": 1150, "moq": 10, "availability": "In Stock", "catalogId": "off-paper"},
            {"supplierIdx": 1, "productName": "Ballpoint Pens (Pack of 50)", "brand": "Cello", "category": "office", "unit": "pack", "currentPrice": 290, "moq": 10, "availability": "In Stock", "catalogId": "off-pens"},
            {"supplierIdx": 1, "productName": "All-in-One Inkjet Printer", "brand": "Canon", "category": "office", "unit": "unit", "currentPrice": 12500, "moq": 3, "availability": "In Stock", "catalogId": "off-printer"},

            # 2: Anand FPO Collective (grocery)
            {"supplierIdx": 2, "productName": "Premium Basmati Rice 10kg", "brand": "India Gate", "category": "grocery", "unit": "bag", "currentPrice": 850, "moq": 20, "availability": "In Stock", "catalogId": "groc-rice"},
            {"supplierIdx": 2, "productName": "Fresh Vegetables Combo 5kg", "brand": "Farm Fresh", "category": "grocery", "unit": "combo", "currentPrice": 350, "moq": 20, "availability": "In Stock", "catalogId": "groc-veg"},
            {"supplierIdx": 2, "productName": "Organic Turmeric Powder 5kg", "brand": "Anand Organic", "category": "grocery", "unit": "bag", "currentPrice": 720, "moq": 10, "availability": "Limited Stock"},

            # 3: Metro Garments Mfg (fashion)
            {"supplierIdx": 3, "productName": "Cotton Crew Neck T-Shirt", "brand": "Levi's", "category": "fashion", "unit": "unit", "currentPrice": 850, "moq": 50, "availability": "In Stock", "catalogId": "fash-tshirt"},
            {"supplierIdx": 3, "productName": "Slim Fit Denim Jeans", "brand": "Levi's", "category": "fashion", "unit": "unit", "currentPrice": 2200, "moq": 30, "availability": "In Stock", "catalogId": "fash-jeans"},
            {"supplierIdx": 3, "productName": "Air Zoom Running Shoes", "brand": "Nike", "category": "fashion", "unit": "pair", "currentPrice": 6200, "moq": 20, "availability": "In Stock", "catalogId": "fash-shoes-nike"},
            {"supplierIdx": 3, "productName": "Windcheater Jacket", "brand": "Puma", "category": "fashion", "unit": "unit", "currentPrice": 2800, "moq": 30, "availability": "In Stock", "catalogId": "fash-jacket"},

            # 4: MediSafe Supplies (medical, cleaning)
            {"supplierIdx": 4, "productName": "3-Ply Surgical Masks (Box of 100)", "brand": "MediShield", "category": "medical", "unit": "box", "currentPrice": 250, "moq": 10, "availability": "In Stock", "catalogId": "med-mask"},
            {"supplierIdx": 4, "productName": "Nitrile Examination Gloves (Box of 100)", "brand": "SafeHand", "category": "medical", "unit": "box", "currentPrice": 480, "moq": 10, "availability": "In Stock", "catalogId": "med-gloves"},
            {"supplierIdx": 4, "productName": "Fingertip Pulse Oximeter", "brand": "Dr Trust", "category": "medical", "unit": "unit", "currentPrice": 1200, "moq": 5, "availability": "In Stock", "catalogId": "med-oximeter"},
            {"supplierIdx": 4, "productName": "Infrared Thermometer", "brand": "Omron", "category": "medical", "unit": "unit", "currentPrice": 1450, "moq": 5, "availability": "In Stock", "catalogId": "med-thermometer"},
            {"supplierIdx": 4, "productName": "Floor Cleaner Disinfectant 5L", "brand": "Lizol", "category": "cleaning", "unit": "can", "currentPrice": 550, "moq": 10, "availability": "In Stock", "catalogId": "clean-floor"},

            # 5: Bharat Industrial Tools (industrial, office)
            {"supplierIdx": 5, "productName": "Cordless Power Drill 20V", "brand": "Bosch", "category": "industrial", "unit": "unit", "currentPrice": 5800, "moq": 2, "availability": "In Stock", "catalogId": "ind-drill"},
            {"supplierIdx": 5, "productName": "Safety Helmets (Pack of 10)", "brand": "Karam", "category": "industrial", "unit": "pack", "currentPrice": 980, "moq": 5, "availability": "In Stock", "catalogId": "ind-helmet"},
            {"supplierIdx": 5, "productName": "Adjustable Wrench Set", "brand": "Taparia", "category": "industrial", "unit": "set", "currentPrice": 1500, "moq": 5, "availability": "In Stock", "catalogId": "ind-wrench"},
            {"supplierIdx": 5, "productName": "Ergonomic Office Chair", "brand": "Featherlite", "category": "office", "unit": "unit", "currentPrice": 9800, "moq": 2, "availability": "In Stock", "catalogId": "furn-chair"},

            # 6: Furniture Craft Works (furniture, office)
            {"supplierIdx": 6, "productName": "Ergonomic Office Chair", "brand": "Featherlite", "category": "furniture", "unit": "unit", "currentPrice": 10500, "moq": 2, "availability": "In Stock", "catalogId": "furn-chair"},
            {"supplierIdx": 6, "productName": "Height-Adjustable Standing Desk", "brand": "Urban", "category": "furniture", "unit": "unit", "currentPrice": 15500, "moq": 2, "availability": "In Stock", "catalogId": "furn-desk"},
            {"supplierIdx": 6, "productName": "3-Seater Fabric Sofa", "brand": "HomeTown", "category": "furniture", "unit": "unit", "currentPrice": 30000, "moq": 2, "availability": "In Stock", "catalogId": "furn-sofa"},
            {"supplierIdx": 6, "productName": "Filing Cabinet 4-Drawer", "brand": "Furniture Craft", "category": "office", "unit": "unit", "currentPrice": 6500, "moq": 2, "availability": "In Stock"},

            # 7: Krishna Electronics Distributors (electronics)
            {"supplierIdx": 7, "productName": "Galaxy S Smartphone 5G (256GB)", "brand": "Samsung", "category": "electronics", "unit": "unit", "currentPrice": 56000, "moq": 3, "availability": "In Stock", "catalogId": "elec-phone-galaxy"},
            {"supplierIdx": 7, "productName": "iPhone Pro Smartphone (256GB)", "brand": "Apple", "category": "electronics", "unit": "unit", "currentPrice": 108000, "moq": 3, "availability": "In Stock", "catalogId": "elec-phone-iphone"},
            {"supplierIdx": 7, "productName": "27-inch 4K UHD Monitor", "brand": "LG", "category": "electronics", "unit": "unit", "currentPrice": 27000, "moq": 3, "availability": "In Stock", "catalogId": "elec-monitor"},
            {"supplierIdx": 7, "productName": "Wireless Noise Cancelling Headphones", "brand": "Sony", "category": "electronics", "unit": "unit", "currentPrice": 20500, "moq": 5, "availability": "In Stock", "catalogId": "elec-headphones"},

            # 8: PureClean Hygiene Co (cleaning, medical)
            {"supplierIdx": 8, "productName": "Hand Sanitizer 5L Refill", "brand": "Dettol", "category": "cleaning", "unit": "can", "currentPrice": 780, "moq": 10, "availability": "In Stock", "catalogId": "clean-sanitizer"},
            {"supplierIdx": 8, "productName": "Tissue Rolls (Pack of 12)", "brand": "Origami", "category": "cleaning", "unit": "pack", "currentPrice": 420, "moq": 10, "availability": "In Stock", "catalogId": "clean-tissue"},
            {"supplierIdx": 8, "productName": "3-Ply Surgical Masks (Box of 100)", "brand": "MediShield", "category": "medical", "unit": "box", "currentPrice": 220, "moq": 20, "availability": "In Stock", "catalogId": "med-mask"},
            {"supplierIdx": 8, "productName": "Nitrile Examination Gloves (Box of 100)", "brand": "SafeHand", "category": "medical", "unit": "box", "currentPrice": 450, "moq": 15, "availability": "In Stock", "catalogId": "med-gloves"},

            # 9: StyleCraft Apparel House (fashion)
            {"supplierIdx": 9, "productName": "Ultraboost Running Shoes", "brand": "Adidas", "category": "fashion", "unit": "pair", "currentPrice": 6800, "moq": 30, "availability": "In Stock", "catalogId": "fash-shoes-adidas"},
            {"supplierIdx": 9, "productName": "Cotton Crew Neck T-Shirt", "brand": "Levi's", "category": "fashion", "unit": "unit", "currentPrice": 900, "moq": 30, "availability": "In Stock", "catalogId": "fash-tshirt"},
            {"supplierIdx": 9, "productName": "Slim Fit Denim Jeans", "brand": "Levi's", "category": "fashion", "unit": "unit", "currentPrice": 2400, "moq": 30, "availability": "In Stock", "catalogId": "fash-jeans"},
            {"supplierIdx": 9, "productName": "Windcheater Jacket", "brand": "Puma", "category": "fashion", "unit": "unit", "currentPrice": 2950, "moq": 30, "availability": "In Stock", "catalogId": "fash-jacket"},
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
                "catalogId": p.get("catalogId"),
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
