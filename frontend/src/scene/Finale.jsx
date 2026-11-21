import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../game/store";

const BURSTS = 7;
const dot = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d");
  const r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.4, "rgba(255,255,255,0.6)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
})();
const PER = 90;
const PALETTE = [[3, 0.6, 0.8], [3, 2.2, 0.6], [0.6, 2.6, 3], [2.2, 0.8, 3], [0.8, 3, 1.4], [3, 1.4, 0.4]];

export function Fireworks() {
  const ref = useRef();
  const { pos, col, dirs, bursts } = useMemo(() => {
    const dirs = Array.from({ length: PER }, () => new THREE.Vector3().randomDirection());
    const bursts = Array.from({ length: BURSTS }, (_, i) => ({ t0: -i * 0.55, center: new THREE.Vector3(), color: PALETTE[i % PALETTE.length], speed: 6 }));
    return { pos: new Float32Array(BURSTS * PER * 3), col: new Float32Array(BURSTS * PER * 3), dirs, bursts };
  }, []);
  useFrame((st) => {
    const on = !!useGame.getState().finale;
    ref.current.visible = on;
    if (!on) return;
    const t = st.clock.elapsedTime;
    bursts.forEach((b, bi) => {
      let age = t - b.t0;
      if (age > 2.4 || age < 0) {
        b.t0 = t + Math.random() * 0.4;
        b.center.set(-45 + Math.random() * 90, 20 + Math.random() * 16, -55 - Math.random() * 20);
        b.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        b.speed = 5 + Math.random() * 4;
        age = 0;
        window.__fache?.audio?.sfx("firework");
      }
      const fade = Math.max(0, 1 - age / 2.4);
      for (let i = 0; i < PER; i++) {
        const o = (bi * PER + i) * 3;
        const d = dirs[i];
        pos[o] = b.center.x + d.x * b.speed * age;
        pos[o + 1] = b.center.y + d.y * b.speed * age - 2.5 * age * age;
        pos[o + 2] = b.center.z + d.z * b.speed * age;
        col[o] = b.color[0] * fade; col[o + 1] = b.color[1] * fade; col[o + 2] = b.color[2] * fade;
      }
    });
    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.geometry.attributes.color.needsUpdate = true;
  });
  return (
    <points ref={ref} frustumCulled={false} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
        <bufferAttribute attach="attributes-color" args={[col, 3]} />
      </bufferGeometry>
      <pointsMaterial map={dot} size={2.6} vertexColors transparent depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

const ORDER = { wing: 0, jasmine: 1, fong: 2, cart: 3 };
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

export function useParade(ref, key, home, homeRot) {
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const s = useGame.getState();
    if (s.finale !== "parade") { g.position.set(...home); g.rotation.y = homeRot; return; }
    const k = (performance.now() - s.finaleStart) / 1000;
    const j = ease(Math.min(1, k / 2));
    const lineX = 6 + ORDER[key] * 8.5;
    g.position.set(home[0] + (lineX - home[0]) * j - Math.max(0, k - 2) * 3, 0, home[2] + (0.8 - home[2]) * j);
    g.rotation.y = homeRot * (1 - j);
  });
}

export function FinaleGlow({ color }) {
  const on = useGame((s) => !!s.finale);
  if (!on) return null;
  const c = new THREE.Color(color).multiplyScalar(3);
  return (
    <group>
      <pointLight position={[0.4, 3.4, 2]} color={color} intensity={18} distance={9} />
      {[[0.4, 2.76, 1.22, 4.5, 0.05, 0.05], [0.4, 2.76, -1.22, 4.5, 0.05, 0.05], [0.4, 0.55, 1.18, 4.4, 0.05, 0.05]].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]}><boxGeometry args={[w, h, d]} /><meshBasicMaterial color={c} toneMapped={false} /></mesh>
      ))}
    </group>
  );
}
