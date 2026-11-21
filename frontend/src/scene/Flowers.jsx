import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FLOWER_LOOK, SLOT_LAYOUT } from "../game/layout";
import { loadSignFonts, makeTextTexture } from "./fx";
import { useEffect, useState } from "react";

const GEO = {
  bloom: new THREE.IcosahedronGeometry(0.09, 0),
  leaf: new THREE.ConeGeometry(0.06, 0.24, 4),
  stalk: new THREE.CylinderGeometry(0.022, 0.028, 0.5, 5),
};

function partsFor(id, at, s, out) {
  const L = FLOWER_LOOK[id];
  const [x, y, z] = at;
  const add = (k, p, sc, c, r = 0) => out[k].push({ p: [x + p[0] * s, y + p[1] * s, z + p[2] * s], s: (Array.isArray(sc) ? sc : [sc, sc, sc]).map((q) => q * s), c, r });
  const col = (i) => L.bloom[i % L.bloom.length];
  if (L.shape === "tree") {
    add("stalk", [0, 0.15, 0], [1.6, 0.6, 1.6], "#6b4226");
    add("bloom", [0, 0.45, 0], [2.7, 2.4, 2.7], L.leaf);
    for (let i = 0; i < 8; i++) { const a = i * 0.785; add("bloom", [Math.cos(a) * 0.22, 0.42 + Math.sin(i * 1.7) * 0.12, Math.sin(a) * 0.22], 0.45, col(i)); }
  } else if (L.shape === "stalk") {
    for (let i = 0; i < 3; i++) { add("stalk", [(i - 1) * 0.08, 0.3 + i * 0.05, 0], [1.2, 1.2 + i * 0.3, 1.2], L.bloom[0]); add("leaf", [(i - 1) * 0.08 + 0.05, 0.6 + i * 0.12, 0], 0.9, L.leaf, -0.9); }
  } else if (L.shape === "plume") {
    for (let i = 0; i < 3; i++) { add("stalk", [(i - 1) * 0.06, 0.25, 0], [0.6, 1.1, 0.6], "#a08a5c", (i - 1) * 0.25); add("leaf", [(i - 1) * 0.18, 0.62, 0], [1.6, 2.4, 1.6], L.bloom[0], (1 - i) * 0.3); }
  } else if (L.shape === "branch") {
    add("stalk", [0, 0.28, 0], [0.9, 1.2, 0.9], L.leaf, 0.2);
    add("stalk", [0.08, 0.38, 0], [0.6, 0.7, 0.6], L.leaf, -0.6);
    for (let i = 0; i < 7; i++) add("bloom", [Math.sin(i * 2.1) * 0.16, 0.25 + i * 0.07, Math.cos(i * 1.3) * 0.08], 0.62, col(i));
  } else if (L.shape === "stand") {
    add("stalk", [-0.28, 0.65, 0], [1.6, 2.7, 1.6], "#8b5a2b", 0.18);
    add("stalk", [0.28, 0.65, 0], [1.6, 2.7, 1.6], "#8b5a2b", -0.18);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; add("bloom", [Math.cos(a) * 0.46, 1.5 + Math.sin(a) * 0.46, 0], 1.25, col(i)); }
    add("bloom", [0, 1.5, 0.02], [3.4, 3.4, 0.5], "#fff4d6");
    add("leaf", [-0.13, 0.95, 0.06], [0.9, 3.2, 0.3], "#e0244a", Math.PI);
    add("leaf", [0.13, 0.95, 0.06], [0.9, 3.2, 0.3], "#f5c242", Math.PI);
  } else {
    [[0, 0.3, 0], [0.12, 0.24, 0.08], [-0.12, 0.24, 0.06], [0.08, 0.26, -0.1], [-0.07, 0.33, -0.06]].forEach((o, i) => add("bloom", o, 1, col(i)));
    for (let i = 0; i < 3; i++) { const a = i * 2.1; add("leaf", [Math.cos(a) * 0.12, 0.12, Math.sin(a) * 0.12], 1, L.leaf, Math.cos(a) * 0.6); }
  }
}

function PartMesh({ geo, list }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    const c = new THREE.Color();
    list.forEach((p, i) => {
      d.position.set(...p.p); d.rotation.set(0, 0, p.r); d.scale.set(...p.s); d.updateMatrix();
      ref.current.setMatrixAt(i, d.matrix);
      ref.current.setColorAt(i, c.set(p.c));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [list]);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, list.length]} castShadow>
      <meshStandardMaterial flatShading roughness={0.6} />
    </instancedMesh>
  );
}

const easeOutBack = (k) => 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2);

export function Bouquet({ items, pop = false, phase = 0, planter = null }) {
  const g = useRef();
  const born = useRef(performance.now());
  const sig = items.map((i) => `${i.id}${i.at}`).join("|");
  const parts = useMemo(() => {
    const out = { bloom: [], leaf: [], stalk: [] };
    items.forEach((it) => partsFor(it.id, it.at, it.scale || 1, out));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    g.current.rotation.z = Math.sin(t * 1.7 + phase) * 0.035;
    g.current.rotation.x = Math.sin(t * 1.3 + phase) * 0.025;
    if (pop) { const k = (performance.now() - born.current) / 260; g.current.scale.setScalar(k >= 1 ? 1 : Math.max(0.01, easeOutBack(k))); }
  });
  return (
    <group ref={g} scale={pop ? 0.01 : 1}>
      {planter && <mesh castShadow receiveShadow position={[0, planter[1] / 2, 0]}><boxGeometry args={planter} /><meshStandardMaterial color="#7a4b2a" flatShading /></mesh>}
      {Object.entries(parts).map(([k, list]) => list.length > 0 && <PartMesh key={`${k}${list.length}`} geo={GEO[k]} list={list} />)}
    </group>
  );
}

export function slotItems(slot, id) {
  const L = SLOT_LAYOUT[slot];
  if (slot === "stand" && id !== "stand") return [{ id, at: [0, 0.35, 0], scale: 1.5 }, { id, at: [0.25, 0.3, 0.1], scale: 1.3 }];
  const y = L.planter ? L.planter[1] : 0;
  return L.xs.map((x) => ({ id, at: [x, y, 0], scale: L.scale }));
}

function RibbonBanner({ lines }) {
  const [tex, setTex] = useState(null);
  const key = lines.join("|");
  useEffect(() => {
    let alive = true;
    loadSignFonts(lines).then(() => alive && setTex(makeTextTexture(lines.map((t, i) => ({ text: t, size: 92, y: 0.3 + i * 0.42, color: "#1a0d05" })), 1024, 256)));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return (
    <group position={[0, 0.72, 0.1]}>
      <mesh><planeGeometry args={[1.6, 0.46]} /><meshStandardMaterial color="#f5d27a" emissive="#3a2200" side={THREE.DoubleSide} /></mesh>
      {tex && <mesh position={[0, 0, 0.005]}><planeGeometry args={[1.56, 0.42]} /><meshBasicMaterial map={tex} transparent depthWrite={false} /></mesh>}
    </group>
  );
}

export function SlotBouquet({ slot, id, pop, phase, ribbon }) {
  const pot = slot === "stand" && id !== "stand" ? [0.6, 0.45, 0.6] : SLOT_LAYOUT[slot].planter;
  return (
    <group>
      <Bouquet items={slotItems(slot, id)} pop={pop} phase={phase} planter={pot} />
      {id === "stand" && ribbon && <RibbonBanner lines={ribbon} />}
    </group>
  );
}

export function PetalBurst({ color = "#ff8fc1" }) {
  const ref = useRef();
  const born = useRef(performance.now());
  const { pos, vel } = useMemo(() => {
    const n = 36;
    const vel = Array.from({ length: n }, () => new THREE.Vector3((Math.random() - 0.5) * 3, 1.5 + Math.random() * 2.5, (Math.random() - 0.5) * 3));
    return { pos: new Float32Array(n * 3), vel };
  }, []);
  const tint = useMemo(() => new THREE.Color(color).multiplyScalar(2.2), [color]);
  useFrame(() => {
    const k = (performance.now() - born.current) / 1000;
    if (!ref.current) return;
    ref.current.visible = k < 1;
    vel.forEach((v, i) => { pos[i * 3] = v.x * k; pos[i * 3 + 1] = 0.3 + v.y * k - 4 * k * k; pos[i * 3 + 2] = v.z * k; });
    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.material.opacity = Math.max(0, 1 - k);
  });
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
      <pointsMaterial size={0.14} color={tint} transparent depthWrite={false} toneMapped={false} />
    </points>
  );
}

export function BlownBouquet({ slot, id }) {
  const g = useRef();
  const born = useRef(performance.now());
  useFrame(() => {
    const k = (performance.now() - born.current) / 2200;
    if (!g.current) return;
    g.current.visible = k < 1;
    g.current.position.set(k * 11, k * 3.5 + Math.sin(k * 12) * 0.3, k * 3);
    g.current.rotation.set(k * 6, k * 4, k * 9);
  });
  return <group ref={g}><SlotBouquet slot={slot} id={id} /></group>;
}
