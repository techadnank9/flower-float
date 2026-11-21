# Phase 4 Requirement: Jasmine, Auntie Fong and the Parade Finale

**Version:** phase-4

**Goal:** Two more full levels, Jasmine at "Curry Up" and Auntie Fong at "Fong's Milk Tea and Pineapple Buns", using the same five beats as Uncle Wing, with their own personas, voices, needs and taboos. Auntie Fong's congratulation stand carries a ribbon message the AI writes from what she told you. When all three trucks are done, night falls and the trucks roll along the harbour as a lit parade with fireworks, a final score and a "Share your float" screenshot button.

Builds on Phases 1–3 as delivered (dialogue on `claude-fable-5-1`, ElevenLabs voices Jessica for Jasmine and Matilda for Fong, live You.com intel cached per owner, test switches as in `/app/memory/test_credentials.md`). Personas are in [../overview.md](../overview.md).

## Owner facts (fixed server-side, the LLM can't change them)
- **Jasmine:** budget HK$1500. Colours pinks and oranges. Goal: a photo-worthy look plus edible flowers to garnish dishes. Taboo: anything old-fashioned. Personal topics that build Trust: her Instagram, how she started the truck, her fusion recipes.
  - Need match (interpreted): flowers tagged pink or orange, the edible Nasturtium and pansy mix, or modern-style flowers (pampas grass, orchid). The Nasturtium and pansy mix gains the tag orange.
  - Taboo (interpreted): old-fashioned flowers, meaning the chrysanthemums (yellow and white) and the Congratulation stand.
- **Auntie Fong:** budget HK$1000. Goal: her truck's 20th anniversary, a traditional congratulation flower stand with a ribbon message, and flowers that last a week. Taboo: strong scents that overpower her tea. Personal topics that build Trust: the 20 years of the truck, her regular customers, her family.
  - Need match (interpreted): the Congratulation stand, or long-lasting hardy/medium flowers with traditional meanings (kumquat, yellow chrysanthemum, orchid, lucky bamboo, peony).
  - Taboo: the strong-scented Lily.
  - Without a Congratulation stand on her truck, the anniversary goal counts as unmet.

## Functional requirements

### Levels
- REQ-165 [event] When the player clicks Jasmine's truck, the system shall start her level at the Meet beat. This replaces the P1 lock bubble.
- REQ-166 [event] When the player clicks Auntie Fong's truck, the system shall start her level at the Meet beat. This replaces the P1 lock bubble.
- REQ-167 [always] The system shall let the player play the three trucks in any order. (interpreted)
- REQ-168 [always] The system shall run Jasmine's and Auntie Fong's levels through the same five beats as Uncle Wing: Meet, Talk, Research, Arrange, Storm and Reveal.
- REQ-169 [always] The system shall play Jasmine as fast-talking and trend-obsessed, in 1–2 short sentences of English with a few Cantonese words.
- REQ-170 [always] The system shall play Auntie Fong as warm and gossipy, calling the player "dear", in 1–2 short sentences of English with a few Cantonese words.
- REQ-171 [unwanted] If the player has not asked about a hidden need, then the system shall keep that need out of the owner's replies.
- REQ-172 [event] When Jasmine or Auntie Fong reveals a need, the system shall fill that line of her Needs notebook from the server's fixed facts.
- REQ-173 [always] The system shall keep a separate notebook, conversation, Trust, intel, arrangement and score per owner.
- REQ-174 [always] The system shall speak every Jasmine line with her upbeat young female voice.
- REQ-175 [always] The system shall speak every Auntie Fong line with her warm older female voice.
- REQ-176 [event] When the player places an old-fashioned flower on Jasmine's truck, the system shall have Jasmine complain out loud immediately.
- REQ-177 [event] When the player places a Lily on Auntie Fong's truck, the system shall have Auntie Fong complain out loud about the scent immediately.
- REQ-178 [unwanted] If the LLM or TTS fails for Jasmine or Auntie Fong, then the system shall use that owner's seeded lines with no error message.

### Ribbon message
- REQ-179 [event] When the player places the Congratulation stand on Auntie Fong's truck, the system shall show a ribbon message on the stand written by the LLM from her conversation.
- REQ-180 [always] The system shall keep the ribbon message to two short ribbon lines that mention the 20th anniversary. (interpreted)
- REQ-181 [unwanted] If the ribbon message call fails or takes over 4 seconds, then the system shall show the seeded ribbon message "Congratulations on 20 Years! 二十週年 生意興隆". (interpreted)
- REQ-182 [always] The system shall show the ribbon message on the score card receipt line for the stand.
- REQ-183 [event] When the Congratulation stand is placed on another owner's truck, the system shall show a ribbon message written for that owner. (interpreted)

### Scoring
- REQ-184 [always] The system shall score Jasmine and Auntie Fong using the same five lines and star rules as Uncle Wing, with their own need-match and taboo rules.
- REQ-185 [event] When a level's score card closes, the system shall leave that truck decorated with its stars shown above it.

### Finale
- REQ-186 [event] When the third truck's score card closes, the system shall start the finale.
- REQ-187 [event] When the finale starts, the system shall turn the sky to night.
- REQ-188 [state] While the finale plays, the system shall light up all three decorated trucks.
- REQ-189 [state] While the finale plays, the system shall roll the three trucks along the harbourfront as a parade, followed by the flower cart.
- REQ-190 [state] While the finale plays, the system shall launch fireworks over the skyline.
- REQ-191 [state] While the finale plays, the system shall show a "Skip" button.
- REQ-192 [event] When the parade ends or is skipped, the system shall show a final score panel with the stars per truck.
- REQ-193 [always] The system shall show the total stars out of 9 on the final score panel.
- REQ-194 [always] The system shall show the total spend in HKD across all trucks on the final score panel.
- REQ-195 [event] When the player clicks "Share your float", the system shall download a PNG screenshot of the 3D parade scene. (interpreted)
- REQ-196 [optional] Where the browser supports sharing files, the system shall offer the screenshot through the system share sheet as well. (interpreted)
- REQ-197 [event] When the player clicks "Play again" on the final score panel, the system shall clear the saved run and return to the start screen. (interpreted)
- REQ-198 [event] When the page is refreshed after the finale, the system shall resume at the final score panel. (interpreted)

### Fixes carried in
- REQ-199 [always] The system shall pick the seeded offline festival card by today's date, so it never shows a festival that has already passed.

## Quality requirements
```
Q-26 Tag: AI.PersonaFidelity (all owners)
     Scale: % of replies per owner that are 1–2 sentences, contain ≥1 Cantonese word and are clearly in that owner's voice (Fong says "dear")
     Meter: tester, 10 replies per owner
     Must: 85
     Plan: 100
```
```
Q-27 Tag: AI.FactAccuracy (trust)
     Scale: replies giving a wrong budget/colour/goal/taboo or an unasked need, per owner
     Meter: tester, 10 replies per owner
     Must: 0
     Plan: 0
```
```
Q-28 Tag: AI.RibbonQuality (cosmetic)
     Scale: ribbon messages that are ≤2 short lines, mention 20 years, and fit on the stand without overflow
     Meter: tester 3 generations + screenshot; human glance
     Must: 3/3
     Plan: 3/3 and personal to the chat
```
```
Q-29 Tag: Performance.FinaleFPS
     Scale: fps during parade + fireworks on a laptop
     Meter: human, Chrome FPS meter
     Must: 40 (estimate)
     Plan: 60
```
```
Q-30 Tag: Share.Screenshot (cosmetic)
     Scale: screenshot PNG shows the lit parade (not blank or black), at canvas resolution
     Meter: tester (decode PNG, check non-uniform pixels) + human
     Must: non-blank PNG
     Plan: crisp, includes all three trucks
```
```
Q-31 Tag: Persistence.MultiLevel
     Scale: % of refreshes that keep every finished truck's stars and decorations and the in-progress truck's state
     Meter: tester, refresh with 1 and 2 trucks complete
     Must: 100
     Plan: 100
```
