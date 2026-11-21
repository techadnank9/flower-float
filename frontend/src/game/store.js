import { create } from "zustand";
import { api } from "./api";
import { speak, stopVoice } from "./voice";

export const SAVE_KEY = "fache_save_v1";
const ACTIVE_BEATS = ["talk", "research", "arrange", "storm", "reveal", "score"];

export const OWNER_IDS = ["wing", "jasmine", "fong"];
export const FINALE_MS = 14000;
const EMPTY = {};
export const freshLevel = (ownerId = "wing") => ({
  ownerId, beat: "idle", ribbon: null, conversation: [], chips: [], needs: {}, trust: 0,
  intelSeen: false, intel: null, placements: {}, preStorm: null, score: null,
});

const newSession = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`);
export const intelEffects = (lv) => (lv.intelSeen && lv.intel ? lv.intel.cards.flatMap((c) => c.effects) : []);

const AUDIO_KEY = "fache_audio_prefs";
const readAudioPrefs = () => {
  try { return { music: true, sfx: true, ...JSON.parse(localStorage.getItem(AUDIO_KEY) || "{}") }; } catch { return { music: true, sfx: true }; }
};
export const saveAudioPrefs = (p) => localStorage.setItem(AUDIO_KEY, JSON.stringify(p));

const readSave = () => {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { return null; }
};

const transient = () => ({
  camKey: "harbour", flyId: 0, camInstant: true, flying: false, skipFlyToken: 0,
  tutorialStep: -1, kit: null, bubble: null, selected: null, pending: false, meters: null,
  stormStart: 0, stormPhase: "none", countdown: 20, stormBlown: false,
  revealStart: 0, queueSnap: 0, finaleStart: 0, placedFx: null, blownFx: [], scoreOpen: false, menuOpen: false,
  nameError: false, speaking: null, micListening: null, intelLoading: false,
});

let ribbonTiming = null;
let meterSeq = 0;

export const useGame = create((set, get) => ({
  data: null, sessionId: readSave()?.sessionId || newSession(), screen: "start", playerName: "", tutorialDone: false,
  level: freshLevel(), levels: {}, finale: null, completed: {}, hasSave: !!readSave(), lastActivity: Date.now(), micForceUnsupported: false, audioPrefs: readAudioPrefs(), models: {}, assetsLoading: false, queueing: false,
  ...transient(),

  flower: (id) => get().data?.flowers.find((f) => f.id === id),
  owner: () => get().data?.owners[get().level.ownerId],
  setLevel: (patch) => set({ level: { ...get().level, ...patch } }),
  say: (text) => set({ kit: { text, key: Date.now() } }),
  ownerSay: (text, tone = "talk") => {
    const ownerId = get().level.ownerId;
    set({ bubble: { ownerId, text, tone, key: Date.now() } });
    speak(ownerId, text);
  },

  flyTo: (camKey, instant = false) => set({ camKey, camInstant: instant, flyId: get().flyId + 1, flying: !instant }),

  openStall: () => {
    const save = readSave();
    if (!save?.playerName) return set({ screen: "name" });
    const levels = save.levels || {};
    const active = save.activeOwner || save.level?.ownerId || "wing";
    const level = { ...freshLevel(active), ...(levels[active] || save.level) };
    set({ ...transient(), screen: "game", playerName: save.playerName, tutorialDone: true, completed: save.completed || {}, level, levels, finale: save.finale || null, sessionId: save.sessionId || get().sessionId });
    if (save.finale) { get().flyTo("parade", true); return set({ finale: "done" }); }
    if (level.beat === "storm" && level.preStorm) get().setLevel({ placements: { ...level.preStorm } });
    if (ACTIVE_BEATS.includes(level.beat)) {
      get().flyTo(level.beat === "reveal" ? `${active}-wide` : active, true);
      if (level.beat === "reveal") get().beginReveal();
      if (level.beat === "score") set({ scoreOpen: true });
    } else get().flyTo("harbour", true);
    get().refreshMeters();
  },

  submitName: (raw) => {
    const name = raw.trim();
    if (!name) return set({ nameError: true });
    set({ ...transient(), screen: "game", playerName: name, tutorialDone: false, tutorialStep: 0, level: freshLevel(), levels: {}, finale: null, completed: {}, sessionId: newSession() });
    get().flyTo("harbour", true);
  },

  advanceTutorial: () => {
    const lines = get().data?.kit.tutorial || [];
    const next = get().tutorialStep + 1;
    if (next >= lines.length) set({ tutorialStep: -1, tutorialDone: true });
    else set({ tutorialStep: next });
  },

  skip: () => {
    const s = get();
    if (s.flying) set({ skipFlyToken: s.skipFlyToken + 1 });
    if (s.queueing) set({ queueSnap: s.queueSnap + 1, queueing: false });
    if (s.tutorialStep >= 0) set({ tutorialStep: -1, tutorialDone: true, kit: null });
    if (s.finale === "parade") get().endFinale();
    if (s.level.beat === "reveal") get().finishReveal();
    else if (s.level.beat === "storm") get().skipStorm();
  },

  arrived: (key) => {
    const { level } = get();
    if (key === level.ownerId) {
      if (level.beat === "idle") get().beginLevel();
      else if (level.beat === "done") set({ scoreOpen: true });
    }
  },

  switchOwner: (ownerId) => {
    const { level, levels } = get();
    if (level.ownerId === ownerId) return;
    const next = { ...levels, [level.ownerId]: level };
    set({ levels: next, level: next[ownerId] || freshLevel(ownerId), meters: null, placedFx: null, blownFx: [] });
    get().refreshMeters();
  },

  clickTruck: (ownerId) => {
    const s = get();
    if (["storm", "reveal"].includes(s.level.beat) || s.screen !== "game" || s.finale) return;
    if (s.camKey === ownerId && !s.flying) {
      if (s.level.beat === "done") set({ scoreOpen: true });
      return;
    }
    set({ scoreOpen: false, selected: null });
    get().switchOwner(ownerId);
    get().flyTo(ownerId);
  },

  backToHarbour: () => set({ scoreOpen: false, selected: null }) || get().flyTo("harbour"),

  beginLevel: () => {
    const ownerId = get().level.ownerId;
    const owner = get().data.owners[ownerId];
    set({ level: { ...freshLevel(ownerId), beat: "talk", conversation: [{ role: "owner", text: owner.greeting }], chips: owner.initial_chips }, meters: null });
    get().ownerSay(owner.greeting);
  },

  sendMessage: async (raw, opts = {}) => {
    const text = raw.trim();
    const s = get();
    if (!text || s.pending) return;
    const lv = s.level;
    const history = lv.conversation;
    get().setLevel({ conversation: [...history, { role: "player", text }] });
    set({ pending: true });
    let res;
    try {
      res = await api.dialogue({ owner_id: lv.ownerId, message: text, history, revealed: Object.keys(lv.needs), trust: lv.trust, prev_chips: lv.chips }, opts.forceFallback);
    } catch {
      res = { reply: "Aiya, the harbour wind ate your words. Say again, m goi?", chips: lv.chips, needs: {}, trust_delta: 0 };
    }
    const cur = get().level;
    get().setLevel({
      conversation: [...cur.conversation, { role: "owner", text: res.reply }],
      chips: res.chips, needs: { ...cur.needs, ...res.needs }, trust: cur.trust + (res.trust_delta || 0),
    });
    set({ pending: false });
    get().ownerSay(res.reply);
  },

  askMarket: async () => {
    if (get().intelLoading) return;
    let intel = get().level.intel;
    if (!intel) {
      set({ intelLoading: true });
      intel = await api.intel(get().sessionId, get().level.ownerId).catch(() => null);
      set({ intelLoading: false });
      if (!intel) return;
    }
    get().setLevel({ beat: "research", intelSeen: true, intel });
  },
  backToTalk: () => { set({ selected: null }); get().setLevel({ beat: "talk" }); },
  startArranging: () => { get().setLevel({ beat: "arrange" }); get().refreshMeters(); },

  ribbonTiming: () => ribbonTiming,
  refreshMeters: async (newFlower = null) => {
    const lv = get().level;
    const seq = ++meterSeq;
    try {
      const m = await api.evaluate(lv.ownerId, { placements: lv.placements, trust: lv.trust, revealed: Object.keys(lv.needs), intel_seen: lv.intelSeen, intel_effects: intelEffects(lv), new_flower: newFlower });
      if (seq === meterSeq) set({ meters: m });
      if (m.complaint) get().ownerSay(m.complaint, "angry");
    } catch { /* keep last meters */ }
  },

  selectFlower: (id) => set({ selected: get().selected === id ? null : id }),

  canArrange: () => {
    const { level, stormPhase } = get();
    return level.beat === "arrange" || (level.beat === "storm" && stormPhase === "countdown");
  },

  clickSlot: (slot) => {
    const s = get();
    if (!s.canArrange()) return;
    const placements = { ...s.level.placements };
    if (!s.selected) {
      if (!placements[slot]) return;
      delete placements[slot];
      get().setLevel({ placements });
      return get().refreshMeters();
    }
    const f = s.flower(s.selected);
    if (f.slot_only && f.slot_only !== slot) return get().say(s.data.kit.stand_only);
    placements[slot] = f.id;
    if (f.id === "stand") {
      const owner = s.level.ownerId;
      const t0 = performance.now();
      const fallback = s.data.owners[owner]?.ribbon_fallback || null;
      api.ribbon(owner, s.level.conversation).then((r) => r.lines).catch(() => fallback).then((lines) => {
        ribbonTiming = { ms: Math.round(performance.now() - t0) };
        if (get().level.ownerId === owner && Object.values(get().level.placements).includes("stand")) get().setLevel({ ribbon: lines });
      });
    }
    set({ selected: null, placedFx: { slot, key: performance.now() } });
    get().setLevel({ placements, ...(f.id === "stand" ? { ribbon: null } : {}) });
    get().refreshMeters(f.id);
  },

  brace: () => {
    const lv = get().level;
    if (!Object.keys(lv.placements).length) return;
    set({ selected: null, stormStart: 0, stormPhase: "none", stormBlown: false, blownFx: [] });
    get().setLevel({ beat: "storm", preStorm: { ...lv.placements } });
  },

  blowFragile: () => {
    const s = get();
    const placements = { ...s.level.placements };
    const blown = [];
    Object.entries(placements).forEach(([slot, id]) => {
      if (s.flower(id)?.hardiness === "fragile") { blown.push({ slot, id, key: performance.now() + Math.random() }); delete placements[slot]; }
    });
    set({ stormBlown: true, blownFx: blown });
    get().setLevel({ placements });
    get().refreshMeters();
  },

  skipStorm: () => {
    const { stormStart } = get();
    const el = performance.now() - stormStart;
    if (el < T.countdown) set({ stormStart: performance.now() - T.countdown });
    else if (el < T.clear) set({ stormStart: performance.now() - T.clear });
    else get().beginReveal();
  },

  beginReveal: async () => {
    set({ revealStart: performance.now(), stormPhase: "none", selected: null, blownFx: [] });
    get().setLevel({ beat: "reveal", score: null });
    get().flyTo(`${get().level.ownerId}-wide`);
    const lv = get().level;
    const body = { ribbon: Object.values(lv.placements).includes("stand") ? lv.ribbon : null, placements: lv.placements, pre_storm: lv.preStorm, trust: lv.trust, revealed: Object.keys(lv.needs), intel_seen: lv.intelSeen, intel_effects: intelEffects(lv) };
    let score = null;
    for (let i = 0; i < 4 && !score; i++) {
      score = await api.score(lv.ownerId, body).catch(() => null);
      if (!score) await new Promise((r) => setTimeout(r, 1200));
    }
    if (!score) return;
    if (get().level.beat !== "reveal" && get().level.beat !== "score") return;
    get().setLevel({ score });
    get().ownerSay(score.reaction, score.reaction_tone);
  },

  finishReveal: () => {
    if (!get().level.score) return;
    if (get().flying) set({ skipFlyToken: get().skipFlyToken + 1 });
    set({ scoreOpen: true, queueSnap: get().queueSnap + 1 });
    get().setLevel({ beat: "score" });
  },

  closeScore: () => {
    const lv = get().level;
    if (!lv.score) return;
    const completed = { ...get().completed, [lv.ownerId]: { stars: lv.score.stars, placements: lv.placements, total: lv.score.receipt.total, ribbon: lv.ribbon } };
    set({ scoreOpen: false, completed });
    get().setLevel({ beat: "done" });
    if (OWNER_IDS.every((o) => completed[o])) get().startFinale();
    else get().flyTo("harbour");
  },

  startFinale: () => {
    set({ finale: "parade", finaleStart: performance.now(), scoreOpen: false, selected: null });
    get().flyTo("parade");
    if (get().data) get().say(get().data.kit.finale);
  },
  endFinale: () => {
    if (get().flying) set({ skipFlyToken: get().skipFlyToken + 1 });
    set({ finale: "done" });
  },

  playAgain: () => {
    const completed = { ...get().completed };
    delete completed[get().level.ownerId];
    set({ scoreOpen: false, completed, meters: null, blownFx: [] });
    get().beginLevel();
    if (get().camKey !== get().level.ownerId) get().flyTo(get().level.ownerId);
  },

  newRun: () => {
    stopVoice();
    localStorage.removeItem(SAVE_KEY);
    set({ ...transient(), screen: "start", playerName: "", tutorialDone: false, level: freshLevel(), levels: {}, finale: null, completed: {}, hasSave: false });
  },
}));

export const T = { t3: 2200, t8: 4400, countdown: 5600, clear: 25600, reveal: 27000 };

useGame.subscribe((s, p) => {
  if (s.screen !== "game") return;
  if (s.level === p.level && s.finale === p.finale && s.completed === p.completed && s.playerName === p.playerName && s.tutorialDone === p.tutorialDone) return;
  localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, sessionId: s.sessionId, playerName: s.playerName, tutorialDone: s.tutorialDone, level: s.level, levels: { ...s.levels, [s.level.ownerId]: s.level }, activeOwner: s.level.ownerId, finale: s.finale === "parade" ? "done" : s.finale, completed: s.completed, savedAt: Date.now() }));
});

const SAMPLE = {
  wing: { roof: "kumquat", awning: "orchid", counter: "ychrys", bumper: "bamboo" },
  jasmine: { roof: "pampas", awning: "orchid", counter: "edible", bumper: "sunflower" },
  fong: { roof: "kumquat", counter: "orchid", bumper: "bamboo", stand: "stand" },
};
const completeTrucks = (ids = OWNER_IDS, stars = 3) => {
  const s = useGame.getState();
  const completed = { ...s.completed };
  ids.forEach((o) => { completed[o] = { stars, placements: SAMPLE[o], total: Object.values(SAMPLE[o]).reduce((t, id) => t + (s.flower(id)?.price || 0), 0), ribbon: o === "fong" ? ["Congratulations on 20 Years!", "二十週年 生意興隆"] : null }; });
  const levels = { ...s.levels };
  ids.forEach((o) => { if (o !== s.level.ownerId) levels[o] = { ...freshLevel(o), beat: "done", placements: SAMPLE[o] }; });
  useGame.setState({ completed, levels, ...(ids.includes(s.level.ownerId) ? { level: { ...s.level, beat: "done", placements: SAMPLE[s.level.ownerId] } } : {}) });
};
if (typeof window !== "undefined") window.__fache = Object.assign(window.__fache || {}, { store: useGame, completeTrucks, startFinale: () => useGame.getState().startFinale() });
