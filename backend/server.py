"""
Reverse proxy (port 8001, Uvicorn) -> Node/Express backend (port 8002).

The platform ingress routes every `/api/*` request to port 8001. The real application
is a Node.js + Express + TypeScript service running on port 8002. This FastAPI app:

  1. Serves a native `/health` endpoint (200 OK) so Kubernetes probes pass immediately,
     independent of the Node backend's boot state.
  2. Bootstraps the Node backend as a background child process on startup when nothing
     is already serving :8002 (in the preview sandbox a supervisor program owns :8002,
     so we skip; in production only `server.py` runs, so we spawn it here).
  3. Proxies all remaining traffic to the Node backend.
"""
import os
import socket
import subprocess
import threading
import time

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response

NODE_BACKEND_URL = os.environ.get("NODE_BACKEND_URL", "http://127.0.0.1:8002")
NODE_PORT = 8002
NODE_DIR = os.path.dirname(os.path.abspath(__file__))

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
client = httpx.AsyncClient(base_url=NODE_BACKEND_URL, timeout=httpx.Timeout(90.0))

HOP_BY_HOP = {
    "content-encoding",
    "content-length",
    "transfer-encoding",
    "connection",
    "keep-alive",
    "te",
    "trailers",
    "upgrade",
    "proxy-authenticate",
    "proxy-authorization",
}

_node_started = False
_node_lock = threading.Lock()


def _port_open(host: str = "127.0.0.1", port: int = NODE_PORT) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.5)
        return sock.connect_ex((host, port)) == 0


def _bootstrap_node() -> None:
    """Runs in a background thread so it never blocks Uvicorn (and `/health`)."""
    # If something already serves :8002 within the observation window (e.g. the
    # preview supervisor program), do not spawn a duplicate.
    for _ in range(12):
        if _port_open():
            print("[bootstrap] Node backend already serving :8002, skipping spawn.")
            return
        time.sleep(1)

    child_env = {**os.environ, "PORT": str(NODE_PORT), "NODE_ENV": "production"}

    bundle_entry = os.path.join(NODE_DIR, "dist", "server.bundle.js")
    dist_entry = os.path.join(NODE_DIR, "dist", "app.js")

    if os.path.isfile(bundle_entry):
        # Self-contained esbuild bundle: no node_modules required at runtime.
        cmd = ["node", "dist/server.bundle.js"]
    else:
        # Non-bundled entrypoints need dependencies installed first.
        if not os.path.isdir(os.path.join(NODE_DIR, "node_modules")):
            print("[bootstrap] node_modules missing, running `yarn install`...")
            subprocess.run(
                ["yarn", "install", "--frozen-lockfile", "--production=false"],
                cwd=NODE_DIR,
                check=False,
            )
        if os.path.isfile(dist_entry):
            cmd = ["node", "dist/app.js"]
        else:
            print("[bootstrap] dist not found, falling back to `npx tsx src/app.ts`.")
            cmd = ["npx", "tsx", "src/app.ts"]

    print(f"[bootstrap] Starting Node backend: {' '.join(cmd)}")
    subprocess.Popen(cmd, cwd=NODE_DIR, env=child_env)


@app.on_event("startup")
async def _startup():
    global _node_started
    with _node_lock:
        if _node_started:
            return
        _node_started = True
    threading.Thread(target=_bootstrap_node, daemon=True).start()


@app.get("/health")
async def health_check():
    return JSONResponse({"status": "ok"}, status_code=200)


@app.api_route(
    "/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def proxy(path: str, request: Request):
    body = await request.body()
    headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}
    try:
        upstream = await client.request(
            request.method,
            "/" + path,
            params=dict(request.query_params),
            content=body,
            headers=headers,
        )
    except (httpx.ConnectError, httpx.ReadError, httpx.RemoteProtocolError):
        return Response(
            content=b'{"success":false,"error":"Backend service is starting, please retry."}',
            status_code=503,
            media_type="application/json",
        )

    resp_headers = {
        k: v for k, v in upstream.headers.items() if k.lower() not in HOP_BY_HOP
    }
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=resp_headers,
    )


@app.on_event("shutdown")
async def _shutdown():
    await client.aclose()
