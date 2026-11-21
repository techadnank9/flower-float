import asyncio
import logging
import os
import re
import time
from datetime import date

import httpx

from game_data import INTEL_OFFLINE

log = logging.getLogger("intel")
YDC_URL = "https://ydc-index.io/v1/search"
BUDGET_S = 3.5
LIVE_LABEL = "Researched live with You.com"
OFFLINE_LABEL = INTEL_OFFLINE["label"]

stats = {"you_calls": 0, "cache_hits": 0, "failures": 0, "by_topic": {"weather": 0, "event": 0, "festival": 0}}
_cache: dict = {}
_client = httpx.AsyncClient(timeout=httpx.Timeout(BUDGET_S))

EYE_CATCHING = ["sunflower", "peach", "orchid", "pampas", "stand"]
FESTIVALS = [
    (date(2026, 2, 17), "Lunar New Year", {"ids": ["peach", "kumquat"]}, "Peach blossom and kumquat +Luck"),
    (date(2026, 4, 5), "Ching Ming Festival", {"ids": ["ychrys"]}, "Yellow chrysanthemum +Luck"),
    (date(2026, 5, 24), "Buddha's Birthday", {"ids": ["orchid", "lily"]}, "Orchid and lily +Luck"),
    (date(2026, 6, 19), "Tuen Ng (Dragon Boat) Festival", {"ids": ["bamboo", "orchid"]}, "Lucky bamboo and orchid +Luck"),
    (date(2026, 9, 25), "Mid-Autumn Festival", {"tags": ["red", "gold"]}, "Red and gold flowers +Luck"),
    (date(2026, 10, 1), "National Day", {"tags": ["red"]}, "Red flowers +Luck"),
    (date(2026, 10, 18), "Chung Yeung Festival", {"ids": ["ychrys", "wchrys"]}, "Chrysanthemums +Luck"),
    (date(2026, 12, 22), "Winter Solstice", {"tags": ["red", "gold"]}, "Red and gold flowers +Luck"),
    (date(2026, 12, 25), "Christmas", {"tags": ["red", "gold"]}, "Red and gold flowers +Luck"),
    (date(2027, 2, 6), "Lunar New Year", {"ids": ["peach", "kumquat"]}, "Peach blossom and kumquat +Luck"),
    (date(2027, 4, 5), "Ching Ming Festival", {"ids": ["ychrys"]}, "Yellow chrysanthemum +Luck"),
    (date(2027, 6, 9), "Tuen Ng (Dragon Boat) Festival", {"ids": ["bamboo", "orchid"]}, "Lucky bamboo and orchid +Luck"),
    (date(2027, 9, 15), "Mid-Autumn Festival", {"tags": ["red", "gold"]}, "Red and gold flowers +Luck"),
]

WET = r"\brain|shower|thunder|strong wind|gale|typhoon|tropical cyclone|signal no|squall|storm"
HOT = r"\bhot\b|very hot|sunny|sunshine|heat|3[3-9] ?°|3[3-9] degrees"


def next_festival(today: date):
    return next((f for f in FESTIVALS if f[0] >= today), FESTIVALS[-1])


def topics(today: date) -> dict:
    fest = next_festival(today)
    return {
        "weather": {"query": "Hong Kong Observatory weather forecast today typhoon signal rain", "freshness": "day", "boost_domains": ["hko.gov.hk", "info.gov.hk", "news.rthk.hk", "scmp.com", "thestandard.com.hk"]},
        "event": {"query": "West Kowloon Cultural District events this week WestK M+ Xiqu Centre Art Park", "freshness": "week", "boost_domains": ["westk.hk", "mplus.org.hk", "timeout.com"]},
        "festival": {"query": f"{fest[1]} {fest[0].year} Hong Kong public holiday celebrations", "freshness": "month", "boost_domains": ["gov.hk", "discoverhongkong.com", "scmp.com"], "fest": fest},
    }


MOCK_RESULTS = {
    "weather": [{"url": "https://www.hko.gov.hk/en/wxinfo/currwx/flw.htm", "title": "Local Weather Forecast (TEST MOCK)", "description": "Typhoon Signal No. 3 is in force. Occasional heavy showers and squally thunderstorms tonight."}],
    "event": [{"url": "https://www.westk.hk/en/whats-on", "title": "What's On at West Kowloon (TEST MOCK)", "description": "Outdoor performances at the Art Park draw evening crowds along the harbourfront this week."}],
    "festival": [{"url": "https://www.gov.hk/en/about/abouthk/holiday/2026.htm", "title": "General holidays for 2026 (TEST MOCK)", "description": "Hong Kong's general holidays include the Winter Solstice period and Christmas Day."}],
}


async def _search(topic: str, cfg: dict, slow: bool, mock: bool = False) -> list:
    if mock:
        return MOCK_RESULTS[topic]
    stats["you_calls"] += 1
    stats["by_topic"][topic] += 1
    if slow:
        await asyncio.sleep(BUDGET_S + 1)
    body = {"query": cfg["query"], "count": 6, "country": "HK", "freshness": cfg["freshness"], "boost_domains": cfg["boost_domains"]}
    r = await _client.post(YDC_URL, headers={"X-API-Key": os.environ["YDC_API_KEY"]}, json=body)
    r.raise_for_status()
    web = (r.json().get("results") or {}).get("web") or []
    return [w for w in web if w.get("url") and (w.get("description") or w.get("snippets"))]


def _clean(text: str) -> str:
    text = re.sub(r"<[^>]+>|\s+", " ", text or "").strip()
    return text


def _summary(results: list) -> str:
    text = " ".join(_clean(r.get("description") or " ".join(r.get("snippets") or [])) for r in results[:2])
    sentences = re.split(r"(?<!\bNo\.)(?<!\bno\.)(?<=[.!?])\s+", text)
    out = " ".join(sentences[:2]).strip()
    return (out[:237] + "…") if len(out) > 240 else out


def _sources(results: list) -> list:
    return [{"name": _clean(r.get("title"))[:80] or r["url"], "url": r["url"]} for r in results[:2]]


def _effect(stat, amount, target, badge, words):
    return {"stat": stat, "amount": amount, "target": target, "badge": badge, "words": words}


def _weather_card(results: list) -> dict:
    blob = " ".join(_clean(f"{r.get('title')} {r.get('description')} {' '.join(r.get('snippets') or [])}") for r in results).lower()
    m = re.search(r"(?:signal|t)\s*(?:no\.?|number)?\s*(1|3|8|9|10)\b", blob) if re.search(r"typhoon|tropical cyclone|signal", blob) else None
    signal = m.group(1) if m else None
    effects = []
    if re.search(WET, blob):
        effects.append(_effect("storm", 6, {"hardiness": ["hardy"]}, "Rain: +Storm Proof", "Hardy flowers +Storm Proof"))
    if re.search(HOT, blob):
        effects.append(_effect("crowd", 6, {"ids": ["sunflower"]}, "Sunny: +Crowd", "Sunflowers +Crowd"))
    if not effects:
        effects.append(_effect("crowd", 3, {"ids": ["sunflower"]}, "Fair skies: +Crowd", "Sunflowers +Crowd"))
    title = f"Typhoon Signal No. {signal} in force" if signal else ("Rain and gusts on the way" if effects[0]["stat"] == "storm" else "Warm, bright evening ahead")
    return {"title": title, "signal": signal, "effects": effects}


def _event_card(results: list) -> dict:
    return {"title": _clean(results[0].get("title"))[:90], "effects": [_effect("crowd", 6, {"ids": EYE_CATCHING}, "Show crowds: +Crowd", "Eye-catching flowers +Crowd")]}


def _festival_card(results: list, fest) -> dict:
    when, name, target, words = fest
    return {"title": f"Next up: {name} ({when.strftime('%-d %b %Y')})", "festival": name, "effects": [_effect("luck", 6, target, f"{name.split(' (')[0]}: +Luck", words)]}


def offline_card(topic: str) -> dict:
    c = next(c for c in INTEL_OFFLINE["cards"] if c["id"] == topic)
    eff = {**c["effect"], "words": c.get("effect_words")}
    if topic == "festival":
        when, name, target, words = next_festival(date.today())
        short = name.split(" (")[0]
        c = {**c, "title": f"{name} is coming", "body": f"{name} falls on {when.strftime('%-d %B %Y')} in Hong Kong. Festive displays with the right flowers feel lucky.",
             "source_url": f"https://www.gov.hk/en/about/abouthk/holiday/{when.year}.htm", "source_name": f"GovHK: {when.year} public holidays"}
        eff = {"stat": "luck", "amount": 6, "target": target, "badge": f"{short}: +Luck", "words": words}
    return {
        **{k: c[k] for k in ("id", "kind", "title", "body")},
        "sources": [{"name": c["source_name"], "url": c["source_url"]}],
        "effects": [eff], "effect_text": eff["words"], "source": "offline", "label": OFFLINE_LABEL,
    }


def live_card(topic: str, cfg: dict, results: list) -> dict:
    kind = next(c["kind"] for c in INTEL_OFFLINE["cards"] if c["id"] == topic)
    extra = _weather_card(results) if topic == "weather" else _event_card(results) if topic == "event" else _festival_card(results, cfg["fest"])
    return {
        "id": topic, "kind": kind, "body": _summary(results), "sources": _sources(results),
        "effect_text": "; ".join(e["words"] for e in extra["effects"]), "source": "you.com", "label": LIVE_LABEL, **extra,
    }


async def gather_intel(owner_id: str, session_id: str, forced: bool, fail_topics: set, slow: bool, mock: bool = False) -> dict:
    start = time.monotonic()
    today = date.today()
    hooks = forced or fail_topics or slow or mock
    key = (owner_id, session_id, today.isoformat())
    if not hooks and key in _cache:
        stats["cache_hits"] += 1
        return {**_cache[key], "cached": True, "latency_ms": int((time.monotonic() - start) * 1000)}
    cfgs = topics(today)
    names = list(cfgs)

    async def run(t):
        if forced or t in fail_topics:
            return None
        try:
            res = await asyncio.wait_for(_search(t, cfgs[t], slow, mock), timeout=BUDGET_S)
            return res or None
        except Exception as exc:
            stats["failures"] += 1
            log.warning("intel %s fallback: %s", t, repr(exc)[:160])
            return None

    results = await asyncio.gather(*(run(t) for t in names))
    cards = [live_card(t, cfgs[t], r) if r else offline_card(t) for t, r in zip(names, results)]
    live = sum(c["source"] == "you.com" for c in cards)
    payload = {
        "label": LIVE_LABEL if live else OFFLINE_LABEL, "source": "live" if live == 3 else "mixed" if live else "offline",
        "cards": cards, "date": today.isoformat(), "cached": False,
    }
    if not hooks and live:
        _cache[key] = payload
    payload["latency_ms"] = int((time.monotonic() - start) * 1000)
    log.info("intel %s in %dms (session %s)", payload["source"], payload["latency_ms"], session_id[:8])
    return payload
