import { useEffect, useRef } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import { useGame } from "../game/store";
import { getAnalyser, isSimulated, micSupported, registerMicTarget, startMic, stopMic } from "../game/mic";

export function Waveform() {
  const ref = useRef();
  useEffect(() => {
    let raf;
    const data = new Uint8Array(128);
    const draw = () => {
      const c = ref.current;
      if (!c) return;
      const g = c.getContext("2d");
      const an = getAnalyser();
      if (an) an.getByteTimeDomainData(data);
      g.clearRect(0, 0, c.width, c.height);
      const bars = 32;
      const t = performance.now() / 1000;
      for (let i = 0; i < bars; i++) {
        let v;
        if (an) { let m = 0; for (let k = 0; k < 4; k++) m = Math.max(m, Math.abs(data[i * 4 + k] - 128)); v = Math.min(1, 0.06 + m / 64); }
        else v = isSimulated() ? 0.15 + Math.abs(Math.sin(t * 9 + i * 0.7)) * 0.7 * Math.abs(Math.sin(t * 2.3 + i)) : 0.08;
        const h = v * c.height;
        g.fillStyle = `hsl(${185 + i * 2}, 95%, ${55 + v * 20}%)`;
        g.fillRect(i * (c.width / bars) + 1, (c.height - h) / 2, c.width / bars - 2, h);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} width={220} height={34} className="waveform" data-testid="mic-waveform" />;
}

export function MicButton({ target, onInterim, onFinal, onCancel, onStart, disabled, testId }) {
  const listening = useGame((s) => s.micListening === target);
  useGame((s) => s.micForceUnsupported);
  const handlers = useRef({});
  handlers.current = { onInterim, onFinal, onCancel, onStart };
  useEffect(() => registerMicTarget(target, {
    onInterim: (t) => handlers.current.onInterim?.(t),
    onFinal: (t) => handlers.current.onFinal?.(t),
    onCancel: (r) => handlers.current.onCancel?.(r),
    onStart: () => handlers.current.onStart?.(),
  }), [target]);
  const supported = micSupported();
  const off = !supported || (disabled && !listening);
  const title = !supported ? "Mic not available in this browser" : listening ? "Stop listening" : "Speak";
  return (
    <span className="mic-wrap" title={title} data-testid={`${testId}-wrap`}>
      <button
        type="button" className={`btn-mic ${listening ? "is-listening" : ""}`} data-testid={testId} disabled={off} title={title} aria-label={title}
        data-listening={listening} onClick={() => (listening ? stopMic() : startMic(target))}
      >
        {!supported ? <MicOff size={16} /> : listening ? <Square size={14} /> : <Mic size={16} />}
      </button>
    </span>
  );
}
