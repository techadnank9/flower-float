# Phase 3 Requirement: Live Market Intel with You.com

**Version:** phase-3

**Goal:** "Ask the market" does real research. The backend asks You.com for today's Hong Kong weather and typhoon signal, events near West Kowloon, and the next festival, then shows three live Market Intel cards with source links. Each card changes flower stats. If You.com fails or is slow, the seeded offline cards appear silently.

Builds on Phases 1–2 as delivered (the offline intel cards from P1 become the fallback). Context is in [../overview.md](../overview.md). The storm beat stays as built in P1, since the in-game typhoon always arrives.

## Functional requirements
- REQ-144 [event] When the player clicks "Ask the market", the system shall request live intel from the backend.
- REQ-145 [always] The system shall call the You.com Web Search API only from the backend, with header `X-API-Key` from YDC_API_KEY, at the path confirmed from https://you.com/docs/openapi.json (expected `POST https://ydc-index.io/v1/search`).
- REQ-146 [always] The system shall research three topics: today's Hong Kong weather and typhoon signal, events near West Kowloon, and the next Hong Kong festival.
- REQ-147 [always] The system shall run the three topic searches in parallel. (interpreted)
- REQ-148 [event] When live results arrive, the system shall show one Market Intel card per topic with a short headline and a 1–2 sentence summary drawn from the results.
- REQ-149 [always] The system shall show at least one clickable source link from the You.com results on each live card.
- REQ-150 [always] The system shall show the label "Researched live with You.com" on the live intel panel.
- REQ-151 [event] When a live weather card mentions rain, showers, thunderstorms, strong wind or a typhoon signal, the system shall raise the Storm Proof value of hardy flowers.
- REQ-152 [event] When a live weather card mentions rain, showers, thunderstorms, strong wind or a typhoon signal, the system shall show the shelf badge "Rain: +Storm Proof" on hardy flowers.
- REQ-153 [event] When a live weather card reports a current Hong Kong typhoon signal, the system shall show that signal number on the card.
- REQ-154 [event] When a live weather card reports hot or sunny weather, the system shall raise the Crowd value of sunflowers. (interpreted)
- REQ-155 [event] When a live event card finds an event near West Kowloon, the system shall raise the Crowd value of eye-catching flowers (sunflower, peach blossom, orchid, pampas grass, congratulation stand).
- REQ-156 [event] When a live festival card names the next festival, the system shall raise the Luck value of that festival's flowers (e.g. Lunar New Year: peach blossom and kumquat; Chung Yeung: chrysanthemums; Winter Solstice/Christmas: red and gold). (interpreted)
- REQ-157 [always] The system shall show each card's effect in words on the card (e.g. "Hardy flowers +Storm Proof").
- REQ-158 [unwanted] If a You.com call fails, then the system shall show the seeded offline card for that topic with no error message.
- REQ-159 [unwanted] If the intel request takes over 4 seconds, then the system shall show the seeded offline cards with no error message.
- REQ-160 [unwanted] If a fallback card is shown, then the system shall label it "Market notes (offline)" in place of the You.com label.
- REQ-161 [event] When the player asks the market again in the same session, the system shall reuse the cached intel without calling You.com.
- REQ-162 [event] When the page is refreshed, the system shall restore the same intel cards from the save.
- REQ-163 [unwanted] If the test switch `X-Force-Fallback: 1` (or `?force_fallback=1`) is set, then the system shall return the offline cards. (interpreted)
- REQ-164 [always] The system shall keep the YDC key out of the browser bundle and network responses.

## Quality requirements
```
Q-21 Tag: Responsiveness.Intel
     Scale: seconds from "Ask the market" click to three cards visible
     Meter: tester, 3 cold + 3 cached trials
     Must: 4.5 cold, 0.5 cached
     Plan: 3 cold, 0.2 cached
```
```
Q-22 Tag: AI.IntelRelevance (trust)
     Scale: live cards whose summary is on-topic for Hong Kong and is current (today/this week/next festival) and whose link opens a real page
     Meter: tester (inspect payload + open links) + human glance
     Must: 3/3 on-topic, 3/3 links resolve
     Plan: same, and summaries read naturally
```
```
Q-23 Tag: Reliability.IntelFallback
     Scale: % of requests that show 3 cards when You.com fails or is forced off
     Meter: tester, forced failure, 3 trials
     Must: 100
     Plan: 100
```
```
Q-24 Tag: Cost.IntelCache
     Scale: You.com calls per session for repeated "Ask the market"
     Meter: tester, backend stats/log
     Must: 3 (one per topic)
     Plan: 3
```
```
Q-25 Tag: Security.KeyExposure
     Scale: YDC key occurrences in browser
     Meter: tester grep
     Must: 0
     Plan: 0
```
