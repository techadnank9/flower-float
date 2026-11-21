import { useGame, saveAudioPrefs } from "./store";
import { getCtx } from "./voice";

// All sounds are synthesised in code with the Web Audio API (see public/audio/LICENSES.md).
const log = [];
const live = { music: false, harbour: false, storm: false, ducked: false };
let ctx = null;
let bus = null;
let noise = null;
const loops = {};
const lastAt = {};

const prefs = () => useGame.getState().audioPrefs;

function setup() {
  ctx = getCtx();
  if (!ctx || bus) return;
  const g = (v, to) => { const n = ctx.createGain(); n.gain.value = v; n.connect(to); return n; };
  const master = g(0.9, ctx.destination);
  const duck = g(1, master);
  bus = { master, duck, sfx: g(1, master), music: g(0.55, duck), amb: g(1, duck) };
  noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

const env = (node, t, peak, attack, decay) => {
  node.gain.setValueAtTime(0.0001, t);
  node.gain.exponentialRampToValueAtTime(peak, t + attack);
  node.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
};

function tone(type, f0, f1, t, dur, peak, to = bus.sfx) {
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, peak, 0.005, dur); o.connect(g); g.connect(to);
  o.start(t); o.stop(t + dur + 0.05);
}

function burst(filterType, freq, t, dur, peak, q = 1, to = bus.sfx) {
  const s = ctx.createBufferSource(); s.buffer = noise;
  const f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain(); env(g, t, peak, 0.004, dur);
  s.connect(f); f.connect(g); g.connect(to);
  s.start(t, Math.random()); s.stop(t + dur + 0.05);
  return f;
}

const SFX = {
  pop: (t) => { tone("sine", 520, 1250, t, 0.11, 0.28); burst("highpass", 2500, t, 0.03, 0.05); },
  whoosh: (t) => {
    const f = burst("bandpass", 300, t, 0.75, 0.16, 0.9);
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(1900, t + 0.35); f.frequency.exponentialRampToValueAtTime(350, t + 0.75);
  },
  alert: (t) => [0, 0.16, 0.32].forEach((d, i) => tone("square", i % 2 ? 660 : 880, 0, t + d, 0.12, 0.07)),
  tick: (t) => { tone("square", 1900, 0, t, 0.03, 0.12); tone("sine", 950, 0, t, 0.05, 0.08); },
  chime: (t) => {
    burst("highpass", 3500, t, 0.08, 0.12);
    [1318.5, 1975.5, 2637].forEach((f, i) => tone("sine", f, 0, t + 0.07 + i * 0.015, 1.1 - i * 0.2, 0.13 / (i + 1)));
    tone("triangle", 2093, 0, t + 0.22, 0.9, 0.08);
  },
  firework: (t) => {
    tone("sine", 110, 38, t, 0.35, 0.22);
    burst("lowpass", 900, t, 0.28, 0.16);
    for (let i = 0; i < 5; i++) burst("highpass", 3000, t + 0.25 + Math.random() * 0.5, 0.025, 0.05);
  },
};

export function sfx(name) {
  const entry = { name, t: Math.round(performance.now()), played: false };
  log.push(entry);
  if (log.length > 300) log.shift();
  if (!prefs().sfx) return;
  setup();
  if (!ctx || !SFX[name]) return;
  const now = performance.now();
  if (now - (lastAt[name] || 0) < 70) return;
  lastAt[name] = now;
  SFX[name](ctx.currentTime + 0.01);
  entry.played = true;
}

function startLoop(key, build) {
  if (loops[key]) return;
  setup();
  if (!ctx) return;
  const out = ctx.createGain(); out.gain.value = 0.0001; out.connect(bus.amb);
  out.gain.setTargetAtTime(1, ctx.currentTime, 0.6);
  loops[key] = { out, nodes: build(out) };
  live[key] = true;
}

function stopLoop(key) {
  const l = loops[key];
  if (!l) return;
  delete loops[key];
  live[key] = false;
  l.out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
  setTimeout(() => l.nodes.forEach((n) => { try { n.stop(); } catch { /* not a source */ } }), 1800);
}

function noiseLayer(out, type, freq, gain, lfoRate = 0, lfoDepth = 0) {
  const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = ctx.createGain(); g.gain.value = gain;
  s.connect(f); f.connect(g); g.connect(out); s.start();
  const nodes = [s];
  if (lfoRate) {
    const lfo = ctx.createOscillator(); const lg = ctx.createGain();
    lfo.frequency.value = lfoRate; lg.gain.value = lfoDepth;
    lfo.connect(lg); lg.connect(f.frequency); lfo.start(); nodes.push(lfo);
  }
  return nodes;
}

const harbourLoop = (out) => [...noiseLayer(out, "lowpass", 380, 0.05, 0.13, 160), ...noiseLayer(out, "bandpass", 520, 0.018, 0.4, 120)];
const stormLoop = (out) => [...noiseLayer(out, "lowpass", 520, 0.3, 0.21, 380), ...noiseLayer(out, "highpass", 3200, 0.07), ...noiseLayer(out, "bandpass", 1200, 0.04, 0.6, 500)];

// Procedural pentatonic lo-fi loop, scheduled ahead in small steps.
const SCALE = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3];
const MELODY = [0, 2, 4, 2, 5, -1, 4, 3, 2, 4, 3, 1, 0, -1, 1, 2, 4, 5, 7, 5, 4, -1, 2, 3, 4, 2, 1, 0, -1, -1, 2, -1];
const BASS = [130.8, 130.8, 110, 110, 98, 98, 87.3, 98];
let music = null;

function startMusic() {
  if (music) return;
  setup();
  if (!ctx) return;
  const out = ctx.createGain(); out.gain.value = 0.0001; out.connect(bus.music);
  out.gain.setTargetAtTime(0.5, ctx.currentTime, 0.8);
  const step = 60 / 84 / 2;
  let i = 0; let next = ctx.currentTime + 0.1;
  const id = setInterval(() => {
    while (next < ctx.currentTime + 0.3) {
      const m = MELODY[i % MELODY.length];
      if (m >= 0) tone("triangle", SCALE[m], 0, next, step * 1.6, 0.09, out);
      if (i % 4 === 0) tone("sine", BASS[(i / 4) % BASS.length], 0, next, step * 3.6, 0.14, out);
      if (i % 2 === 1) burst("highpass", 7000, next, 0.03, 0.025, 1, out);
      next += step; i++;
    }
  }, 100);
  music = { out, id };
  live.music = true;
}

function stopMusic() {
  if (!music) return;
  const m = music; music = null; live.music = false;
  m.out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3);
  setTimeout(() => clearInterval(m.id), 1200);
}

const STORMY = ["t1", "t3", "t8", "countdown"];

function sync(s) {
  const inGame = s.screen === "game";
  const storming = inGame && s.level.beat === "storm" && STORMY.includes(s.stormPhase);
  if (inGame && s.audioPrefs.music) startMusic(); else stopMusic();
  if (storming && s.audioPrefs.sfx) startLoop("storm", stormLoop); else stopLoop("storm");
  if (inGame && !storming && s.audioPrefs.sfx) startLoop("harbour", harbourLoop); else stopLoop("harbour");
  const duck = !!s.speaking;
  if (duck !== live.ducked && bus) bus.duck.gain.setTargetAtTime(duck ? 0.28 : 1, ctx.currentTime, 0.12);
  live.ducked = duck;
}

let started = false;
export function startAudio() {
  if (started) return;
  started = true;
  sync(useGame.getState());
  useGame.subscribe((s, p) => {
    if (s.placedFx && s.placedFx.key !== p.placedFx?.key) sfx("pop");
    if (s.flyId !== p.flyId && s.flying) sfx("whoosh");
    if (s.stormPhase !== p.stormPhase && ["t1", "t3", "t8"].includes(s.stormPhase)) sfx("alert");
    if (s.stormPhase === "countdown" && s.countdown !== p.countdown && s.countdown > 0 && s.countdown <= 5) sfx("tick");
    if (s.scoreOpen && !p.scoreOpen) sfx("chime");
    sync(s);
  });
}

export function setAudioPref(key, value) {
  const next = { ...prefs(), [key]: value };
  useGame.setState({ audioPrefs: next });
  saveAudioPrefs(next);
}

window.__fache = Object.assign(window.__fache || {}, {
  audio: {
    log, sfx,
    state: () => ({ ...live, prefs: prefs(), ctxState: ctx?.state || "none", started }),
    clear: () => { log.length = 0; },
  },
});
