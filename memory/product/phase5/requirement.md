# Phase 5 Requirement: Meshy Characters, Sound and Polish

**Version:** phase-5

**Goal:** Characters can be upgraded to Meshy-generated 3D models made once at build time and saved as static files. The low-poly primitives remain the fallback. The game gains sound effects and a music toggle, and the whole experience is polished against the quality bar (load under 5 s, 60 fps target, Skip on every animation).

Builds on Phases 1–4 as delivered. Context is in [../overview.md](../overview.md). Note: the MESHY_API_KEY currently saved is a masked placeholder, so generation can't run until a real key is saved. The pipeline must still be built and must fall back cleanly.

## Functional requirements

### Meshy characters (build time only)
- REQ-200 [always] The system shall provide a one-off build script that generates character GLBs with the Meshy text-to-3D API (`/openapi/v2/text-to-3d`, preview then refine, GLB output) using MESHY_API_KEY from backend env.
- REQ-201 [always] The system shall generate one model each for Kit, Uncle Wing, Jasmine and Auntie Fong from prompts that match their personas (stylised low poly, distinct colours, hats and aprons).
- REQ-202 [always] The system shall save generated GLBs as static assets with a manifest listing which characters have models.
- REQ-203 [always] The system shall never call Meshy at runtime.
- REQ-204 [always] The system shall compress each saved GLB to 2 MB or less. (interpreted)
- REQ-205 [state] While a character has a saved GLB in the manifest, the system shall render that GLB in the scene.
- REQ-206 [unwanted] If a character's GLB is missing or fails to load, then the system shall render the primitive character with no error shown.
- REQ-207 [unwanted] If the Meshy key is invalid or a generation task fails, then the build script shall log the failure and leave the primitives in place.
- REQ-208 [always] The system shall keep idle animation (wave, weight shift) and the talking bob working on GLB characters. (interpreted)
- REQ-209 [always] The system shall load character GLBs after the start screen is interactive, so the 5 s load target holds. (interpreted)

### Sound effects
- REQ-210 [event] When a flower pops into a slot, the system shall play a pop sound.
- REQ-211 [event] When the camera flies to a truck, the system shall play a soft whoosh.
- REQ-212 [event] When a typhoon signal banner is raised, the system shall play a signal alert.
- REQ-213 [state] While the storm runs, the system shall play wind and rain ambience.
- REQ-214 [state] While the storm countdown is in its last 5 seconds, the system shall play a tick each second.
- REQ-215 [event] When the score card appears, the system shall play a cash-register chime.
- REQ-216 [state] While fireworks burst in the finale, the system shall play firework pops.
- REQ-217 [state] While the harbour is idle, the system shall play quiet harbour ambience (water and crowd murmur). (interpreted)
- REQ-218 [state] While an owner voice line plays, the system shall lower music and ambience volume. (interpreted)

### Music toggle
- REQ-219 [state] While the game is open past the start screen, the system shall play a looping background music track.
- REQ-220 [always] The system shall show a music toggle button in the HUD.
- REQ-221 [event] When the player clicks the music toggle, the system shall switch the music between on and off.
- REQ-222 [always] The system shall show a sound-effects toggle button in the HUD. (interpreted)
- REQ-223 [event] When the player changes either toggle, the system shall save that choice in the browser.
- REQ-224 [always] The system shall use only music and sound files that are licensed for use, or sounds synthesised in code, with the source recorded in the repo. (interpreted)

### Polish
- REQ-225 [state] While any cinematic plays (camera fly, tutorial, storm, reveal, crowd queue, parade), the system shall show a "Skip" button.
- REQ-226 [state] While assets are still loading after the start screen, the system shall show a short loading indicator over the scene. (interpreted)
- REQ-227 [unwanted] If WebGL is unavailable, then the system shall show the message "Your browser can't run 3D. Try Chrome on a laptop."

## Quality requirements
```
Q-32 Tag: Performance.LoadTime
     Scale: seconds to "Open the stall" clickable, cold cache, laptop Chrome
     Meter: tester (Performance API) + human
     Must: 5
     Plan: 3
```
```
Q-33 Tag: Performance.FrameRate
     Scale: fps at harbour, storm, and finale, mid-range laptop
     Meter: human, Chrome FPS meter
     Must: 45 harbour/storm, 40 finale (estimate)
     Plan: 60
```
```
Q-34 Tag: Audio.Mix (cosmetic)
     Scale: voice lines remain clearly audible over music/SFX; no clipping; no overlapping duplicate SFX
     Meter: human
     Must: voices always intelligible
     Plan: balanced, polished mix
```
```
Q-35 Tag: Visual.CharacterQuality (cosmetic)
     Scale: GLB characters (when present) read as the right persona, sit on the ground, face the player, scale matches trucks, no broken textures
     Meter: human + tester screenshots
     Must: 0 broken/floating/mis-scaled characters
     Plan: charming and consistent with the low-poly style
```
```
Q-36 Tag: Size.Assets
     Scale: MB of character GLBs total
     Meter: tester (file sizes)
     Must: 8
     Plan: 4
```
