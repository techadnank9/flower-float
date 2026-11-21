import { Star, Check, X, Minus, RotateCcw, Anchor } from "lucide-react";
import { useGame } from "../game/store";

export function StormBanner() {
  const phase = useGame((s) => s.stormPhase);
  const countdown = useGame((s) => s.countdown);
  if (phase === "none") return null;
  const signal = { t1: "T1", t3: "T3", t8: "T8", countdown: "T8", clear: "T8" }[phase];
  return (
    <div className="storm-banner-wrap">
      <div className={`storm-banner sig-${signal}`} data-testid="typhoon-banner" key={signal}>
        <span className="sig-num" data-testid="typhoon-signal">{signal}</span>
        <span>{phase === "clear" ? "Signal lowered, the sky is clearing" : `Typhoon Signal No. ${signal.slice(1)} ${phase === "t8" ? "· gale winds!" : "hoisted"}`}</span>
      </div>
      {phase === "countdown" && (
        <div className="storm-countdown" data-testid="storm-countdown">Swap in hardy flowers! <b data-testid="storm-countdown-value">{countdown}s</b></div>
      )}
    </div>
  );
}

const Mark = ({ line }) => (line.passed ? <Check size={15} /> : line.partial ? <Minus size={15} /> : <X size={15} />);

export function ScoreCard() {
  const score = useGame((s) => s.level.score);
  const close = useGame((s) => s.closeScore);
  const again = useGame((s) => s.playAgain);
  const owner = useGame((s) => s.data?.owners[s.level.ownerId]);
  if (!score) return null;
  return (
    <div className="hud-panel score-card" data-testid="game-score-card">
      <button className="score-close" data-testid="score-close-button" onClick={close} aria-label="Close"><X size={18} /></button>
      <div className="eyebrow" data-testid="score-owner">{owner?.name} · {owner?.truck}</div>
      <div className="stars" data-testid="score-stars" data-stars={score.stars}>
        {[1, 2, 3].map((n) => <Star key={n} size={34} className={n <= score.stars ? "on" : "off"} />)}
      </div>
      <blockquote className={`reaction tone-${score.reaction_tone}`} data-testid="score-reaction">"{score.reaction}"</blockquote>
      <div className="score-lines">
        {score.lines.map((l) => (
          <div key={l.key} className={`score-line ${l.passed ? "pass" : l.partial ? "partial" : "fail"}`} data-testid={`score-line-${l.key}`} data-passed={l.passed}>
            <span className="mark"><Mark line={l} /></span>
            <span className="score-label">{l.label}</span>
            <span className="score-detail">{l.detail}</span>
          </div>
        ))}
      </div>
      <div className="receipt" data-testid="order-receipt">
        <div className="receipt-title">Order receipt · Fa Che Florist</div>
        {score.receipt.items.map((i) => (
          <div key={i.slot} data-testid={`receipt-item-${i.slot}`}>
            <div className="receipt-row"><span>{i.name} <em>({i.slot})</em></span><span>HK${i.price}</span></div>
            {i.ribbon && <div className="receipt-ribbon" data-testid="receipt-ribbon">Ribbon: “{i.ribbon.join(" / ")}”</div>}
          </div>
        ))}
        <div className="receipt-row total" data-testid="receipt-total"><span>Total</span><span>HK${score.receipt.total}</span></div>
        <div className="receipt-slot" data-testid="receipt-delivery-slot">Delivery: {score.receipt.delivery_slot}</div>
      </div>
      <div className="row-actions">
        <button className="btn-ghost" data-testid="score-back-harbour-button" onClick={close}><Anchor size={15} /> Back to harbour</button>
        <button className="btn-primary" data-testid="play-again-button" onClick={again}><RotateCcw size={15} /> Play again</button>
      </div>
    </div>
  );
}
