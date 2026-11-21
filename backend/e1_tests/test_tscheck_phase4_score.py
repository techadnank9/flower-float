ALL=["budget","colours","goal","taboo"]
J={"roof":"peony","awning":"peach","counter":"edible","bumper":"pampas"}
F={"roof":"orchid","awning":"bamboo","counter":"kumquat","bumper":"ychrys","stand":"stand"}
def sc(c,o,p,pre=None):
    r=c.post(f"/owners/{o}/score",json={"placements":p,"pre_storm":pre or p,"trust":3,"revealed":ALL,"intel_seen":True})
    assert r.status_code==200; d=r.json()
    assert d["receipt"]["total"]==sum(i["price"] for i in d["receipt"]["items"]); return d
L=lambda d,k: next(l for l in d["lines"] if l["key"]==k)
def test_jasmine_good(client): assert sc(client,"jasmine",J)["stars"]==3
def test_jasmine_taboo(client):
    for t in ["ychrys","wchrys","stand"]:
        p=dict(J,bumper=t) if t!="stand" else dict(J,stand="stand")
        d=sc(client,"jasmine",p); assert d["stars"]==2 and L(d,"taboo")["passed"] is False, t
def test_fong_good(client): assert sc(client,"fong",F)["stars"]==3
def test_fong_no_stand(client):
    p={k:v for k,v in F.items() if k!="stand"}; assert sc(client,"fong",p)["stars"]<=2
def test_fong_lily(client):
    d=sc(client,"fong",dict(F,counter="lily")); assert d["stars"]==2 and not L(d,"taboo")["passed"]
def test_fong_overspend(client):
    d=sc(client,"fong",dict(F,awning="kumquat",bumper="kumquat")); assert d["stars"]==2 and not L(d,"budget")["passed"]
def test_min_one(client):
    d=client.post("/owners/fong/score",json={"placements":{"roof":"lily"},"trust":0}).json(); assert d["stars"]==1
