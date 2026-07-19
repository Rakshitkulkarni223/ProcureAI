"""
ProcureAI — FastAPI Backend

Native Python/FastAPI backend that replaces the previous Node.js/Express +
reverse-proxy architecture. Runs on port 8001 (Emergent platform ingress).
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import env
from app.database import close_db, connect_db
from app.routes import router
from app.routes_supplier import router as supplier_router
from app.routes_ai import router as ai_router
from app.seed import run_seed


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Startup / shutdown lifecycle."""
    try:
        await connect_db()
        await run_seed()
    except Exception as exc:
        print(f"[ERROR] Startup failed: {exc}")
    yield
    try:
        await close_db()
    except Exception:
        pass


app = FastAPI(
    title="ProcureAI API",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    lifespan=lifespan,
)

# CORS
try:
    origins = ["*"] if env.CORS_ORIGINS == "*" else [o.strip() for o in env.CORS_ORIGINS.split(",")]
except Exception:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API routes under /api
app.include_router(router, prefix="/api")
app.include_router(supplier_router, prefix="/api")
app.include_router(ai_router, prefix="/api")


# -----------------------------------------------------------------------
# Root & health endpoints (outside /api prefix)
# -----------------------------------------------------------------------

@app.get("/")
async def root():
    try:
        return JSONResponse({"success": True, "service": "procureai-api", "docs": "/api/docs"})
    except Exception:
        return JSONResponse({"success": True, "service": "procureai-api"})


@app.get("/health")
async def health_check():
    try:
        return JSONResponse({"status": "ok"})
    except Exception:
        return JSONResponse({"status": "ok"})
