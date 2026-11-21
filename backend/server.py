import logging
import os
import random
from pathlib import Path
from typing import Dict, List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, Header, HTTPException, Query, Response
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from dialogue import ribbon_message, run_turn  # noqa: E402
from game_data import FLOWER_BY_ID, INTEL_OFFLINE, OWNERS, public_data  # noqa: E402
import scoring  # noqa: E402
import tts  # noqa: E402
import intel as live_intel  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

app = FastAPI(title="FA CHE 花車 API", openapi_url="/api/openapi.json", docs_url="/api/docs")
api = APIRouter(prefix="/api")


def playable_owner(owner_id: str) -> dict:
    owner = OWNERS.get(owner_id)
    if not owner or not owner.get("playable"):
        raise HTTPException(404, "Owner not playable in this phase")
    return owner


class Turn(BaseModel):
    role: str
    text: str


class DialogueIn(BaseModel):
    owner_id: str = "wing"
    message: str = Field(min_length=1, max_length=400)
    history: List[Turn] = []
    revealed: List[str] = []
    trust: int = 0
    prev_chips: List[str] = []


class DialogueOut(BaseModel):
    reply: str
    chips: List[str]
    revealed_needs: List[str]
    needs: Dict[str, str]
    trust_delta: int
    source: str
    latency_ms: int


class TTSIn(BaseModel):
    owner_id: str = "wing"
    text: str = Field(min_length=1, max_length=400)


class IntelEffect(BaseModel):
    stat: str = Field(pattern="^(luck|crowd|storm)$")
    amount: int = Field(ge=0, le=10)
    target: Dict[str, List[str]] = {}


class BoardIn(BaseModel):
    placements: Dict[str, str] = {}
    pre_storm: Optional[Dict[str, str]] = None
    trust: int = 0
    revealed: List[str] = []
    intel_seen: bool = False
    intel_effects: Optional[List[IntelEffect]] = None
    new_flower: Optional[str] = None
    ribbon: Optional[List[str]] = None


@api.get("/")
async def root():
    return {"game": "FA CHE 花車: The Flower Float", "phase": 4}


@api.get("/game/data")
async def game_data():
    return public_data()


@api.get("/intel")
async def intel(
    owner_id: str = Query("wing"),
    session_id: str = Query("anon", max_length=64),
    x_force_fallback: Optional[str] = Header(None),
    force_fallback: int = Query(0),
    x_intel_fail: Optional[str] = Header(None, description="Test hook: comma list of topics to fail (weather,event,festival)"),
    fail_topics: Optional[str] = Query(None, description="Test hook: same as X-Intel-Fail"),
    x_intel_slow: Optional[str] = Header(None, description="Test hook: 1 = make every You.com call exceed the 4 s budget"),
    x_intel_mock: Optional[str] = Header(None, description="Test hook: 1 = use canned You.com-shaped results (no real call)"),
):
    forced = os.environ.get("FORCE_DIALOGUE_FALLBACK") == "1" or x_force_fallback == "1" or force_fallback == 1
    fails = {t.strip() for t in f"{x_intel_fail or ''},{fail_topics or ''}".split(",") if t.strip()}
    return await live_intel.gather_intel(owner_id, session_id, forced, fails, x_intel_slow == "1", x_intel_mock == "1")


@api.get("/intel/offline")
async def intel_offline():
    return INTEL_OFFLINE


@api.get("/intel/stats")
async def intel_stats():
    return {**live_intel.stats, "cached_sessions": len(live_intel._cache)}


@api.post("/dialogue", response_model=DialogueOut)
async def dialogue(body: DialogueIn, x_force_fallback: Optional[str] = Header(None), force_fallback: int = Query(0)):
    owner = playable_owner(body.owner_id)
    forced = os.environ.get("FORCE_DIALOGUE_FALLBACK") == "1" or x_force_fallback == "1" or force_fallback == 1
    history = [t.model_dump() for t in body.history]
    return await run_turn(owner, body.message.strip(), history, set(body.revealed), body.trust, body.prev_chips, forced)


def effects_of(body: BoardIn):
    return None if body.intel_effects is None else [e.model_dump() for e in body.intel_effects]


@api.post("/owners/{owner_id}/evaluate")
async def evaluate(owner_id: str, body: BoardIn):
    owner = playable_owner(owner_id)
    placements = {s: f for s, f in body.placements.items() if f in FLOWER_BY_ID}
    result = scoring.evaluate(owner, placements, body.trust, body.revealed, body.intel_seen, effects_of(body))
    new = FLOWER_BY_ID.get(body.new_flower or "")
    result["complaint"] = random.choice(owner["complaint"]) if new and scoring.is_taboo(owner, new) else None
    return result


@api.post("/owners/{owner_id}/score")
async def score(owner_id: str, body: BoardIn):
    owner = playable_owner(owner_id)
    placements = {s: f for s, f in body.placements.items() if f in FLOWER_BY_ID}
    return scoring.score(owner, placements, body.pre_storm, body.trust, body.revealed, body.intel_seen, effects_of(body), body.ribbon)


class RibbonIn(BaseModel):
    owner_id: str = "fong"
    history: List[Turn] = []


@api.post("/ribbon")
async def ribbon(body: RibbonIn, x_force_fallback: Optional[str] = Header(None), force_fallback: int = Query(0)):
    owner = playable_owner(body.owner_id)
    forced = os.environ.get("FORCE_DIALOGUE_FALLBACK") == "1" or x_force_fallback == "1" or force_fallback == 1
    return await ribbon_message(owner, [t.model_dump() for t in body.history], forced)


@api.post("/tts", response_class=Response, responses={200: {"content": {"audio/mpeg": {}}, "description": "MP3 speech"}, 204: {"description": "No audio (forced off, failed or timed out); show text only"}})
async def text_to_speech(body: TTSIn, x_force_fallback: Optional[str] = Header(None), force_fallback: int = Query(0)):
    if body.owner_id not in tts.VOICE_ENV:
        raise HTTPException(404, "Unknown owner")
    if os.environ.get("FORCE_DIALOGUE_FALLBACK") == "1" or x_force_fallback == "1" or force_fallback == 1:
        return Response(status_code=204, headers={"X-TTS-Status": "forced-off"})
    audio, status = await tts.synthesize(body.owner_id, body.text.strip())
    if audio is None:
        return Response(status_code=204, headers={"X-TTS-Status": status})
    return Response(content=audio, media_type="audio/mpeg", headers={"X-TTS-Status": status, "X-TTS-Voice": tts.voice_id(body.owner_id), "Cache-Control": "no-store"})


@api.get("/tts/voices")
async def tts_voices():
    return {"model_id": tts.MODEL_ID, "voices": tts.voices_public()}


@api.get("/tts/stats")
async def tts_stats():
    return {**tts.stats, "cached_lines": len(tts._cache)}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
