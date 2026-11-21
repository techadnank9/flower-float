import asyncio
import json
import logging
import os
import re
import time
import uuid

from emergentintegrations.llm.chat import LlmChat, UserMessage

from game_data import NEED_KEYS

log = logging.getLogger("dialogue")
LLM_TIMEOUT_S = 3.9

KEYWORDS = {
    "taboo": [r"\bavoid", r"dislike", r"\bhate", r"taboo", r"don'?t like", r"do not like", r"not like", r"bad luck", r"unlucky", r"superstiti", r"steer clear", r"forbid", r"\bnever\b", r"stay away", r"shouldn'?t (use|put)", r"off.?limits"],
    "budget": [r"budget", r"\bprice", r"money", r"\bspend", r"afford", r"\bcost", r"how much", r"hk\$", r"dollar", r"\bcash", r"pay\b"],
    "colours": [r"colou?r", r"\bshade", r"\bhue", r"palette"],
    "goal": [r"\bgoal", r"\bhope", r"\bwish", r"achieve", r"purpose", r"looking for", r"\baim", r"\bdream", r"what do you need", r"what should the flowers", r"flowers (to )?do", r"bring you", r"\bwant\b"],
    "family": [r"father", r"\bdad", r"\bba\b", r"papa", r"family", r"started (this|the) truck", r"who started", r"founded", r"history", r"parent", r"mother", r"\bmum", r"\bmom", r"grand(father|pa)", r"legacy", r"\blate\b"],
    "personal": [r"how are you", r"are you (ok|okay|alright|doing)", r"\btired", r"your health", r"how long", r"you doing", r"your day", r"\bfeel", r"proud", r"holding up", r"grew up", r"childhood", r"\bkids\b", r"\bwife\b"],
    "smalltalk": [r"business", r"evening", r"weather", r"\bnice\b", r"smell", r"waffle", r"harbou?r", r"\bview", r"hello", r"\bhi\b", r"\bhey\b", r"tonight", r"busy", r"tasty", r"delicious"],
}

MARKERS = {
    "budget": r"\b600\b|six hundred",
    "colours": r"\bred\b|\bgold(en)?\b",
    "goal": r"\bluck(y)?\b|\bwealth|\bfortune|\bprosper",
    "taboo": r"\bwhite\b|\bfuneral",
}
SMALLTALK_LINES = [[r"evening", r"\bnice\b", r"weather", r"hello", r"\bhi\b", r"\bhey\b"], [r"business", r"busy", r"customer"], [r"harbou?r", r"\bview"], [r"waffle", r"smell", r"tasty", r"delicious"]]
CANTONESE = r"\b(aiya+|hai|m ?goi|dai lou|wah|lah|mm hai|ah ba|gwai|jo san|sik fan|hou|lei|ah)\b"


def detect_topics(text: str, owner: dict | None = None) -> list[str]:
    t = text.lower()
    found = [k for k, pats in KEYWORDS.items() if any(re.search(p, t) for p in pats)]
    if owner:
        if any(re.search(p, t) for p in owner.get("goal_keywords", [])) and "goal" not in found:
            found.append("goal")
        if any(re.search(p, t) for p in owner.get("trust_keywords", [])) and "family" not in found:
            found.append("family")
    if "taboo" in found and "goal" in found and not any(re.search(p, t) for p in KEYWORDS["goal"] if p != r"\bwant\b"):
        found.remove("goal")
    return found


def leaks(owner: dict, reply: str, allowed: set[str]) -> set[str]:
    r = reply.lower()
    out = set()
    for need, pat in owner["markers"].items():
        if need in allowed or not re.search(pat, r):
            continue
        if owner["id"] == "wing" and need == "goal" and allowed & {"colours", "taboo"} and not re.search(r"\bwealth|\bfortune|\bprosper", r):
            continue
        out.add(need)
    return out


def mentions(owner: dict, reply: str, need: str) -> bool:
    return bool(re.search(owner["markers"][need], reply.lower()))


def trust_from_topics(topics: list[str]) -> int:
    if "family" in topics:
        return 2
    if "personal" in topics:
        return 1
    return 0


def seeded_chips(owner: dict, revealed: set[str], prev: list[str], turn: int) -> list[str]:
    pools = owner["seed_chips"]
    needs = [n for n in NEED_KEYS if n not in revealed]
    order = needs[:2] + ["family", "personal", "smalltalk"] + needs[2:]
    chips = []
    for i, topic in enumerate(order):
        opts = pools[topic]
        for k in range(len(opts)):
            c = opts[(turn + i + k) % len(opts)]
            if c not in prev and c not in chips:
                chips.append(c)
                break
        if len(chips) == 3:
            break
    return chips


def fallback_turn(owner: dict, message: str, revealed: set[str], trust: int, prev_chips: list[str], turn: int) -> dict:
    topics = detect_topics(message, owner)
    fb = owner["fallback"]
    needs = [t for t in topics if t in NEED_KEYS]
    unrevealed = [n for n in needs if n not in revealed]
    pick = (unrevealed or needs or [t for t in topics if t in ("family", "personal")] or [t for t in topics if t == "smalltalk"] or ["offtopic"])[0]
    if pick == "smalltalk" and trust >= 3:
        pick = "smalltalk_soft"
    lines = fb[pick]
    reply = lines[turn % len(lines)]
    if pick == "smalltalk":
        low = message.lower()
        for idx, pats in enumerate(SMALLTALK_LINES):
            if any(re.search(p, low) for p in pats):
                reply = lines[idx % len(lines)]
                break
    new_revealed = [pick] if pick in NEED_KEYS else []
    return {
        "reply": reply,
        "chips": seeded_chips(owner, revealed | set(new_revealed), prev_chips, turn),
        "revealed_needs": new_revealed,
        "trust_delta": trust_from_topics(topics),
        "source": "fallback",
    }


def system_prompt(owner: dict) -> str:
    f = owner["facts"]
    return (
        f"You are {owner['persona']} Personality: {owner['style']}. Speak short English with a few Cantonese words (aiya, hai, m goi, wah, lah). "
        "A young florist is offering to dress your truck in flowers.\n"
        f"HIDDEN FACTS (fixed, never change): budget: {f['budget']['llm']}. colours: {f['colours']['llm']}. "
        f"goal: {f['goal']['llm']}. taboo: {f['taboo']['llm']}. personal: {f['personal']['llm']}.\n"
        "RULES: 1) 1-2 short sentences, max 28 words, in character, at least one Cantonese word. "
        "2) Reveal a hidden fact ONLY if the player's latest message directly asks about that topic; then state it plainly. "
        "Never volunteer other facts; if a topic was not asked, do not mention its amount, colours, wishes or dislikes. "
        "3) Never alter facts. 4) Asked about your personal story or how you are: be noticeably warmer and share it. "
        "5) Off-topic: brush it off briefly, steer back to your truck.\n"
        'Return ONLY compact JSON: {"reply":"...","chips":["3 short things the florist could say next, under 8 words, varied"],'
        '"revealed_needs":["subset of budget,colours,goal,taboo revealed because the player asked"],"trust_delta":0}'
        " trust_delta is 1 or 2 only for kind personal questions, else 0."
    )


def parse_json(text: str) -> dict:
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        raise ValueError("no json")
    return json.loads(m.group(0))


def trim_sentences(reply: str) -> str:
    parts = re.split(r"(?<=[.!?])\s+", reply.strip())
    return " ".join(parts[:2])


async def llm_turn(owner: dict, message: str, history: list[dict], revealed: set[str], trust: int, prev_chips: list[str]) -> dict:
    convo = "\n".join(f"{'Florist' if h['role'] == 'player' else 'You'}: {h['text']}" for h in history[-8:])
    prompt = (
        f"Trust: {'high, you are warm' if trust >= 3 else 'low'}. Already revealed: {sorted(revealed) or 'none'}. "
        f"Avoid these chips: {prev_chips}.\nConversation so far:\n{convo}\nFlorist's latest message: \"{message}\""
    )
    chat = LlmChat(
        api_key=os.environ["EMERGENT_LLM_KEY"],
        session_id=f"fache-{uuid.uuid4()}",
        system_message=system_prompt(owner),
    ).with_model("anthropic", os.environ["DIALOGUE_MODEL"]).with_params(max_tokens=160, extra_body={"output_config": {"effort": "low"}})
    raw = await asyncio.wait_for(chat.send_message(UserMessage(text=prompt)), timeout=LLM_TIMEOUT_S)
    return parse_json(raw)


def validate(owner: dict, data: dict, message: str, revealed: set[str], trust: int, prev_chips: list[str], turn: int) -> dict:
    topics = detect_topics(message, owner)
    reply = trim_sentences(str(data.get("reply", "")))
    if not reply or len(reply) > 320:
        raise ValueError("bad reply")
    llm_rev = {n for n in data.get("revealed_needs") or [] if n in NEED_KEYS}
    asked = {t for t in topics if t in NEED_KEYS} | llm_rev
    if leaks(owner, reply, asked | revealed):
        raise ValueError("leak")
    kw_needs = [t for t in topics if t in NEED_KEYS]
    if any(not mentions(owner, reply, n) for n in kw_needs if n not in revealed):
        raise ValueError("asked need not answered")
    if not re.search(CANTONESE, reply.lower()):
        reply = "Hai, " + reply[0].lower() + reply[1:]
    mw = owner.get("must_word")
    if mw and mw not in reply.lower():
        reply = re.sub(r"[.!?]*$", "", reply) + f", {mw}."
    new_revealed = sorted(n for n in asked if mentions(owner, reply, n))
    chips = [str(c).strip()[:70] for c in (data.get("chips") or []) if str(c).strip()]
    chips = list(dict.fromkeys(chips))
    if len(chips) < 3 or set(chips[:3]) == set(prev_chips):
        chips = seeded_chips(owner, revealed | set(new_revealed), prev_chips, turn)
    try:
        llm_delta = max(0, min(1, int(data.get("trust_delta") or 0)))
    except (TypeError, ValueError):
        llm_delta = 0
    kw_delta = trust_from_topics(topics)
    delta = kw_delta if (kw_delta or set(topics) & set(NEED_KEYS + ["smalltalk"])) else llm_delta
    return {"reply": reply, "chips": chips[:3], "revealed_needs": new_revealed, "trust_delta": delta, "source": "llm"}


async def run_turn(owner: dict, message: str, history: list[dict], revealed: set[str], trust: int, prev_chips: list[str], force_fallback: bool) -> dict:
    turn = sum(1 for h in history if h.get("role") == "player")
    start = time.monotonic()
    result = None
    if not force_fallback:
        try:
            data = await llm_turn(owner, message, history, revealed, trust, prev_chips)
            result = validate(owner, data, message, revealed, trust, prev_chips, turn)
        except Exception as exc:
            log.warning("dialogue fallback: %s", repr(exc)[:200])
    if result is None:
        result = fallback_turn(owner, message, revealed, trust, prev_chips, turn)
    result["latency_ms"] = int((time.monotonic() - start) * 1000)
    result["needs"] = {n: owner["facts"][n]["value"] for n in result["revealed_needs"]}
    log.info("dialogue %s %dms revealed=%s", result["source"], result["latency_ms"], result["revealed_needs"])
    return result


def _ribbon_ok(owner: dict, lines) -> bool:
    if not isinstance(lines, list) or len(lines) != 2:
        return False
    if any(not isinstance(l, str) or not l.strip() or len(l) > 30 for l in lines):
        return False
    return owner["id"] != "fong" or bool(re.search(r"20|twenty|二十", " ".join(lines).lower()))


async def ribbon_message(owner: dict, history: list[dict], force_fallback: bool) -> dict:
    start = time.monotonic()
    lines, source = owner["ribbon_fallback"], "fallback"
    if not force_fallback:
        convo = "\n".join(f"{'Florist' if h['role'] == 'player' else owner['name']}: {h['text']}" for h in history[-10:])
        extra = " It is the truck's 20th anniversary, so the message MUST mention 20 years." if owner["id"] == "fong" else ""
        try:
            chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=f"ribbon-{uuid.uuid4()}",
                           system_message="You write Hong Kong congratulation flower-stand ribbon messages. Return ONLY JSON {\"lines\": [\"line 1\", \"line 2\"]}: exactly 2 short lines, each at most 26 characters. English, or a 4-8 character Chinese blessing.").with_model("anthropic", os.environ["DIALOGUE_MODEL"]).with_params(max_tokens=80)
            prompt = f"Owner: {owner['name']} of {owner['truck']}.{extra} Make it personal to this chat:\n{convo or '(no chat)'}"
            data = parse_json(await asyncio.wait_for(chat.send_message(UserMessage(text=prompt)), timeout=LLM_TIMEOUT_S))
            cand = [str(x).strip() for x in data.get("lines", [])]
            if _ribbon_ok(owner, cand):
                lines, source = cand, "llm"
        except Exception as exc:
            log.warning("ribbon fallback: %s", repr(exc)[:160])
    return {"lines": lines, "source": source, "latency_ms": int((time.monotonic() - start) * 1000)}
