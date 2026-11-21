def test_header(client):
    d=client.post("/dialogue",json={"message":"What's your budget?"},headers={"X-Force-Fallback":"1"}).json()
    assert d["source"]=="fallback" and d["needs"]["budget"]=="HK$600" and d["chips"]
def test_query(client):
    d=client.post("/dialogue?force_fallback=1",json={"message":"Which colours do you like?"}).json()
    assert d["source"]=="fallback" and d["reply"] and d["chips"]
