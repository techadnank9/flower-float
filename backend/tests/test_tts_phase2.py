# Phase 2 TTS endpoints: /api/tts, /api/tts/voices, /api/tts/stats, force-fallback, key leak
import os
import uuid
import pytest
import requests
from dotenv import dotenv_values

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL") or dotenv_values("/app/frontend/.env")["REACT_APP_BACKEND_URL"]
BASE_URL = BASE_URL.rstrip("/")
KEY = os.environ.get("ELEVENLABS_API_KEY") or dotenv_values("/app/backend/.env").get("ELEVENLABS_API_KEY")


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# Voices: 3 distinct ids + model
def test_voices_distinct(s):
    r = s.get(f"{BASE_URL}/api/tts/voices")
    assert r.status_code == 200
    d = r.json()
    assert d["model_id"] == "eleven_flash_v2_5"
    ids = [d["voices"][o]["voice_id"] for o in ("wing", "jasmine", "fong")]
    assert all(isinstance(i, str) and i for i in ids)
    assert len(set(ids)) == 3


# Stats shape
def test_stats_shape(s):
    d = s.get(f"{BASE_URL}/api/tts/stats").json()
    for k in ("elevenlabs_calls", "cache_hits", "failures", "cached_lines"):
        assert isinstance(d[k], int)


# Each owner attempted; invalid key -> 204 silent fallback, stats increment
@pytest.mark.parametrize("owner", ["wing", "jasmine", "fong"])
def test_tts_each_owner(s, owner):
    before = s.get(f"{BASE_URL}/api/tts/stats").json()
    r = s.post(f"{BASE_URL}/api/tts", json={"owner_id": owner, "text": f"TEST_ hello {uuid.uuid4().hex[:6]}"})
    assert r.status_code in (200, 204)
    st = r.headers.get("X-TTS-Status")
    assert st in ("miss", "hit", "hit-inflight", "timeout", "error")
    if r.status_code == 200:
        assert r.headers["content-type"].startswith("audio/mpeg") and len(r.content) > 100
    else:
        assert r.content == b""
    after = s.get(f"{BASE_URL}/api/tts/stats").json()
    assert after["elevenlabs_calls"] >= before["elevenlabs_calls"] + 1


# Force fallback header & query param
def test_force_fallback_header(s):
    before = s.get(f"{BASE_URL}/api/tts/stats").json()["elevenlabs_calls"]
    r = s.post(f"{BASE_URL}/api/tts", json={"owner_id": "wing", "text": "TEST_ forced"}, headers={"X-Force-Fallback": "1"})
    assert r.status_code == 204 and r.headers["X-TTS-Status"] == "forced-off"
    r = s.post(f"{BASE_URL}/api/tts?force_fallback=1", json={"owner_id": "wing", "text": "TEST_ forced"})
    assert r.status_code == 204 and r.headers["X-TTS-Status"] == "forced-off"
    assert s.get(f"{BASE_URL}/api/tts/stats").json()["elevenlabs_calls"] == before


# Validation
def test_tts_validation(s):
    assert s.post(f"{BASE_URL}/api/tts", json={"owner_id": "nobody", "text": "hi"}).status_code == 404
    assert s.post(f"{BASE_URL}/api/tts", json={"owner_id": "wing", "text": ""}).status_code == 422
    assert s.post(f"{BASE_URL}/api/tts", json={"owner_id": "wing", "text": "x" * 401}).status_code == 422


# Key never leaks in responses
def test_no_key_leak(s):
    assert KEY, "no key configured"
    for url in ("/api/tts/voices", "/api/tts/stats", "/api/game/data", "/api/", "/api/openapi.json"):
        assert KEY not in s.get(f"{BASE_URL}{url}").text
    r = s.post(f"{BASE_URL}/api/tts", json={"owner_id": "wing", "text": "TEST_ leak"})
    assert KEY not in r.text and KEY not in str(r.headers)
