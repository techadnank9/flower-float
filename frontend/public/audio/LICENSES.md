# Audio sources and licences

The game ships **no audio files**. Every sound is synthesised at runtime with the Web Audio API in
`frontend/src/game/audio.js`, written for this project. There are no third-party recordings and no licence obligations.

| Sound | Trigger | How it's made |
| --- | --- | --- |
| pop | flower placed in a slot | sine sweep 520→1250 Hz + short high-passed noise |
| whoosh | camera fly | band-passed noise with a swept centre frequency |
| alert | each typhoon signal banner (T1/T3/T8) | three square-wave beeps (880/660 Hz) |
| wind + rain | storm running | looping low-passed noise with LFO (wind) + high-passed noise (rain) |
| tick | last 5 s of the countdown | square click + sine body |
| chime | score card opens | noise "ka" + bell partials (E6/B6/E7) |
| firework | each finale burst | sine thump 110→38 Hz + noise crackle |
| harbour ambience | game screen, not in storm | slow LFO low-passed noise (water) + band-passed murmur |
| music | game screen, music toggle on | procedural C-major pentatonic lo-fi loop at 84 BPM (triangle melody, sine bass, noise hats) |

Owner voice lines come from ElevenLabs TTS through the backend (`/api/tts`). They are not stored here.
