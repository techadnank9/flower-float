import { useEffect, useRef, useState } from "react";
import { Bike } from "lucide-react";
import { useGame } from "../game/store";
import { unlockAudio } from "../game/voice";
import { MicButton, Waveform } from "./Mic";
import { KitBubble } from "./KitBubble";

export function StartScreen() {
  const openStall = useGame((s) => s.openStall);
  const ready = useGame((s) => !!s.data);
  useEffect(() => {
    if (!ready || window.__fache?.loadTimings) return;
    window.__fache = Object.assign(window.__fache || {}, { loadTimings: { openStallReadyMs: Math.round(performance.now()) } });
    const t = setTimeout(() => import("../game/models").then((m) => m.loadModels()), 200);
    return () => clearTimeout(t);
  }, [ready]);
  return (
    <div className="overlay-screen" data-testid="start-screen">
      <div className="start-card">
        <p className="eyebrow">West Kowloon · Harbourfront · Dusk</p>
        <h1 className="title" data-testid="start-title">FA CHE <span className="title-zh">花車</span></h1>
        <p className="subtitle" data-testid="start-subtitle">The Flower Float</p>
        <button className="btn-primary btn-lg" data-testid="open-stall-button" disabled={!ready} onClick={() => { unlockAudio(); openStall(); }}>
          Open the stall
        </button>
      </div>
    </div>
  );
}

export function NameStep() {
  const [name, setName] = useState("");
  const [heard, setHeard] = useState(null);
  const beforeName = useRef("");
  const listening = useGame((s) => s.micListening === "name");
  const cleanName = (t) => t.replace(/^(my name is|i am|i'm|it's|call me)\s+/i, "").replace(/[.,!?]/g, "").trim().slice(0, 24);
  const submitName = useGame((s) => s.submitName);
  const nameError = useGame((s) => s.nameError);
  const kitLine = useGame((s) => s.data?.kit.name_empty);
  const submit = (e) => { e.preventDefault(); submitName(name); };
  return (
    <div className="overlay-screen" data-testid="name-step">
      <form className="start-card name-card" onSubmit={submit}>
        <p className="eyebrow">Fa Che Florist · Flower Market Road</p>
        <h2 className="panel-heading">What should Kit call you?</h2>
        <div className="composer">
          <input
            className="text-input" data-testid="player-name-input" placeholder="Your name" value={name} maxLength={24} autoFocus
            onChange={(e) => { setName(e.target.value); setHeard(null); }}
          />
          <MicButton
            target="name" testId="name-mic-button"
            onStart={() => { beforeName.current = name; }}
            onCancel={() => setName(beforeName.current)}
            onInterim={(t) => setName(cleanName(t))}
            onFinal={(t) => { const n = cleanName(t); setName(n); setHeard(n); }}
          />
        </div>
        {listening && <Waveform />}
        {heard && <div className="heard-hint" data-testid="name-heard-confirm">Heard "{heard}". Press Let's go to confirm, or edit it.</div>}
        {nameError && (
          <div className="kit-inline" data-testid="name-error-kit-hint"><Bike size={16} /> <b>Kit:</b> {kitLine}</div>
        )}
        <button type="submit" className="btn-primary" data-testid="start-game-button">Let's go</button>
      </form>
      <KitBubble />
    </div>
  );
}
