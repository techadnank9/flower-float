import time
def test_budget_live_or_fallback(client):
    t=time.time()
    r=client.post("/dialogue",json={"message":"What's your budget, Uncle?"})
    assert r.status_code==200; d=r.json()
    assert time.time()-t<6
    assert d["reply"] and len(d["chips"])>=1
    assert d["needs"].get("budget")=="HK$600"
def test_small_talk_no_needs(client):
    d=client.post("/dialogue",json={"message":"Nice evening, huh?"}).json()
    assert d["needs"]=={}
def test_empty_rejected(client):
    assert client.post("/dialogue",json={"message":""}).status_code==422
