"""Backend API tests for ProcureAI proxy + Node backend."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://buywise-compare-1.preview.emergentagent.com").rstrip("/")
INTERNAL_URL = "http://localhost:8001"
ADMIN_EMAIL = "admin@procureai.com"
ADMIN_PASSWORD = "Admin@123"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def token(session):
    r = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    tok = data.get("token") or (data.get("data") or {}).get("token")
    assert tok, f"No token in login response: {data}"
    return tok


@pytest.fixture(scope="session")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# --- Health checks ---
def test_native_health_internal():
    """FastAPI native /health on 8001 (internal only, ingress routes only /api externally)."""
    r = requests.get(f"{INTERNAL_URL}/health", timeout=10)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_api_health_external():
    r = requests.get(f"{BASE_URL}/api/health", timeout=30)
    assert r.status_code == 200
    body = r.json()
    assert body.get("status") == "ok" or body.get("success") is True


def test_no_503_fallback(session):
    """Ensure proxy reaches Node - no 'Backend service is starting' fallback."""
    r = session.get(f"{BASE_URL}/api/health", timeout=30)
    assert r.status_code != 503, f"Got 503 fallback: {r.text}"
    assert "starting, please retry" not in r.text.lower()


# --- Auth ---
def test_login_returns_token_and_user(session):
    r = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    # Accept both { token, user } and { data: { token, user } }
    payload = data.get("data") if "data" in data and isinstance(data["data"], dict) else data
    assert payload.get("token"), f"No token: {data}"
    user = payload.get("user") or {}
    assert user.get("email") == ADMIN_EMAIL


def test_login_invalid(session):
    r = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong-pass"}, timeout=30)
    assert r.status_code in (400, 401, 403), r.text


def test_auth_me(auth_headers):
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    payload = data.get("data") if "data" in data and isinstance(data["data"], dict) else data
    user = payload.get("user") or payload
    assert user.get("email") == ADMIN_EMAIL


# --- Search ---
def test_search(auth_headers):
    r = requests.post(
        f"{BASE_URL}/api/search",
        json={"query": "laptop", "quantity": 1, "category": "electronics"},
        headers=auth_headers,
        timeout=60,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    payload = data.get("data") if "data" in data and isinstance(data["data"], dict) else data
    # results could be under 'results', 'products', 'items'
    results = (
        payload.get("results")
        or payload.get("products")
        or payload.get("items")
        or (payload if isinstance(payload, list) else None)
    )
    assert results is not None, f"No results field in {data}"
    assert isinstance(results, list)


# --- Dashboard ---
def test_dashboard(auth_headers):
    r = requests.get(f"{BASE_URL}/api/dashboard", headers=auth_headers, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("success") is True or isinstance(data, dict)


# --- Basket optimize ---
def test_basket_optimize(auth_headers):
    payload = {
        "category": "electronics",
        "items": [
            {"query": "laptop", "quantity": 1},
            {"query": "mouse", "quantity": 2},
        ],
    }
    r = requests.post(f"{BASE_URL}/api/basket/optimize", json=payload, headers=auth_headers, timeout=60)
    assert r.status_code == 200, r.text
    data = r.json()
    body = data.get("data") if "data" in data and isinstance(data["data"], dict) else data
    # Look for expected fields
    assert any(k in body for k in ("splits", "suppliers", "cart", "baskets", "optimization", "estimatedSavings", "savings"))
