import asyncio
import logging
import os
import time
from collections import OrderedDict

import httpx

log = logging.getLogger("tts")
TTS_TIMEOUT_S = 4.0
MODEL_ID = "eleven_flash_v2_5"
CACHE_MAX = 300

VOICE_ENV = {"wing": "WING_VOICE_ID", "jasmine": "JASMINE_VOICE_ID", "fong": "FONG_VOICE_ID"}
VOICE_META = {
    "wing": {"name": "Bill", "fit": "gruff older man"},
    "jasmine": {"name": "Jessica", "fit": "upbeat young woman"},
    "fong": {"name": "Matilda", "fit": "warm older woman"},
}

_cache: "OrderedDict[tuple, bytes]" = OrderedDict()
_inflight: dict = {}
_failed: dict = {}
FAIL_TTL_S = 30
stats = {"elevenlabs_calls": 0, "cache_hits": 0, "failures": 0}
_client = httpx.AsyncClient(timeout=httpx.Timeout(TTS_TIMEOUT_S))


def voice_id(owner_id: str) -> str | None:
    env = VOICE_ENV.get(owner_id)
    return os.environ.get(env) if env else None


def voices_public() -> dict:
    return {oid: {"voice_id": voice_id(oid), **VOICE_META[oid]} for oid in VOICE_ENV}


async def _call_elevenlabs(vid: str, text: str) -> bytes:
    stats["elevenlabs_calls"] += 1
    log.info("tts elevenlabs call voice=%s model=%s chars=%d", vid, MODEL_ID, len(text))
    r = await _client.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{vid}",
        params={"output_format": "mp3_44100_64"},
        headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Accept": "audio/mpeg"},
        json={"text": text, "model_id": MODEL_ID},
    )
    r.raise_for_status()
    return r.content


async def synthesize(owner_id: str, text: str) -> tuple[bytes | None, str]:
    vid = voice_id(owner_id)
    if not vid:
        return None, "no-voice"
    key = (vid, text)
    if key in _cache:
        _cache.move_to_end(key)
        stats["cache_hits"] += 1
        log.info("tts cache hit voice=%s", vid)
        return _cache[key], "hit"
    task = _inflight.get(key)
    if _failed.get(key, 0) > time.monotonic():
        return None, "error-recent"
    if task is None:
        task = asyncio.ensure_future(_call_elevenlabs(vid, text))
        _inflight[key] = task
        task.add_done_callback(lambda t: _settle(key, t))
        status = "miss"
    else:
        stats["cache_hits"] += 1
        status = "hit-inflight"
    try:
        audio = await asyncio.wait_for(asyncio.shield(task), timeout=TTS_TIMEOUT_S)
    except asyncio.TimeoutError:
        stats["failures"] += 1
        log.warning("tts timeout voice=%s", vid)
        return None, "timeout"
    except Exception as exc:
        stats["failures"] += 1
        log.warning("tts failed voice=%s: %s", vid, repr(exc)[:160])
        return None, "error"
    return audio, status


def _settle(key, task):
    _inflight.pop(key, None)
    if task.cancelled() or task.exception():
        _failed[key] = time.monotonic() + FAIL_TTL_S
        return
    _cache[key] = task.result()
    while len(_cache) > CACHE_MAX:
        _cache.popitem(last=False)
