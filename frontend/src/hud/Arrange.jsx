import { CloudLightning, MessageCircle, Store } from "lucide-react";
import { useGame } from "../game/store";
import { FLOWER_LOOK } from "../game/layout";
import { Notebook } from "./TalkPanel";

function badgesFor(flower, intel) {
  if (!intel) return [];
  return intel.cards.flatMap((c) => c.effects).filter((e) => {
    const t = e.target || {};
    return (t.hardiness || []).includes(flower.hardiness) || (t.ids || []).includes(flower.id) || flower.tags.some((g) => (t.tags || []).includes(g));
  }).map((e) => e.badge);
}

export function Shelf({ disabled }) {
  const flowers = useGame((s) => s.data.flowers);
  const selected = useGame((s) => s.selected);
  const select = useGame((s) => s.selectFlower);
  const intel = useGame((s) => (s.level.intelSeen ? s.level.intel : null));
  return (
    <div className={`hud-panel shelf ${disabled ? "is-disabled" : ""}`} data-testid="flower-shelf">
      <div className="panel-head"><div className="panel-heading">Flower shelf</div><span className="panel-sub">{selected ? "Now click a glowing slot" : "Pick a flower"}</span></div>
      <div className="shelf-list">
        {flowers.map((f) => (
          <button key={f.id} className={`shelf-item ${selected === f.id ? "is-selected" : ""}`} data-testid={`shelf-flower-${f.id}`} disabled={disabled} onClick={() => select(f.id)}>
            <span className="swatch" style={{ background: FLOWER_LOOK[f.id].bloom[0] }} />
            <span className="shelf-main">
              <span className="shelf-name">{f.name} <span className="zh">{f.zh}</span></span>
              <span className="shelf-meta" data-testid={`shelf-flower-${f.id}-meta`}>HK${f.price} · {f.meaning} · <b className={`hard-${f.hardiness}`}>{f.hardiness}</b>{f.slot_only && " · stand slot only"}</span>
              {badgesFor(f, intel).map((b) => <span key={b} className="badge" data-testid={`shelf-badge-${f.id}`}>{b}</span>)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Bar({ id, label, value }) {
  return (
    <div className="meter" data-testid={`meter-${id}`}>
      <div className="meter-row"><span>{label}</span><span data-testid={`meter-${id}-value`}>{value}</span></div>
      <div className="meter-bar"><div className={`meter-fill fill-${id}`} style={{ width: `${value}%` }} /></div>
    </div>
  );
}

export function Meters() {
  const m = useGame((s) => s.meters);
  const spent = m?.spent ?? 0;
  const over = !!m?.over_budget;
  return (
    <div className="hud-panel meters" data-testid="live-meters">
      <div className={`budget ${over ? "is-over" : ""}`} data-testid="meter-budget">
        <span>Budget</span>
        <span className="budget-value" data-testid="meter-budget-value">HK${spent} / {m?.budget ? `HK$${m.budget}` : "?"}</span>
      </div>
      <Bar id="luck" label="Luck" value={m?.luck ?? 0} />
      <Bar id="crowd" label="Crowd" value={m?.crowd ?? 0} />
      <Bar id="storm-proof" label="Storm Proof" value={m?.storm ?? 0} />
    </div>
  );
}

export function ArrangeLeft() {
  const back = useGame((s) => s.backToTalk);
  const market = useGame((s) => s.askMarket);
  return (
    <div className="left-stack">
      <Meters />
      <Notebook />
      <div className="row-actions">
        <button className="btn-ghost" data-testid="arrange-talk-button" onClick={back}><MessageCircle size={15} /> Talk</button>
        <button className="btn-ghost" data-testid="arrange-market-button" onClick={market}><Store size={15} /> Market intel</button>
      </div>
    </div>
  );
}

export function BraceButton() {
  const count = useGame((s) => Object.keys(s.level.placements).length);
  const brace = useGame((s) => s.brace);
  return (
    <div className="bottom-dock">
      <button className="btn-storm" data-testid="brace-storm-button" disabled={count === 0} onClick={brace}>
        <CloudLightning size={18} /> Brace for the storm
      </button>
    </div>
  );
}
