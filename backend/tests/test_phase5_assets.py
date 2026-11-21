# Phase 5: Meshy build script, model manifests, synthesised audio, /demo route (static + public URL checks)
import json
import os
import subprocess
from pathlib import Path

import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
ROOT = Path("/app")
PUB = ROOT / "frontend" / "public"
MODELS = PUB / "models"


# Meshy script: dry run never writes the manifest and only targets the v2 text-to-3d API
def test_generate_characters_dry_run_no_write():
    before = (MODELS / "manifest.json").read_text()
    r = subprocess.run(["python", "scripts/generate_characters.py", "--only", "kit", "--dry-run"], cwd=ROOT / "backend",
                       capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr
    assert "would POST preview" in r.stdout
    assert (MODELS / "manifest.json").read_text() == before


def test_script_uses_only_v2_text_to_3d():
    src = (ROOT / "backend" / "scripts" / "generate_characters.py").read_text()
    assert 'API = "https://api.meshy.ai/openapi/v2/text-to-3d"' in src
    assert src.count("api.meshy.ai") == 1


def test_manifest_characters_empty():
    m = json.loads((MODELS / "manifest.json").read_text())
    assert m["characters"] == {}


# Test GLB manifests point at real files under 2 MB (bad one deliberately references missing/corrupt files)
def test_test_good_manifest_files_exist_and_small():
    m = json.loads((MODELS / "manifest.test-good.json").read_text())
    assert set(m["characters"]) == {"kit", "fong"}
    for c in m["characters"].values():
        p = PUB / c["url"].lstrip("/")
        assert p.exists() and p.stat().st_size <= 2 * 1024 * 1024


def test_test_bad_manifest_shape():
    m = json.loads((MODELS / "manifest.test-bad.json").read_text())
    assert not (PUB / m["characters"]["wing"]["url"].lstrip("/")).exists()
    assert (PUB / m["characters"]["kit"]["url"].lstrip("/")).exists()


# Frontend never calls Meshy at runtime; audio is synthesised (no audio files shipped)
def test_frontend_src_has_no_meshy():
    for p in (ROOT / "frontend" / "src").rglob("*.js*"):
        assert "api.meshy.ai" not in p.read_text(errors="ignore"), p


def test_audio_licences_and_no_audio_files():
    assert (PUB / "audio" / "LICENSES.md").exists()
    exts = {".mp3", ".wav", ".ogg", ".m4a"}
    assert not [p for p in PUB.rglob("*") if p.suffix.lower() in exts]


# Public URL: /demo served by SPA, video absent -> HTML fallback (client shows "Video coming soon")
def test_demo_route_served():
    r = requests.get(f"{BASE_URL}/demo", timeout=20)
    assert r.status_code == 200 and "<div id=\"root\"" in r.text


def test_demo_video_absent_returns_html():
    r = requests.head(f"{BASE_URL}/demo/fa-che-gameplay.mp4", timeout=20)
    assert "video" not in r.headers.get("content-type", "")


def test_public_manifest_served():
    r = requests.get(f"{BASE_URL}/models/manifest.json", timeout=20)
    assert r.status_code == 200 and r.json()["characters"] == {}
