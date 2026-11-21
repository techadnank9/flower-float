# Phase 1 Journeys: 3D Harbourfront + Uncle Wing Level

Uncle Wing facts the checks rely on: budget HK$600, loves red and gold, wants luck and wealth symbols, taboo white flowers. Matching flowers include Kumquat tree, Peony, Yellow chrysanthemum, Peach blossom, Lucky bamboo and Orchid. White chrysanthemum is the trap.

## Start and name
- **JRN-1**
  - steps: Open the game URL in a fresh browser.
  - expected: The start screen shows "FA CHE 花車" and "The Flower Float" with exactly one button, "Open the stall". It becomes clickable within 5 s.
- **JRN-2**
  - steps: Click "Open the stall", leave the name blank, submit.
  - expected: The name step stays open and Kit says "Tell me your name, Boss!". The harbour is not entered. (interpreted)
- **JRN-3**
  - steps: Click "Open the stall", type "Mei", submit.
  - expected: The 3D harbourfront appears. Kit's tutorial bubbles play, one contains "Mei" and at least one contains "Boss!". A "Skip" button is visible during the tutorial.
- **JRN-4**
  - steps: During Kit's tutorial, click "Skip".
  - expected: The tutorial ends at once and the harbour is free to explore.

## World and interaction
- **JRN-5**
  - steps: At the harbour overview, look around without clicking.
  - expected: The scene is 3D at dusk. Water moves with waves, the skyline towers glow across the harbour, and a ferry-style boat drifts. String lights are visible, and neon signs show both Chinese and English text with visible bloom. Three trucks ("Wing's Egg Waffles", "Curry Up", "Fong's Milk Tea and Pineapple Buns") stand in an arc with the "Fa Che Florist" cart in front. Shadows fall under the trucks.
- **JRN-6**
  - steps: Watch the harbour for 15 seconds.
  - expected: Owners wave and shift weight, steam rises from each truck, flowers on the cart sway, lanterns swing, and crowd characters (visibly varied: tourists, office workers, students) walk past the empty trucks without stopping.
- **JRN-7**
  - steps: Hover over each truck, an owner, Kit, the cart, the ferry and a lantern.
  - expected: Each hovered object glows and bounces slightly. The effect stops when the pointer leaves.
- **JRN-8**
  - steps: Click Kit, the cart, the ferry and a neon sign.
  - expected: Each one gives a small reaction (a wiggle, a bubble or a sparkle). (interpreted)
- **JRN-9**
  - steps: Click "Curry Up", then Fong's truck.
  - expected: Each time the camera flies to the truck and Kit says "Boss! Let's help Uncle Wing first." "Back to harbour" returns the camera to the overview in about 1 s. (interpreted)
- **JRN-10**
  - steps: Click Uncle Wing's truck and time the camera move.
  - expected: The camera flies smoothly to his truck in about 1 s (0.7–1.4 s), with a "Skip" button visible during the move.
- **JRN-11**
  - steps: Inspect characters at a truck close-up.
  - expected: Each character is low-poly, built from primitive shapes, with its own colours, hat and apron. Kit stands by a scooter.

## Meet and Talk
- **JRN-12**
  - steps: Arrive at Uncle Wing's truck.
  - expected: Uncle Wing's greeting appears in a speech bubble and does not mention HK$600, red, gold or white flowers. The conversation panel opens over the still-visible 3D scene with three reply chips, a text box with Send, an "Ask the market" button and an empty Needs notebook (Budget, Colours, Goal, Taboo).
- **JRN-13**
  - steps: Click one of the three chips.
  - expected: Uncle Wing replies in 1–2 short sentences of English with at least one Cantonese word, within 4.5 s. Three new chips replace the old ones, with different text.
- **JRN-14**
  - steps: Type "What's your budget, Uncle?" and send.
  - expected: His reply gives HK$600, and the notebook Budget line fills with "HK$600".
- **JRN-15**
  - steps: Ask about the colours he likes, what he hopes the flowers will do, and anything he wants to avoid, each as a separate message.
  - expected: The replies reveal red and gold, luck and wealth, and white flowers (funerals). The notebook Colours, Goal and Taboo lines fill in. Replies never contradict the fixed facts.
- **JRN-16**
  - steps: In a fresh level, send only small talk ("Nice evening!", "How's business?") for 4 turns.
  - expected: No reply states the budget, colours, goal or taboo, and the notebook stays empty.
- **JRN-17**
  - steps: Ask "Who started this truck?" then "Tell me about your father."
  - expected: His replies turn noticeably softer and mention his late father. Trust is not shown on screen, but it later shows as high on the score card, and his final reaction is warmer than in a run without these questions.
- **JRN-18**
  - steps: Try to send with an empty text box. Then send a message and try clicking chips while the reply is pending.
  - expected: Send is disabled when the box is empty. Chips and Send are disabled until the reply appears.
- **JRN-19**
  - steps: Use a dictation tool (or a paste event) to put text into the text box, then press Send.
  - expected: The dictated text is sent and answered like typed text.
- **JRN-20**
  - steps: With the dialogue AI forced to fail or exceed 4 s (backend test switch or simulated timeout), ask about the budget, then small talk.
  - expected: An in-character Uncle Wing reply still appears within about 4.5 s with no error message. The budget question still fills the Budget line with HK$600, and fresh chips still appear.

## Research
- **JRN-21**
  - steps: Click "Ask the market".
  - expected: Three Market Intel cards appear (weather/typhoon signal, an event near West Kowloon, the next festival), each with a working source link and the label "Market notes (offline)". (interpreted)
- **JRN-22**
  - steps: Read the cards, then click "Start arranging".
  - expected: The shelf slides in. Flowers affected by the intel carry a badge (e.g. "Rain: +Storm Proof" on hardy flowers), and their effect shows in the meters when placed.

## Arrange
- **JRN-23**
  - steps: Look at the shelf.
  - expected: All 12 catalogue flowers are listed with name, price in HKD, meaning and hardiness (e.g. "Kumquat tree, HK$180, wealth, hardy").
- **JRN-24**
  - steps: Before uncovering the budget, click Kumquat tree, then the roof slot.
  - expected: The five slots (roof, awning, counter, bumper, stand) glow once the flower is selected. The kumquat pops onto the roof with a bounce and petal burst within 300 ms. The Budget meter reads "HK$180 / ?", and Luck, Crowd and Storm Proof update at once. (interpreted)
- **JRN-25**
  - steps: With the budget uncovered, place Peony on the awning, then click the placed Peony with nothing selected.
  - expected: Budget shows "HK$300 / HK$600" after placing, then "HK$180 / HK$600" after removal, and the Peony disappears from the truck.
- **JRN-26**
  - steps: Select Sunflower and click the occupied roof slot.
  - expected: The Sunflower replaces the Kumquat, and the budget drops by HK$120 net (refund HK$180, charge HK$60). (interpreted)
- **JRN-27**
  - steps: Select the Congratulation stand and click the counter slot, then the stand slot.
  - expected: The counter refuses it and Kit says "Boss, the stand goes beside the truck!". The stand slot accepts it. (interpreted)
- **JRN-28**
  - steps: Place White chrysanthemum on the bumper.
  - expected: Uncle Wing immediately complains in a speech bubble (funeral/bad luck in tone).
- **JRN-29**
  - steps: Fill slots until spending passes HK$600.
  - expected: The Budget meter turns red. Placement is still allowed.
- **JRN-30**
  - steps: With no flowers placed, look at "Brace for the storm".
  - expected: The button is disabled. It enables once one flower is placed.

## Storm
- **JRN-31**
  - steps: Place Peach blossom (fragile), Kumquat tree (hardy) and Orchid (medium), then click "Brace for the storm".
  - expected: The banner shows T1, then T3, then T8. The sky darkens, rain and wind particles appear, and the camera shakes. At T8 the Peach blossom blows off while the Kumquat and Orchid stay. A 20-second countdown appears with the shelf open, and a "Skip" button is visible during the sequence.
- **JRN-32**
  - steps: During the countdown, place Lucky bamboo in the empty slot. Let the timer hit zero.
  - expected: The bamboo pops in. At zero the sky clears and the rain stops.
- **JRN-33**
  - steps: Start the storm and click "Skip" during the banner sequence.
  - expected: It jumps to the end state of the sequence (fragile flowers off, countdown running or finished) without breaking the level.

## Reveal and score
- **JRN-34**
  - steps: Complete a "good" run: uncover all four needs, ask about his father, place 4–5 hardy/medium red-or-gold or luck/wealth flowers (no white), spend ≤ HK$600, survive the storm.
  - expected: Uncle Wing reacts warmly in a bubble, crowd characters queue at his truck, and the score card shows 3 stars. Five lines appear: Needs matched, Taboo avoided, Budget respected, Storm survivors, Trust. The receipt lists each flower with its price, a total in HKD matching the sum, and a delivery slot.
- **JRN-35**
  - steps: Repeat the good run but add White chrysanthemum.
  - expected: Uncle Wing complains on placement. The score card shows one star fewer than the good run, with "Taboo avoided" marked failed.
- **JRN-36**
  - steps: Repeat the good run but overspend past HK$600.
  - expected: The Budget meter is red. The score card shows one star fewer than the good run, with "Budget respected" marked failed.
- **JRN-37**
  - steps: Do a bad run: small talk only, white chrysanthemum, overspend, all fragile flowers.
  - expected: The score card shows exactly 1 star (never 0), and his reaction is grumpy.
- **JRN-38**
  - steps: Compare the Crowd meter for the same flowers in a high-Trust run and a no-Trust run.
  - expected: Crowd is higher in the high-Trust run.
- **JRN-39**
  - steps: Click "Skip" during the reveal and the crowd queue.
  - expected: It jumps straight to the score card.
- **JRN-40**
  - steps: Close the score card.
  - expected: The camera returns to the harbour. Uncle Wing's truck stays decorated with his star count shown above it, and crowd characters now stop at it while still passing the other trucks.
- **JRN-41**
  - steps: Reopen Uncle Wing's truck and click "Play again" on the score card (or from his completed truck).
  - expected: The level restarts from Meet with an empty truck, an empty notebook and a fresh conversation. (interpreted)

## Saving
- **JRN-42**
  - steps: Mid-Talk with two notebook lines filled, refresh the page and click "Open the stall".
  - expected: No name prompt. The game resumes at Uncle Wing's Talk beat with the same conversation history and notebook lines.
- **JRN-43**
  - steps: Mid-Arrange with three flowers placed, refresh and resume.
  - expected: The same three flowers are in the same slots, and the meters show the same values.
- **JRN-44**
  - steps: Refresh during the storm countdown and resume.
  - expected: The storm restarts from T1 with the pre-storm flowers back on the truck. (interpreted)
- **JRN-45**
  - steps: After completing the level, refresh and resume.
  - expected: The harbour shows Uncle Wing's decorated truck with his stars.
- **JRN-46**
  - steps: Open the in-game menu, choose "Start a new run", then click "Open the stall".
  - expected: Saved progress is cleared, the start screen returns, and the name step appears again. (interpreted)

## Security and quality
- **JRN-47**
  - steps: Search the loaded JS bundle, page source and all network responses for key values or key-like strings.
  - expected: No ElevenLabs, You.com, Meshy or LLM key appears anywhere in the browser.
- **JRN-48**
  - steps: Play the overview and a close-up at 1366×768 and 1920×1080 in Chrome.
  - expected: The panels never fully hide the truck being dressed, text is readable, and there is no z-fighting or flicker. (human for fps)
