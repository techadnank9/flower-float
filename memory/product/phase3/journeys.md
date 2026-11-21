# Phase 3 Journeys: Live Market Intel

All earlier journeys stay valid. JRN-21 (offline label) now applies only to the fallback path; see JRN-69.

- **JRN-65**
  - steps: Start Uncle Wing's level, talk briefly, click "Ask the market".
  - expected: Within 4.5 s three cards appear (weather and typhoon signal, an event near West Kowloon, the next festival) under the label "Researched live with You.com". Each card has a headline, a 1–2 sentence Hong Kong-relevant summary and at least one clickable source link to a real page.
- **JRN-66**
  - steps: Read each card's effect line, then open the shelf.
  - expected: Each card states its effect in words. The matching flowers on the shelf carry the badge (e.g. if rain or a signal is mentioned, hardy flowers show "Rain: +Storm Proof"), and placing them moves the matching meter more than without the intel.
- **JRN-67**
  - steps: Inspect the backend intel response.
  - expected: It shows the source as live You.com for each card and includes the result URLs. It contains no API key.
- **JRN-68**
  - steps: Click "Ask the market" a second time in the session, then refresh the page and resume.
  - expected: The same cards appear instantly (under 0.5 s) without new You.com calls, and after refresh the cards are restored from the save.
- **JRN-69**
  - steps: Force the fallback (test switch, or simulate You.com failure/timeout) and click "Ask the market".
  - expected: Three seeded cards appear labelled "Market notes (offline)", with no error message and the game flowing on to arranging.
- **JRN-70**
  - steps: Simulate one topic failing while the other two succeed (if a test hook exists).
  - expected: Two live cards and one offline card appear, each with its own correct label.
- **JRN-71**
  - steps: Search the bundle and network for the YDC key.
  - expected: It is not found.
