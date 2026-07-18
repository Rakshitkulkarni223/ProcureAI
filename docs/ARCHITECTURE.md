# 🏗️ Architecture

## System Design

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

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser (React SPA)                       │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐           │
│  │Dashboard │ │ Search & │ │ Supplier  │ │ Business │           │
│  │          │ │ Compare  │ │   Hub     │ │  Impact  │           │
│  └────┬─────┘ └────┬─────┘ └─────┬─────┘ └────┬─────┘           │
│       └─────────────┴─────────────┴─────────────┘                │
│                           │  Axios API Client                    │
└───────────────────────────┼──────────────────────────────────────┘
                            │ HTTP / JSON
┌───────────────────────────┼──────────────────────────────────────┐
│                    FastAPI Backend (Python)                       │
│                                                                  │
│  ┌─────────┐  ┌────────────────────────────────────────────────┐ │
│  │  Auth   │  │            Search & Comparison                 │ │
│  │  (JWT)  │  │  ┌──────────────┐     ┌─────────────────────┐  │ │
│  └────┬────┘  │  │ Marketplace  │     │   Supplier Hub      │  │ │
│       │       │  │  Adapters    │     │  (Your Suppliers)   │  │ │
│       │       │  └──────┬───────┘     └─────────┬───────────┘  │ │
│       │       │         └───────────┬───────────┘              │ │
│       │       │                     ▼                          │ │
│       │       │        ┌────────────────────────┐              │ │
│       │       │        │  Multi-factor          │              │ │
│       │       │        │  Recommendation Engine │              │ │
│       │       │        └────────────┬───────────┘              │ │
│       │       └─────────────────────┼──────────────────────────┘ │
│       │                             ▼                            │
│       │                ┌────────────────────────┐                │
│       │                │   Basket Optimizer     │                │
│       │                │   (Split-Cart)         │                │
│       │                └────────────┬───────────┘                │
│  ┌────┴─────────────────────────────┴────────────────────────┐   │
│  │              Services (Motor async MongoDB)               │   │
│  └──────────────────────────┬────────────────────────────────┘   │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                      ┌───────┴───────┐
                      │   MongoDB     │
                      │  (Atlas /     │
                      │   Local)      │
                      └───────────────┘
```

---

## Scoring Pipeline

```
User Search
    │
    ▼
┌─────────────────────────────────────┐
│  Marketplace Results + Supplier Hub  │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│  Normalization & Scoring             │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│  Recommendation Engine (6 modes)     │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│  Explainable AI (reasoning + chart)  │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│  Recommendation + Business Impact    │
└─────────────────────────────────────┘
```

---

## Procurement Workflow

```
     ┌───────────────────┐     ┌────────────────────────────┐
     │  Supplier Network  │     │  Marketplace Sources        │
     │  (Your Suppliers)  │     │  (Mock + opt. Google Shop.) │
     └────────┬──────────┘     └──────────────┬─────────────┘
              └──────────────┬─────────────┘
                             ▼
              ┌──────────────────────────┐
              │  Multi-factor            │
              │  Recommendation Engine   │
              └────────────┬─────────────┘
                           ▼
              ┌──────────────────────────┐
              │  Recommendation + Explain│
              └────────────┬─────────────┘
                           ▼
              ┌──────────────────────────┐
              │   Basket Optimization    │
              └────────────┬─────────────┘
                           ▼
              ┌──────────────────────────┐
              │  Business Impact + Export│
              └──────────────────────────┘
```

1. **Build** — Add your trusted suppliers and products to Supplier Hub
2. **Search** — ProcureAI queries marketplace and private suppliers from a single interface
3. **Compare** — Results from online and offline suppliers are normalized in one sortable table
4. **Recommend** — The decision engine scores every option across price, delivery, reliability, risk, warranty, and returns
5. **Explain** — Click "Why this recommendation?" for a radar chart, scoreboard, and business reasoning
6. **Optimize** — Add multiple items to a basket for split-cart optimization across all suppliers
7. **Export** — Download results as CSV or styled PDF for team review
8. **Track** — Monitor savings, hours freed, and procurement efficiency on the Business Impact dashboard

---

## Recommendation Modes

The same supplier may not be the best choice under every business objective. ProcureAI supports **6 recommendation modes** that dynamically rerank suppliers.

| Mode | Optimizes For | Best When |
|------|---------------|-----------|
| **Balanced** | Weighted score across all factors | Default — general-purpose procurement |
| **Lowest Cost** | Total procurement cost (price + shipping + handling) | Budget is the primary constraint |
| **Lowest Risk** | Composite risk score (price stability, delivery risk) | Buying critical or high-value items |
| **Fastest Delivery** | Minimum delivery days | Urgent or time-sensitive purchases |
| **Highest Reliability** | Supplier delivery consistency and rating | Repeat orders where reliability matters |
| **Best Long-Term Value** | Supplier score (quality + consistency + warranty) | Building long-term supplier relationships |

Each mode generates **different business-friendly reasoning** explaining why the recommended supplier was chosen.

---

## What the AI Evaluates (7 Factors)

| Factor | What It Measures |
|--------|-----------------|
| **Price** | Unit cost, line total, volume discounts |
| **Delivery** | Estimated days based on supplier location and user city |
| **Reliability** | Supplier rating, delivery consistency |
| **Warranty** | Coverage duration in months |
| **Returns** | Return policy availability and terms |
| **Risk** | Composite risk score (price volatility, delivery risk, supplier concentration) |
| **Total Cost** | Full procurement cost including shipping, handling, and consolidation penalties |

---

## Optional Integrations

| Integration | Env Variable | Purpose | Fallback |
|-------------|-------------|---------|----------|
| **SerpAPI** | `SERPAPI_KEY` | Live Google Shopping prices blended into scoring | Built-in mock providers |
| **Google Gemini** | `GEMINI_API_KEY` | Natural language explanations for recommendations | Rule-based template explanations |
