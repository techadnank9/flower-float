from game_data import FLOWER_BY_ID, INTEL_OFFLINE

TRUST_HIGH = 3


def flowers_of(placements: dict) -> list[tuple[str, dict]]:
    return [(slot, FLOWER_BY_ID[fid]) for slot, fid in placements.items() if fid in FLOWER_BY_ID]


OFFLINE_EFFECTS = [c["effect"] for c in INTEL_OFFLINE["cards"]]


def intel_bonus(flower: dict, stat: str, effects: list) -> int:
    total = 0
    for eff in effects:
        tgt = eff.get("target") or {}
        if eff["stat"] != stat:
            continue
        hit = (flower["hardiness"] in tgt.get("hardiness", [])) or (flower["id"] in tgt.get("ids", [])) or bool(set(flower["tags"]) & set(tgt.get("tags", [])))
        total += max(0, min(10, int(eff.get("amount", 0)))) if hit else 0
    return total


def is_match(owner: dict, flower: dict) -> bool:
    r = owner["rules"]
    return flower["id"] in r.get("match_ids", []) or bool(set(flower["tags"]) & set(r["match_tags"])) or any(w in f"{flower['meaning']} {flower['name']}".lower() for w in r["match_meaning_words"])


def is_taboo(owner: dict, flower: dict) -> bool:
    r = owner["rules"]
    return flower["id"] in r.get("taboo_ids", []) or bool(set(flower["tags"]) & set(r["taboo_tags"]))


def clamp(v: float) -> int:
    return int(max(0, min(100, round(v))))


def evaluate(owner: dict, placements: dict, trust: int, revealed: list[str], intel_seen: bool, effects: list | None = None) -> dict:
    effects = (effects if effects is not None else OFFLINE_EFFECTS) if intel_seen else []
    items = flowers_of(placements)
    spent = sum(f["price"] for _, f in items)
    budget = owner["facts"]["budget"]["amount"]

    def stat(name):
        return sum(f[name] + intel_bonus(f, name, effects) for _, f in items)

    crowd = stat("crowd") + (min(trust, 6) * 4 if items else 0)
    return {
        "spent": spent,
        "budget": budget if "budget" in revealed else None,
        "over_budget": spent > budget,
        "luck": clamp(stat("luck")),
        "crowd": clamp(crowd),
        "storm": clamp(stat("storm")),
        "taboo_flowers": [f["id"] for _, f in items if is_taboo(owner, f)],
        "matching_flowers": [f["id"] for _, f in items if is_match(owner, f)],
    }


def score(owner: dict, placements: dict, pre_storm: dict, trust: int, revealed: list[str], intel_seen: bool, effects: list | None = None, ribbon: list | None = None) -> dict:
    meters = evaluate(owner, placements, trust, revealed, intel_seen, effects)
    items = flowers_of(placements)
    matched = len(meters["matching_flowers"])
    needs_pts = 2 if matched >= 3 else (1 if matched >= 1 else 0)
    missing = [i for i in owner["rules"].get("required_ids", []) if i not in placements.values()]
    if missing:
        needs_pts = 0
    pre = flowers_of(pre_storm or placements)
    survivors = sum(1 for _, f in pre if f["hardiness"] != "fragile")
    ratio = survivors / len(pre) if pre else 0
    storm_ok = ratio >= 0.6
    trust_high = trust >= TRUST_HIGH
    taboo_ok = not meters["taboo_flowers"]
    budget_ok = not meters["over_budget"]
    quality = needs_pts + (1 if storm_ok else 0) + (1 if trust_high else 0)
    base = 3 if quality >= 3 else (2 if quality >= 1 else 1)
    stars = max(1, base - (0 if taboo_ok else 1) - (0 if budget_ok else 1))
    tone = "grumpy" if stars == 1 else ("warm" if trust_high else "neutral")
    trust_label = "High" if trust_high else ("Medium" if trust >= 1 else "Low")
    lines = [
        {"key": "needs", "label": "Needs matched", "passed": needs_pts == 2, "partial": needs_pts == 1, "detail": owner["rules"]["required_label"] if missing else f"{matched} of {len(items)} flowers match {owner['match_words']}", "points": needs_pts},
        {"key": "taboo", "label": "Taboo avoided", "passed": taboo_ok, "detail": "No taboo flowers" if taboo_ok else "Taboo flowers on the truck (-1 star)", "points": 0 if taboo_ok else -1},
        {"key": "budget", "label": "Budget respected", "passed": budget_ok, "detail": f"HK${meters['spent']} of HK${owner['facts']['budget']['amount']}" + ("" if budget_ok else " (-1 star)"), "points": 0 if budget_ok else -1},
        {"key": "storm", "label": "Storm survivors", "passed": storm_ok, "detail": f"{survivors} of {len(pre)} pre-storm flowers survived T8", "points": 1 if storm_ok else 0},
        {"key": "trust", "label": "Trust", "passed": trust_high, "partial": trust_label == "Medium", "detail": f"{trust_label} trust", "points": 1 if trust_high else 0},
    ]
    receipt = [{"slot": slot, "id": f["id"], "name": f["name"], "price": f["price"], **({"ribbon": ribbon or owner.get("ribbon_fallback")} if f["id"] == "stand" and (ribbon or owner.get("ribbon_fallback")) else {})} for slot, f in items]
    return {
        "stars": stars,
        "base_stars": base,
        "lines": lines,
        "reaction": owner["reactions"][tone],
        "reaction_tone": tone,
        "trust_label": trust_label,
        "meters": meters,
        "receipt": {"items": receipt, "total": sum(i["price"] for i in receipt), "currency": "HKD", "delivery_slot": owner["delivery_slot"]},
    }
