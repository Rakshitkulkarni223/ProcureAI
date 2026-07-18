<p align="center">
  <img src="screenshots/dashboard.png" alt="ProcureAI Dashboard" width="800" />
</p>

# 🚀 ProcureAI — Procurement Decision Intelligence Platform

> Compare marketplace and private suppliers from a single interface. Optimize purchasing with a multi-factor decision engine and optional AI-powered explanations.

- ✅ Compare online + offline suppliers in one search
- ✅ Multi-factor recommendation engine with confidence scores
- ✅ 6 procurement strategies for different business goals
- ✅ Split-cart basket optimization across all suppliers
- ✅ Build a private supplier network (Supplier Hub)
- ✅ Track procurement ROI with Business Impact Dashboard

[![GitHub](https://img.shields.io/badge/GitHub-Rakshitkulkarni223%2FProcureAI-blue?logo=github)](https://github.com/Rakshitkulkarni223/ProcureAI)

---

## 🌐 Live Demo

> Try ProcureAI right now — no setup required.

| | |
|---|---|
| **Production** | [https://buywise-compare-1.emergent.host](https://buywise-compare-1.emergent.host) |
| **Preview** | [https://buywise-compare-1.preview.emergentagent.com](https://buywise-compare-1.preview.emergentagent.com) |
| **Email** | `demo@procureai.com` |
| **Password** | `Demo@123` |

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Product Search** | Search any product across marketplace and private suppliers — results normalized, scored, and ranked |
| **Supplier Hub** | Register offline suppliers with products, pricing, and delivery info — they appear in every search |
| **Basket Optimization** | Split-cart optimizer finds the cheapest multi-item combination across suppliers |
| **Explanation Panel** | Radar chart + scoreboard + business reasoning for every recommendation (rule-based or AI-generated via Gemini) |
| **6 Recommendation Modes** | Balanced, Lowest Cost, Lowest Risk, Fastest Delivery, Highest Reliability, Best Long-Term Value |
| **Location-Aware Delivery** | Same city → 1 day, same state → 2 days, different state → 4–5 days |
| **Business Impact Dashboard** | Savings, hours saved, efficiency score, projected annual savings — with date range filtering |
| **ROI Calculator** | Interactive sliders — estimate monthly hours saved, salary savings, annual cost reduction |
| **Export Reports** | CSV and styled PDF export from comparison results |
| **Price Watchlist** | Track prices and set target alerts across sessions |
| **Search History** | Paginated per-user log with basket entries tagged |
| **Dark Mode** | Full light/dark theme support with CSS variable theming |

---

## 📸 Screenshots

| Dashboard | Search & Compare | Explanation Panel |
|---|---|---|
| ![Dashboard](screenshots/dashboard.png) | ![Search](screenshots/search-compare.png) | ![AI](screenshots/ai-explanation.png) |

| Basket Optimization | Business Impact | ROI Calculator |
|---|---|---|
| ![Basket](screenshots/basket-optimization.png) | ![Impact](screenshots/business-impact.png) | ![ROI](screenshots/roi-calculator.png) |

<details>
<summary>More screenshots</summary>

| Analytics | Search History | Watchlist |
|---|---|---|
| ![Analytics](screenshots/analytics.png) | ![History](screenshots/history.png) | ![Watchlist](screenshots/watchlist.png) |

| Settings | Documentation |
|---|---|
| ![Settings](screenshots/settings.png) | ![Docs](screenshots/docs.png) |

</details>

---

## 🎬 Demo Video

> Full walkthrough: Login → Dashboard → Business Impact → Search & Compare → Basket Optimizer → Analytics → History → Watchlist → Settings → Docs → Dark Mode

[Demo Video](https://github.com/user-attachments/assets/80705382-ff09-4438-9ee8-7c09f00f426b)

<details>
<summary>Can't see the video? Click to expand.</summary>

Download from [`demo/procureai-demo.mp4`](demo/procureai-demo.mp4) and play locally.

</details>

---

## 🏗️ System Design

```
┌─────────────────────────────────────────┐
│           React SPA (Browser)           │
│  Dashboard │ Search │ Hub │ Impact │ …  │
└──────────────────┬──────────────────────┘
                   │ Axios / HTTP JSON
┌──────────────────┼──────────────────────┐
│          FastAPI Backend (Python)        │
│                  │                       │
│   ┌──────────────┴──────────────┐       │
│   │  Multi-factor Recommendation │       │
│   │       Engine (6 modes)       │       │
│   └──────┬───────────┬──────────┘       │
│          │           │                   │
│  ┌───────┴───┐ ┌─────┴──────┐           │
│  │Marketplace│ │ Supplier   │           │
│  │ Adapter   │ │Hub Adapter │           │
│  └───────┬───┘ └─────┬──────┘           │
│          │           │                   │
│  ┌───────┴───┐ ┌─────┴──────┐           │
│  │  SerpAPI  │ │  Gemini    │           │
│  │ Adapter   │ │  Advisor   │           │
│  │(optional) │ │ (optional) │           │
│  └───────────┘ └────────────┘           │
│          │                               │
│   ┌──────┴───────────────────────┐      │
│   │  Services (Motor async)      │      │
│   └──────────────┬───────────────┘      │
└──────────────────┼──────────────────────┘
                   │
           ┌───────┴───────┐
           │    MongoDB    │
           │ (Atlas/Local) │
           └───────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, TailwindCSS, React Router v6, Recharts, Framer Motion, Lucide |
| **Backend** | Python 3.13, FastAPI, Pydantic, Uvicorn |
| **Database** | MongoDB with Motor (async driver) |
| **Auth** | JWT (PyJWT) + bcrypt |
| **Optional** | SerpAPI (live Google Shopping), Gemini 2.0 Flash (natural language explanations) |

---

## ⚡ Performance

- Async supplier search — concurrent adapter execution via `asyncio.gather`
- Error isolation — individual supplier failures don't block the search
- MongoDB indexing on frequently queried fields
- Stateless JWT auth — no session storage
- Lazy-loaded React routes — code-split per page
- Fire-and-forget history persistence — non-blocking writes

---

## 🔒 Security

- JWT authentication with configurable expiry (PyJWT)
- bcrypt password hashing (12 salt rounds)
- Protected API endpoints — bearer token required
- Input validation via Pydantic models on every request
- Environment variable secrets — no hardcoded credentials
- CORS configuration per environment (FastAPI CORSMiddleware)

---

## 🧩 Engineering Challenges

- Unified different supplier response schemas using the **Adapter Pattern**
- Balanced weighted scoring across **7 procurement factors** with configurable weight profiles
- Implemented **split-cart optimization** — finds cheapest multi-item combination across suppliers
- Built **explainable recommendations** — confidence scores, radar charts, and business reasoning
- **Location-aware delivery estimation** — city/state distance-based delivery days
- Async aggregation with **error isolation** — one failing supplier doesn't break the search
- Optional **Gemini LLM integration** with graceful fallback to rule-based explanations

---

## 🚀 Setup

### Prerequisites

- Python >= 3.11 · Node.js >= 18.x · MongoDB (local or Atlas)

### Quick Start

```bash
# Clone
git clone https://github.com/Rakshitkulkarni223/ProcureAI.git
cd ProcureAI

# Backend
cd backend && pip install -r requirements.txt

# Frontend
cd ../frontend && npm install
```

### Environment Variables

```env
# backend/.env
MONGO_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net
DB_NAME=procureai
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=8001
DEMO_EMAIL=demo@procureai.com
DEMO_PASSWORD=Demo@123
DEMO_NAME=Demo User
CORS_ORIGINS=*
SERPAPI_KEY=                    # Optional — live Google Shopping (free: serpapi.com)
GEMINI_API_KEY=                # Optional — AI Procurement Advisor (free: ai.google.dev)

# frontend/.env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Run

```bash
# Backend
cd backend && uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd frontend && npm start
```

### Tests

```bash
cd backend && python -m pytest tests/backend_test.py -v
```

---

## 🗺️ Future Roadmap

| Phase | Feature |
|-------|---------|
| **✅ Available (Optional)** | Live Google Shopping prices via SerpAPI · AI Procurement Advisor via Gemini |
| **P1** | Amazon/Udaan/Metro APIs · Live Supplier Quotes · ERP Integration · WhatsApp Quotes |
| **P2** | Invoice OCR · AI Negotiation · Approval Workflows · Predictive Procurement |
| **P3** | Inventory Sync · Supplier Scorecards |
| **Future** | Multi-currency · Mobile App |

---

## 🏅 Highlights

- ✅ 40+ REST API endpoints
- ✅ React + FastAPI full-stack architecture
- ✅ JWT authentication with bcrypt
- ✅ Async MongoDB backend (Motor)
- ✅ Multi-factor decision engine (7 scoring dimensions)
- ✅ 6 configurable procurement strategies
- ✅ Split-cart basket optimization algorithm
- ✅ Supplier Hub — private supplier management
- ✅ Business Impact Dashboard + ROI Calculator
- ✅ PDF & CSV export
- ✅ Location-aware delivery estimation
- ✅ Responsive UI with dark mode
- ✅ Built-in interactive documentation

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [docs/API.md](docs/API.md) | Full API reference — all endpoints with auth requirements |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, scoring pipeline, recommendation modes, workflow diagrams |
| [docs/DESIGN.md](docs/DESIGN.md) | Project structure, design decisions, conventions, data model |

---

<p align="center">
  <b>ProcureAI</b> — Transforming procurement from comparing prices to making intelligent business decisions.<br/>
  <a href="https://github.com/Rakshitkulkarni223/ProcureAI">GitHub</a>
</p>
