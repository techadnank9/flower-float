# Phase 3 Market Intel (You.com) API tests: JRN-65..71 backend side
import asyncio
import os
import sys
import time
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
MOCK = {"X-Intel-Mock": "1"}


def _ydc_key():
    k = os.environ.get("YDC_API_KEY")
    if k:
        return k
    import subprocess
    pids = subprocess.run(["pgrep", "-f", "uvicorn"], capture_output=True, text=True).stdout.split()
    for p in pids:
        try:
            env = open(f"/proc/{p}/environ", "rb").read().split(b"\0")
            for e in env:
                if e.startswith(b"YDC_API_KEY="):
                    return e.split(b"=", 1)[1].decode()
        except Exception:
            pass
    return None


def sid():
    return f"TEST_{uuid.uuid4().hex[:10]}"


def get_intel(headers=None, params=None, session=None):
    p = {"owner_id": "wing", "session_id": session or sid(), **(params or {})}
    return requests.get(f"{API}/intel", params=p, headers=headers or {}, timeout=15)


# JRN-65/67 live (mock) path
class TestLiveMock:
    def test_mock_three_live_cards(self):
        r = get_intel(MOCK)
        assert r.status_code == 200
        d = r.json()
        assert d["source"] == "live" and d["label"] == "Researched live with You.com"
        ids = [c["id"] for c in d["cards"]]
        assert ids == ["weather", "event", "festival"]
        for c in d["cards"]:
            assert c["source"] == "you.com" and c["label"] == "Researched live with You.com"
            assert c["title"] and c["body"] and c["effect_text"]
            assert c["sources"] and c["sources"][0]["url"].startswith("https://")
            assert c["effects"] and c["effects"][0]["badge"]
        w = d["cards"][0]
        assert w["signal"] == "3" and "Signal No. 3" in w["title"]
        assert any(e["badge"] == "Rain: +Storm Proof" and e["target"] == {"hardiness": ["hardy"]} for e in w["effects"])
        assert "Winter Solstice" in d["cards"][2]["title"]
        assert d["cached"] is False

    def test_mock_not_cached(self):
        s = sid()
        get_intel(MOCK, session=s)
        r = get_intel(MOCK, session=s)
        assert r.json()["cached"] is False


# JRN-69 fallback
class TestFallback:
    def test_force_fallback_header(self):
        d = get_intel({"X-Force-Fallback": "1"}).json()
        assert d["source"] == "offline" and d["label"] == "Market notes (offline)"
        assert len(d["cards"]) == 3
        assert all(c["source"] == "offline" and c["label"] == "Market notes (offline)" for c in d["cards"])

    def test_force_fallback_query(self):
        d = get_intel(params={"force_fallback": "1"}).json()
        assert d["source"] == "offline" and len(d["cards"]) == 3

    def test_slow_within_budget(self):
        t = time.time()
        r = get_intel({"X-Intel-Slow": "1"})
        el = time.time() - t
        d = r.json()
        assert r.status_code == 200 and d["source"] == "offline"
        assert el < 5.0, el
        assert 3000 <= d["latency_ms"] <= 4200

    def test_real_key_falls_back_cleanly(self):
        r = get_intel()
        assert r.status_code == 200
        assert len(r.json()["cards"]) == 3

    def test_offline_endpoint(self):
        r = requests.get(f"{API}/intel/offline", timeout=10)
        assert r.status_code == 200


# JRN-70 mixed
class TestMixed:
    def test_fail_festival_header(self):
        d = get_intel({**MOCK, "X-Intel-Fail": "festival"}).json()
        assert d["source"] == "mixed" and d["label"] == "Researched live with You.com"
        src = {c["id"]: (c["source"], c["label"]) for c in d["cards"]}
        assert src["weather"] == ("you.com", "Researched live with You.com")
        assert src["event"] == ("you.com", "Researched live with You.com")
        assert src["festival"] == ("offline", "Market notes (offline)")

    def test_fail_topics_query(self):
        d = get_intel(MOCK, params={"fail_topics": "weather,event"}).json()
        assert [c["source"] for c in d["cards"]] == ["offline", "offline", "you.com"]


# JRN-66 scoring with intel effects
class TestEffects:
    def _eval(self, effects, intel_seen=True):
        body = {"placements": {"roof": "bamboo"}, "trust": 4, "revealed": [], "intel_seen": intel_seen}
        if effects is not None:
            body["intel_effects"] = effects
        r = requests.post(f"{API}/owners/wing/evaluate", json=body, timeout=10)
        assert r.status_code == 200, r.text
        return r.json()

    def test_storm_bonus(self):
        live = get_intel(MOCK).json()
        effects = [e for c in live["cards"] for e in c["effects"]]
        with_fx = self._eval(effects)
        none_fx = self._eval([])
        print("with", with_fx, "none", none_fx)
        key = next(k for k in ("storm", "storm_proof", "stats") if k in with_fx)
        a = with_fx[key]["storm"] if key == "stats" else with_fx[key]
        b = none_fx[key]["storm"] if key == "stats" else none_fx[key]
        assert a > b

    def test_bad_amount_clamped(self):
        fx = [{"stat": "storm", "amount": 9999, "target": {"hardiness": ["hardy"]}, "badge": "x", "words": "x"}]
        body = {"placements": {"roof": "bamboo"}, "trust": 4, "revealed": [], "intel_seen": True, "intel_effects": fx}
        r = requests.post(f"{API}/owners/wing/evaluate", json=body, timeout=10)
        assert r.status_code == 422  # pydantic le=10


# JRN-67/71 no key leak
class TestNoLeak:
    def test_key_not_in_responses(self):
        key = _ydc_key()
        if not key:
            pytest.skip("YDC key not found")
        bodies = []
        for h in (MOCK, {"X-Force-Fallback": "1"}, {}, {**MOCK, "X-Intel-Fail": "event"}):
            r = get_intel(h)
            bodies.append(r.text + str(dict(r.headers)))
        bodies.append(requests.get(f"{API}/intel/stats", timeout=10).text)
        bodies.append(requests.get(f"{API}/intel/offline", timeout=10).text)
        assert all(key not in b for b in bodies)

    def test_stats_shape(self):
        d = requests.get(f"{API}/intel/stats", timeout=10).json()
        for k in ("you_calls", "cache_hits", "failures", "by_topic", "cached_sessions"):
            assert k in d


# JRN-68 server cache unit test (patched _search, real key is 403)
class TestCacheUnit:
    def test_cache_with_patched_search(self, monkeypatch):
        sys.path.insert(0, "/app/backend")
        os.environ.setdefault("YDC_API_KEY", "x")
        import intel
        calls = {"n": 0}

        async def fake(topic, cfg, slow, mock=False):
            calls["n"] += 1
            return intel.MOCK_RESULTS[topic]

        monkeypatch.setattr(intel, "_search", fake)
        s = sid()
        hits0 = intel.stats["cache_hits"]
        a = asyncio.run(intel.gather_intel("wing", s, False, set(), False, False))
        b = asyncio.run(intel.gather_intel("wing", s, False, set(), False, False))
        assert a["cached"] is False and b["cached"] is True
        assert calls["n"] == 3
        assert intel.stats["cache_hits"] == hits0 + 1
        c = asyncio.run(intel.gather_intel("wing", sid(), False, set(), False, False))
        assert c["cached"] is False and calls["n"] == 6

    def test_offline_not_cached(self, monkeypatch):
        sys.path.insert(0, "/app/backend")
        import intel

        async def boom(*a, **k):
            raise RuntimeError("403")

        monkeypatch.setattr(intel, "_search", boom)
        s = sid()
        asyncio.run(intel.gather_intel("wing", s, False, set(), False, False))
        b = asyncio.run(intel.gather_intel("wing", s, False, set(), False, False))
        assert b["cached"] is False and b["source"] == "offline"
