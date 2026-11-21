import { useState } from "react";
import { Share2, RotateCcw, Sparkles } from "lucide-react";
import { useGame, OWNER_IDS } from "../game/store";

async function shareFloat(setMsg) {
  const canvas = document.querySelector("canvas");
  if (!canvas) return;
  const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
  if (!blob) return setMsg("Could not capture the float");
  window.__fache.lastShare = { width: canvas.width, height: canvas.height, bytes: blob.size };
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "fa-che-float.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  const file = new File([blob], "fa-che-float.png", { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: "My FA CHE 花車 float" }); } catch { /* share cancelled */ }
  }
  setMsg("Saved fa-che-float.png");
}

export function FinalPanel() {
  const completed = useGame((s) => s.completed);
  const owners = useGame((s) => s.data?.owners);
  const newRun = useGame((s) => s.newRun);
  const [msg, setMsg] = useState("");
  const stars = OWNER_IDS.reduce((t, o) => t + (completed[o]?.stars || 0), 0);
  const spend = OWNER_IDS.reduce((t, o) => t + (completed[o]?.total || 0), 0);
  return (
    <div className="hud-panel final-panel" data-testid="final-score-panel">
      <div className="eyebrow"><Sparkles size={12} /> The Flower Float · Finale</div>
      <div className="final-title">Harbour in bloom</div>
      {OWNER_IDS.map((o) => (
        <div key={o} className="final-row" data-testid={`final-stars-${o}`} data-stars={completed[o]?.stars || 0}>
          <span>{owners?.[o]?.truck}</span>
          <span className="st">{"★".repeat(completed[o]?.stars || 0)}<span>{"★".repeat(3 - (completed[o]?.stars || 0))}</span></span>
        </div>
      ))}
      <div className="final-total"><span>Total stars</span><span data-testid="final-total-stars">{stars} / 9</span></div>
      <div className="final-total"><span>Total spend</span><span data-testid="final-total-spend">HK${spend}</span></div>
      {msg && <div className="heard-hint" data-testid="share-status">{msg}</div>}
      <div className="row-actions">
        <button className="btn-ghost" data-testid="share-float-button" onClick={() => shareFloat(setMsg)}><Share2 size={15} /> Share your float</button>
        <button className="btn-primary" data-testid="final-play-again-button" onClick={newRun}><RotateCcw size={15} /> Play again</button>
      </div>
    </div>
  );
}
