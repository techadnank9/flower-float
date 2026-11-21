import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Sparkles } from "@react-three/drei";
import { registry } from "./fx";

const GLOW = "#ffb35c";

function setGlow(root, on) {
  root?.traverse((o) => {
    const m = o.material;
    if (!o.isMesh || !m || !m.emissive) return;
    if (!o.userData.baseEm) { o.userData.baseEm = m.emissive.clone(); o.userData.baseEi = m.emissiveIntensity; }
    if (on) { m.emissive.set(GLOW); m.emissiveIntensity = 0.16; }
    else { m.emissive.copy(o.userData.baseEm); m.emissiveIntensity = o.userData.baseEi; }
  });
}

export function Clickable({ id, anchorY = 1, onClick, children, bubble, bubbleY = 2.4, sparkle = false, wiggle = 0.12, bounce = 0.12, ...props }) {
  const outer = useRef();
  const inner = useRef();
  const [hover, setHover] = useState(false);
  const [fx, setFx] = useState(null);
  const react = useRef(0);

  useEffect(() => { if (id) registry.set(id, { ref: outer, dy: anchorY }); return () => id && registry.delete(id); }, [id, anchorY]);
  useEffect(() => { setGlow(inner.current, hover); }, [hover]);
  useEffect(() => { if (!fx) return; const t = setTimeout(() => setFx(null), 1800); return () => clearTimeout(t); }, [fx]);

  useFrame((st, dt) => {
    const g = inner.current;
    if (!g) return;
    const t = st.clock.elapsedTime;
    const by = hover ? bounce * Math.abs(Math.sin(t * 7)) : 0;
    g.position.y += (by - g.position.y) * Math.min(1, dt * 14);
    const s = hover ? 1.03 : 1;
    g.scale.setScalar(g.scale.x + (s - g.scale.x) * Math.min(1, dt * 10));
    react.current = Math.max(0, react.current - dt * 1.4);
    g.rotation.z = Math.sin(t * 22) * wiggle * react.current;
  });

  const handleClick = (e) => {
    e.stopPropagation();
    react.current = 1;
    const text = typeof bubble === "function" ? bubble() : bubble;
    setFx({ key: Date.now(), text });
    onClick?.(e);
  };

  return (
    <group
      ref={outer}
      {...props}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = "auto"; }}
      onClick={handleClick}
    >
      <group ref={inner}>{children}</group>
      {fx && sparkle && <Sparkles key={fx.key} count={26} scale={[2.4, 2, 2.4]} position={[0, bubbleY * 0.55, 0]} size={5} speed={1.4} color="#ffd36b" />}
      {fx?.text && (
        <Html position={[0, bubbleY, 0]} center zIndexRange={[20, 0]}>
          <div className="react-bubble" data-testid={`reaction-bubble-${id}`}>{fx.text}</div>
        </Html>
      )}
    </group>
  );
}
