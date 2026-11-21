# Phase 4: Jasmine + Auntie Fong playable levels (dialogue, trust, complaints, ribbon, scoring, offline festival)
import os
import re

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
FF = {"X-Force-Fallback": "1"}
CANTO = r"\b(aiya+|hai|m ?goi|dai lou|wah|lah|mm hai|ah ba|gwai|jo san|sik fan|hou|lei|ah)\b"

CANON = {
    "jasmine": {"budget": "HK$1500", "colours": "Pinks and oranges", "goal": "Photo-worthy look + edible garnish flowers", "taboo": "Nothing old-fashioned"},
    "fong": {"budget": "HK$1000", "goal_prefix": "20th anniversary", "taboo": "No strong scents (they overpower her tea)"},
}
ASK = {"budget": "What's your budget?", "colours": "Which colours do you like?", "goal": "What do you want the flowers to do?", "taboo": "Anything I should avoid?"}


def dlg(owner, msg, turn_hist=None, force=True, revealed=None, trust=0):
    body = {"owner_id": owner, "message": msg, "history": turn_hist or [], "revealed": revealed or [], "trust": trust, "prev_chips": []}
    r = requests.post(f"{BASE_URL}/api/dialogue", json=body, headers=FF if force else {}, timeout=20)
    assert r.status_code == 200, r.text
    return r.json()


def game_data():
    return requests.get(f"{BASE_URL}/api/game/data", timeout=10).json()


# --- data: both owners playable (JRN-72)
def test_owners_playable():
    owners = game_data()["owners"]
    for o in ("wing", "jasmine", "fong"):
        assert owners[o]["playable"] is True


# --- dialogue fallback reveals (JRN-73/74)
@pytest.mark.parametrize("owner", ["jasmine", "fong"])
def test_smalltalk_reveals_nothing(owner):
    for msg in ["Nice evening, right?", "How's business tonight?", "Your truck looks fun!"]:
        d = dlg(owner, msg)
        assert d["revealed_needs"] == [] and d["needs"] == {}, (msg, d)


@pytest.mark.parametrize("owner", ["jasmine", "fong"])
@pytest.mark.parametrize("turn", [0, 1])
def test_need_reveals_canonical(owner, turn):
    hist = [{"role": "player", "text": "hi"}, {"role": "owner", "text": "hi"}] * turn
    for need, q in ASK.items():
        d = dlg(owner, q, hist)
        assert need in d["revealed_needs"], (need, d)
        val = d["needs"][need]
        if owner == "jasmine":
            assert val == CANON["jasmine"][need]
        elif need == "budget":
            assert val == "HK$1000"
        elif need == "goal":
            assert val.startswith("20th anniversary")
        elif need == "taboo":
            assert val.startswith("No strong scents")


@pytest.mark.parametrize("owner", ["jasmine", "fong"])
@pytest.mark.parametrize("turn", [0, 1])
def test_every_fallback_reply_has_cantonese(owner, turn):
    hist = [{"role": "player", "text": "hi"}, {"role": "owner", "text": "hi"}] * turn
    msgs = list(ASK.values()) + ["Nice evening!", "How are you tonight?", "What's the capital of France?"]
    bad = []
    for m in msgs:
        reply = dlg(owner, m, hist)["reply"]
        if not re.search(CANTO, reply.lower()):
            bad.append(reply)
        if owner == "fong":
            assert "dear" in reply.lower(), reply
    assert not bad, f"replies without Cantonese word: {bad}"


# --- trust topics (JRN-75)
@pytest.mark.parametrize("owner,msgs", [
    ("jasmine", ["Tell me about your Instagram!", "How did you start Curry Up?", "What recipes do you make?"]),
    ("fong", ["Tell me about your 20 years here!", "Who are your regulars?", "How is your family?"]),
])
def test_trust_topics(owner, msgs):
    for m in msgs:
        assert dlg(owner, m)["trust_delta"] > 0, m


# --- live LLM sample (JRN-73/74)
@pytest.mark.parametrize("owner,need", [("jasmine", "budget"), ("fong", "budget"), ("fong", "goal")])
def test_live_llm_reveal(owner, need):
    d = dlg(owner, ASK[need] if need != "goal" else "What's the occasion, Auntie?", force=False)
    assert need in d["revealed_needs"], d
    assert re.search(CANTO, d["reply"].lower()), d
    if owner == "fong":
        assert "dear" in d["reply"].lower()
    print(owner, need, d["source"], d["latency_ms"], d["reply"])


def test_live_llm_smalltalk_no_reveal():
    d = dlg("fong", "Lovely evening on the harbour!", force=False)
    assert d["revealed_needs"] == [] and "dear" in d["reply"].lower(), d


# --- complaints (JRN-76)
def test_complaints():
    j = requests.post(f"{BASE_URL}/api/owners/jasmine/evaluate", json={"placements": {"roof": "ychrys"}, "new_flower": "ychrys"}, timeout=10).json()
    assert j["complaint"] and "ychrys" in j["taboo_flowers"]
    f = requests.post(f"{BASE_URL}/api/owners/fong/evaluate", json={"placements": {"roof": "lily"}, "new_flower": "lily"}, timeout=10).json()
    assert f["complaint"] and "lily" in f["taboo_flowers"]
    ok = requests.post(f"{BASE_URL}/api/owners/fong/evaluate", json={"placements": {"roof": "kumquat"}, "new_flower": "kumquat"}, timeout=10).json()
    assert ok["complaint"] is None


# --- ribbon (JRN-77/78)
def test_ribbon_fallback():
    r = requests.post(f"{BASE_URL}/api/ribbon", json={"owner_id": "fong", "history": []}, headers=FF, timeout=10).json()
    assert r["lines"] == ["Congratulations on 20 Years!", "二十週年 生意興隆"] and r["source"] == "fallback"


def test_ribbon_live():
    hist = [{"role": "player", "text": "Tell me about your 20 years here!"}, {"role": "owner", "text": "Twenty years, dear! My regular taxi driver comes every morning."}]
    r = requests.post(f"{BASE_URL}/api/ribbon", json={"owner_id": "fong", "history": hist}, timeout=20).json()
    print(r)
    assert len(r["lines"]) == 2
    assert re.search(r"20|twenty|二十", " ".join(r["lines"]).lower())


# --- scoring (JRN-79..82)
def score(owner, placements, trust=4, revealed=("budget", "colours", "goal", "taboo"), ribbon=None):
    body = {"placements": placements, "pre_storm": placements, "trust": trust, "revealed": list(revealed), "intel_seen": False, "ribbon": ribbon}
    r = requests.post(f"{BASE_URL}/api/owners/{owner}/score", json=body, timeout=10)
    assert r.status_code == 200
    return r.json()


JAS_GOOD = {"roof": "pampas", "awning": "orchid", "counter": "edible", "bumper": "sunflower"}
FONG_GOOD = {"roof": "kumquat", "counter": "orchid", "bumper": "bamboo", "stand": "stand"}


def test_jasmine_good_3_stars():
    s = score("jasmine", JAS_GOOD)
    assert s["stars"] == 3, s["lines"]


def test_fong_good_3_stars_with_ribbon():
    rib = ["Congratulations on 20 Years!", "二十週年 生意興隆"]
    s = score("fong", FONG_GOOD, ribbon=rib)
    assert s["stars"] == 3, s["lines"]
    stand = [i for i in s["receipt"]["items"] if i["id"] == "stand"][0]
    assert stand["ribbon"] == rib


def test_fong_without_stand():
    s = score("fong", {"roof": "kumquat", "counter": "orchid", "bumper": "bamboo", "awning": "ychrys"})
    needs = [l for l in s["lines"] if l["key"] == "needs"][0]
    assert needs["points"] == 0 and s["stars"] <= 2


def test_taboo_and_overspend_penalties():
    assert score("fong", {**FONG_GOOD, "awning": "lily"})["stars"] == 2
    assert score("jasmine", {**JAS_GOOD, "stand": "stand"})["stars"] == 2  # stand is old-fashioned for Jasmine
    over = {"roof": "kumquat", "awning": "peony", "counter": "orchid", "bumper": "bamboo", "stand": "stand"}  # 910 ok
    assert score("fong", over)["stars"] == 3
    over2 = {**over, "awning": "lily", "counter": "lily"}  # taboo
    s = score("fong", over2, trust=0)
    assert s["stars"] >= 1
    # overspend jasmine: no; fong overspend: stand 400 + kumquat 180 *... craft one > 1000
    big = {"roof": "kumquat", "awning": "kumquat", "counter": "kumquat", "bumper": "kumquat", "stand": "stand"}  # 1120
    s = score("fong", big)
    assert s["meters"]["over_budget"] and s["stars"] == 2
    s = score("fong", {**big, "awning": "lily", "roof": "lily", "counter": "lily", "bumper": "kumquat"}, trust=0)
    assert s["stars"] == 1


# --- offline festival by date (JRN-88)
def test_offline_festival_upcoming():
    d = requests.get(f"{BASE_URL}/api/intel", params={"owner_id": "fong", "session_id": "TEST_p4"}, headers=FF, timeout=10).json()
    fest = [c for c in d["cards"] if c["id"] == "festival"][0]
    print(fest["title"])
    assert "Mid-Autumn" not in fest["title"]
    assert "Winter Solstice" in fest["title"]  # server date 2026-11-20
