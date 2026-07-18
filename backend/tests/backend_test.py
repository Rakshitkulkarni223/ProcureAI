"""
ProcureAI backend integration tests.

Covers:
- Health
- Auth (register, login, /me, invalid creds, protected route)
- Categories & suppliers
- Core search -> compare -> recommend flow + weight profile ranking
- Recommendations endpoint
- History (list/delete)
- Dashboard / analytics / insights
- Preferences GET/PUT persistence
- Weight profiles list
"""
import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback from frontend/.env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                    break
    except Exception:
        pass

API = f"{BASE_URL}/api"

ADMIN = {"email": "demo@procureai.com", "password": "Demo@123"}


def _ok(resp):
    """Envelope { success: true, data: ... } helper."""
    assert resp.headers.get("content-type", "").startswith("application/json"), resp.text[:200]
    body = resp.json()
    assert body.get("success") is True, body
    return body.get("data")


# -------------------- Fixtures --------------------

@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json=ADMIN, timeout=20)
    assert r.status_code == 200, r.text
    data = _ok(r)
    assert "token" in data and "user" in data
    return data["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# -------------------- Health --------------------

def test_health(s):
    r = s.get(f"{API}/health", timeout=10)
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True and body["status"] == "ok"


# -------------------- Auth --------------------

class TestAuth:
    def test_login_admin(self, s):
        r = s.post(f"{API}/auth/login", json=ADMIN, timeout=20)
        assert r.status_code == 200, r.text
        data = _ok(r)
        assert isinstance(data["token"], str) and len(data["token"]) > 10
        assert data["user"]["email"] == ADMIN["email"]
        assert data["user"].get("role") == "user"

    def test_login_invalid(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN["email"], "password": "wrong"}, timeout=20)
        assert r.status_code == 401
        body = r.json()
        assert body.get("success") is False
        assert "error" in body or "message" in body

    def test_register_new_user(self, s):
        # Backend normalizes emails to lowercase; use lower-case prefix
        unique = f"test_{uuid.uuid4().hex[:8]}@procureai.com"
        payload = {
            "name": "TEST User",
            "email": unique,
            "password": "Test@1234",
            "businessType": "startup",
        }
        r = s.post(f"{API}/auth/register", json=payload, timeout=20)
        assert r.status_code in (200, 201), r.text
        data = _ok(r)
        assert "token" in data
        assert data["user"]["email"] == unique
        # Login with new user
        r2 = s.post(f"{API}/auth/login", json={"email": unique, "password": "Test@1234"}, timeout=20)
        assert r2.status_code == 200
        _ok(r2)

    def test_me_with_token(self, s, admin_headers):
        r = s.get(f"{API}/auth/me", headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        data = _ok(r)
        assert data["email"] == ADMIN["email"]

    def test_protected_without_token(self, s):
        r = s.get(f"{API}/categories", timeout=20)
        assert r.status_code == 401, f"Expected 401 unauth, got {r.status_code}: {r.text[:200]}"

    def test_dashboard_without_token(self, s):
        r = s.get(f"{API}/dashboard", timeout=20)
        assert r.status_code == 401


# -------------------- Categories & Suppliers --------------------

class TestCatalog:
    def test_categories_list(self, s, admin_headers):
        r = s.get(f"{API}/categories", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        data = _ok(r)
        assert isinstance(data, list)
        assert len(data) == 8, f"Expected 8 categories, got {len(data)}"
        slugs = [c.get("slug") for c in data]
        assert "fashion" in slugs

    def test_fashion_suppliers(self, s, admin_headers):
        r = s.get(f"{API}/categories/fashion/suppliers", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        data = _ok(r)
        names = {sup.get("name") for sup in data}
        expected = {"Myntra", "Ajio", "Amazon", "Flipkart", "Tata CLiQ"}
        assert expected.issubset(names), f"Expected {expected}, got {names}"

    def test_all_suppliers(self, s, admin_headers):
        r = s.get(f"{API}/suppliers", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        data = _ok(r)
        assert isinstance(data, list) and len(data) > 5

    def test_toggle_supplier(self, s, admin_headers):
        # Pick first supplier
        r = s.get(f"{API}/suppliers", headers=admin_headers, timeout=20)
        suppliers = _ok(r)
        sup = suppliers[0]
        sid = sup.get("id") or sup.get("_id")
        original = sup.get("enabled", True)
        r2 = s.patch(
            f"{API}/suppliers/{sid}",
            headers=admin_headers,
            json={"enabled": not original},
            timeout=20,
        )
        assert r2.status_code == 200, r2.text
        updated = _ok(r2)
        assert updated.get("enabled") == (not original)
        # toggle back
        s.patch(f"{API}/suppliers/{sid}", headers=admin_headers, json={"enabled": original}, timeout=20)


# -------------------- Weight profiles --------------------

class TestWeightProfiles:
    def test_list(self, s, admin_headers):
        r = s.get(f"{API}/weight-profiles", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        data = _ok(r)
        keys = {p.get("key") for p in data}
        assert {"balanced", "budget", "urgent", "fast"}.issubset(keys), keys


# -------------------- Core search + recommendation --------------------

def _do_search(s, headers, query="Nike Shoes", category="fashion", weight="budget", suppliers=None):
    payload = {"category": category, "query": query, "weightProfile": weight}
    if suppliers is not None:
        payload["suppliers"] = suppliers
    r = s.post(f"{API}/search", headers=headers, json=payload, timeout=60)
    assert r.status_code == 200, r.text
    return _ok(r)


class TestSearch:
    def test_search_returns_results_and_recommendation(self, s, admin_headers):
        data = _do_search(s, admin_headers)
        # results
        results = data.get("results") or data.get("comparisons") or []
        assert isinstance(results, list) and len(results) > 0, f"no results: {data}"
        # recommendation shape
        rec = data.get("recommendation")
        assert rec is not None, data
        assert isinstance(rec.get("reasons"), list) and len(rec["reasons"]) > 0
        assert isinstance(rec.get("estimatedSavings"), (int, float))
        assert rec["estimatedSavings"] >= 0
        confidence = rec.get("confidence")
        assert isinstance(confidence, (int, float))
        assert 0 <= confidence <= 1, f"confidence out of range: {confidence}"
        assert isinstance(rec.get("factors"), list)
        assert isinstance(rec.get("scoreboard"), list)
        # recommended supplier must appear in results (results use 'provider')
        supplier_names = {r.get("provider") for r in results}
        rec_sup = rec.get("supplier")
        rec_sup_name = rec_sup.get("name") if isinstance(rec_sup, dict) else rec_sup
        assert rec_sup_name in supplier_names, f"rec supplier {rec_sup_name} not in {supplier_names}"

    def test_weight_profiles_can_change_ranking(self, s, admin_headers):
        results = {}
        for profile in ["budget", "urgent", "fast"]:
            d = _do_search(s, admin_headers, weight=profile)
            rec = d["recommendation"]
            sb = rec.get("scoreboard") or []
            top_score = sb[0].get("score") if sb else None
            rec_sup = rec.get("supplier")
            rec_sup_name = rec_sup.get("name") if isinstance(rec_sup, dict) else rec_sup
            results[profile] = (rec_sup_name, top_score)
        # Not strictly required that supplier differs, but scoreboards / scores should differ
        # across at least two profiles.
        unique = set(results.values())
        assert len(unique) >= 2, f"Weight profile did not affect output at all: {results}"


# -------------------- Recommendation endpoint --------------------

class TestRecommendation:
    def test_recommend_from_products(self, s, admin_headers):
        # First run a search to get a products list
        d = _do_search(s, admin_headers)
        results = d.get("results") or []
        assert results
        r = s.post(
            f"{API}/recommendations",
            headers=admin_headers,
            json={"products": results, "weightProfile": "balanced"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        data = _ok(r)
        rec = data.get("recommendation", data)  # endpoint wraps under 'recommendation'
        assert rec.get("supplier") is not None
        assert 0 <= rec["confidence"] <= 1


# -------------------- History --------------------

class TestHistory:
    def test_list_and_delete(self, s, admin_headers):
        # Ensure at least one search
        _do_search(s, admin_headers, query=f"TEST_hist_{uuid.uuid4().hex[:6]}")
        time.sleep(0.5)
        r = s.get(f"{API}/history", headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        history_resp = _ok(r)
        # Unified history returns paginated envelope
        items = history_resp.get("items") if isinstance(history_resp, dict) else history_resp
        assert isinstance(items, list) and len(items) > 0
        item = items[0]
        hid = item.get("id") or item.get("_id")
        assert hid
        r2 = s.delete(f"{API}/history/{hid}", headers=admin_headers, timeout=20)
        assert r2.status_code in (200, 204), r2.text
        # verify removed
        r3 = s.get(f"{API}/history", headers=admin_headers, timeout=20)
        resp3 = _ok(r3)
        items3 = resp3.get("items") if isinstance(resp3, dict) else resp3
        remaining_ids = {(h.get("id") or h.get("_id")) for h in items3}
        assert hid not in remaining_ids


# -------------------- Basket Optimization --------------------

def _do_basket(s, headers, items=None, category="grocery", weight="balanced"):
    payload = {
        "category": category,
        "items": items or [
            {"query": "Premium Basmati Rice 10kg", "quantity": 2},
            {"query": "Sunflower Cooking Oil 5L", "quantity": 1},
            {"query": "Fresh Vegetables Combo 5kg", "quantity": 3},
        ],
        "weightProfile": weight,
    }
    r = s.post(f"{API}/basket/optimize", headers=headers, json=payload, timeout=60)
    assert r.status_code == 200, r.text
    return _ok(r)


class TestBasketOptimization:
    def test_basket_returns_valid_structure(self, s, admin_headers):
        data = _do_basket(s, admin_headers)
        # Must have items, totals, and plan fields
        assert "items" in data, f"Missing 'items' in basket response: {list(data.keys())}"
        assert isinstance(data["items"], list) and len(data["items"]) > 0
        assert "splitTotal" in data
        assert "baseline" in data or "baselineTotal" in data
        assert "estimatedSavings" in data
        assert isinstance(data["estimatedSavings"], (int, float))
        assert data["estimatedSavings"] >= 0
        assert "recommendedPlan" in data
        assert data["recommendedPlan"] in ("split", "consolidate")

    def test_basket_item_shape(self, s, admin_headers):
        data = _do_basket(s, admin_headers)
        for item in data["items"]:
            assert "query" in item, f"Missing 'query' in basket item: {item}"
            assert "price" in item, f"Missing 'price' in basket item: {item}"
            assert "quantity" in item, f"Missing 'quantity' in basket item: {item}"
            # Fulfilled items have a non-null supplier
            if item.get("supplier"):
                assert "title" in item
                assert item["price"] > 0

    def test_basket_unfulfillable_items(self, s, admin_headers):
        """Gibberish items should be marked as unfulfillable, not matched."""
        data = _do_basket(s, admin_headers, items=[
            {"query": "xyzzyplugh999", "quantity": 1},
            {"query": "Premium Basmati Rice 10kg", "quantity": 1},
        ])
        unfulfillable = data.get("unfulfillable", [])
        # The gibberish query should appear in unfulfillable
        assert "xyzzyplugh999" in unfulfillable, f"Expected gibberish in unfulfillable: {unfulfillable}"
        # Real item should still be fulfilled (supplier is not null)
        fulfilled_queries = [it["query"] for it in data["items"] if it.get("supplier")]
        assert any("rice" in q.lower() for q in fulfilled_queries), f"Rice not found in: {fulfilled_queries}"

    def test_basket_all_unfulfillable(self, s, admin_headers):
        """All gibberish items → everything unfulfillable."""
        data = _do_basket(s, admin_headers, items=[
            {"query": "zzznonsense111", "quantity": 1},
            {"query": "aaafakeitem222", "quantity": 1},
        ])
        unfulfillable = data.get("unfulfillable", [])
        assert len(unfulfillable) == 2, f"Expected 2 unfulfillable, got {unfulfillable}"

    def test_basket_validation_empty_items(self, s, admin_headers):
        """Empty items list should be rejected."""
        r = s.post(
            f"{API}/basket/optimize",
            headers=admin_headers,
            json={"category": "grocery", "items": []},
            timeout=20,
        )
        assert r.status_code in (400, 422), f"Expected validation error, got {r.status_code}: {r.text}"

    def test_basket_without_auth(self, s):
        r = s.post(
            f"{API}/basket/optimize",
            json={"category": "grocery", "items": [{"query": "Rice", "quantity": 1}]},
            timeout=20,
        )
        assert r.status_code == 401


# -------------------- Basket History --------------------

class TestBasketHistory:
    def test_basket_history_populated_after_optimize(self, s, admin_headers):
        """After running a basket optimization, it should appear in basket history."""
        _do_basket(s, admin_headers)
        time.sleep(0.5)
        r = s.get(f"{API}/basket/history", headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        data = _ok(r)
        items = data.get("items", data) if isinstance(data, dict) else data
        assert isinstance(items, list) and len(items) > 0, f"Basket history empty: {data}"
        entry = items[0]
        assert "category" in entry
        assert "items" in entry or "itemCount" in entry

    def test_basket_history_without_auth(self, s):
        r = s.get(f"{API}/basket/history", timeout=20)
        assert r.status_code == 401


# -------------------- Unified History (single + basket) --------------------

class TestUnifiedHistory:
    def test_unified_history_contains_both_types(self, s, admin_headers):
        """After running both a single search and a basket, unified /history returns both."""
        _do_search(s, admin_headers, query=f"UH_single_{uuid.uuid4().hex[:6]}")
        _do_basket(s, admin_headers)
        time.sleep(0.5)
        r = s.get(f"{API}/history", headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        data = _ok(r)
        items = data.get("items", data) if isinstance(data, dict) else data
        assert isinstance(items, list) and len(items) > 0
        types_seen = {it.get("type") for it in items}
        assert "single" in types_seen, f"No single search in history types: {types_seen}"
        assert "basket" in types_seen, f"No basket search in history types: {types_seen}"

    def test_basket_history_entry_has_basket_items(self, s, admin_headers):
        """Basket entries in unified history should include basketItems array."""
        r = s.get(f"{API}/history", headers=admin_headers, timeout=20)
        data = _ok(r)
        items = data.get("items", data) if isinstance(data, dict) else data
        basket_entries = [it for it in items if it.get("type") == "basket"]
        assert len(basket_entries) > 0, "No basket entries found in unified history"
        entry = basket_entries[0]
        assert "basketItems" in entry, f"Basket entry missing basketItems: {list(entry.keys())}"
        assert isinstance(entry["basketItems"], list)
        if entry["basketItems"]:
            bi = entry["basketItems"][0]
            assert "query" in bi, f"basketItem missing 'query': {bi}"

    def test_unified_history_delete_basket_entry(self, s, admin_headers):
        """Should be able to delete a basket entry via /history/:id."""
        r = s.get(f"{API}/history", headers=admin_headers, timeout=20)
        data = _ok(r)
        items = data.get("items", data) if isinstance(data, dict) else data
        basket_entries = [it for it in items if it.get("type") == "basket"]
        if not basket_entries:
            _do_basket(s, admin_headers)
            time.sleep(0.5)
            r = s.get(f"{API}/history", headers=admin_headers, timeout=20)
            data = _ok(r)
            items = data.get("items", data) if isinstance(data, dict) else data
            basket_entries = [it for it in items if it.get("type") == "basket"]
        assert basket_entries, "Still no basket entries after running basket optimization"
        hid = basket_entries[0].get("id") or basket_entries[0].get("_id")
        r2 = s.delete(f"{API}/history/{hid}", headers=admin_headers, timeout=20)
        assert r2.status_code in (200, 204), r2.text


# -------------------- No Results (single search) --------------------

class TestNoResults:
    def test_single_search_gibberish_returns_empty(self, s, admin_headers):
        """Gibberish query should return 0 results, not fake matches."""
        data = _do_search(s, admin_headers, query="xyzzyplugh_gibberish_999")
        results = data.get("results") or data.get("comparisons") or []
        assert len(results) == 0, f"Expected 0 results for gibberish, got {len(results)}"


# -------------------- Dashboard / analytics --------------------

class TestDashboard:
    def test_dashboard_payload(self, s, admin_headers):
        r = s.get(f"{API}/dashboard", headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        d = _ok(r)
        for key in [
            "totalSearches",
            "estimatedMonthlySavings",
            "preferredSupplier",
            "topCategory",
            "activeCategories",
            "recentSearches",
        ]:
            assert key in d, f"missing key {key} in dashboard: {list(d.keys())}"
        assert isinstance(d["recentSearches"], list)

    def test_analytics_spend(self, s, admin_headers):
        r = s.get(f"{API}/analytics/spend", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        _ok(r)

    def test_analytics_savings(self, s, admin_headers):
        r = s.get(f"{API}/analytics/savings", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        _ok(r)

    def test_insights(self, s, admin_headers):
        r = s.get(f"{API}/insights", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        _ok(r)


# -------------------- Preferences --------------------

class TestPreferences:
    def test_get_and_update(self, s, admin_headers):
        r = s.get(f"{API}/preferences", headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        prefs = _ok(r)
        assert isinstance(prefs, dict)
        new_prefs = {
            "defaultCategory": "fashion",
            "sortPreference": "lowest_price",
            "weightProfile": "budget",
            "businessType": "startup",
        }
        r2 = s.put(f"{API}/preferences", headers=admin_headers, json=new_prefs, timeout=20)
        assert r2.status_code == 200, r2.text
        updated = _ok(r2)
        for k, v in new_prefs.items():
            assert updated.get(k) == v, f"{k} = {updated.get(k)} expected {v}"
        # Re-fetch verifies persistence
        r3 = s.get(f"{API}/preferences", headers=admin_headers, timeout=20)
        fetched = _ok(r3)
        for k, v in new_prefs.items():
            assert fetched.get(k) == v
