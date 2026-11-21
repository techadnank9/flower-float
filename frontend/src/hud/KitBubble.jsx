import { useEffect, useState } from "react";
import { Bike } from "lucide-react";
import { useGame } from "../game/store";

export function KitBubble() {
  const step = useGame((s) => s.tutorialStep);
  const lines = useGame((s) => s.data?.kit.tutorial);
  const name = useGame((s) => s.playerName);
  const kit = useGame((s) => s.kit);
  const advance = useGame((s) => s.advanceTutorial);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!kit) return;
    setVisible(true);
    const id = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(id);
  }, [kit]);

  const tutorial = step >= 0 && lines;
  const text = tutorial ? lines[step].replace("{name}", name) : visible && kit?.text;
  if (!text) return null;
  return (
    <div className={`kit-bubble ${tutorial ? "is-tutorial" : ""}`} data-testid="kit-bubble" key={tutorial ? step : kit?.key} onClick={tutorial ? advance : undefined}>
      <div className="kit-avatar"><Bike size={18} /></div>
      <div>
        <div className="kit-name">Kit {tutorial && <span className="kit-step">{step + 1}/{lines.length} · click to continue</span>}</div>
        <div className="kit-text" data-testid="kit-bubble-text">{text}</div>
      </div>
    </div>
  );
}
