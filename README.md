<p align="center">
  <img src="screenshots/dashboard.png" alt="ProcureAI Dashboard" width="800" />
</p>

# 🚀 ProcureAI

**AI-Powered Procurement & Vendor Intelligence Platform**

Compare suppliers, optimize purchases, reduce procurement costs, and measure business impact — with explainable AI.

⭐ Up to **93% faster** supplier comparison
&nbsp;&nbsp;·&nbsp;&nbsp;
💰 **Business Impact** Dashboard
&nbsp;&nbsp;·&nbsp;&nbsp;
📊 **ROI Calculator**
&nbsp;&nbsp;·&nbsp;&nbsp;
🤖 **Explainable AI** Recommendations

[![GitHub](https://img.shields.io/badge/GitHub-Rakshitkulkarni223%2FProcureAI-blue?logo=github)](https://github.com/Rakshitkulkarni223/ProcureAI)

---

## � Live Demo

> Try ProcureAI right now — no setup required.

| | |
|---|---|
| **Production** | [https://buywise-compare-1.emergent.host/](https://buywise-compare-1.emergent.host/) (Production URL) |
| **Preview** | [https://buywise-compare-1.preview.emergentagent.com/](https://buywise-compare-1.preview.emergentagent.com/) (Preview URL) |

### Demo Account

| Field | Value |
|---|---|
| **Email** | `demo@procureai.com` |
| **Password** | `Demo@123` |

> The demo user is auto-created on first startup via the seed script.

---

## 📸 Product Screenshots

| Dashboard | Search & Compare | AI Explanation |
|---|---|---|
| ![Dashboard](screenshots/dashboard.png) | ![Search](screenshots/search-compare.png) | ![AI](screenshots/ai-explanation.png) |

| Basket Optimization | Business Impact | ROI Calculator |
|---|---|---|
| ![Basket](screenshots/basket-optimization.png) | ![Impact](screenshots/business-impact.png) | ![ROI](screenshots/roi-calculator.png) |

| Analytics | Search History | Watchlist |
|---|---|---|
| ![Analytics](screenshots/analytics.png) | ![History](screenshots/history.png) | ![Watchlist](screenshots/watchlist.png) |

<details>
<summary>More screenshots — Settings & Documentation</summary>

| Settings & Weight Profiles | Built-in Documentation |
|---|---|
| ![Settings](screenshots/settings.png) | ![Docs](screenshots/docs.png) |

</details>

---

## 🎬 Product Demo

> Full walkthrough: Login → Dashboard → Business Impact → Search & Compare → Basket Optimizer → Analytics → History → Watchlist → Settings → Docs → Dark Mode

[Demo Video](https://github.com/user-attachments/assets/80705382-ff09-4438-9ee8-7c09f00f426b)

<details>
<summary>Can't see the video? Click to expand.</summary>

Download from [`demo/procureai-demo.mp4`](demo/procureai-demo.mp4) and play locally.

</details>

---

## 🏆 Business Transformation

### The Problem

Businesses spend **45–60 minutes** manually comparing suppliers across multiple marketplaces, maintaining spreadsheets, and making procurement decisions with limited visibility.

### The Solution

ProcureAI uses **AI to compare suppliers, optimize purchasing decisions, and recommend the best procurement strategy in seconds** — with full transparency into why each supplier was chosen.

### Before vs After

| | Before (Manual) | After (ProcureAI) |
|---|---|---|
| **Supplier comparison** | Manual across 5–10 websites | Automated — all suppliers in one click |
| **Time per procurement** | 45–60 minutes | 3–5 minutes |
| **Calculations** | Excel / paper | Eliminated — AI handles scoring |
| **AI recommendations** | ❌ Not available | ✅ Weighted scoring with explanation |
| **Reports** | Manual preparation | One-click CSV & PDF export |
| **Multi-item optimization** | Not feasible | ✅ Split-cart optimizer across suppliers |
| **Savings tracking** | No visibility | ✅ Real-time dashboard with trends |
| **Decision transparency** | "Gut feel" | ✅ Radar chart + scoreboard |

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **Single Product Search** | Search any product across all configured suppliers in one click. Results are normalized and ranked by an AI recommendation engine. |
| **Basket Optimization** | Add multiple items to a basket. The split-cart optimizer finds the cheapest combination across suppliers while factoring in consolidation penalties (shipping). |
| **Weight Profiles** | Choose from predefined profiles (Balanced, Cost Saver, Speed Priority, Quality First) that adjust how price, delivery, rating, discount, warranty, and return policy are weighted. |
| **AI Explanation Panel** | "Why this recommendation?" — interactive radar chart comparing top suppliers + color-coded scoreboard with scores out of 100. |
| **Export Reports** | Export comparison results to CSV or styled PDF directly from the results table. |
| **Price Watchlist** | Add products to a persistent watchlist to track prices and set target alerts across sessions. |
| **Business Impact Dashboard** | Total savings, hours saved, purchases optimized, AI accuracy, procurement efficiency score, projected annual savings — all with date range filtering. |
| **Before vs After Workflow** | Visual side-by-side comparison of manual procurement (45–60 min, 8 steps) vs ProcureAI-assisted (3–5 min, 5 steps) showing 93% time reduction. |
| **ROI Calculator** | Interactive calculator with sliders — estimate monthly hours saved, salary savings, annual savings, and cost reduction %. |
| **Dashboard & Analytics** | Real-time KPIs with date range filtering — preset ranges (Last 7/30/90 days, This Month, Last Month) or custom date picker. |
| **Search History** | Paginated (15 per page), per-user log of successful comparisons. Failed/empty searches are automatically excluded. |
| **Dark Mode** | Full light/dark theme support with CSS variable theming. |

---

## 🔄 How It Works

```
🏢 Business Need  →  🤖 ProcureAI  →  📊 AI Recommendation  →  💰 Business Impact
```

1. **Search** — Type a product name, pick a category, and ProcureAI queries all suppliers simultaneously
2. **Compare** — Results are normalized and displayed in a sortable comparison table
3. **Recommend** — AI scores every option on price, delivery, rating, discount, warranty, and returns
4. **Explain** — Click "Why this recommendation?" for a radar chart and supplier scoreboard
5. **Optimize** — Add multiple items to a basket for split-cart optimization across suppliers
6. **Export** — Download results as CSV or styled PDF for team review
7. **Track** — Monitor savings, hours freed, and procurement efficiency on the Business Impact dashboard

---

## ️ Architecture

### Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, TailwindCSS, React Router v6, Axios, Recharts, Framer Motion, Lucide Icons |
| **Backend** | Python 3.13, FastAPI, Pydantic (validation), Uvicorn |
| **Database** | MongoDB with Motor (async driver) |
| **Auth** | JWT (PyJWT) + bcrypt |

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (React SPA)                │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐  │
│  │Dashboard │ │ Search & │ │  Business │ │Analytics │  │
│  │  Page    │ │ Compare  │ │  Impact   │ │  Page    │  │
│  └────┬─────┘ └────┬─────┘ └─────┬─────┘ └────┬─────┘  │
│       │             │            │              │        │
│       └─────────────┴─────┬──────┴──────────────┘        │
│                           │  Axios API Client            │
└───────────────────────────┼──────────────────────────────┘
                            │ HTTP / JSON
┌───────────────────────────┼──────────────────────────────┐
│                   FastAPI Backend (Python)                │
│  ┌─────────┐  ┌───────────────┐  ┌────────────────────┐ │
│  │  Auth   │  │   Search &    │  │  Basket Optimizer  │ │
│  │  (JWT)  │  │  Comparison   │  │  (Split-Cart)      │ │
│  └────┬────┘  └───────┬───────┘  └─────────┬──────────┘ │
│       │               │                    │             │
│       │        ┌──────┴───────┐            │             │
│       │        │  Provider    │            │             │
│       │        │  Adapters    │            │             │
│       │        │ (Mock Data)  │            │             │
│       │        └──────────────┘            │             │
│  ┌────┴────────────────────────────────────┴──────────┐  │
│  │             Services (Motor async MongoDB)         │  │
│  └────────────────────────┬───────────────────────────┘  │
└───────────────────────────┼──────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │   MongoDB     │
                    │  (Atlas /     │
                    │   Local)      │
                    └───────────────┘
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login, returns JWT token |
| GET | `/api/auth/me` | Get current user profile |

### Search & Compare

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/search` | Search products across suppliers |
| GET | `/api/categories` | List all product categories |
| GET | `/api/suppliers/:category` | List suppliers for a category |

### Basket Optimization

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/basket/optimize` | Optimize a multi-item basket |
| GET | `/api/basket/history?page=1&limit=20` | Paginated basket optimization history |

### History & Preferences

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/history?page=1&limit=20` | Paginated search history |
| DELETE | `/api/history/:id` | Delete a history entry |
| GET | `/api/preferences` | Get user preferences |
| PUT | `/api/preferences` | Update user preferences |

### Dashboard, Analytics & Business Impact

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard?from=&to=` | Dashboard KPIs (date range optional) |
| GET | `/api/analytics/spend?from=&to=` | Spend analytics |
| GET | `/api/analytics/savings?from=&to=` | Savings trend |
| GET | `/api/insights?from=&to=` | AI-generated procurement insights |
| GET | `/api/business-impact?from=&to=` | Business impact metrics (savings, hours saved, efficiency, ROI) |

---

## 🚀 Setup & Running

### Prerequisites

- **Python** >= 3.11
- **Node.js** >= 18.x (frontend only)
- **MongoDB** (local or Atlas connection string)

### 1. Clone the Repository

```bash
git clone https://github.com/Rakshitkulkarni223/ProcureAI.git
cd ProcureAI
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
MONGO_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net
DB_NAME=procureai
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=8001
DEMO_EMAIL=demo@procureai.com
DEMO_PASSWORD=Demo@123
DEMO_NAME=Demo User
CORS_ORIGINS=*
```

Start the backend:

```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload   # Development
uvicorn server:app --host 0.0.0.0 --port 8001             # Production
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

Start the frontend:

```bash
npm start
```

---

## 🛠️ Developer Guide

### Project Structure

```
ProcureAI/
├── backend/
│   ├── server.py               # FastAPI entry point (Uvicorn)
│   ├── requirements.txt        # Python dependencies
│   └── app/
│       ├── config.py           # Env vars, categories, suppliers, weight profiles, catalog
│       ├── database.py         # Motor async MongoDB client
│       ├── auth.py             # JWT (PyJWT), bcrypt password hashing, auth dependency
│       ├── schemas.py          # Pydantic validation models
│       ├── routes.py           # All API routes under /api prefix
│       ├── seed.py             # DB seeder (categories, suppliers, demo user, sample history)
│       └── services/
│           ├── core.py         # PRNG, CatalogResolver, MockProviderAdapter, Search, Comparison, Recommendation
│           ├── basket.py       # Basket optimization (split-cart)
│           └── analytics.py    # Dashboard, History, Preference, Catalog services
│
├── frontend/
│   └── src/
│       ├── components/         # Reusable UI (AppLayout, Card, Badge, DateRangeFilter, etc.)
│       ├── context/            # AuthContext, ThemeContext
│       ├── hooks/              # useSearchSuggestions, useWatchlist
│       ├── lib/                # api client, formatters, exportUtils
│       ├── pages/              # Dashboard, Search, BusinessImpact, Analytics, History, Watchlist, Settings, Docs
│       └── types.ts            # Shared TypeScript interfaces
│
├── screenshots/               # Product screenshots for README
└── README.md
```

### Design Decisions

- **Adapter Pattern** — Supplier integrations use an adapter interface so mock data can be swapped for real APIs without touching business logic.
- **Service Layer** — All database access goes through service classes, keeping Motor queries out of routes.
- **Async concurrency** — Individual supplier failures don't block the entire search (asyncio gather with error handling).
- **Fire-and-forget history** — Search history is persisted asynchronously. Only successful searches (with results) are saved.
- **Date range filtering** — Dashboard, Analytics, and Business Impact endpoints accept optional `from`/`to` query params.
- **Business impact metrics** — Derived from search history: hours saved (manual 45 min vs AI 3 min), efficiency score (composite of accuracy + automation + volume), projected annual savings.
- **Weight profiles** — The recommendation engine is fully configurable via weight profiles.

### Conventions

- **Backend**: FastAPI routes → Service layer → MongoDB (Motor). All functions wrapped in try-catch. Responses use `{"success": true, "data": ...}`.
- **Frontend**: Functional components with hooks. State collocated in page components. `api.ts` centralizes all HTTP calls. TailwindCSS utility classes for styling.
- **Error handling**: All functions wrapped in try-catch blocks. Backend raises `HTTPException`. Frontend uses `apiError()` helper.
- **Validation**: Pydantic models for backend request validation. TypeScript interfaces on the frontend.

### Running Tests

```bash
cd backend
python -m pytest tests/backend_test.py -v
```

---

## 🗺️ Future Roadmap

| Phase | Feature | Description |
|---|---|---|
| **P1** | Real Supplier Integrations | Connect to live marketplace APIs (Amazon, Flipkart, IndiaMART) for real-time pricing |
| **P1** | ERP Integration | Sync procurement data with SAP, Oracle, or Zoho for seamless order management |
| **P2** | Approval Workflows | Multi-level purchase approval chains with role-based routing |
| **P2** | Predictive Procurement | ML-based demand forecasting and optimal reorder point suggestions |
| **P3** | Inventory Synchronization | Real-time stock level monitoring across warehouses and suppliers |
| **P3** | Supplier Scorecards | Historical performance tracking — on-time delivery, quality, SLA compliance |
| **Future** | Multi-currency Support | Cross-border procurement with automatic currency conversion |
| **Future** | Mobile App | React Native companion for on-the-go procurement approvals |

---

<p align="center">
  <b>ProcureAI</b> — Smart Procurement, Powered by AI<br/>
  <a href="https://github.com/Rakshitkulkarni223/ProcureAI">GitHub</a>
</p>
