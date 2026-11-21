import { ExternalLink, CloudRain, PartyPopper, Moon, Flower2, MessageCircle, Radio, Wind } from "lucide-react";
import { useGame } from "../game/store";
import { Notebook } from "./TalkPanel";

const ICON = { weather: CloudRain, event: PartyPopper, festival: Moon };

function IntelCard({ c }) {
  const Icon = ICON[c.id] || CloudRain;
  const live = c.source === "you.com";
  return (
    <div className={`intel-card ${live ? "is-live" : ""}`} data-testid={`intel-card-${c.id}`} data-source={c.source}>
      <div className="intel-kind"><Icon size={14} /> {c.kind}</div>
      <div className="intel-title" data-testid={`intel-title-${c.id}`}>{c.title}</div>
      {c.signal && <div className="intel-signal" data-testid="intel-signal"><Wind size={13} /> Signal No. {c.signal}</div>}
      <p className="intel-body" data-testid={`intel-summary-${c.id}`}>{c.body}</p>
      <div className="intel-effect" data-testid={`intel-effect-text-${c.id}`}>Effect: {c.effect_text}</div>
      <div className="intel-foot">
        {c.effects.map((e) => <span key={e.badge} className="badge" data-testid={`intel-effect-${c.id}`}>{e.badge}</span>)}
      </div>
      <div className="intel-sources">
        {c.sources.map((s, i) => (
          <a key={s.url} href={s.url} target="_blank" rel="noreferrer" data-testid={`intel-source-${c.id}${i ? `-${i}` : ""}`}>{s.name} <ExternalLink size={11} /></a>
        ))}
      </div>
      <div className={`intel-offline ${live ? "live" : ""}`} data-testid={`intel-card-label-${c.id}`}>{c.label}</div>
    </div>
  );
}

export function IntelPanel() {
  const intel = useGame((s) => s.level.intel);
  const start = useGame((s) => s.startArranging);
  const back = useGame((s) => s.backToTalk);
  if (!intel) return null;
  const live = intel.cards.some((c) => c.source === "you.com");
  return (
    <div className="hud-panel intel-panel" data-testid="market-intel-panel" data-source={intel.source}>
      <div className="panel-head">
        <div className="panel-heading">Market Intel</div>
        <span className={`offline-label ${live ? "live" : ""}`} data-testid="intel-panel-label">{live && <Radio size={11} />} {intel.label}</span>
      </div>
      <div className="intel-cards">{intel.cards.map((c) => <IntelCard key={c.id} c={c} />)}</div>
      <div className="row-actions">
        <button className="btn-ghost" data-testid="back-to-talk-button" onClick={back}><MessageCircle size={15} /> Back to talk</button>
        <button className="btn-primary" data-testid="start-arranging-button" onClick={start}><Flower2 size={15} /> Start arranging</button>
      </div>
      <Notebook />
    </div>
  );
}
