# Requirements: FA CHE 花車: The Flower Float

## Core Value
A fully 3D, story-driven browser game set on the West Kowloon harbourfront at dusk. The player is a Mong Kok florist. They talk to struggling food-truck owners to uncover hidden needs, dress each truck in flowers, survive a typhoon, and turn the trucks into a parade. Core loop: **meet an owner → talk to uncover needs → read market intel → arrange flowers → survive the storm → reveal, score and receipt.**

## Personas & Roles
- **Player (single role, no login):** a laptop Chrome user who plays one run at a time. Progress is saved in their own browser (localStorage). No accounts, and no data is shared between players.
- **In-game characters (content, not users):**
  - **The Florist (player):** runs "Fa Che Florist", a third-generation stall on Flower Market Road. Seen as a flower cart and a pair of hands. The player types (and later speaks) their name.
  - **Kit:** 22, delivery rider on a scooter, cheerful guide. Gives the tutorial and hints in short speech bubbles and says "Boss!" a lot.
  - **Uncle Wing:** 58, "Wing's Egg Waffles". Gruff, proud, superstitious. Budget HK$600. Wants luck and wealth symbols. Loves red and gold. Taboo: white flowers (funerals). Softens if asked about his late father, who started the truck.
  - **Jasmine:** 29, "Curry Up" (curry fish-ball fusion). Fast-talking, trend-obsessed, Instagram. Budget HK$1500. Wants a photo-worthy look in pinks and oranges, plus edible flowers to garnish dishes. Taboo: anything old-fashioned.
  - **Auntie Fong:** 64, "Fong's Milk Tea and Pineapple Buns". Warm, gossipy, calls everyone "dear". Budget HK$1000. It is the truck's 20th anniversary: she wants a traditional congratulation flower stand with a ribbon message, and flowers that last a week. Taboo: strong scents that overpower her tea.
  - **Crowd:** tourists, office workers and students. They walk past empty trucks and queue at decorated ones.
  - **The Typhoon (antagonist):** arrives as signal banners T1 → T3 → T8.

## Features
| id | feature | persona | phase |
|---|---|---|---|
| F-1 | Start screen with the title in English and Chinese ("FA CHE 花車", "The Flower Float") and one button, "Open the stall" | Player | 1 |
| F-2 | Player types their name at the start | Player | 1 |
| F-3 | One always-3D harbourfront scene at dusk: gently waving water, stylised HK skyline of glowing towers, a Star Ferry-style boat drifting past, string lights, neon signs in Chinese and English | Player | 1 |
| F-4 | Three food trucks parked in an arc, with the player's flower cart in front | Player | 1 |
| F-5 | Stylised low-poly look, warm lighting, soft shadows, bloom on neon | Player | 1 |
| F-6 | Everything clickable. Hover makes objects glow and bounce slightly. Clicking a truck flies the camera there in a smooth 1-second move | Player | 1 |
| F-7 | Idle animation everywhere: owners wave and shift weight, steam rises, flowers sway, crowd walks past, lanterns swing | Player | 1 |
| F-8 | Charming low-poly characters built from primitives, each with distinct colours, hats and aprons | Player | 1 |
| F-9 | Kit on his scooter gives the tutorial and hints in short speech bubbles ("Boss!") | Player | 1 |
| F-10 | Beat 1 MEET: click Uncle Wing's truck, the camera flies in and he greets you (text bubble in P1, spoken from P2) | Player | 1 |
| F-11 | Beat 2 TALK: conversation panel over the 3D scene. The LLM (Claude Fable 5.2) plays the owner in 1–2 short sentences of English with a few Cantonese words, and never states hidden needs up front | Player | 1 |
| F-12 | Three suggested reply chips, regenerated every turn, plus a text box that dictation tools like Willow can type into | Player | 1 |
| F-13 | "Needs" notebook fills in as the player uncovers budget, colours, goal and taboo | Player | 1 |
| F-14 | Hidden Trust: kind personal questions raise it, giving a Crowd bonus and a warmer final reaction | Player | 1 |
| F-15 | Beat 3 RESEARCH: "Ask the market" shows three Market Intel cards (weather/typhoon signal, event near West Kowloon, next festival) with source links. Intel changes flower stats. **P1 uses seeded offline cards** | Player | 1 |
| F-16 | Beat 4 ARRANGE: a flower shelf slides in. Click a flower, then a glowing slot (roof, awning, counter, bumper, stand beside the truck). Flowers pop in with a bounce and petal burst. Click a placed flower to remove it | Player | 1 |
| F-17 | Four live meters: Budget, Luck, Crowd, Storm Proof | Player | 1 |
| F-18 | Flower catalogue of 12 items (see Seed Data) | Player | 1 |
| F-19 | Beat 5 STORM: typhoon banner T1 → T3 → T8, sky darkens, rain and wind particles, camera shake. Fragile flowers blow off and the player has 20 seconds to swap in hardy ones | Player | 1 |
| F-20 | REVEAL: sky clears, the owner reacts out loud, a crowd queues, and a score card shows 1–3 stars plus an order receipt (flowers, total in HKD, delivery slot) | Player | 1 |
| F-21 | Scoring from needs matched, taboo avoided, budget respected, flowers surviving the storm, and Trust. Breaking a taboo makes the owner complain out loud and costs a star. Going over budget is allowed, turns the Budget meter red and costs a star | Player | 1 |
| F-22 | Crowd characters (tourists, office workers, students), instanced for performance | Player | 1 |
| F-23 | A "Skip" button on every animation (each phase covers its own new animations) | Player | 1 |
| F-24 | Progress saved in this browser, so a refresh resumes the run | Player | 1 |
| F-25 | Every external call has a seeded fallback. If a call fails or takes over 4 seconds, the fallback is used silently | Player | 1 |
| F-26 | All API keys live in backend env vars, never in the browser | Player | 1 |
| F-27 | ElevenLabs TTS (eleven_flash_v2_5) speaks every owner reply in three distinct voices (gruff older man, upbeat young woman, warm older woman). The mouth or body bobs while audio plays, subtitles show, and the text bubble alone is used if TTS fails | Player | 2 |
| F-28 | Mic button using the browser Web Speech API with a live waveform | Player | 2 |
| F-29 | Player can speak their name at the start | Player | 2 |
| F-30 | Live Market Intel from the You.com Web Search API: today's HK weather and typhoon signal, events near West Kowloon, next festival. Source links, a "Researched live with You.com" label, cached for the session | Player | 3 |
| F-31 | Live intel changes flower stats (e.g. rain raises the value of hardy flowers). The storm and the seeded fallback stay in place | Player | 3 |
| F-32 | Jasmine level (all five beats, her persona, needs, taboo, voice) | Player | 4 |
| F-33 | Auntie Fong level (all five beats). The LLM writes the congratulation-stand ribbon message from what she told you | Player | 4 |
| F-34 | FINALE: night falls, trucks light up and roll along the harbour as a parade, fireworks over the skyline, final score, "Share your float" screenshot button | Player | 4 |
| F-35 | Meshy text-to-3D GLB characters generated once at build time and saved as static assets, never at runtime. Primitives are the fallback | Player | 5 |
| F-36 | Polish, sound effects, music toggle | Player | 5 |
| F-37 | Quality bar: loads in under 5 s on a laptop in Chrome, 60 fps target, instancing for flowers and crowd | Player | all |

## Phases
- **Phase 1 (MVP): 3D world + Uncle Wing level end to end** → the full harbourfront scene, camera moves, Kit tutorial, and Uncle Wing's complete level: Meet → Talk (chips + text, Claude Fable 5.2) → Research (seeded offline intel) → Arrange → Storm → Reveal with stars and receipt. Saved in the browser. F-1…F-26, F-37.
  - [phase1/requirement.md](phase1/requirement.md) · [phase1/journeys.md](phase1/journeys.md). Status: built and tested, 12/12 passed.
- **Phase 2: Voices and mic** → ElevenLabs owner voices, talking animation, subtitles, mic input with waveform, spoken name. F-27, F-28, F-29.
  - [phase2/requirement.md](phase2/requirement.md) · [phase2/journeys.md](phase2/journeys.md)
- **Phase 3: Live market research** → You.com Market Intel replaces the offline cards (seeded fallback kept) and drives flower stats. F-30, F-31.
- **Phase 4: Jasmine, Auntie Fong and the parade** → two more levels plus the finale. F-32, F-33, F-34.
- **Phase 5: Meshy characters and polish** → Meshy GLB characters, SFX, music toggle, overall polish. F-35, F-36.

## UI/UX Rules
- One 3D scene, always visible. Panels (conversation, notebook, intel cards, shelf, score card) are overlays over the scene, never flat pages.
- Warm dusk palette, neon bloom, stylised low poly. Chinese and English on signs and the title.
- Speech bubbles are short. Kit says "Boss!" often. Owners speak English with a few Cantonese words (e.g. "aiya", "hai", "m goi", "dai lou").
- All three ways to talk stay visible together (chips, text box, and from P2 the mic).
- Every cinematic animation (camera fly, tutorial, storm, reveal, crowd queue, later the parade) has a "Skip" button.
- The player never sees errors from external services. Fallbacks are silent.
- Target: laptop Chrome with a mouse.

## Integrations
| service | purpose | key | phase | fallback |
|---|---|---|---|---|
| Claude Fable 5.2 (model id `claude-fable-5-2`) via Emergent LLM Key | owner dialogue, reply chips, need/trust detection, later the ribbon message | Emergent Universal Key | 1 | seeded per-owner dialogue lines chosen by topic, used when the call fails or exceeds 4 s |
| ElevenLabs TTS, `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`, header `xi-api-key`, model `eleven_flash_v2_5` | owner voices | user's `ELEVENLABS_API_KEY` | 2 | text bubble only |
| Browser Web Speech API | mic input | none (Chrome/Edge) | 2 | text box and chips |
| You.com Web Search API, `POST https://ydc-index.io/v1/search`, header `X-API-Key` (confirm against https://you.com/docs/openapi.json) | live Market Intel | user's `YDC_API_KEY` | 3 | seeded offline intel cards |
| Meshy text-to-3D (`/openapi/v2/text-to-3d`, preview → refine → GLB), run once at build time | character models | user's `MESHY_API_KEY` (optional) | 5 | primitive low-poly characters |

**Deviation:** The Emergent LLM proxy rejects `claude-fable-5-2`, so dialogue runs on `claude-fable-5-1` (the closest Fable version), set via the env var DIALOGUE_MODEL. It switches back to 5.2 once that model is supported.

The user confirmed they have ElevenLabs, You.com and Meshy keys. Each is requested through a secure form when its phase starts.

## Edge Cases
- LLM slow (>4 s) or failing → a seeded reply appears silently. The notebook still fills when the player asks about a need topic.
- Claude Fable 5.2 is a heavy flagship model, so some replies may hit the 4 s cap and use seeded lines. The model choice is kept as the user named it.
- The LLM must never invent or change hidden facts (budget, colours, goal, taboo). These are fixed server-side.
- Over budget: allowed, the meter turns red, and it costs a star at scoring.
- Taboo flower placed: the owner complains immediately, and it costs a star at scoring.
- Refresh mid-level: resume at the same beat. Refresh mid-storm: the storm restarts from T1.
- Mic unsupported (Firefox) or denied → the mic button shows "Mic not available in this browser", and text and chips keep working (P2).
- Audio autoplay: the "Open the stall" click unlocks audio (P2).
- Meshy generation fails or no key → primitive characters (P5).

## Seed Data
- **Flower catalogue (name, price HKD, meaning, hardiness, tags):**
  - Kumquat tree, 180, wealth, hardy, gold
  - Peach blossom, 150, luck in love and footfall, fragile, pink
  - Peony, 120, prosperity, fragile, red/pink
  - Orchid, 140, abundance and elegance, medium, purple
  - Sunflower, 60, cheer, medium, yellow
  - Yellow chrysanthemum, 50, long life, hardy, gold
  - White chrysanthemum, 40, mourning, hardy, white (a trap for Uncle Wing)
  - Lily, 90, a hundred years of harmony, medium, strong scent
  - Lucky bamboo, 70, steady growth, hardy, green
  - Pampas grass, 80, modern style, hardy, dried
  - Nasturtium and pansy mix, 65, edible garnish, fragile, edible
  - Congratulation stand with ribbon, 400, grand celebration, hardy (stand slot only). The LLM writes the ribbon message (P4)
- **Owner fact sheets** (fixed server-side, as in Personas). Uncle Wing's need-match rule: flowers tagged red or gold, or with a wealth, luck, prosperity or abundance meaning, count as matching. His taboo is any flower tagged white.
- **Seeded fallback dialogue** per owner: a greeting, lines per topic (budget, colours, goal, taboo, family/personal, small talk, off-topic), complaint lines, and low/high-Trust reveal reactions.
- **Seeded offline Market Intel**: three cards (weather/typhoon signal, event near West Kowloon, next festival), each with a real public source link and a stat effect.
- **Kit lines**: tutorial and per-beat hints.
- **Delivery slots** per owner for the receipt (e.g. "Tomorrow 7:00–9:00am, before opening").
- No other demo data.
