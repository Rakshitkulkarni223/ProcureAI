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
- 2026-07-04: **Fixed production 503 "Backend service is starting" (P0).** In prod,
  `node_modules` is gitignored (absent) so the Node backend couldn't start via
  runtime install. Fix: added esbuild `yarn bundle` -> single self-contained
  `dist/server.bundle.js` (no node_modules needed at runtime). `server.py` now spawns
  `node dist/server.bundle.js` in a background thread with a watchdog (auto-restart on
  crash), only when :8002 isn't already served (skips in preview). Also added native
  `/health` + `/api/health` (200). `env.ts` dotenv path -> `process.cwd()`. Swagger
  setup wrapped in try/catch. Validated: production spawn path (curl) + testing_agent
  9/9 backend pass, no 503. NOTE: re-run `yarn bundle` after any backend code change
  before deploying.
- 2026-07-04: Fixed `.gitignore` deployment blockers (unignored `.env`* and
  `package*.json`; ignored `memory/test_credentials.md`). deployment_agent: pass.
- 2026-07-04: Initial deployment fix — native `/health` + FastAPI bootstrap of Node.

## Upcoming / Backlog
- P1: Multi-product results grouping
- P2: Brand-filter UI
- P2: Search history pagination
- Future: Real marketplace/local-supplier APIs, Purchase Request & Approval workflows,
  Budget Tracking & Inventory Management

## Test Credentials
- admin@procureai.com / Admin@123 (see test_credentials.md)
