"""Build-time only: generate character GLBs with Meshy text-to-3D (preview -> refine -> GLB).

Usage:  cd /app/backend && python scripts/generate_characters.py [--only wing,kit] [--dry-run]
Never imported or called by the running app.
"""
import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "frontend" / "public" / "models"
GLTF_CLI = ROOT / "frontend" / "node_modules" / ".bin" / "gltf-transform"
API = "https://api.meshy.ai/openapi/v2/text-to-3d"
MAX_BYTES = 2 * 1024 * 1024
STYLE = "stylised low poly game character, chunky simple shapes, flat colours, full body standing, friendly face, facing forward"

CHARACTERS = {
    "kit": f"Kit, a cheerful young Hong Kong florist with a green bucket hat and a pink apron over a white t-shirt, holding nothing, {STYLE}",
    "wing": f"Uncle Wing, a gruff older Hong Kong street food vendor, white chef hat with red band, red shirt, gold apron, dark trousers, {STYLE}",
    "jasmine": f"Jasmine, an upbeat young woman food truck chef, orange bandana, pink shirt, teal apron, sneakers, {STYLE}",
    "fong": f"Auntie Fong, a warm older Hong Kong tea shop owner, short grey permed hair, jade green cardigan, cream apron, {STYLE}",
}


def log(msg):
    print(f"[meshy] {msg}", flush=True)


def create_task(client, body):
    r = client.post(API, json=body)
    if r.status_code >= 300:
        raise RuntimeError(f"HTTP {r.status_code} creating {body['mode']} task: {r.text[:200]}")
    return r.json()["result"]


def wait_task(client, task_id, timeout_s):
    start = time.time()
    while time.time() - start < timeout_s:
        r = client.get(f"{API}/{task_id}")
        if r.status_code >= 300:
            raise RuntimeError(f"HTTP {r.status_code} polling {task_id}: {r.text[:200]}")
        t = r.json()
        if t["status"] == "SUCCEEDED":
            return t
        if t["status"] in ("FAILED", "CANCELED"):
            raise RuntimeError(f"task {task_id} {t['status']}: {t.get('task_error')}")
        log(f"  {task_id} {t['status']} {t.get('progress', 0)}%")
        time.sleep(8)
    raise RuntimeError(f"task {task_id} timed out after {timeout_s}s")


def compress(src: Path, dst: Path):
    attempts = [["--texture-size", "1024"], ["--texture-size", "512", "--simplify-ratio", "0.5"], ["--texture-size", "256", "--simplify-ratio", "0.25"]]
    for extra in attempts:
        subprocess.run([str(GLTF_CLI), "optimize", str(src), str(dst), "--compress", "meshopt", "--texture-compress", "webp", *extra],
                       check=True, capture_output=True)
        if dst.stat().st_size <= MAX_BYTES:
            return dst.stat().st_size
    dst.unlink(missing_ok=True)
    raise RuntimeError(f"could not compress {src.name} under 2 MB")


def generate(client, cid, prompt, timeout_s):
    preview = create_task(client, {"mode": "preview", "prompt": prompt, "model_type": "smart-topology", "ai_model": "meshy-t2.5",
                                   "target_polycount": 8000, "pose_mode": "a-pose", "target_formats": ["glb"], "origin_at": "bottom"})
    log(f"{cid}: preview task {preview}")
    wait_task(client, preview, timeout_s)
    refine = create_task(client, {"mode": "refine", "preview_task_id": preview, "target_formats": ["glb"], "texture_resolution": "2k"})
    log(f"{cid}: refine task {refine}")
    task = wait_task(client, refine, timeout_s)
    raw = OUT / f"{cid}.raw.glb"
    with httpx.stream("GET", task["model_urls"]["glb"], timeout=120) as r:
        r.raise_for_status()
        with open(raw, "wb") as f:
            for chunk in r.iter_bytes():
                f.write(chunk)
    size = compress(raw, OUT / f"{cid}.glb")
    raw.unlink(missing_ok=True)
    return {"url": f"/models/{cid}.glb", "bytes": size, "preview_task": preview, "refine_task": refine}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--timeout", type=int, default=900)
    args = ap.parse_args()
    load_dotenv(ROOT / "backend" / ".env")
    key = os.environ.get("MESHY_API_KEY", "").strip()
    ids = [i for i in args.only.split(",") if i] or list(CHARACTERS)
    OUT.mkdir(parents=True, exist_ok=True)
    manifest_path = OUT / "manifest.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    chars = {k: v for k, v in manifest.get("characters", {}).items() if (OUT / Path(v["url"]).name).exists()}
    results = dict(manifest.get("last_run", {}).get("results", {}))
    if args.dry_run:
        for cid in ids:
            log(f"{cid}: would POST preview with prompt: {CHARACTERS[cid]}")
        return 0
    if not key:
        log("FAILED: MESHY_API_KEY is not set. Primitives stay in place.")
        results.update({cid: "skipped: no MESHY_API_KEY" for cid in ids})
    else:
        if set(key) == {"*"}:
            log("WARNING: MESHY_API_KEY looks like a masked placeholder (only asterisks). Trying anyway.")
        with httpx.Client(timeout=60, headers={"Authorization": f"Bearer {key}"}) as client:
            for cid in ids:
                try:
                    chars[cid] = generate(client, cid, CHARACTERS[cid], args.timeout)
                    results[cid] = f"ok ({chars[cid]['bytes']} bytes)"
                    log(f"{cid}: saved {chars[cid]['url']} ({chars[cid]['bytes']} bytes)")
                except Exception as e:  # noqa: BLE001 - every failure is logged and the primitive stays
                    results[cid] = f"failed: {e}"
                    log(f"{cid}: FAILED - {e}")
                    if "HTTP 401" in str(e) or "HTTP 402" in str(e):
                        log("Auth or billing failure, so the remaining characters are skipped. Primitives stay in place.")
                        for rest in ids[ids.index(cid) + 1:]:
                            results[rest] = "skipped after auth/billing failure"
                        break
    manifest = {"version": 1, "generator": "meshy text-to-3d v2 (preview -> refine), meshopt + webp via gltf-transform",
                "characters": chars, "last_run": {"at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "results": results}}
    manifest_path.write_text(json.dumps(manifest, indent=2))
    log(f"manifest written: {len(chars)} character(s) listed -> {manifest_path}")
    return 0 if all(results[c].startswith("ok") for c in ids) else 1


if __name__ == "__main__":
    sys.exit(main())
