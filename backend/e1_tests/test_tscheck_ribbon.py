def test_ribbon_llm(client):
    r=client.post("/ribbon",json={"owner_id":"fong","history":[{"role":"user","text":"20th anniversary?"}]}); assert r.status_code==200
    d=r.json(); assert len(d["lines"])==2 and d["latency_ms"]<=4500
    if d["source"]=="llm": assert "20" in " ".join(d["lines"]) or "twenty" in " ".join(d["lines"]).lower()
def test_ribbon_fallback(client):
    d=client.post("/ribbon",json={"owner_id":"fong"},headers={"X-Force-Fallback":"1"}).json()
    assert d["lines"]==["Congratulations on 20 Years!","二十週年 生意興隆"] and d["source"]=="fallback"
