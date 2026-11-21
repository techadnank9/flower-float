# Phase 1 Requirement: 3D Harbourfront + Uncle Wing Level End to End

**Version:** phase-1

**Goal:** A player opens the game, names themselves and lands in a living 3D West Kowloon harbourfront at dusk. They then play Uncle Wing's level start to finish: meet him, talk to uncover his hidden needs, read offline market notes, dress his truck in flowers, survive a typhoon, and see the reveal with stars and a receipt. The run is saved in the browser.

Product definition, personas, flower catalogue, integrations and seed data live in [../overview.md](../overview.md). Out of scope this phase: voices, mic, spoken name (P2); live You.com intel (P3); Jasmine and Auntie Fong levels and the parade (P4); Meshy models, SFX and music (P5).

Stack: React + three.js via @react-three/fiber and @react-three/drei, FastAPI backend, Mongo only if needed. All API keys stay server-side.

## Functional requirements

### Start and name
- REQ-1 [event] When the game loads, the system shall show a start screen titled "FA CHE 花車" with the subtitle "The Flower Float".
- REQ-2 [always] The system shall show exactly one button, "Open the stall", on the start screen.
- REQ-3 [event] When the player clicks "Open the stall" with no saved run, the system shall show a name step with a text field.
- REQ-4 [unwanted] If the player submits an empty name, then the system shall keep the name step open with Kit's hint "Tell me your name, Boss!" (interpreted)
- REQ-5 [event] When the player submits a name, the system shall show the 3D harbourfront with Kit's first tutorial bubble containing that name.
- REQ-6 [event] When the player clicks "Open the stall" with a saved run, the system shall resume the saved run at its saved beat without asking for the name again.

### The 3D world
- REQ-7 [always] The system shall render the game as one continuous 3D scene of the West Kowloon harbourfront at dusk.
- REQ-8 [always] The system shall animate the harbour water with gentle waves.
- REQ-9 [always] The system shall show a stylised Hong Kong skyline of glowing towers across the harbour.
- REQ-10 [always] The system shall show a Star Ferry-style boat drifting across the harbour.
- REQ-11 [always] The system shall show string lights over the truck area.
- REQ-12 [always] The system shall show neon signs carrying both Chinese and English text.
- REQ-13 [always] The system shall park three food trucks in an arc: "Wing's Egg Waffles", "Curry Up" and "Fong's Milk Tea and Pineapple Buns".
- REQ-14 [always] The system shall place the player's "Fa Che Florist" flower cart in front of the trucks.
- REQ-15 [always] The system shall render a stylised low-poly look with warm lighting.
- REQ-16 [always] The system shall cast soft shadows from trucks and characters.
- REQ-17 [always] The system shall apply bloom to the neon signs.
- REQ-18 [always] The system shall keep the 3D scene visible behind every panel (conversation, notebook, intel, shelf, score card).

### Hover, click, camera
- REQ-19 [event] When the pointer hovers over a clickable object, the system shall make that object glow.
- REQ-20 [event] When the pointer hovers over a clickable object, the system shall make that object bounce slightly.
- REQ-21 [always] The system shall make every truck, owner, Kit, the flower cart, the ferry, lanterns and neon signs clickable. (interpreted)
- REQ-22 [event] When the player clicks a truck, the system shall fly the camera to that truck in a smooth move of about 1 second.
- REQ-23 [event] When the player clicks a clickable object that is not a truck, the system shall play a small reaction on it (a wiggle, a bubble or a sparkle). (interpreted)
- REQ-24 [event] When the player clicks Jasmine's or Auntie Fong's truck in this phase, the system shall show Kit's bubble "Boss! Let's help Uncle Wing first." (interpreted)
- REQ-25 [event] When the player clicks "Back to harbour" outside a level, the system shall fly the camera back to the harbour overview in about 1 second.

### Idle life
- REQ-26 [always] The system shall animate each owner waving.
- REQ-27 [always] The system shall animate each owner shifting weight.
- REQ-28 [always] The system shall show steam rising from every truck.
- REQ-29 [always] The system shall sway every placed and displayed flower.
- REQ-30 [always] The system shall walk crowd characters (tourists, office workers, students) along the harbourfront.
- REQ-31 [always] The system shall swing the lanterns.
- REQ-32 [state] While a truck has no flowers, the system shall have crowd characters walk past it without stopping.
- REQ-33 [always] The system shall render crowd characters and flowers with instancing.

### Characters and Kit
- REQ-34 [always] The system shall build every character from low-poly primitives with a distinct colour scheme, hat and apron per character.
- REQ-35 [always] The system shall show Kit beside a scooter near the flower cart.
- REQ-36 [event] When the harbour first appears for a new run, the system shall play Kit's tutorial as a sequence of short speech bubbles that includes "Boss!".
- REQ-37 [event] When the player stays idle for 20 seconds inside a beat, the system shall show a Kit hint bubble for that beat. (interpreted)

### Beat 1: Meet
- REQ-38 [event] When the camera arrives at Uncle Wing's truck, the system shall show Uncle Wing's greeting in a speech bubble.
- REQ-39 [always] The system shall keep Uncle Wing's budget, colours, goal and taboo out of his greeting.

### Beat 2: Talk
- REQ-40 [event] When Uncle Wing's greeting appears, the system shall open the conversation panel over the 3D scene.
- REQ-41 [state] While the conversation panel is open, the system shall show three suggested reply chips.
- REQ-42 [state] While the conversation panel is open, the system shall show a text box with a Send button.
- REQ-43 [always] The system shall accept text typed into the text box by dictation tools such as Willow.
- REQ-44 [event] When the player sends a chip or typed message, the system shall show Uncle Wing's reply of 1 or 2 short sentences.
- REQ-45 [always] The system shall write Uncle Wing's replies in English with a few Cantonese words.
- REQ-46 [event] When a reply appears, the system shall replace the chips with three new chips.
- REQ-47 [unwanted] If the player has not asked about a hidden need, then the system shall keep that need out of Uncle Wing's replies.
- REQ-48 [event] When Uncle Wing reveals a hidden need, the system shall fill the matching line of the "Needs" notebook (Budget, Colours, Goal or Taboo).
- REQ-49 [always] The system shall hold Uncle Wing's hidden facts server-side as fixed values: budget HK$600, red and gold, luck and wealth symbols, taboo white flowers.
- REQ-50 [event] When the player asks a kind personal question, the system shall raise Uncle Wing's hidden Trust.
- REQ-51 [event] When the player asks about Uncle Wing's late father, the system shall make his replies noticeably softer.
- REQ-52 [always] The system shall keep Trust hidden from the player until the score card.
- REQ-53 [always] The system shall generate owner dialogue and chips with Claude Fable 5.2 (`claude-fable-5-2`) through the Emergent LLM Key.
- REQ-54 [unwanted] If the dialogue call fails, then the system shall show a seeded Uncle Wing reply with no error message.
- REQ-55 [unwanted] If the dialogue call takes over 4 seconds, then the system shall show a seeded Uncle Wing reply with no error message.
- REQ-56 [unwanted] If a seeded fallback reply answers a need topic, then the system shall still fill that notebook line.
- REQ-57 [unwanted] If the text box is empty, then the system shall disable the Send button.
- REQ-58 [state] While a reply is pending, the system shall disable the chips and the Send button.
- REQ-59 [always] The system shall show an "Ask the market" button in the conversation panel that the player can use at any time. (interpreted)

### Beat 3: Research (offline this phase)
- REQ-60 [event] When the player clicks "Ask the market", the system shall show three Market Intel cards: weather and typhoon signal, an event near West Kowloon, and the next festival.
- REQ-61 [always] The system shall show a source link on every Market Intel card.
- REQ-62 [always] The system shall label the offline cards "Market notes (offline)". (interpreted)
- REQ-63 [event] When the intel cards appear, the system shall apply each card's stat effect to the flowers it affects.
- REQ-64 [event] When an intel effect applies, the system shall show a badge on each affected flower in the shelf (e.g. "Rain: +Storm Proof").
- REQ-65 [event] When the player clicks "Start arranging", the system shall move to the Arrange beat.

### Beat 4: Arrange
- REQ-66 [event] When the Arrange beat starts, the system shall slide in a flower shelf listing all 12 catalogue flowers.
- REQ-67 [always] The system shall show each shelf flower's name, price in HKD, meaning and hardiness.
- REQ-68 [event] When the player clicks a shelf flower, the system shall mark it as selected.
- REQ-69 [state] While a flower is selected, the system shall make the truck's five slots glow: roof, awning, counter, bumper and stand.
- REQ-70 [event] When the player clicks a glowing slot with a flower selected, the system shall pop that flower into the slot with a bounce.
- REQ-71 [event] When a flower pops into a slot, the system shall play a petal burst.
- REQ-72 [unwanted] If the player tries to place the Congratulation stand on any slot except the stand, then the system shall refuse it with Kit's bubble "Boss, the stand goes beside the truck!" (interpreted)
- REQ-73 [event] When the player places a flower on an occupied slot, the system shall replace the old flower and refund its price. (interpreted)
- REQ-74 [event] When the player clicks a placed flower with nothing selected, the system shall remove it and refund its price.
- REQ-75 [state] While arranging, the system shall show four live meters: Budget, Luck, Crowd and Storm Proof.
- REQ-76 [event] When a flower is placed or removed, the system shall update all four meters immediately.
- REQ-77 [state] While the budget is not yet uncovered, the system shall show the Budget meter as "HK$<spent> / ?". (interpreted)
- REQ-78 [unwanted] If the amount spent exceeds Uncle Wing's budget, then the system shall turn the Budget meter red.
- REQ-79 [event] When the player places a white-tagged flower on Uncle Wing's truck, the system shall show an Uncle Wing complaint bubble immediately.
- REQ-80 [event] When the player has at least one flower placed and clicks "Brace for the storm", the system shall start the storm.
- REQ-81 [unwanted] If no flower is placed, then the system shall disable "Brace for the storm".

### Beat 5: Storm
- REQ-82 [event] When the storm starts, the system shall show the typhoon signal banner T1, then T3, then T8.
- REQ-83 [event] When the storm starts, the system shall darken the sky.
- REQ-84 [state] While the storm runs, the system shall show rain particles.
- REQ-85 [state] While the storm runs, the system shall show wind particles.
- REQ-86 [state] While the storm runs, the system shall shake the camera.
- REQ-87 [event] When T8 is raised, the system shall blow every fragile flower off the truck.
- REQ-88 [event] When T8 is raised, the system shall keep medium and hardy flowers on the truck. (interpreted)
- REQ-89 [event] When fragile flowers blow off, the system shall start a visible 20-second countdown with the shelf open for swaps.
- REQ-90 [event] When the countdown reaches zero, the system shall clear the sky.

### Reveal and scoring
- REQ-91 [event] When the sky clears, the system shall show Uncle Wing's reaction in a speech bubble.
- REQ-92 [state] While Trust is high, the system shall make Uncle Wing's final reaction warmer than at low Trust.
- REQ-93 [event] When the sky clears, the system shall queue crowd characters at Uncle Wing's decorated truck.
- REQ-94 [event] When the reveal finishes, the system shall show a score card with 1 to 3 stars.
- REQ-95 [always] The system shall show five score lines on the score card: Needs matched, Taboo avoided, Budget respected, Storm survivors, Trust.
- REQ-96 [always] The system shall show an order receipt on the score card listing each placed flower with its price.
- REQ-97 [always] The system shall show the receipt total in HKD.
- REQ-98 [always] The system shall show a delivery slot on the receipt.
- REQ-99 [always] The system shall count a flower as matching Uncle Wing's needs when it is tagged red or gold, or means wealth, luck, prosperity or abundance.
- REQ-100 [unwanted] If a taboo flower was on the truck at the reveal, then the system shall deduct one star.
- REQ-101 [unwanted] If spending exceeded the budget at the reveal, then the system shall deduct one star.
- REQ-102 [always] The system shall award at least one star.
- REQ-103 [always] The system shall give a higher Crowd meter value at high Trust than at low Trust for the same flowers.
- REQ-104 [event] When the player closes the score card, the system shall return to the harbour with Uncle Wing's truck still decorated.
- REQ-105 [event] When the player closes the score card, the system shall show Uncle Wing's stars above his truck.
- REQ-106 [event] When the player clicks "Play again" on the score card, the system shall restart Uncle Wing's level from Meet with an empty truck. (interpreted)

### Skip
- REQ-107 [state] While a camera fly, the tutorial, the storm sequence, the reveal or the crowd queue is playing, the system shall show a "Skip" button.
- REQ-108 [event] When the player clicks "Skip", the system shall jump that animation to its end state.

### Saving
- REQ-109 [event] When the beat changes, the system shall save the run in the browser.
- REQ-110 [event] When a flower is placed or removed, the system shall save the run in the browser.
- REQ-111 [event] When the page is refreshed mid-level, the system shall restore the name, beat, conversation, notebook and placed flowers.
- REQ-112 [unwanted] If the page is refreshed during the storm, then the system shall restart the storm from T1 with the pre-storm flowers. (interpreted)
- REQ-113 [event] When the player chooses "Start a new run" in the in-game menu, the system shall clear the saved run and return to the start screen. (interpreted)

### Keys
- REQ-114 [always] The system shall keep every API key in backend env vars and out of the browser bundle and network responses.

## Quality requirements
```
Q-1  Tag: Performance.LoadTime
     Scale: seconds from URL open to "Open the stall" clickable, cold cache, laptop Chrome
     Meter: Chrome DevTools, 3 trials; tester gets a rough headless measure
     Must: 5
     Plan: 3
```
```
Q-2  Tag: Performance.FrameRate
     Scale: frames per second at harbour overview with full crowd, and during the storm
     Meter: human, Chrome FPS meter on a mid-range laptop, 30 s each
     Must: 45 (estimate)
     Plan: 60
```
```
Q-3  Tag: Responsiveness.Dialogue
     Scale: seconds from Send to owner reply visible
     Meter: tester, 10 turns timed via network + UI
     Must: 4.5 (4 s cap + render)
     Plan: 2.5
```
```
Q-4  Tag: Reliability.Fallback
     Scale: % of turns that show a reply when the LLM call fails or times out
     Meter: tester, force failure (bad model/timeout), 5 turns
     Must: 100
     Plan: 100
```
```
Q-5  Tag: AI.PersonaFidelity
     Scale: % of Uncle Wing replies that are 1–2 sentences, contain ≥1 Cantonese word, and stay gruff/superstitious in tone
     Meter: tester, 15 replies across chips and typed
     Must: 85
     Plan: 100
```
```
Q-6  Tag: AI.FactAccuracy (trust)
     Scale: count of replies that state a wrong budget, wrong colours or wrong taboo, or reveal an unasked need
     Meter: tester, 15 replies including direct and off-topic questions
     Must: 0
     Plan: 0
```
```
Q-7  Tag: Persistence.Resume (lost my stuff)
     Scale: % of refreshes that restore name, beat, notebook, conversation and flowers
     Meter: tester, refresh once in each beat
     Must: 100
     Plan: 100
```
```
Q-8  Tag: Usability.FirstTime
     Scale: minutes for a first-time player to finish Uncle Wing's level unaided
     Meter: human
     Must: 12 (estimate)
     Plan: 8
```
```
Q-9  Tag: Visual.Quality (cosmetic)
     Scale: visible glitches (z-fighting, stretched or flickering meshes, unreadable signs, panels hiding the truck being dressed) across overview, truck close-up, storm, reveal
     Meter: human + tester screenshots
     Must: 0 blocking glitches
     Plan: 0 glitches, and the dusk scene reads warm, neon visibly blooms
```
```
Q-10 Tag: Animation.CameraFly
     Scale: ms for the truck camera move
     Meter: tester, 3 timed clicks
     Must: 700–1400
     Plan: 1000
```
```
Q-11 Tag: Security.KeyExposure
     Scale: API keys found in JS bundle, page source or any network response
     Meter: tester, grep bundle + inspect responses
     Must: 0
     Plan: 0
```
```
Q-12 Tag: Compatibility.Browser
     Scale: blocking issues on latest Chrome and Edge, laptop, 1366×768 and 1920×1080
     Meter: human + tester at both sizes
     Must: 0
     Plan: 0
```
```
Q-13 Tag: Feel.PlacementJuice (cosmetic)
     Scale: ms from slot click to flower visible with bounce and petal burst
     Meter: tester, 5 placements
     Must: 300
     Plan: 150
```
