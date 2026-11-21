import { useEffect } from "react";
import { useGame, T, FINALE_MS } from "./store";
import { api } from "./api";

export function useBoot() {
  useEffect(() => {
    let alive = true;
    const load = (n) => api.gameData().then((d) => alive && useGame.setState({ data: d })).catch(() => n > 0 && setTimeout(() => load(n - 1), 1500));
    load(5);
    return () => { alive = false; };
  }, []);
}

export function useTutorial() {
  const step = useGame((s) => s.tutorialStep);
  useEffect(() => {
    if (step < 0) return;
    const id = setTimeout(() => useGame.getState().advanceTutorial(), 3600);
    return () => clearTimeout(id);
  }, [step]);
}

export function useStormDirector() {
  const beat = useGame((s) => s.level.beat);
  useEffect(() => {
    if (beat !== "storm") return;
    if (!useGame.getState().stormStart) useGame.setState({ stormStart: performance.now(), stormBlown: false });
    const id = setInterval(() => {
      const s = useGame.getState();
      const el = performance.now() - s.stormStart;
      const phase = el < T.t3 ? "t1" : el < T.t8 ? "t3" : el < T.countdown ? "t8" : el < T.clear ? "countdown" : "clear";
      const countdown = phase === "countdown" ? Math.ceil((T.clear - el) / 1000) : phase === "clear" ? 0 : 20;
      if (el >= T.t8 && !s.stormBlown) s.blowFragile();
      if (phase !== s.stormPhase || countdown !== s.countdown) useGame.setState({ stormPhase: phase, countdown });
      if (el >= T.reveal) s.beginReveal();
    }, 100);
    return () => clearInterval(id);
  }, [beat]);
}

export function useRevealDirector() {
  const beat = useGame((s) => s.level.beat);
  const hasScore = useGame((s) => !!s.level.score);
  useEffect(() => {
    if (beat !== "reveal" || !hasScore) return;
    const wait = Math.max(0, 5500 - (performance.now() - useGame.getState().revealStart));
    const id = setTimeout(() => useGame.getState().level.beat === "reveal" && useGame.getState().finishReveal(), wait);
    return () => clearTimeout(id);
  }, [beat, hasScore]);
}

export function useFinaleDirector() {
  const finale = useGame((s) => s.finale);
  useEffect(() => {
    if (finale !== "parade") return;
    const wait = Math.max(0, FINALE_MS - (performance.now() - useGame.getState().finaleStart));
    const id = setTimeout(() => useGame.getState().finale === "parade" && useGame.getState().endFinale(), wait);
    return () => clearTimeout(id);
  }, [finale]);
}

function hintKey(s) {
  if (s.finale) return null;
  if (s.camKey === "harbour") return s.level.beat === "done" ? null : "harbour";
  if (s.scoreOpen) return "score";
  if (s.level.beat === "storm") return s.stormPhase === "countdown" ? "storm" : null;
  return s.level.beat;
}

export function useIdleHints() {
  useEffect(() => {
    const bump = () => useGame.setState({ lastActivity: Date.now() });
    window.addEventListener("pointerdown", bump);
    window.addEventListener("keydown", bump);
    const id = setInterval(() => {
      const s = useGame.getState();
      const busy = s.screen !== "game" || s.flying || s.tutorialStep >= 0 || s.pending || s.level.beat === "reveal";
      if (busy || Date.now() - s.lastActivity < 20000) return;
      const line = s.data?.kit.hints[hintKey(s)];
      if (line) s.say(line);
      useGame.setState({ lastActivity: Date.now() });
    }, 1000);
    return () => { clearInterval(id); window.removeEventListener("pointerdown", bump); window.removeEventListener("keydown", bump); };
  }, []);
}

export const isCinematic = (s) =>
  s.flying || s.queueing || s.finale === "parade" || s.tutorialStep >= 0 || s.level.beat === "reveal" || (s.level.beat === "storm" && s.stormPhase !== "clear");
