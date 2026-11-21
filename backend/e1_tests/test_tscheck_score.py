GOOD={"roof":"kumquat","awning":"peony","counter":"orchid","bumper":"bamboo"}
ALL=["budget","colours","goal","avoid"]
def sc(c,b): r=c.post("/owners/wing/score",json=b); assert r.status_code==200; return r.json()
def test_good_3(client):
    d=sc(client,{"placements":GOOD,"pre_storm":GOOD,"trust":3,"revealed":ALL,"intel_seen":True})
    assert d["stars"]==3 and len(d["lines"])==5
    assert d["receipt"]["total"]==sum(i["price"] for i in d["receipt"]["items"])
def test_white_minus1(client):
    p=dict(GOOD,stand="wchrys") if False else dict(GOOD,bumper="wchrys")
    d=sc(client,{"placements":p,"pre_storm":p,"trust":3,"revealed":ALL,"intel_seen":True})
    assert d["stars"]==2 and next(l for l in d["lines"] if l["key"]=="taboo")["passed"] is False
def test_bad_1(client):
    d=sc(client,{"placements":{"roof":"wchrys"},"trust":0})
    assert d["stars"]==1
def test_intel(client):
    d=client.get("/intel").json()
    assert d["label"]=="Market notes (offline)" and len(d["cards"])==3 and all(c["sources"] and c["sources"][0]["url"] for c in d["cards"])
def test_overspend_minus1(client):
    p=dict(GOOD,stand="stand")
    d=sc(client,{"placements":p,"pre_storm":p,"trust":3,"revealed":ALL,"intel_seen":True})
    assert d["meters"]["over_budget"] and d["stars"]==2
    assert next(l for l in d["lines"] if l["key"]=="budget")["passed"] is False
def test_trust_raises_crowd(client):
    b={"placements":GOOD,"pre_storm":GOOD,"revealed":ALL,"intel_seen":True}
    lo=sc(client,dict(b,trust=0)); hi=sc(client,dict(b,trust=4))
    assert hi["meters"]["crowd"]>lo["meters"]["crowd"]
    assert hi["reaction_tone"]!=lo["reaction_tone"] or hi["reaction"]!=lo["reaction"]
