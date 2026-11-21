# FA CHE Phase 1 backend regression tests: game data, intel, dialogue (LLM + fallback), evaluate, score
import os
import re
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
FB = {"X-Force-Fallback": "1"}
GOOD = {"roof": "kumquat", "awning": "orchid", "counter": "ychrys", "bumper": "bamboo"}
ALL_NEEDS = ["budget", "colours", "goal", "taboo"]


@pytest.fixture(scope="module")
def s():
    x = requests.Session()
    x.headers.update({"Content-Type": "application/json"})
    return x


def dlg(s, msg, revealed=None, history=None, trust=0, headers=None, prev=None):
    r = s.post(f"{BASE_URL}/api/dialogue", json={"owner_id": "wing", "message": msg, "history": history or [],
               "revealed": revealed or [], "trust": trust, "prev_chips": prev or []}, headers=headers or {}, timeout=15)
    return r


# Basic / game data
class TestData:
    def test_root_and_openapi(self, s):
        assert s.get(f"{BASE_URL}/api/").status_code == 200
        r = s.get(f"{BASE_URL}/api/openapi.json")
        assert r.status_code == 200 and "/api/dialogue" in r.json()["paths"]

    def test_game_data_no_hidden_facts(self, s):
        d = s.get(f"{BASE_URL}/api/game/data").json()
        assert len(d["flowers"]) == 12 and len(d["slots"]) == 5
        w = d["owners"]["wing"]
        assert "facts" not in w and "fallback" not in w
        txt = str(d["owners"]).lower()
        assert "600" not in txt and "funeral" not in txt
        assert not re.search(r"\b(red|gold|white)\b", w["greeting"].lower())
        assert d["kit"]["name_empty"] == "Tell me your name, Boss!"
        assert d["kit"]["locked_truck"] == "Boss! Let's help Uncle Wing first."

    def test_intel(self, s):
        d = s.get(f"{BASE_URL}/api/intel?owner_id=wing").json()
        assert d["label"] == "Market notes (offline)"
        assert {c["id"] for c in d["cards"]} == {"weather", "event", "festival"}
        assert all(c["sources"][0]["url"].startswith("https://") for c in d["cards"])  # Phase 3 contract: sources[]

    def test_no_key_leak(self, s):
        for p in ["/api/game/data", "/api/intel", "/api/openapi.json"]:
            assert "sk-" not in s.get(f"{BASE_URL}{p}").text


# Dialogue - fallback (deterministic)
class TestDialogueFallback:
    @pytest.mark.parametrize("msg,need,val", [
        ("What's your budget, Uncle?", "budget", "HK$600"),
        ("Which colours do you like?", "colours", "Red and gold"),
        ("What do you hope the flowers will do?", "goal", "Luck and wealth symbols"),
        ("Anything you want me to avoid?", "taboo", "No white flowers (funerals)"),
    ])
    def test_needs(self, s, msg, need, val):
        r = dlg(s, msg, headers=FB)
        assert r.status_code == 200
        d = r.json()
        assert d["source"] == "fallback"
        assert d["needs"].get(need) == val
        assert len(d["chips"]) == 3

    def test_query_param_switch(self, s):
        r = s.post(f"{BASE_URL}/api/dialogue?force_fallback=1", json={"message": "Nice evening!"})
        assert r.json()["source"] == "fallback" and r.json()["needs"] == {}

    def test_smalltalk_no_reveal(self, s):
        for m in ["Nice evening!", "How's business?"]:
            d = dlg(s, m, headers=FB).json()
            assert d["needs"] == {} and d["trust_delta"] == 0

    def test_father_trust(self, s):
        d = dlg(s, "Tell me about your father.", headers=FB).json()
        assert d["trust_delta"] == 2 and "father" in d["reply"].lower()

    def test_empty_message_422(self, s):
        assert dlg(s, "").status_code == 422

    def test_non_playable_404(self, s):
        # Phase 4: fong/jasmine are playable now; unknown owners still 404
        r = s.post(f"{BASE_URL}/api/dialogue", json={"owner_id": "nobody", "message": "hi"})
        assert r.status_code == 404


# Dialogue - live LLM
class TestDialogueLLM:
    def test_budget_llm(self, s):
        t = time.time()
        d = dlg(s, "What's your budget, Uncle?").json()
        el = time.time() - t
        print("LLM budget", d["source"], d["latency_ms"], round(el, 2), d["reply"])
        assert el < 6
        assert d["needs"].get("budget") == "HK$600"
        assert len(d["chips"]) == 3

    def test_smalltalk_llm_no_leak(self, s):
        for m in ["Nice evening!", "How's business?", "The harbour view is lovely", "Your waffles smell great"]:
            d = dlg(s, m).json()
            print("LLM small", d["source"], d["latency_ms"], d["reply"])
            assert d["needs"] == {}
            assert not re.search(r"\b600\b|\bred\b|\bgold\b|\bwhite\b|funeral", d["reply"].lower())

    def test_chips_change(self, s):
        prev = ["How's business tonight?", "What's your budget, Uncle?", "Who started this truck?"]
        d = dlg(s, "How's business tonight?", prev=prev).json()
        assert set(d["chips"]) != set(prev)


# Evaluate & score
class TestScoring:
    def ev(self, s, pl, **kw):
        return s.post(f"{BASE_URL}/api/owners/wing/evaluate", json={"placements": pl, **kw}).json()

    def sc(self, s, pl, pre=None, trust=0, revealed=ALL_NEEDS):
        return s.post(f"{BASE_URL}/api/owners/wing/score", json={"placements": pl, "pre_storm": pre or pl, "trust": trust, "revealed": revealed, "intel_seen": True}).json()

    def test_budget_hidden_then_revealed(self, s):
        assert self.ev(s, {"roof": "kumquat"})["budget"] is None
        m = self.ev(s, {"roof": "kumquat", "awning": "peony"}, revealed=["budget"])
        assert m["spent"] == 300 and m["budget"] == 600

    def test_complaint_wchrys(self, s):
        assert self.ev(s, {"bumper": "wchrys"}, new_flower="wchrys")["complaint"]
        assert self.ev(s, {"bumper": "kumquat"}, new_flower="kumquat")["complaint"] is None

    def test_good_run_3_stars(self, s):
        d = self.sc(s, GOOD, trust=4)
        assert d["stars"] == 3 and d["receipt"]["total"] == 440 and len(d["lines"]) == 5
        assert d["reaction_tone"] == "warm"

    def test_good_plus_white_2(self, s):
        d = self.sc(s, {**GOOD, "stand": "wchrys"}, trust=4)
        assert d["stars"] == 2
        assert [l for l in d["lines"] if l["key"] == "taboo"][0]["passed"] is False

    def test_good_overspend_2(self, s):
        d = self.sc(s, {**GOOD, "stand": "stand"}, trust=4)
        assert d["stars"] == 2
        assert [l for l in d["lines"] if l["key"] == "budget"][0]["passed"] is False

    def test_bad_run_1(self, s):
        pl = {"roof": "peach", "awning": "peony", "counter": "edible", "bumper": "wchrys", "stand": "stand"}
        post = {"bumper": "wchrys", "stand": "stand"}
        d = self.sc(s, post, pre=pl, trust=0, revealed=[])
        assert d["stars"] == 1 and d["reaction_tone"] == "grumpy"

    def test_crowd_trust(self, s):
        assert self.ev(s, GOOD, trust=4)["crowd"] > self.ev(s, GOOD, trust=0)["crowd"]
