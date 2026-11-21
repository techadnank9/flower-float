# Phase 2 Requirement: Owner Voices and Mic Input

**Version:** phase-2

**Goal:** Uncle Wing speaks every line out loud in a distinct ElevenLabs voice with his body bobbing and subtitles shown. The player can talk back with their own voice through a mic button with a live waveform, including speaking their name at the start. The game never blocks if voice or mic fails.

Builds on Phase 1 as delivered (dialogue on `claude-fable-5-1`, test switch `X-Force-Fallback`, save key `fache_save_v1`). Product context is in [../overview.md](../overview.md). Out of scope: You.com (P3), Jasmine/Fong levels and parade (P4), Meshy, SFX and music (P5). Voices for Jasmine and Auntie Fong are chosen and configured now but only heard in P4.

## Functional requirements

### Text to speech
- REQ-115 [event] When an owner line appears (greeting, reply, taboo complaint, or reveal reaction), the system shall play it as ElevenLabs speech.
- REQ-116 [always] The system shall call ElevenLabs only from the backend: `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}` with header `xi-api-key` from ELEVENLABS_API_KEY and `model_id` `eleven_flash_v2_5`.
- REQ-117 [always] The system shall voice Uncle Wing with a gruff older male voice.
- REQ-118 [always] The system shall configure an upbeat young female voice for Jasmine.
- REQ-119 [always] The system shall configure a warm older female voice for Auntie Fong.
- REQ-120 [always] The system shall keep the three voice ids in backend config, each distinct from the others.
- REQ-121 [state] While an owner's audio plays, the system shall bob that owner's mouth or body in the 3D scene.
- REQ-122 [state] While an owner's audio plays, the system shall show that line as a subtitle.
- REQ-123 [event] When a new owner line starts, the system shall stop any owner audio still playing.
- REQ-124 [unwanted] If the TTS call fails, then the system shall show the text bubble only, with no error message.
- REQ-125 [unwanted] If the TTS call takes over 4 seconds, then the system shall show the text bubble only, with no error message.
- REQ-126 [event] When the same owner line is requested again in a session, the system shall reuse cached audio instead of calling ElevenLabs again. (interpreted)
- REQ-127 [event] When the player clicks "Open the stall", the system shall unlock browser audio so the first owner line can play without another click.
- REQ-128 [always] The system shall keep Kit's lines as unvoiced speech bubbles. (interpreted)
- REQ-129 [unwanted] If the test switch `X-Force-Fallback: 1` (or `?force_fallback=1`) is set, then the system shall skip TTS and show text only. (interpreted)

### Mic input
- REQ-130 [state] While the conversation panel is open, the system shall show a mic button next to the text box, alongside the chips and the text box.
- REQ-131 [event] When the player clicks the mic button, the system shall start Web Speech API recognition.
- REQ-132 [state] While the mic is listening, the system shall show a live waveform that moves with the player's voice.
- REQ-133 [state] While the mic is listening, the system shall write the interim transcript into the text box.
- REQ-134 [event] When recognition returns a final result, the system shall send the transcript as the player's message. (interpreted)
- REQ-135 [event] When the player clicks the mic button while listening, the system shall stop listening without sending empty text.
- REQ-136 [unwanted] If the browser lacks the Web Speech API, then the system shall disable the mic button with the tooltip "Mic not available in this browser".
- REQ-137 [unwanted] If the player denies mic permission, then the system shall show Kit's bubble "No mic? No problem, Boss, just type!" (interpreted)
- REQ-138 [unwanted] If recognition hears nothing for 8 seconds, then the system shall stop listening with the text box unchanged. (interpreted)
- REQ-139 [state] While an owner reply is pending, the system shall disable the mic button.
- REQ-140 [event] When the mic starts listening, the system shall stop any owner audio playing.

### Spoken name
- REQ-141 [always] The system shall show a mic button on the name step.
- REQ-142 [event] When the player speaks their name on the name step, the system shall fill the name field with the recognised name.
- REQ-143 [always] The system shall require the player to confirm the spoken name before entering the harbour. (interpreted)

## Quality requirements
```
Q-14 Tag: Responsiveness.VoiceStart
     Scale: seconds from owner text visible to audio audible
     Meter: tester (network timing of /api/tts), 8 lines; human ear check
     Must: 2.5
     Plan: 1.0
```
```
Q-15 Tag: Reliability.TTSFallback
     Scale: % of owner lines that still show text when TTS fails or is forced off
     Meter: tester, forced failure, 5 lines
     Must: 100
     Plan: 100
```
```
Q-16 Tag: Voice.Distinctness (cosmetic/trust)
     Scale: listener can tell the 3 voices apart and match them to gruff older man / upbeat young woman / warm older woman
     Meter: human, 1 sample each
     Must: 3/3 matched
     Plan: 3/3 and each feels in character
```
```
Q-17 Tag: Sync.TalkAnimation (cosmetic)
     Scale: ms between audio start/stop and bob start/stop
     Meter: human + tester state check
     Must: 300
     Plan: 100
```
```
Q-18 Tag: Mic.Accuracy
     Scale: % of 5 clear spoken English sentences transcribed well enough to get an on-topic reply
     Meter: human, Chrome laptop mic
     Must: 80
     Plan: 100
```
```
Q-19 Tag: Cost.TTSCache
     Scale: ElevenLabs calls for the same line replayed in one session
     Meter: tester, backend log count
     Must: 1
     Plan: 1
```
```
Q-20 Tag: Security.KeyExposure
     Scale: ElevenLabs key occurrences in bundle/network
     Meter: tester grep
     Must: 0
     Plan: 0
```
