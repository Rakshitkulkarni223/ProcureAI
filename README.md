# ProcureAI — AI-Powered Procurement & Vendor Intelligence Platform

## Table of Contents

- [Application Overview](#application-overview)
- [Architecture](#architecture)
- [Application Flow](#application-flow)
- [Module-wise Explanation](#module-wise-explanation)
- [API Reference](#api-reference)
- [Setup & Running the Project](#setup--running-the-project)
- [Developer Guide](#developer-guide)

---

## Application Overview

### Purpose

ProcureAI is an AI-powered procurement platform that helps organizations compare products across multiple suppliers, optimize purchasing decisions, and track savings — all from a single dashboard.

### Problem It Solves

Procurement teams manually compare prices across dozens of supplier websites, miss volume discounts, and lack data-driven visibility into spend patterns. ProcureAI automates multi-supplier search, applies weighted scoring to recommend the best vendor, and optimizes multi-item baskets for cost, delivery, and quality.

### Key Features

| Feature | Description |
|---|---|
| **Single Product Search** | Search any product across all configured suppliers in one click. Results are normalized and ranked by an AI recommendation engine. |
| **Basket Optimization** | Add multiple items to a basket. The split-cart optimizer finds the cheapest combination across suppliers while factoring in consolidation penalties (shipping). |
| **Weight Profiles** | Choose from predefined profiles (Balanced, Cost Saver, Speed Priority, Quality First) that adjust how price, delivery, rating, discount, warranty, and return policy are weighted. |
| **Dashboard & Analytics** | Real-time KPIs: total searches, estimated savings, top categories, supplier usage, monthly spend trends, and savings trends. |
| **Search History** | Paginated, per-user log of every comparison. Re-run or delete past searches. |
| **User Preferences** | Persist default category, currency, and notification settings. |
| **Auth** | JWT-based registration and login with bcrypt password hashing. |

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (React SPA)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │Dashboard │ │ Search & │ │Analytics │ │  History   │  │
│  │  Page    │ │ Compare  │ │  Page    │ │   Page     │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘  │
│       │             │            │              │        │
│       └─────────────┴─────┬──────┴──────────────┘        │
│                           │  Axios API Client            │
└───────────────────────────┼──────────────────────────────┘
                            │ HTTP / JSON
┌───────────────────────────┼──────────────────────────────┐
│                    Express API Server                    │
│  ┌─────────┐  ┌───────────────┐  ┌────────────────────┐ │
│  │  Auth   │  │   Search &    │  │  Basket Optimizer  │ │
│  │Middleware│  │  Comparison   │  │  (Split-Cart)      │ │
│  └────┬────┘  └───────┬───────┘  └─────────┬──────────┘ │
│       │               │                    │             │
│       │        ┌──────┴───────┐            │             │
│       │        │  Provider    │            │             │
│       │        │  Adapters    │            │             │
│       │        │ (Mock Data)  │            │             │
│       │        └──────────────┘            │             │
│  ┌────┴────────────────────────────────────┴──────────┐  │
│  │              Repositories (Mongoose)               │  │
│  └────────────────────────┬───────────────────────────┘  │
└───────────────────────────┼──────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │   MongoDB     │
                    │  (Atlas /     │
                    │   Local)      │
                    └───────────────┘
```

### Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, TailwindCSS, React Router v6, Axios, Recharts, Framer Motion, Lucide Icons |
| **Backend** | Node.js, Express 4, TypeScript, Zod (validation), Swagger UI |
| **Database** | MongoDB with Mongoose ODM |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **Dev Tools** | tsx (dev server), react-scripts, PostCSS, Autoprefixer |

### Project Structure

```
ProcureAI/
├── backend/
│   └── src/
│       ├── adapters/           # Provider adapters (MockProviderAdapter, ProviderFactory)
│       ├── config/             # env, db, seed data, swagger spec
│       ├── controllers/        # Request handlers (Auth, Search, Basket, History, Dashboard, etc.)
│       ├── interfaces/         # ProviderAdapter interface
│       ├── middleware/         # auth (JWT verify), error handler
│       ├── mock-data/          # catalog.json — product catalog per supplier
│       ├── models/             # Mongoose schemas (User, SearchHistory, BasketHistory, Category, Supplier, UserPreference)
│       ├── repositories/       # Data access layer (CRUD + pagination)
│       ├── routes/             # Express routers
│       ├── services/           # Business logic (Search, Comparison, Recommendation, BasketOptimization, Dashboard, etc.)
│       ├── types/              # Shared TypeScript interfaces
│       ├── utils/              # http helpers, logger, currency
│       └── validators/         # Zod schemas
│
├── frontend/
│   └── src/
│       ├── components/         # Reusable UI (AppLayout, Card, Badge, ComparisonResults, BasketResults, etc.)
│       ├── context/            # AuthContext (React Context + Provider)
│       ├── lib/                # api client, formatters, icons, utils
│       ├── pages/              # Route-level pages (Dashboard, Search, Analytics, History, Settings, Login, Register)
│       └── types.ts            # Shared frontend type definitions
│
└── README.md
```

---

## Application Flow

### End-to-End Request Flow

```
User Action          Frontend                     Backend                         Database
    │                    │                            │                               │
    │  1. Login          │                            │                               │
    │───────────────────►│  POST /api/auth/login      │                               │
    │                    │───────────────────────────►│  Verify password (bcrypt)      │
    │                    │                            │──────────────────────────────►│
    │                    │◄───────────────────────────│  Return JWT token             │
    │◄───────────────────│  Store token, redirect     │                               │
    │                    │                            │                               │
    │  2. Search         │                            │                               │
    │───────────────────►│  POST /api/search           │                               │
    │                    │───────────────────────────►│  a) Resolve supplier adapters  │
    │                    │                            │  b) Query all in parallel      │
    │                    │                            │  c) Normalize & dedupe         │
    │                    │                            │  d) Apply comparison/sort      │
    │                    │                            │  e) Run recommendation engine  │
    │                    │                            │  f) Persist history ──────────►│
    │                    │◄───────────────────────────│  Return ranked results         │
    │◄───────────────────│  Display comparison table  │                               │
    │                    │                            │                               │
    │  3. Basket Optimize│                            │                               │
    │───────────────────►│  POST /api/basket/optimize  │                               │
    │                    │───────────────────────────►│  a) Search each basket item    │
    │                    │                            │  b) Score per supplier/item    │
    │                    │                            │  c) Build SPLIT vs CONSOL plan │
    │                    │                            │  d) Compare + recommend        │
    │                    │                            │  e) Persist basket history ───►│
    │                    │◄───────────────────────────│  Return optimization result    │
    │◄───────────────────│  Display basket results    │                               │
```

### User Journey

```
┌──────────┐     ┌──────────────┐     ┌─────────────────┐     ┌───────────────┐
│  Login / │────►│  Dashboard   │────►│  Search &       │────►│  View Results │
│ Register │     │  (KPIs +     │     │  Compare        │     │  + AI         │
│          │     │   insights)  │     │  (Single/Basket)│     │  Recommend.   │
└──────────┘     └──────┬───────┘     └────────┬────────┘     └───────┬───────┘
                        │                      │                      │
                        ▼                      ▼                      ▼
                 ┌──────────────┐     ┌─────────────────┐     ┌───────────────┐
                 │  Analytics   │     │   History        │     │  Settings     │
                 │  (Spend,     │     │   (Paginated,    │     │  (Preferences,│
                 │   Savings)   │     │    Re-run,       │     │   Profile)    │
                 │              │     │    Delete)        │     │              │
                 └──────────────┘     └─────────────────┘     └───────────────┘
```

---

## Module-wise Explanation

### Backend Modules

#### 1. Adapters (`adapters/`)

- **`MockProviderAdapter`** — Simulates supplier APIs using a local `catalog.json`. Each adapter is instantiated per supplier name and returns normalized `Product` objects.
- **`ProviderFactory`** — Creates the correct adapter for a given supplier name. In production, this is where real API adapters would be plugged in.

#### 2. Services (`services/`)

| Service | Responsibility |
|---|---|
| **`AuthService`** | Registration (bcrypt hash), login (password verify + JWT sign) |
| **`SearchService`** | Resolves adapters, queries suppliers in parallel (`Promise.allSettled`), normalizes results, runs comparison + recommendation, persists history |
| **`ComparisonService`** | Deduplicates products, applies filters, sorts by chosen strategy |
| **`RecommendationService`** | AI scoring engine — normalizes price/delivery/rating/discount/warranty/returns to 0–1, multiplies by weight profile, sums to a final score. Generates human-readable reasons. |
| **`BasketOptimizationService`** | Split-cart optimizer. Builds a SPLIT plan (best supplier per item) vs. CONSOLIDATED baseline (single supplier). Applies consolidation penalty for shipping. |
| **`DashboardService`** | Aggregates KPIs from search/basket history |
| **`CatalogService`** | Returns categories and suppliers per category |
| **`HistoryService`** | Paginated listing and deletion of search history |
| **`PreferenceService`** | CRUD for user preferences |

#### 3. Models (`models/`)

| Model | Key Fields |
|---|---|
| **User** | name, email, password (hashed), role |
| **SearchHistory** | userId, query, category, suppliers, resultCount, recommendedSupplier, bestPrice, estimatedSavings, weightProfile |
| **BasketHistory** | userId, category, suppliers, items[], splitTotal, baselineTotal, estimatedSavings, recommendedPlan |
| **Category** | name, slug, icon |
| **Supplier** | name, slug, color, enabled, categories[] |
| **UserPreference** | userId, defaultCategory, currency, notifications |

#### 4. Repositories (`repositories/`)

Data access layer wrapping Mongoose queries. Each repository provides `create`, `listByUser`, `paginatedByUser`, `deleteById`, etc. Compound indexes on `{ userId: 1, createdAt: -1 }` ensure fast paginated reads.

### Frontend Modules

#### Pages

| Page | Route | Purpose |
|---|---|---|
| **LoginPage** | `/login` | Email + password login form |
| **RegisterPage** | `/register` | New user registration |
| **DashboardPage** | `/` | KPIs, recent searches, spend & savings charts |
| **SearchPage** | `/search` | Single search + basket optimization, supplier selection, weight profiles |
| **AnalyticsPage** | `/analytics` | Spend by month/category, supplier usage, savings trend |
| **HistoryPage** | `/history` | Paginated search history with Prev/Next, re-run, delete |
| **SettingsPage** | `/settings` | User preferences |

#### Key Components

| Component | Purpose |
|---|---|
| **AppLayout** | Sidebar navigation + responsive mobile menu |
| **ComparisonResults** | Renders the supplier comparison table for single search |
| **BasketResults** | Renders the split-cart optimization results |
| **RecommendationCard** | Displays the AI recommendation with score, confidence, and reasons |
| **WeightProfileSelector** | UI for selecting weight profiles (Balanced, Cost Saver, etc.) |
| **SupplierLogo** | Renders supplier avatar with brand color |
| **AuthShell** | Layout wrapper for login/register pages |
| **ProtectedRoute** | Route guard that redirects unauthenticated users to `/login` |

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login, returns JWT token |
| GET | `/api/auth/me` | Get current user profile |

### Catalog

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories` | List all product categories |
| GET | `/api/suppliers/:category` | List suppliers for a category |

### Search & Compare

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/search` | Search products across suppliers |

### Basket Optimization

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/basket/optimize` | Optimize a multi-item basket |
| GET | `/api/basket/history?page=1&limit=20` | Paginated basket optimization history |

### History

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/history?page=1&limit=20` | Paginated search history (default page=1, limit=20, max limit=100) |
| DELETE | `/api/history/:id` | Delete a history entry |

### Preferences

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/preferences` | Get user preferences |
| PUT | `/api/preferences` | Update user preferences |
| GET | `/api/weight-profiles` | List available weight profiles |

### Dashboard & Analytics

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Dashboard KPIs |
| GET | `/api/analytics/spend` | Spend analytics (monthly, category, supplier) |
| GET | `/api/analytics/savings` | Savings trend + total savings |
| GET | `/api/insights` | AI-generated procurement insights |

---

## Setup & Running the Project

### Prerequisites

- **Node.js** >= 18.x
- **npm** or **yarn**
- **MongoDB** (local or Atlas connection string)

### 1. Clone the Repository

```bash
git clone https://github.com/Rakshitkulkarni223/ProcureAI.git
cd ProcureAI
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
MONGO_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net
DB_NAME=procureai
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=8002
ADMIN_EMAIL=admin@procureai.com
ADMIN_PASSWORD=Admin@123
ADMIN_NAME=Procurement Admin
CORS_ORIGINS=*
NODE_ENV=development
```

Start the backend:

```bash
npm run dev        # Development (hot-reload)
npm run build      # Compile TypeScript
npm start          # Production
```

The API will be available at `http://localhost:8002`. Swagger docs at `http://localhost:8002/api/docs`.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```env
REACT_APP_BACKEND_URL=http://localhost:8002
```

Start the frontend:

```bash
npm start
```

The app will be available at `http://localhost:3000`.

### 4. Default Login

| Field | Value |
|---|---|
| Email | `admin@procureai.com` |
| Password | `Admin@123` |

The admin user is automatically created via the seed script on first startup.

---

## Developer Guide

### Common Workflows

1. **Add a new supplier adapter** — Create a class implementing `ProviderAdapter` in `adapters/`, register it in `ProviderFactory.create()`.
2. **Add a new category** — Add to `CATEGORY_SUPPLIERS` in `config/data.ts` and add catalog entries in `mock-data/catalog.json`.
3. **Add a new weight profile** — Add to `WEIGHT_PROFILES` in `config/data.ts`.
4. **Add a new API endpoint** — Create controller → service → repository → route file → register in `routes/index.ts`.

### Design Decisions

- **Adapter Pattern** — Supplier integrations use an adapter interface so mock data can be swapped for real APIs without touching business logic.
- **Repository Pattern** — All database access goes through repositories, keeping Mongoose out of services and controllers.
- **Promise.allSettled** — Individual supplier failures don't block the entire search. Failed providers are logged and skipped.
- **Fire-and-forget history** — Search history is persisted asynchronously so it never slows down the response.
- **Compound indexes** — `{ userId: 1, createdAt: -1 }` on both history collections for efficient user-scoped, time-sorted pagination.
- **Weight profiles** — The recommendation engine is fully configurable via weight profiles, making it easy to add new scoring strategies.

### Conventions

- **Backend**: Controller → Service → Repository layering. All async handlers wrapped in `asyncHandler`. Responses use `ok(res, data)`.
- **Frontend**: Functional components with hooks. State collocated in page components. `api.ts` centralizes all HTTP calls. TailwindCSS utility classes for styling.
- **Error handling**: All functions wrapped in try-catch blocks. Backend uses `ApiError` class with status codes. Frontend uses `apiError()` helper for user-friendly messages.
- **TypeScript**: Strict types shared between layers. Zod for runtime request validation on the backend.

### Running Tests

```bash
cd backend
npm run test:unit    # Basket optimizer unit tests
npm run typecheck    # TypeScript type checking
```
