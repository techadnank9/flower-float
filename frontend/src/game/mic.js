import { useGame } from "./store";
import { stopVoice } from "./voice";

const SILENCE_MS = 8000;
const targets = new Map();
let session = null;
let lastTarget = null;
const DENIED = "No mic? No problem, Boss, just type!";

const SR = () => window.SpeechRecognition || window.webkitSpeechRecognition;
export const micSupported = () => !useGame.getState().micForceUnsupported && !!SR();

export function registerMicTarget(name, handlers) {
  targets.set(name, handlers);
  lastTarget = name;
  return () => { targets.delete(name); if (lastTarget === name) lastTarget = [...targets.keys()].pop() || null; if (session?.target === name) stopMic(); };
}

function armSilence() {
  clearTimeout(session?.silence);
  if (session) session.silence = setTimeout(() => stopMic("silence"), SILENCE_MS);
}

function cleanup(s) {
  clearTimeout(s.silence);
  try { s.rec?.abort(); } catch { /* ignore */ }
  s.stream?.getTracks().forEach((t) => t.stop());
  try { s.ctx?.close(); } catch { /* ignore */ }
}

export function stopMic(reason = "cancel") {
  const s = session;
  if (!s) return;
  session = null;
  cleanup(s);
  useGame.setState({ micListening: null });
  s.handlers.onCancel?.(reason);
}

function deliverInterim(text) {
  if (!session) return;
  armSilence();
  session.handlers.onInterim?.(text);
}

function deliverFinal(text) {
  const s = session;
  if (!s) return;
  session = null;
  cleanup(s);
  useGame.setState({ micListening: null });
  const t = text.trim();
  if (t) s.handlers.onFinal?.(t);
  else s.handlers.onCancel?.("empty");
}

function handleError(code) {
  const denied = code === "not-allowed" || code === "service-not-allowed" || code === "NotAllowedError";
  stopMic(denied ? "denied" : "error");
  if (denied) useGame.getState().say(DENIED);
}

function attachRecognition(s) {
  const Rec = SR();
  if (!Rec) return;
  const rec = new Rec();
  rec.lang = "en-US";
  rec.interimResults = true;
  rec.continuous = false;
  rec.onresult = (e) => {
    let interim = "";
    let final = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) final += r[0].transcript; else interim += r[0].transcript;
    }
    if (final) deliverFinal(final); else if (interim) deliverInterim(interim);
  };
  rec.onerror = (e) => { if (session === s && e.error !== "no-speech" && e.error !== "aborted") handleError(e.error); };
  rec.onend = () => { if (session === s && s.restarts++ < 6) { try { rec.start(); } catch { /* ignore */ } } };
  s.rec = rec;
  try { rec.start(); } catch { /* ignore */ }
}

function attachWaveform(s) {
  navigator.mediaDevices?.getUserMedia({ audio: true }).then((stream) => {
    if (session !== s) { stream.getTracks().forEach((t) => t.stop()); return; }
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    ctx.createMediaStreamSource(stream).connect(analyser);
    Object.assign(s, { stream, ctx, analyser });
  }).catch((err) => { if (session === s && (err.name === "NotAllowedError" || err.name === "SecurityError")) handleError("not-allowed"); });
}

export function startMic(target, { simulated = false } = {}) {
  const handlers = targets.get(target);
  if (!handlers) return false;
  if (session) stopMic();
  stopVoice();
  session = { target, handlers, simulated, restarts: 0, analyser: null };
  useGame.setState({ micListening: target });
  handlers.onStart?.();
  armSilence();
  if (!simulated) { attachRecognition(session); attachWaveform(session); }
  return true;
}

export const getAnalyser = () => session?.analyser || null;
export const isSimulated = () => !!session?.simulated;

function ensureSession() {
  if (!session) startMic(lastTarget, { simulated: true });
  return !!session;
}

window.__fache = Object.assign(window.__fache || {}, {
  mic: {
    simulate: (text, { interimMs = 350 } = {}) => {
      if (!ensureSession()) return false;
      const words = text.split(" ");
      words.slice(0, -1).forEach((_, i) => setTimeout(() => deliverInterim(words.slice(0, i + 1).join(" ")), interimMs * (i + 1)));
      setTimeout(() => deliverFinal(text), interimMs * words.length);
      return true;
    },
    simulateInterim: (text) => ensureSession() && (deliverInterim(text), true),
    simulateError: (code = "not-allowed") => ensureSession() && (handleError(code), true),
    simulateUnsupported: (on = true) => { stopMic(); useGame.setState({ micForceUnsupported: on }); },
    startSimulated: () => startMic(lastTarget, { simulated: true }),
    stop: () => stopMic(),
    state: () => ({ listening: !!session, target: session?.target || null, simulated: !!session?.simulated, hasStream: !!session?.stream, supported: micSupported() }),
  },
});
