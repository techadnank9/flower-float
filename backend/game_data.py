from owners_p4 import FONG, JASMINE

SLOTS = [
    {"id": "roof", "label": "Roof"},
    {"id": "awning", "label": "Awning"},
    {"id": "counter", "label": "Counter"},
    {"id": "bumper", "label": "Bumper"},
    {"id": "stand", "label": "Stand"},
]

FLOWERS = [
    {"id": "kumquat", "name": "Kumquat tree", "zh": "金桔", "price": 180, "meaning": "wealth", "hardiness": "hardy", "tags": ["gold"], "luck": 24, "crowd": 10, "storm": 22},
    {"id": "peach", "name": "Peach blossom", "zh": "桃花", "price": 150, "meaning": "luck in love and footfall", "hardiness": "fragile", "tags": ["pink"], "luck": 20, "crowd": 16, "storm": 4},
    {"id": "peony", "name": "Peony", "zh": "牡丹", "price": 120, "meaning": "prosperity", "hardiness": "fragile", "tags": ["red", "pink"], "luck": 20, "crowd": 14, "storm": 4},
    {"id": "orchid", "name": "Orchid", "zh": "蘭花", "price": 140, "meaning": "abundance and elegance", "hardiness": "medium", "tags": ["purple"], "luck": 16, "crowd": 12, "storm": 12},
    {"id": "sunflower", "name": "Sunflower", "zh": "向日葵", "price": 60, "meaning": "cheer", "hardiness": "medium", "tags": ["yellow"], "luck": 6, "crowd": 12, "storm": 12},
    {"id": "ychrys", "name": "Yellow chrysanthemum", "zh": "黃菊", "price": 50, "meaning": "long life", "hardiness": "hardy", "tags": ["gold"], "luck": 12, "crowd": 7, "storm": 20},
    {"id": "wchrys", "name": "White chrysanthemum", "zh": "白菊", "price": 40, "meaning": "mourning", "hardiness": "hardy", "tags": ["white"], "luck": -20, "crowd": -6, "storm": 20},
    {"id": "lily", "name": "Lily", "zh": "百合", "price": 90, "meaning": "a hundred years of harmony", "hardiness": "medium", "tags": ["strong scent"], "luck": 8, "crowd": 9, "storm": 12},
    {"id": "bamboo", "name": "Lucky bamboo", "zh": "富貴竹", "price": 70, "meaning": "steady growth", "hardiness": "hardy", "tags": ["green"], "luck": 15, "crowd": 7, "storm": 22},
    {"id": "pampas", "name": "Pampas grass", "zh": "蒲葦", "price": 80, "meaning": "modern style", "hardiness": "hardy", "tags": ["dried"], "luck": 2, "crowd": 10, "storm": 20},
    {"id": "edible", "name": "Nasturtium and pansy mix", "zh": "食用花", "price": 65, "meaning": "edible garnish", "hardiness": "fragile", "tags": ["edible", "orange"], "luck": 2, "crowd": 9, "storm": 4},
    {"id": "stand", "name": "Congratulation stand with ribbon", "zh": "花牌", "price": 400, "meaning": "grand celebration", "hardiness": "hardy", "tags": ["stand"], "luck": 18, "crowd": 18, "storm": 20, "slot_only": "stand"},
]
FLOWER_BY_ID = {f["id"]: f for f in FLOWERS}

NEED_KEYS = ["budget", "colours", "goal", "taboo"]

OWNERS = {
    "wing": {
        "id": "wing",
        "name": "Uncle Wing",
        "truck": "Wing's Egg Waffles",
        "truck_zh": "榮記雞蛋仔",
        "playable": True,
        "persona": "Uncle Wing, 58, owner of the food truck \"Wing's Egg Waffles\" on the West Kowloon harbourfront, Hong Kong. Gruff, proud and superstitious. Business is slow and the crowds walk past.",
        "facts": {
            "budget": {"value": "HK$600", "amount": 600, "llm": "total flower budget is HK$600, not a cent more"},
            "colours": {"value": "Red and gold", "llm": "loves red and gold (lucky colours)"},
            "goal": {"value": "Luck and wealth symbols", "llm": "wants luck and wealth symbols that bring fortune and customers"},
            "taboo": {"value": "No white flowers (funerals)", "llm": "no white flowers, white means funerals and bad luck"},
            "personal": {"llm": "his late father (Ah Ba) started the truck 30 years ago; he softens and grows warm when asked about him"},
        },
        "rules": {
            "match_tags": ["red", "gold"],
            "match_meaning_words": ["wealth", "luck", "prosperity", "abundance"],
            "taboo_tags": ["white"], "match_ids": [], "taboo_ids": [],
        },
        "greeting": "Aiya, a florist at my truck? Hai, I'm Uncle Wing. Business is slow tonight, so talk quick, m goi.",
        "initial_chips": ["How's business tonight?", "What's your budget, Uncle?", "Who started this truck?"],
        "delivery_slot": "Tomorrow 7:00–9:00am, before the waffle irons heat up",
        "style": "gruff, proud and superstitious",
        "match_words": "red, gold, luck or wealth",
        "markers": {"budget": r"\b600\b|six hundred", "colours": r"\bred\b|\bgold(en)?\b", "goal": r"\bluck(y)?\b|\bwealth|\bfortune|\bprosper", "taboo": r"\bwhite\b|\bfuneral"},
        "trust_keywords": [],
        "ribbon_fallback": ["Wing's Egg Waffles", "生意興隆 大吉大利"],
        "fallback": {
            "budget": ["Budget? Aiya, HK$600, not one cent more, dai lou.", "HK$600, hai. That's all a waffle man can spare."],
            "colours": ["Red and gold, of course! Hai, those are the only colours for my truck.", "Aiya, red and gold, lah. Anything else looks cheap."],
            "goal": ["I want luck and wealth on this truck, hai. Symbols that bring fortune and customers.", "Luck and wealth, dai lou! Make people feel fortune is here."],
            "taboo": ["No white flowers! Aiya, white is for funerals, very bad luck.", "Mm hai white, never white. White flowers mean funerals, lah."],
            "family": ["My late father started this truck, you know. Ah Ba made waffles here every night... m goi for asking.", "Ah Ba built this truck with his own hands, thirty years ago. Hai... I miss him, florist."],
            "personal": ["Tired, hai, but the waffles keep me going. Kind of you to ask, m goi.", "Aiya, nobody asks me that. I'm okay, just worried about the crowds."],
            "smalltalk": ["Hmph, nice evening, but nobody's buying, aiya.", "Business? Slow, slow. The crowds walk right past, dai lou.", "The harbour is pretty, hai, but pretty doesn't pay rent.", "Waffles are hot, customers are cold. Aiya."],
            "smalltalk_soft": ["Hai, the harbour looks kind tonight. Maybe Ah Ba is watching, ah.", "You're a good kid, florist. Business is slow, but talking helps, m goi."],
            "offtopic": ["Aiya, I don't know about that. I just make egg waffles, dai lou.", "Hmph, ask someone else, lah. I only know waffles."],
        },
        "complaint": ["Aiya! White flowers? You want a funeral at my truck?!", "Mm hai! White means death, dai lou. Take it off!"],
        "reactions": {
            "warm": "Wah... Ah Ba would be proud. M goi, florist, look at that queue!",
            "neutral": "Hai, not bad, not bad. The customers are finally stopping, aiya.",
            "grumpy": "Aiya... this is it? Hmph. Bad luck all over my truck.",
        },
        "seed_chips": {
            "budget": ["What's your budget, Uncle?", "How much can you spend on flowers?"],
            "colours": ["Which colours do you like?", "What colours suit your truck?"],
            "goal": ["What do you hope the flowers will do?", "What should the flowers bring you?"],
            "taboo": ["Anything you want me to avoid?", "Any flowers you dislike?"],
            "family": ["Who started this truck?", "Tell me about your father."],
            "personal": ["How are you holding up, Uncle?", "Are you doing okay, Uncle?"],
            "smalltalk": ["How's business tonight?", "Nice evening on the harbour!", "Your waffles smell amazing!"],
        },
    },
    "jasmine": JASMINE,
    "fong": FONG,
}

INTEL_OFFLINE = {
    "label": "Market notes (offline)",
    "source": "offline",
    "cards": [
        {
            "id": "weather", "kind": "Weather & typhoon signal", "title": "Typhoon Signal No. 1 is up",
            "body": "A tropical cyclone is edging toward the coast. Rain bands and gusts are expected tonight; the Observatory may raise higher signals.",
            "source_name": "Hong Kong Observatory", "source_url": "https://www.hko.gov.hk/en/wxinfo/dailywx/wxwarntoday.htm",
            "effect": {"stat": "storm", "amount": 6, "target": {"hardiness": ["hardy"]}, "badge": "Rain: +Storm Proof"},
            "effect_words": "Hardy flowers +Storm Proof",
        },
        {
            "id": "event", "kind": "Event near West Kowloon", "title": "Weekend crowds at the Art Park",
            "body": "Outdoor shows in the West Kowloon Cultural District draw evening crowds along the harbourfront. Bright, photo-friendly displays catch passers-by.",
            "source_name": "West Kowloon Cultural District", "source_url": "https://www.westk.hk/en/whats-on",
            "effect": {"stat": "crowd", "amount": 6, "target": {"ids": ["sunflower", "peach", "orchid", "pampas", "stand"]}, "badge": "Show crowds: +Crowd"},
            "effect_words": "Eye-catching flowers +Crowd",
        },
        {
            "id": "festival", "kind": "Next festival", "title": "Mid-Autumn Festival is coming",
            "body": "Mid-Autumn falls on 25 September 2026, with a public holiday the day after. Red and gold displays feel festive and lucky.",
            "source_name": "GovHK: 2026 public holidays", "source_url": "https://www.gov.hk/en/about/abouthk/holiday/2026.htm",
            "effect": {"stat": "luck", "amount": 6, "target": {"tags": ["red", "gold"]}, "badge": "Mid-Autumn: +Luck"},
            "effect_words": "Red and gold flowers +Luck",
        },
    ],
}

KIT = {
    "name_empty": "Tell me your name, Boss!",
    "tutorial": [
        "Boss {name}! Welcome to the West Kowloon harbourfront!",
        "Boss! These food trucks are struggling. The crowds just walk past them.",
        "Talk to an owner, find out what they need, then dress the truck in flowers.",
        "Typhoon season, Boss! Pick flowers that can survive a storm.",
        "Start with any truck, Boss. Uncle Wing's egg waffles are in the middle!",
    ],
    "locked_truck": "Boss! Let's help Uncle Wing first.",
    "finale": "Boss! All three trucks are glowing. Parade time!",
    "stand_only": "Boss, the stand goes beside the truck!",
    "hints": {
        "harbour": "Boss! Click a food truck to start dressing it.",
        "talk": "Boss, ask him about budget, colours, his hopes and what to avoid!",
        "research": "Boss, read the market notes, then hit Start arranging.",
        "arrange": "Boss! Pick a flower on the shelf, then click a glowing slot.",
        "storm": "Quick, Boss! Swap in hardy flowers before the timer ends!",
        "score": "Nice work, Boss! Close the card or play again.",
    },
    "reactions": ["Boss! Need a delivery? Ha!", "Vroom vroom, Boss!", "Boss, the waffles smell so good..."],
}


def public_data():
    owners = {}
    for oid, o in OWNERS.items():
        owners[oid] = {k: o[k] for k in ("id", "name", "truck", "truck_zh", "playable") if k in o}
        if o.get("playable"):
            owners[oid]["greeting"] = o["greeting"]
            owners[oid]["initial_chips"] = o["initial_chips"]
            owners[oid]["persona_short"] = o["style"]
            owners[oid]["ribbon_fallback"] = o.get("ribbon_fallback")
    return {"flowers": FLOWERS, "slots": SLOTS, "owners": owners, "kit": KIT, "need_keys": NEED_KEYS}
