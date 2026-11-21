import { useGame } from "./store";
import { api } from "./api";

let ctx = null;
let current = null;
let token = 0;
const log = [];

const forceFallback = () => new URLSearchParams(window.location.search).get("force_fallback") === "1";

export function unlockAudio() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    ctx.resume();
    const s = ctx.createBufferSource();
    s.buffer = ctx.createBuffer(1, 1, 22050);
    s.connect(ctx.destination);
    s.start(0);
  } catch { /* audio unavailable: text only */ }
}

export function getCtx() {
  if (!ctx) unlockAudio();
  return ctx;
}

export function stopVoice() {
  token++;
  if (current) { try { current.stop(); } catch { /* already stopped */ } current = null; }
  if (useGame.getState().speaking) useGame.setState({ speaking: null });
}

export async function speak(ownerId, text) {
  stopVoice();
  const my = token;
  const entry = { ownerId, text, shownAt: performance.now(), startedAt: null, endedAt: null, outcome: "pending" };
  log.push(entry);
  if (forceFallback()) { entry.outcome = "forced-off"; return; }
  try {
    if (!ctx) unlockAudio();
    const ab = await api.tts(ownerId, text);
    if (!ab) { entry.outcome = "text-only"; return; }
    const buf = await ctx.decodeAudioData(ab);
    if (my !== token) { entry.outcome = "superseded"; return; }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.onended = () => {
      entry.endedAt = performance.now();
      if (current === src) { current = null; useGame.setState({ speaking: null }); }
    };
    src.start();
    current = src;
    entry.startedAt = performance.now();
    entry.outcome = "audio";
    useGame.setState({ speaking: { ownerId, text, key: my } });
  } catch {
    entry.outcome = "text-only";
  }
}

window.__fache = Object.assign(window.__fache || {}, {
  voice: {
    log,
    state: () => ({ speaking: useGame.getState().speaking, playing: !!current, ctxState: ctx?.state || "none" }),
    stop: stopVoice,
  },
});
