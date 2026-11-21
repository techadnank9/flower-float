import re, datetime
def ask(c,o,m,trust=0): 
    r=c.post("/dialogue",json={"owner_id":o,"message":m,"trust":trust}); assert r.status_code==200; return r.json()
def test_jasmine_budget(client):
    d=ask(client,"jasmine","What's your budget?"); print(d)
    assert "budget" in d["revealed_needs"] and "1500" in d["needs"]["budget"].replace(",","")
def test_fong_budget_dear(client):
    d=ask(client,"fong","What's your budget, Auntie?"); print(d)
    assert "1000" in d["needs"]["budget"].replace(",","")
def test_small_talk_reveals_nothing(client):
    d=ask(client,"jasmine","Nice weather tonight huh"); assert d["revealed_needs"]==[]
def test_personal_trust(client):
    d=ask(client,"fong","How did you start the shop, Auntie? Tell me about your family."); print(d); assert d["trust_delta"]>0
def test_festival_future(client):
    d=client.get("/intel",headers={"X-Force-Fallback":"1"}).json()
    f=next(c for c in d["cards"] if c["id"]=="festival"); print(f["title"],f["body"],d["date"])
