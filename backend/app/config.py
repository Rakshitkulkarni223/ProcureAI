"""
Configuration: environment variables, static catalog data, supplier profiles,
weight profiles, and category mappings.
"""
import os
from typing import Any

from dotenv import load_dotenv

load_dotenv()


# ---------------------------------------------------------------------------
# Environment helpers
# ---------------------------------------------------------------------------

def _required(key: str) -> str:
    try:
        val = os.environ.get(key)
        if not val:
            raise RuntimeError(f"Missing required environment variable: {key}")
        return val
    except Exception:
        raise


class Env:
    try:
        MONGO_URL: str = _required("MONGO_URL")
        DB_NAME: str = _required("DB_NAME")
        JWT_SECRET: str = _required("JWT_SECRET")
    except Exception:
        raise
    JWT_EXPIRES_IN: str = os.getenv("JWT_EXPIRES_IN", "7d")
    PORT: int = int(os.getenv("PORT", "8001"))
    DEMO_EMAIL: str = os.getenv("DEMO_EMAIL", "demo@procureai.com")
    DEMO_PASSWORD: str = os.getenv("DEMO_PASSWORD", "Demo@123")
    DEMO_NAME: str = os.getenv("DEMO_NAME", "Demo User")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")
    NODE_ENV: str = os.getenv("NODE_ENV", "development")
    SERPAPI_KEY: str = os.getenv("SERPAPI_KEY", "")
    # Groq AI (free tier, OpenAI-compatible)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    AI_PRIMARY_MODEL: str = os.getenv("AI_PRIMARY_MODEL", "qwen/qwen3.6-27b")
    AI_FALLBACK_MODEL: str = os.getenv("AI_FALLBACK_MODEL", "llama-3.1-8b-instant")
    AI_TEMPERATURE: float = float(os.getenv("AI_TEMPERATURE", "0.3"))
    AI_MAX_TOKENS: int = int(os.getenv("AI_MAX_TOKENS", "1024"))


env = Env()


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------

CATEGORIES = [
    {"slug": "electronics", "name": "Electronics", "icon": "Cpu", "description": "Laptops, phones, peripherals & gadgets"},
    {"slug": "grocery", "name": "Grocery", "icon": "ShoppingBasket", "description": "Staples, pantry & fresh supplies"},
    {"slug": "fashion", "name": "Fashion", "icon": "Shirt", "description": "Apparel, footwear & accessories"},
    {"slug": "furniture", "name": "Furniture", "icon": "Armchair", "description": "Office & workspace furniture"},
    {"slug": "office", "name": "Office Supplies", "icon": "Paperclip", "description": "Stationery, paper & office essentials"},
    {"slug": "cleaning", "name": "Cleaning Supplies", "icon": "SprayCan", "description": "Sanitation & janitorial products"},
    {"slug": "medical", "name": "Medical Supplies", "icon": "Stethoscope", "description": "PPE, devices & consumables"},
    {"slug": "industrial", "name": "Industrial Equipment", "icon": "Wrench", "description": "Tools, safety & hardware"},
]


# ---------------------------------------------------------------------------
# Supplier profiles
# ---------------------------------------------------------------------------

SUPPLIER_PROFILES: dict[str, dict[str, Any]] = {
    "Amazon": {"name": "Amazon", "color": "#FF9900", "priceFactor": 1.02, "baseRating": 4.5, "deliveryDays": 2, "discountBias": 12, "warrantyMonths": 24, "returnDays": 10, "stockProbability": 0.95},
    "Flipkart": {"name": "Flipkart", "color": "#2874F0", "priceFactor": 0.98, "baseRating": 4.3, "deliveryDays": 3, "discountBias": 18, "warrantyMonths": 18, "returnDays": 7, "stockProbability": 0.92},
    "Croma": {"name": "Croma", "color": "#12B3A6", "priceFactor": 1.05, "baseRating": 4.2, "deliveryDays": 4, "discountBias": 8, "warrantyMonths": 24, "returnDays": 10, "stockProbability": 0.85},
    "Reliance Digital": {"name": "Reliance Digital", "color": "#E5202E", "priceFactor": 1.03, "baseRating": 4.1, "deliveryDays": 5, "discountBias": 10, "warrantyMonths": 24, "returnDays": 7, "stockProbability": 0.85},
    "Blinkit": {"name": "Blinkit", "color": "#F8CB46", "priceFactor": 1.0, "baseRating": 4.5, "deliveryDays": 0, "discountBias": 12, "warrantyMonths": 0, "returnDays": 2, "stockProbability": 0.9},
    "Zepto": {"name": "Zepto", "color": "#7E3FF2", "priceFactor": 1.0, "baseRating": 4.4, "deliveryDays": 0, "discountBias": 12, "warrantyMonths": 0, "returnDays": 2, "stockProbability": 0.9},
    "BigBasket": {"name": "BigBasket", "color": "#84C225", "priceFactor": 0.97, "baseRating": 4.5, "deliveryDays": 1, "discountBias": 16, "warrantyMonths": 0, "returnDays": 3, "stockProbability": 0.93},
    "JioMart": {"name": "JioMart", "color": "#008ECC", "priceFactor": 0.97, "baseRating": 4.5, "deliveryDays": 1, "discountBias": 15, "warrantyMonths": 0, "returnDays": 5, "stockProbability": 0.93},
    "Instamart": {"name": "Instamart", "color": "#FC8019", "priceFactor": 0.98, "baseRating": 4.4, "deliveryDays": 0, "discountBias": 13, "warrantyMonths": 0, "returnDays": 2, "stockProbability": 0.9},
    "Myntra": {"name": "Myntra", "color": "#FF3F6C", "priceFactor": 1.0, "baseRating": 4.4, "deliveryDays": 4, "discountBias": 30, "warrantyMonths": 0, "returnDays": 14, "stockProbability": 0.9},
    "Ajio": {"name": "Ajio", "color": "#2C4152", "priceFactor": 0.95, "baseRating": 4.2, "deliveryDays": 5, "discountBias": 35, "warrantyMonths": 0, "returnDays": 14, "stockProbability": 0.88},
    "Tata CLiQ": {"name": "Tata CLiQ", "color": "#D4AF37", "priceFactor": 1.04, "baseRating": 4.3, "deliveryDays": 4, "discountBias": 22, "warrantyMonths": 12, "returnDays": 10, "stockProbability": 0.85},
    "Pepperfry": {"name": "Pepperfry", "color": "#F16521", "priceFactor": 1.0, "baseRating": 4.1, "deliveryDays": 7, "discountBias": 25, "warrantyMonths": 12, "returnDays": 7, "stockProbability": 0.8},
    "Urban Ladder": {"name": "Urban Ladder", "color": "#1A1A1A", "priceFactor": 1.06, "baseRating": 4.3, "deliveryDays": 8, "discountBias": 15, "warrantyMonths": 36, "returnDays": 7, "stockProbability": 0.82},
    "IKEA": {"name": "IKEA", "color": "#0058A3", "priceFactor": 0.97, "baseRating": 4.5, "deliveryDays": 6, "discountBias": 10, "warrantyMonths": 24, "returnDays": 14, "stockProbability": 0.85},
    "Pharmacy Vendors": {"name": "Pharmacy Vendors", "color": "#16A34A", "priceFactor": 1.0, "baseRating": 4.2, "deliveryDays": 2, "discountBias": 10, "warrantyMonths": 0, "returnDays": 3, "stockProbability": 0.9},
    "Medical Equipment Suppliers": {"name": "Medical Equipment Suppliers", "color": "#0EA5E9", "priceFactor": 1.08, "baseRating": 4.4, "deliveryDays": 5, "discountBias": 5, "warrantyMonths": 12, "returnDays": 7, "stockProbability": 0.85},
    "Apollo Pharmacy": {"name": "Apollo Pharmacy", "color": "#1AA34A", "priceFactor": 1.02, "baseRating": 4.5, "deliveryDays": 1, "discountBias": 12, "warrantyMonths": 0, "returnDays": 5, "stockProbability": 0.92},
    "Netmeds": {"name": "Netmeds", "color": "#34A853", "priceFactor": 0.95, "baseRating": 4.3, "deliveryDays": 2, "discountBias": 18, "warrantyMonths": 0, "returnDays": 5, "stockProbability": 0.9},
    "Industrial Tools Co": {"name": "Industrial Tools Co", "color": "#B45309", "priceFactor": 1.0, "baseRating": 4.2, "deliveryDays": 6, "discountBias": 8, "warrantyMonths": 12, "returnDays": 7, "stockProbability": 0.82},
    "Amazon Business": {"name": "Amazon Business", "color": "#146EB4", "priceFactor": 1.01, "baseRating": 4.5, "deliveryDays": 3, "discountBias": 12, "warrantyMonths": 24, "returnDays": 10, "stockProbability": 0.9},
}

CATEGORY_SUPPLIERS: dict[str, list[str]] = {
    "electronics": ["Amazon", "Flipkart", "Croma", "Reliance Digital"],
    "grocery": ["Blinkit", "Zepto", "BigBasket", "JioMart", "Instamart"],
    "fashion": ["Myntra", "Ajio", "Amazon", "Flipkart", "Tata CLiQ"],
    "furniture": ["Pepperfry", "Urban Ladder", "IKEA"],
    "office": ["Amazon", "Flipkart"],
    "cleaning": ["Amazon", "BigBasket", "JioMart"],
    "medical": ["Apollo Pharmacy", "Netmeds", "Pharmacy Vendors", "Medical Equipment Suppliers"],
    "industrial": ["Amazon Business", "Industrial Tools Co"],
}


# ---------------------------------------------------------------------------
# Weight profiles
# ---------------------------------------------------------------------------

WEIGHT_PROFILES: dict[str, dict] = {
    "balanced": {
        "key": "balanced", "label": "Balanced",
        "description": "Even consideration of price, speed, reliability and value.",
        "weights": {"price": 0.3, "delivery": 0.2, "rating": 0.2, "discount": 0.1, "availability": 0.1, "warranty": 0.05, "returnPolicy": 0.05},
    },
    "budget": {
        "key": "budget", "label": "Budget",
        "description": "Cost-first. Prioritises the lowest price with decent ratings.",
        "weights": {"price": 0.6, "delivery": 0.2, "rating": 0.2, "discount": 0, "availability": 0, "warranty": 0, "returnPolicy": 0},
    },
    "urgent": {
        "key": "urgent", "label": "Urgent",
        "description": "Availability & speed critical. Stock and delivery dominate.",
        "weights": {"price": 0.2, "delivery": 0.4, "rating": 0, "discount": 0, "availability": 0.4, "warranty": 0, "returnPolicy": 0},
    },
    "fast": {
        "key": "fast", "label": "Fast",
        "description": "Fast, reliable delivery; price secondary.",
        "weights": {"price": 0.3, "delivery": 0.5, "rating": 0, "discount": 0, "availability": 0.2, "warranty": 0, "returnPolicy": 0},
    },
}

# ---------------------------------------------------------------------------
# Recommendation modes (Smart Recommendation Modes)
# Maps mode keys to weight profiles + intelligence-based sort criteria.
# Existing WEIGHT_PROFILES remain for backward compatibility.
# ---------------------------------------------------------------------------

RECOMMENDATION_MODES: dict[str, dict] = {
    "balanced": {
        "key": "balanced", "label": "Balanced",
        "description": "Even consideration of price, speed, reliability and value.",
        "weightProfile": "balanced",
        "sortBy": "balanced",
    },
    "lowest_cost": {
        "key": "lowest_cost", "label": "Lowest Cost",
        "description": "Prioritises the lowest total procurement cost.",
        "weightProfile": "budget",
        "sortBy": "total_cost",
    },
    "lowest_risk": {
        "key": "lowest_risk", "label": "Lowest Risk",
        "description": "Selects suppliers with the lowest procurement risk.",
        "weightProfile": "balanced",
        "sortBy": "risk",
    },
    "fastest_delivery": {
        "key": "fastest_delivery", "label": "Fastest Delivery",
        "description": "Optimises for the shortest delivery time.",
        "weightProfile": "urgent",
        "sortBy": "delivery",
    },
    "highest_reliability": {
        "key": "highest_reliability", "label": "Highest Reliability",
        "description": "Chooses the most reliable supplier based on delivery and quality.",
        "weightProfile": "fast",
        "sortBy": "reliability",
    },
    "best_long_term_value": {
        "key": "best_long_term_value", "label": "Best Long-Term Value",
        "description": "Balances cost, reliability, risk, and stability for long-term procurement.",
        "weightProfile": "balanced",
        "sortBy": "long_term",
    },
}


DEFAULT_CATEGORY_BASE_PRICE: dict[str, int] = {
    "electronics": 24000, "grocery": 600, "fashion": 2500, "furniture": 15000,
    "office": 1500, "cleaning": 700, "medical": 900, "industrial": 3500,
}


# ---------------------------------------------------------------------------
# Product catalog (embedded from mock-data/catalog.json)
# ---------------------------------------------------------------------------

CATALOG: dict[str, list[dict]] = {
    "electronics": [
        {"id": "elec-laptop-ultrabook", "title": "UltraBook Pro 14 Laptop (16GB/512GB)", "brand": "Dell", "basePrice": 78000, "image": "https://images.pexels.com/photos/6968164/pexels-photo-6968164.jpeg", "keywords": ["laptop", "ultrabook", "notebook", "computer", "dell", "macbook"]},
        {"id": "elec-laptop-air", "title": "ProBook Air 13 Slim Laptop", "brand": "HP", "basePrice": 65000, "image": "https://images.pexels.com/photos/8533587/pexels-photo-8533587.jpeg", "keywords": ["laptop", "probook", "hp", "notebook", "air", "computer"]},
        {"id": "elec-phone-galaxy", "title": "Galaxy S Smartphone 5G (256GB)", "brand": "Samsung", "basePrice": 62000, "image": "https://images.pexels.com/photos/215581/pexels-photo-215581.jpeg", "keywords": ["phone", "smartphone", "mobile", "galaxy", "samsung", "5g", "android"]},
        {"id": "elec-phone-iphone", "title": "iPhone Pro Smartphone (256GB)", "brand": "Apple", "basePrice": 119000, "image": "https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg", "keywords": ["phone", "iphone", "apple", "mobile", "smartphone", "ios"]},
        {"id": "elec-headphones", "title": "Wireless Noise Cancelling Headphones", "brand": "Sony", "basePrice": 24000, "image": "", "keywords": ["headphones", "headphone", "earphones", "audio", "sony", "wireless"]},
        {"id": "elec-monitor", "title": "27-inch 4K UHD Monitor", "brand": "LG", "basePrice": 32000, "image": "", "keywords": ["monitor", "display", "screen", "4k", "lg", "uhd"]},
    ],
    "grocery": [
        {"id": "groc-rice", "title": "Premium Basmati Rice 10kg", "brand": "India Gate", "basePrice": 1100, "image": "https://images.pexels.com/photos/3737691/pexels-photo-3737691.jpeg", "keywords": ["rice", "basmati", "grain", "staple"]},
        {"id": "groc-oil", "title": "Sunflower Cooking Oil 5L", "brand": "Fortune", "basePrice": 850, "image": "", "keywords": ["oil", "cooking oil", "sunflower", "fortune"]},
        {"id": "groc-atta", "title": "Whole Wheat Atta 10kg", "brand": "Aashirvaad", "basePrice": 520, "image": "", "keywords": ["atta", "flour", "wheat", "aashirvaad"]},
        {"id": "groc-sugar", "title": "Refined Sugar 5kg", "brand": "Madhur", "basePrice": 260, "image": "", "keywords": ["sugar", "madhur", "sweetener"]},
        {"id": "groc-veg", "title": "Fresh Vegetables Combo 5kg", "brand": "Farm Fresh", "basePrice": 420, "image": "", "keywords": ["vegetables", "veggies", "fresh", "combo", "produce"]},
    ],
    "fashion": [
        {"id": "fash-shoes-nike", "title": "Air Zoom Running Shoes", "brand": "Nike", "basePrice": 7500, "image": "https://images.pexels.com/photos/13525711/pexels-photo-13525711.jpeg", "keywords": ["nike", "shoes", "running", "sneakers", "footwear", "air", "zoom"]},
        {"id": "fash-shoes-adidas", "title": "Ultraboost Running Shoes", "brand": "Adidas", "basePrice": 8200, "image": "", "keywords": ["adidas", "shoes", "running", "sneakers", "ultraboost", "footwear"]},
        {"id": "fash-tshirt", "title": "Cotton Crew Neck T-Shirt", "brand": "Levi's", "basePrice": 1200, "image": "https://images.pexels.com/photos/20458071/pexels-photo-20458071.jpeg", "keywords": ["tshirt", "t-shirt", "shirt", "cotton", "apparel", "tee"]},
        {"id": "fash-jeans", "title": "Slim Fit Denim Jeans", "brand": "Levi's", "basePrice": 2800, "image": "", "keywords": ["jeans", "denim", "pants", "trousers"]},
        {"id": "fash-jacket", "title": "Windcheater Jacket", "brand": "Puma", "basePrice": 3500, "image": "", "keywords": ["jacket", "windcheater", "puma", "outerwear", "coat"]},
    ],
    "furniture": [
        {"id": "furn-chair", "title": "Ergonomic Office Chair", "brand": "Featherlite", "basePrice": 12000, "image": "https://images.pexels.com/photos/295480/pexels-photo-295480.jpeg", "keywords": ["chair", "office chair", "ergonomic", "seating"]},
        {"id": "furn-desk", "title": "Height-Adjustable Standing Desk", "brand": "Urban", "basePrice": 18000, "image": "", "keywords": ["desk", "table", "standing desk", "work"]},
        {"id": "furn-sofa", "title": "3-Seater Fabric Sofa", "brand": "HomeTown", "basePrice": 35000, "image": "", "keywords": ["sofa", "couch", "seater", "living"]},
    ],
    "office": [
        {"id": "off-paper", "title": "A4 Copier Paper (5 Reams)", "brand": "JK Copier", "basePrice": 1400, "image": "", "keywords": ["paper", "a4", "copier", "reams", "stationery"]},
        {"id": "off-pens", "title": "Ballpoint Pens (Pack of 50)", "brand": "Cello", "basePrice": 350, "image": "", "keywords": ["pen", "pens", "ballpoint", "stationery"]},
        {"id": "off-printer", "title": "All-in-One Inkjet Printer", "brand": "Canon", "basePrice": 14000, "image": "", "keywords": ["printer", "inkjet", "canon", "office", "scanner"]},
    ],
    "cleaning": [
        {"id": "clean-floor", "title": "Floor Cleaner Disinfectant 5L", "brand": "Lizol", "basePrice": 650, "image": "", "keywords": ["floor cleaner", "cleaner", "lizol", "disinfectant"]},
        {"id": "clean-sanitizer", "title": "Hand Sanitizer 5L Refill", "brand": "Dettol", "basePrice": 900, "image": "", "keywords": ["sanitizer", "hand sanitizer", "dettol", "hygiene"]},
        {"id": "clean-tissue", "title": "Tissue Rolls (Pack of 12)", "brand": "Origami", "basePrice": 480, "image": "", "keywords": ["tissue", "tissue rolls", "paper towels", "napkin"]},
    ],
    "medical": [
        {"id": "med-mask", "title": "3-Ply Surgical Masks (Box of 100)", "brand": "MediShield", "basePrice": 300, "image": "", "keywords": ["mask", "surgical mask", "ppe", "3-ply", "face mask"]},
        {"id": "med-gloves", "title": "Nitrile Examination Gloves (Box of 100)", "brand": "SafeHand", "basePrice": 600, "image": "", "keywords": ["gloves", "nitrile", "examination", "ppe"]},
        {"id": "med-oximeter", "title": "Fingertip Pulse Oximeter", "brand": "Dr Trust", "basePrice": 1500, "image": "", "keywords": ["oximeter", "pulse oximeter", "spo2", "device"]},
        {"id": "med-thermometer", "title": "Infrared Thermometer", "brand": "Omron", "basePrice": 1800, "image": "", "keywords": ["thermometer", "infrared", "temperature", "device"]},
    ],
    "industrial": [
        {"id": "ind-drill", "title": "Cordless Power Drill 20V", "brand": "Bosch", "basePrice": 6500, "image": "", "keywords": ["drill", "power drill", "cordless", "bosch", "tool"]},
        {"id": "ind-helmet", "title": "Safety Helmets (Pack of 10)", "brand": "Karam", "basePrice": 1200, "image": "", "keywords": ["helmet", "safety helmet", "ppe", "hard hat"]},
        {"id": "ind-wrench", "title": "Adjustable Wrench Set", "brand": "Taparia", "basePrice": 1800, "image": "", "keywords": ["wrench", "spanner", "tool set", "taparia"]},
    ],
}


def format_inr(amount: float) -> str:
    try:
        rounded = round(amount)
        s = f"{rounded:,}"
        # Convert to Indian grouping (xx,xx,xxx)
        parts = s.split(",")
        if len(parts) > 2:
            last = parts[-1]
            rest = ",".join(parts[:-1])
            s = rest + "," + last
        return f"\u20b9{s}"
    except Exception:
        return f"\u20b9{round(amount)}"


def clamp(n: float, mn: float, mx: float) -> float:
    try:
        return max(mn, min(mx, n))
    except Exception:
        return n


# ---------------------------------------------------------------------------
# City distance matrix (approximate road distances in km between major Indian cities)
# Used for distance-based delivery estimation for Supplier Hub suppliers.
# ---------------------------------------------------------------------------

CITY_DISTANCES_KM: dict[str, dict[str, int]] = {
    "Mumbai": {"Mumbai": 0, "Pune": 150, "Nashik": 180, "Surat": 280, "Ahmedabad": 520, "Bengaluru": 980, "Hyderabad": 710, "Chennai": 1330, "Delhi": 1410, "Noida": 1420, "Greater Noida": 1430, "Faridabad": 1400, "Gurugram": 1410, "Anand": 420, "Indore": 580, "Nagpur": 810, "Kolkata": 1960, "Tirupur": 1280, "Coimbatore": 1300},
    "Pune": {"Pune": 0, "Mumbai": 150, "Nashik": 210, "Surat": 420, "Ahmedabad": 660, "Bengaluru": 840, "Hyderabad": 560, "Chennai": 1180, "Delhi": 1290, "Noida": 1300, "Greater Noida": 1310, "Faridabad": 1280, "Gurugram": 1290, "Anand": 560, "Indore": 520, "Nagpur": 680, "Kolkata": 1840, "Tirupur": 1130, "Coimbatore": 1150},
    "Bengaluru": {"Bengaluru": 0, "Mumbai": 980, "Pune": 840, "Chennai": 350, "Hyderabad": 570, "Coimbatore": 365, "Tirupur": 380, "Kochi": 550, "Mysuru": 150, "Delhi": 2150, "Noida": 2160, "Greater Noida": 2170, "Faridabad": 2140, "Gurugram": 2150, "Anand": 1390, "Kolkata": 1870},
    "Chennai": {"Chennai": 0, "Bengaluru": 350, "Hyderabad": 630, "Coimbatore": 500, "Tirupur": 470, "Mumbai": 1330, "Pune": 1180, "Delhi": 2200, "Noida": 2210, "Greater Noida": 2220, "Faridabad": 2190, "Gurugram": 2200, "Kolkata": 1670, "Anand": 1750},
    "Hyderabad": {"Hyderabad": 0, "Bengaluru": 570, "Chennai": 630, "Mumbai": 710, "Pune": 560, "Nagpur": 500, "Delhi": 1550, "Noida": 1560, "Greater Noida": 1570, "Faridabad": 1540, "Gurugram": 1550, "Kolkata": 1480, "Anand": 1130, "Tirupur": 940, "Coimbatore": 920},
    "Delhi": {"Delhi": 0, "Noida": 20, "Greater Noida": 40, "Faridabad": 30, "Gurugram": 30, "Mumbai": 1410, "Pune": 1290, "Bengaluru": 2150, "Chennai": 2200, "Hyderabad": 1550, "Kolkata": 1540, "Ahmedabad": 950, "Indore": 780, "Jaipur": 280, "Anand": 1080, "Nagpur": 1090},
    "Noida": {"Noida": 0, "Delhi": 20, "Greater Noida": 25, "Faridabad": 35, "Gurugram": 50, "Mumbai": 1420, "Pune": 1300, "Bengaluru": 2160, "Chennai": 2210, "Hyderabad": 1560, "Kolkata": 1550, "Anand": 1090},
    "Greater Noida": {"Greater Noida": 0, "Delhi": 40, "Noida": 25, "Faridabad": 55, "Gurugram": 70, "Mumbai": 1430, "Pune": 1310, "Bengaluru": 2170, "Chennai": 2220, "Hyderabad": 1570, "Kolkata": 1560, "Anand": 1100},
    "Faridabad": {"Faridabad": 0, "Delhi": 30, "Noida": 35, "Greater Noida": 55, "Gurugram": 45, "Mumbai": 1400, "Pune": 1280, "Bengaluru": 2140, "Chennai": 2190, "Hyderabad": 1540, "Kolkata": 1530, "Anand": 1070},
    "Gurugram": {"Gurugram": 0, "Delhi": 30, "Noida": 50, "Greater Noida": 70, "Faridabad": 45, "Mumbai": 1410, "Pune": 1290, "Bengaluru": 2150, "Chennai": 2200, "Hyderabad": 1550, "Kolkata": 1540, "Anand": 1080},
    "Anand": {"Anand": 0, "Ahmedabad": 75, "Mumbai": 420, "Pune": 560, "Surat": 215, "Vadodara": 40, "Bengaluru": 1390, "Chennai": 1750, "Hyderabad": 1130, "Delhi": 1080, "Noida": 1090, "Faridabad": 1070, "Gurugram": 1080, "Kolkata": 2010},
    "Tirupur": {"Tirupur": 0, "Coimbatore": 50, "Chennai": 470, "Bengaluru": 380, "Hyderabad": 940, "Mumbai": 1280, "Pune": 1130, "Delhi": 2230, "Kolkata": 1970, "Anand": 1660},
    "Coimbatore": {"Coimbatore": 0, "Tirupur": 50, "Chennai": 500, "Bengaluru": 365, "Hyderabad": 920, "Mumbai": 1300, "Pune": 1150, "Delhi": 2250, "Kolkata": 1990, "Anand": 1680},
    "Kolkata": {"Kolkata": 0, "Delhi": 1540, "Noida": 1550, "Faridabad": 1530, "Gurugram": 1540, "Mumbai": 1960, "Pune": 1840, "Bengaluru": 1870, "Chennai": 1670, "Hyderabad": 1480, "Anand": 2010, "Nagpur": 1140},
    "Ahmedabad": {"Ahmedabad": 0, "Anand": 75, "Mumbai": 520, "Pune": 660, "Surat": 265, "Delhi": 950, "Noida": 960, "Faridabad": 940, "Gurugram": 950, "Bengaluru": 1500, "Hyderabad": 1200, "Indore": 380},
    "Indore": {"Indore": 0, "Mumbai": 580, "Pune": 520, "Delhi": 780, "Ahmedabad": 380, "Nagpur": 380, "Bengaluru": 1360, "Hyderabad": 830, "Anand": 440},
    "Nagpur": {"Nagpur": 0, "Mumbai": 810, "Pune": 680, "Hyderabad": 500, "Indore": 380, "Delhi": 1090, "Kolkata": 1140, "Bengaluru": 1090, "Chennai": 1160},
    "Surat": {"Surat": 0, "Mumbai": 280, "Pune": 420, "Ahmedabad": 265, "Anand": 215, "Delhi": 1180, "Bengaluru": 1260},
    "Nashik": {"Nashik": 0, "Mumbai": 180, "Pune": 210, "Surat": 320, "Ahmedabad": 400, "Anand": 350},
    "Jaipur": {"Jaipur": 0, "Delhi": 280, "Noida": 300, "Gurugram": 240, "Faridabad": 290, "Mumbai": 1140, "Ahmedabad": 670, "Indore": 600},
    "Kochi": {"Kochi": 0, "Bengaluru": 550, "Coimbatore": 190, "Chennai": 685, "Tirupur": 240, "Mumbai": 1360},
    "Mysuru": {"Mysuru": 0, "Bengaluru": 150, "Coimbatore": 200, "Chennai": 500, "Mumbai": 1130},
    "Vadodara": {"Vadodara": 0, "Anand": 40, "Ahmedabad": 110, "Surat": 255, "Mumbai": 460, "Pune": 600, "Delhi": 1030},
}

# Default user location (can be overridden via user preferences)
DEFAULT_USER_CITY = "Hyderabad"

# Sorted list of all cities available in the distance matrix
AVAILABLE_CITIES: list[str] = sorted(CITY_DISTANCES_KM.keys())


def get_city_distance(city_a: str, city_b: str) -> int:
    """Get approximate road distance in km between two cities. Returns 0 if unknown."""
    try:
        if not city_a or not city_b:
            return 0
        if city_a == city_b:
            return 0
        row = CITY_DISTANCES_KM.get(city_a, {})
        dist = row.get(city_b)
        if dist is not None:
            return dist
        # Try reverse lookup
        row = CITY_DISTANCES_KM.get(city_b, {})
        dist = row.get(city_a)
        if dist is not None:
            return dist
        # Same state but unknown distance — estimate 200km
        return 200
    except Exception:
        return 0


# ---------------------------------------------------------------------------
# City → State mapping for delivery day estimation
# ---------------------------------------------------------------------------
CITY_STATE_MAP: dict[str, str] = {
    "Mumbai": "Maharashtra",
    "Pune": "Maharashtra",
    "Nashik": "Maharashtra",
    "Nagpur": "Maharashtra",
    "Bengaluru": "Karnataka",
    "Mysuru": "Karnataka",
    "Chennai": "Tamil Nadu",
    "Coimbatore": "Tamil Nadu",
    "Tirupur": "Tamil Nadu",
    "Hyderabad": "Telangana",
    "Delhi": "Delhi",
    "Noida": "Uttar Pradesh",
    "Greater Noida": "Uttar Pradesh",
    "Faridabad": "Haryana",
    "Gurugram": "Haryana",
    "Kolkata": "West Bengal",
    "Ahmedabad": "Gujarat",
    "Surat": "Gujarat",
    "Anand": "Gujarat",
    "Vadodara": "Gujarat",
    "Indore": "Madhya Pradesh",
    "Jaipur": "Rajasthan",
    "Kochi": "Kerala",
}


def get_city_state(city: str) -> str:
    """Get the state for a city. Returns empty string if unknown."""
    try:
        return CITY_STATE_MAP.get(city, "")
    except Exception:
        return ""


def distance_to_delivery_days(distance_km: int, base_days: int = 0, user_city: str = "", supplier_city: str = "") -> int:
    """Convert location relationship to delivery days.
    Same City:       1 day
    Same State:      2 days
    Different State: 4–5 days (4 if <1000km, 5 if >=1000km)
    """
    try:
        # Same city → 1 day
        if user_city and supplier_city and user_city.strip().lower() == supplier_city.strip().lower():
            return 1

        # Same state → 2 days
        user_state = get_city_state(user_city)
        supplier_state = get_city_state(supplier_city)
        if user_state and supplier_state and user_state == supplier_state:
            return 2

        # NCR region special case (Delhi, Noida, Gurugram, Faridabad, Greater Noida)
        ncr_cities = {"Delhi", "Noida", "Greater Noida", "Faridabad", "Gurugram"}
        if user_city in ncr_cities and supplier_city in ncr_cities:
            return 1

        # Different state → 4 or 5 days based on distance
        if distance_km >= 1000:
            return 5
        return 4
    except Exception:
        return base_days or 4
