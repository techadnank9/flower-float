import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { loadSignFonts, makeTextTexture, neonColor } from "./fx";
import { Clickable } from "./Clickable";

export function NeonSign({ lines, color, size = [3.6, 0.6], intensity = 2.6, board = "#140f22", flicker }) {
  const [tex, setTex] = useState(null);
  const mat = useRef();
  const base = useMemo(() => neonColor(color, intensity), [color, intensity]);
  const key = lines.map((l) => l.text).join("|");
  useEffect(() => {
    let alive = true;
    const h = Math.round((1024 * size[1]) / size[0]);
    loadSignFonts(lines.map((l) => l.text)).then(() => {
      if (alive) setTex(makeTextTexture(lines.map((l) => ({ ...l, size: (l.size * h) / 256 })), 1024, h));
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useFrame((st) => {
    if (!mat.current) return;
    const t = st.clock.elapsedTime;
    const on = flicker?.current > performance.now() ? (Math.sin(t * 60) > 0 ? 1.3 : 0.15) : 1 + Math.sin(t * 2.3) * 0.04;
    mat.current.color.copy(base).multiplyScalar(on);
  });
  return (
    <group>
      {board && (
        <mesh castShadow>
          <boxGeometry args={[size[0] + 0.12, size[1] + 0.12, 0.05]} />
          <meshStandardMaterial color={board} roughness={0.9} />
        </mesh>
      )}
      {tex && (
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={size} />
          <meshBasicMaterial ref={mat} map={tex} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

export function HarbourSign({ id, lines, color, size, ...props }) {
  const flicker = useRef(0);
  return (
    <Clickable id={id} sparkle bubbleY={size[1] + 2.6} onClick={() => { flicker.current = performance.now() + 900; }} {...props}>
      <mesh castShadow position={[-size[0] / 2 + 0.2, 1.1, -0.1]}><cylinderGeometry args={[0.07, 0.09, 2.2, 6]} /><meshStandardMaterial color="#2a2438" /></mesh>
      <mesh castShadow position={[size[0] / 2 - 0.2, 1.1, -0.1]}><cylinderGeometry args={[0.07, 0.09, 2.2, 6]} /><meshStandardMaterial color="#2a2438" /></mesh>
      <group position={[0, 2.2 + size[1] / 2, 0]}><NeonSign lines={lines} color={color} size={size} flicker={flicker} intensity={1.7} /></group>
    </Clickable>
  );
}
