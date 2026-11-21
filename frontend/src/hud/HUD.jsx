import { useEffect } from "react";
import { useGame } from "../game/store";
import { useBoot, useTutorial, useStormDirector, useRevealDirector, useIdleHints, useFinaleDirector } from "../game/director";
import { FinalPanel } from "./FinalPanel";
import { StartScreen, NameStep } from "./StartScreen";
import { TopBar } from "./TopBar";
import { KitBubble } from "./KitBubble";
import { TalkPanel } from "./TalkPanel";
import { IntelPanel } from "./IntelPanel";
import { Shelf, ArrangeLeft, BraceButton, Meters } from "./Arrange";
import { StormBanner, ScoreCard } from "./ScoreCard";

function LevelPanels() {
  const beat = useGame((s) => s.level.beat);
  const atWing = useGame((s) => (s.camKey === s.level.ownerId || s.camKey === `${s.level.ownerId}-wide`) && !s.flying);
  const finale = useGame((s) => s.finale);
  const scoreOpen = useGame((s) => s.scoreOpen);
  const phase = useGame((s) => s.stormPhase);
  if (finale === "done") return <FinalPanel />;
  if (finale) return null;
  if (scoreOpen) return <div className="dock-right"><ScoreCard /></div>;
  if (!atWing && beat !== "storm") return null;
  if (beat === "talk") return <div className="dock-left"><TalkPanel /></div>;
  if (beat === "research") return <div className="dock-left"><IntelPanel /></div>;
  if (beat === "arrange") return (
    <>
      <div className="dock-left"><ArrangeLeft /></div>
      <div className="dock-right"><Shelf /></div>
      <BraceButton />
    </>
  );
  if (beat === "storm") return (
    <>
      <StormBanner />
      <div className="dock-left"><Meters /></div>
      <div className="dock-right"><Shelf disabled={phase !== "countdown"} /></div>
    </>
  );
  return null;
}

function AssetLoader() {
  const loading = useGame((s) => s.assetsLoading);
  if (!loading) return null;
  return <div className="asset-loader" data-testid="asset-loading-indicator"><span className="asset-spinner" /> Loading characters…</div>;
}

function Subtitle() {
  const speaking = useGame((s) => s.speaking);
  const names = useGame((s) => s.data?.owners);
  if (!speaking) return null;
  return (
    <div className="subtitle-bar" data-testid="owner-subtitle" key={speaking.key}>
      <span className="subtitle-name">{names?.[speaking.ownerId]?.name}</span> {speaking.text}
    </div>
  );
}

export default function HUD() {
  useBoot();
  useTutorial();
  useStormDirector();
  useRevealDirector();
  useIdleHints();
  useFinaleDirector();
  const screen = useGame((s) => s.screen);
  useEffect(() => { if (screen === "game") import("../game/audio").then((m) => m.startAudio()); }, [screen]);
  if (screen === "start") return <StartScreen />;
  if (screen === "name") return <NameStep />;
  return (
    <div className="hud" data-testid="game-hud">
      <TopBar />
      <LevelPanels />
      <KitBubble />
      <Subtitle />
      <AssetLoader />
    </div>
  );
}
