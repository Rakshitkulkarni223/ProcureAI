# ProcureAI — Procurement & Vendor Intelligence Platform

## Problem Statement
AI-powered platform to discover, compare, and analyze products across multiple
procurement sources from a single dashboard.

## Tech Stack (as chosen by user)
- Frontend: React + TypeScript (port 3000)
- Backend: Node.js + Express + TypeScript (port 8002, Clean Architecture)
- Proxy: FastAPI `server.py` (port 8001, platform-required) reverse-proxies `/api/*` to Node
- DB: MongoDB (Mongoose), `MONGO_URL` + `DB_NAME` from `backend/.env`
- Auth: JWT (deterministic weighted-scoring AI, no LLM)

## Phase 1 (COMPLETE)
- Mock Provider Adapters (Amazon, Flipkart, etc.)
- JWT Auth, Dashboard, Categories, Product Search & Comparison
- Explainable AI Recommendation (deterministic weighted scoring, profile variants)
- AI Insights Dashboard
- Split-Cart Optimization (Multi-Supplier Basket) + unit tests

## Architecture Notes
- Node runs on :8002, FastAPI proxy on :8001. Ingress routes `/api/*` -> :8001.
- Compiled build: `yarn build` -> `dist/`; production runs `node dist/app.js`.

## Changelog
- 2026-07-04: **Fixed production deployment failure (P0).** Root cause: production
  K8s only runs `server.py` (Uvicorn); the custom `node-backend` supervisor program
  is preview-only, so Node never booted in prod -> 503 on `/health`. Fix in
  `server.py`: (1) native `GET /health` -> 200 `{"status":"ok"}` (declared before
  proxy catch-all, not proxied); (2) non-blocking background-thread bootstrap that
  spawns `node dist/app.js` only when :8002 isn't already served (skips in preview,
  spawns in prod), running `yarn install` only if `node_modules` is missing, passing
  `os.environ` (prod `MONGO_URL`). Validated: `/health` 200, proxied login OK,
  standalone `node dist/app.js` connects+seeds+serves.

## Upcoming / Backlog
- P1: Multi-product results grouping
- P2: Brand-filter UI
- P2: Search history pagination
- Future: Real marketplace/local-supplier APIs, Purchase Request & Approval workflows,
  Budget Tracking & Inventory Management

## Test Credentials
- admin@procureai.com / Admin@123 (see test_credentials.md)
