# FA CHE 花車: The Flower Float · PRD

## Original problem statement
Phase 1 of 5 (MVP). A fully 3D, story-driven browser game: dress struggling West Kowloon food trucks with flowers. The specs are /app/memory/product/overview.md, /app/memory/product/phase1/requirement.md (REQ-1..114) and /app/memory/product/phase1/journeys.md (JRN-1..48).

## Architecture
- Frontend: React + @react-three/fiber/drei/postprocessing. There is one persistent Canvas (src/scene/*), with HUD overlays in src/hud/*. Game state lives in a zustand store (src/game/store.js) and is persisted to localStorage key `fache_save_v1`. src/game/director.js runs the timelines: tutorial, storm, reveal and idle hints.
- Backend: FastAPI (`/api/openapi.json`).
  - Data-driven game data: backend/game_data.py holds the flowers, owners (Wing playable; Jasmine and Fong are stubs), the fallback lines, the OFFLINE intel and the Kit lines.
  - Dialogue: backend/dialogue.py calls the LLM through emergentintegrations. The model comes from env `DIALOGUE_MODEL` (currently claude-fable-5-1, since claude-fable-5-2 is rejected by the proxy), with a 3.9 s cap. The server validates every reply (leak check, canonical notebook values) and falls back to seeded lines.
  - Scoring: backend/scoring.py computes the meters, stars, lines and receipt.
- Test switches: the `X-Force-Fallback: 1` header, `?force_fallback=1` (on the API or the page URL), and env `FORCE_DIALOGUE_FALLBACK=1` (default 0).

## Implemented (2026-09)
- Start screen, name step, tutorial, idle hints after 20 s, resume from save, and Start a new run.
- Dusk harbour scene: waves, skyline, ferry, string lights and lanterns, CJK neon with bloom, 3 trucks and the cart, Kit with his scooter, an instanced crowd, steam and idle animations.
- Hover glow and bounce, 1 s camera flights, Skip on every cinematic.
- Uncle Wing's full level: Meet, Talk, Research, Arrange, Storm (T1 → T3 → T8, fragile flowers blow off, 20 s countdown), Reveal, then the score card with receipt and Play again.

## Phase 2 (2026-09): voices + mic
- backend/tts.py: ElevenLabs REST (eleven_flash_v2_5) with a 4 s timeout. Memory cache keyed by (voice_id, text), in-flight dedupe, late results also cached, and a 30 s negative cache on failure. Endpoints: POST /api/tts (audio/mpeg or 204 = text only), GET /api/tts/voices, GET /api/tts/stats. Voice ids come from env WING/JASMINE/FONG_VOICE_ID.
- Frontend:
  - voice.js: AudioContext unlocked on "Open the stall". A new line stops the previous one. `speaking` drives the bob, mouth and subtitle.
  - mic.js and Mic.jsx: Web Speech API, analyser waveform, 8 s silence stop, denied and unsupported handling, the spoken-name step, and window.__fache.mic test hooks.
- BLOCKER: the current ELEVENLABS_API_KEY is invalid (401), so audio currently falls back to text only.

## Phase 3 (2026-11): live Market Intel
- backend/intel.py: 3 parallel You.com searches (POST https://ydc-index.io/v1/search, X-API-Key) with a 3.5 s budget, plus deterministic keyword effects (rain/signal, hot, event, festival-by-date table). Cards are cached by (owner, session, date); per-topic fallback to the offline seed. Stats at /api/intel/stats. Test hooks: X-Intel-Fail, X-Intel-Slow, X-Intel-Mock.
- Cards are saved in fache_save_v1 (level.intel) with the sessionId, and their effects are sent to evaluate/score as intel_effects.
- BLOCKER: YDC_API_KEY in env is a masked placeholder (16 asterisks), so You.com returns 403 and the live path is only verified through the mock hook.

## Backlog
- P1: shorter prompt or streaming to cut the share of LLM turns that hit the 3.9 s cap (about 30% in testing).
- P2 (next phases): TTS and mic (Phase 2, the mic slot is reserved in the Composer), live You.com intel (Phase 3), Jasmine and Fong levels (Phase 4), Meshy assets (Phase 5).

## Phase 4 — Jasmine, Auntie Fong & parade finale (2026-11-20)
- Jasmine (Curry Up) and Auntie Fong (Milk Tea & Pineapple Buns) are now playable in any order. Each has her own fact sheet, need markers, trust topics, fallback lines, complaints, taboo/match rules and ElevenLabs voice (backend/owners_p4.py).
- Save data is kept per owner in fache_save_v1 (levels, activeOwner, completed, finale).
- Ribbon: POST /api/ribbon (DIALOGUE_MODEL, 4 s cap, seeded fallback). The text shows on the 3D stand and on the receipt. If the ribbon call has not returned in time, the server uses the owner's fallback ribbon on the receipt.
- Finale: night falls, the lit trucks and cart parade, fireworks play, Skip is available, then a final panel shows stars /9 and total HKD, with a PNG Share and Play again.
- The offline festival card is chosen by today's date.
- Tests: backend 71/71; Phase 4 UI journeys pass (iteration_4).
## Backlog
- P0: validate ElevenLabs and You.com with real keys (they are masked now); switch DIALOGUE_MODEL to claude-fable-5-2 once the proxy accepts it.
- P1: Phase 5 per the product docs.

## Phase 5: Meshy characters, sound, polish, demo page (2026-11-21)
- Build-time Meshy script `backend/scripts/generate_characters.py` (preview → refine → GLB → gltf-transform meshopt/webp ≤2 MB → public/models + manifest.json). Never runs at runtime. With the current masked key it gets a 401 and the manifest stays empty.
- Runtime GLB loader (`game/models.js`, `scene/Persona.jsx`) loads models after the start screen behind a loading indicator. It falls back to primitives on a missing or bad file. Test manifests: `?models=test-good|test-bad`.
- All audio is synthesised in code with Web Audio (`game/audio.js`): SFX, storm/harbour ambience, a procedural pentatonic music loop, and ducking under voice lines. Music and SFX toggles are persisted in localStorage. Sources are listed in public/audio/LICENSES.md.
- Polish: Skip on every cinematic (now including the crowd queue walk), the 3D scene mounts after "Open the stall" is ready (about 1.4–2 s), a WebGL-unavailable message, a perf hook, and per-frame allocations removed from the crowd.
- /demo gameplay video page ("Video coming soon" until public/demo/fa-che-gameplay.mp4 exists).
- Tests: iteration_5, all Phase 5 journeys plus the JRN-83 and ribbon regressions pass.
## Backlog
- P0: generate the GLBs once a real MESHY_API_KEY is saved; validate ElevenLabs and You.com with real keys; add the gameplay mp4.
