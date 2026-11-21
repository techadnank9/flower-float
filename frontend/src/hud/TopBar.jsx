import { Menu, SkipForward, Anchor, RotateCcw, X, Music, Volume2, VolumeX } from "lucide-react";
import { useGame } from "../game/store";
import { isCinematic } from "../game/director";
import { isTruckKey } from "../game/layout";

export function TopBar() {
  const s = useGame();
  const cinematic = isCinematic(s);
  const atTruck = isTruckKey(s.camKey) && !s.flying;
  const canLeave = atTruck && !["storm", "reveal"].includes(s.level.beat);
  return (
    <div className="top-bar">
      <div className="brand-chip" data-testid="brand-chip">
        <span className="brand-zh">花車</span> FA CHE <span className="brand-sep">·</span>
        <span className="brand-name" data-testid="player-name-display">{s.playerName}</span>
      </div>
      <div className="top-actions">
        {cinematic && (
          <button className="btn-skip" data-testid="skip-cinematic-button" onClick={s.skip}><SkipForward size={15} /> Skip</button>
        )}
        {canLeave && (
          <button className="btn-ghost" data-testid="back-to-harbour-button" onClick={s.backToHarbour}><Anchor size={15} /> Back to harbour</button>
        )}
        <AudioToggles prefs={s.audioPrefs} />
        <div className="menu-wrap">
          <button className="btn-ghost" data-testid="in-game-menu-button" onClick={() => useGame.setState({ menuOpen: !s.menuOpen })}>
            <Menu size={16} /> Menu
          </button>
          {s.menuOpen && (
            <div className="menu-pop" data-testid="in-game-menu">
              <button data-testid="start-new-run-button" onClick={s.newRun}><RotateCcw size={14} /> Start a new run</button>
              <button data-testid="close-menu-button" onClick={() => useGame.setState({ menuOpen: false })}><X size={14} /> Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AudioToggles({ prefs }) {
  const set = (k) => import("../game/audio").then((m) => m.setAudioPref(k, !prefs[k]));
  return (
    <>
      <button className={`btn-icon ${prefs.music ? "" : "is-off"}`} data-testid="music-toggle-button" aria-pressed={prefs.music} data-state={prefs.music ? "on" : "off"}
        title={prefs.music ? "Music on" : "Music off"} onClick={() => set("music")}>
        <Music size={15} />{!prefs.music && <span className="icon-slash" />}
      </button>
      <button className={`btn-icon ${prefs.sfx ? "" : "is-off"}`} data-testid="sfx-toggle-button" aria-pressed={prefs.sfx} data-state={prefs.sfx ? "on" : "off"}
        title={prefs.sfx ? "Sound effects on" : "Sound effects off"} onClick={() => set("sfx")}>
        {prefs.sfx ? <Volume2 size={15} /> : <VolumeX size={15} />}
      </button>
    </>
  );
}
