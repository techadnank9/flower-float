# Phase 2 Journeys: Owner Voices and Mic Input

All Phase 1 journeys (JRN-1…JRN-48) stay valid.

## Voices
- **JRN-49**
  - steps: Start a new run, click "Open the stall", enter a name, click Uncle Wing's truck.
  - expected: His greeting is heard as speech with no extra click. His mouth or body bobs while it plays and stops after. The greeting shows as a subtitle. The backend called ElevenLabs with model `eleven_flash_v2_5` and Wing's voice id.
- **JRN-50**
  - steps: Send three messages to Uncle Wing (chip, typed, chip).
  - expected: Every reply is spoken, with a subtitle and the bob animation, and the audio starts within 2.5 s of the text appearing. Kit's bubbles stay silent.
- **JRN-51**
  - steps: Send a message, and while Wing is still speaking send another.
  - expected: The first audio stops when the next line starts. Voices never overlap.
- **JRN-52**
  - steps: Place White chrysanthemum, then complete the storm and reach the reveal.
  - expected: The taboo complaint and the reveal reaction are both spoken in Wing's voice with subtitles.
- **JRN-53**
  - steps: Call the TTS endpoint for each owner (wing, jasmine, fong).
  - expected: Three different voice ids are used and each returns playable audio (audio/mpeg).
- **JRN-54**
  - steps: Make TTS fail (test switch, or simulated ElevenLabs error/timeout) and talk to Wing.
  - expected: Reply text bubbles still appear with no error message, and the game continues normally.
- **JRN-55**
  - steps: Trigger the same Wing line twice in one session (e.g. Play again → greeting).
  - expected: The second play is served from cache, and the backend shows only one ElevenLabs call for that line. (interpreted)
- **JRN-56**
  - steps: Search the bundle and all network responses for the ElevenLabs key.
  - expected: It is not found anywhere in the browser.

## Mic
- **JRN-57**
  - steps: Open the conversation panel.
  - expected: Chips, the text box with Send, and a mic button are all visible together.
- **JRN-58**
  - steps: Click mic, allow permission, say "What's your budget, Uncle?" (or inject fake media/recognition in test).
  - expected: A live waveform moves while you speak, and interim words appear in the text box. On the final result the message sends and Wing replies with HK$600, filling the Budget line. (interpreted)
- **JRN-59**
  - steps: Click mic, then click it again before speaking.
  - expected: Listening stops, no message is sent, and the waveform disappears.
- **JRN-60**
  - steps: Click mic and stay silent for 8+ seconds.
  - expected: Listening stops by itself and the text box is unchanged. (interpreted)
- **JRN-61**
  - steps: Deny mic permission when prompted.
  - expected: Kit says "No mic? No problem, Boss, just type!" and the chips and text box still work. (interpreted)
- **JRN-62**
  - steps: Open the game in a browser without the Web Speech API (or with it stubbed out).
  - expected: The mic button is disabled with the tooltip "Mic not available in this browser", and typing and chips work.
- **JRN-63**
  - steps: Click mic while Wing is speaking. Then send a message and look at the mic while the reply is pending.
  - expected: Wing's audio stops when the mic starts listening. The mic is disabled while a reply is pending.

## Spoken name
- **JRN-64**
  - steps: On the name step, click the mic and say "Mei".
  - expected: The name field fills with "Mei". The player confirms it and enters the harbour, and Kit's tutorial uses "Mei". (interpreted)
