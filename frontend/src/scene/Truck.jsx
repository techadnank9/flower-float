import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useGame } from "../game/store";
import { TRUCKS, SLOT_POS, SLOT_HIT } from "../game/layout";
import { Clickable } from "./Clickable";
import { Persona } from "./Persona";
import { NeonSign } from "./NeonSign";
import { SlotBouquet, PetalBurst, BlownBouquet } from "./Flowers";
import { FinaleGlow, useParade } from "./Finale";

const NONE = {};
const NO_FX = [];

const M = ({ c, ...p }) => <meshStandardMaterial color={c} flatShading roughness={0.7} {...p} />;
const OWNER_POS = [-1.3, 0, 1.85];

function TruckBody({ t }) {
  return (
    <group>
      {[[-2.5, 0.85], [-2.5, -0.85], [1.9, 0.85], [1.9, -0.85]].map(([x, z]) => (
        <mesh key={`${x}${z}`} castShadow position={[x, 0.38, z * 1.2]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.38, 0.38, 0.28, 10]} /><M c="#1d1d24" /></mesh>
      ))}
      <mesh castShadow receiveShadow position={[0.4, 1.55, 0]}><boxGeometry args={[4.4, 2.3, 2.3]} /><M c={t.body} /></mesh>
      <mesh position={[0.4, 0.62, 0]}><boxGeometry args={[4.42, 0.16, 2.32]} /><M c={t.trim} /></mesh>
      <mesh castShadow position={[-2.6, 1.22, 0]}><boxGeometry args={[1.6, 1.65, 2.2]} /><M c={t.body} /></mesh>
      <mesh position={[-3.3, 1.55, 0]}><boxGeometry args={[0.22, 0.7, 1.9]} /><M c="#7fb7d9" metalness={0.4} roughness={0.2} /></mesh>
      <mesh position={[-3.42, 0.7, 0]}><boxGeometry args={[0.1, 0.25, 2.1]} /><M c="#d9d9d9" metalness={0.6} /></mesh>
      <mesh position={[0.6, 1.62, 1.16]}><boxGeometry args={[2.5, 0.72, 0.04]} /><M c="#3a2012" emissive="#ffb46a" emissiveIntensity={0.55} /></mesh>
      <mesh position={[0.4, 2.73, 0]} receiveShadow><boxGeometry args={[4.5, 0.06, 2.4]} /><M c={t.roof} /></mesh>
      <mesh position={[0.6, 1.24, 1.42]} castShadow><boxGeometry args={[3.0, 0.08, 0.55]} /><M c="#e9dcc4" /></mesh>
      <group position={[0.6, 1.93, 1.5]} rotation={[0.42, 0, 0]}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} castShadow position={[-1.25 + i * 0.5, 0, 0]}><boxGeometry args={[0.5, 0.04, 0.75]} /><M c={t.awning[i % 2]} /></mesh>
        ))}
      </group>
      <mesh castShadow position={[1.8, 3.0, -0.5]}><cylinderGeometry args={[0.1, 0.12, 0.5, 6]} /><M c="#888" metalness={0.5} /></mesh>
    </group>
  );
}

function OwnerBubble({ ownerId }) {
  const bubble = useGame((s) => s.bubble);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!bubble || bubble.ownerId !== ownerId) return;
    setShow(true);
    const id = setTimeout(() => setShow(false), 7000);
    return () => clearTimeout(id);
  }, [bubble, ownerId]);
  if (!show || !bubble) return null;
  return (
    <Html position={[OWNER_POS[0] + 0.6, 4.4, OWNER_POS[2]]} zIndexRange={[20, 0]} style={{ transform: "translate(-50%, -100%)" }}>
      <div className={`owner-bubble tone-${bubble.tone}`} data-testid="owner-speech-bubble">{bubble.text}</div>
    </Html>
  );
}

function Stars({ ownerId }) {
  const stars = useGame((s) => (s.completed[ownerId] && !(s.level.ownerId === ownerId && !["done", "idle"].includes(s.level.beat)) ? s.completed[ownerId].stars : 0));
  if (!stars) return null;
  return (
    <Html position={[0.4, 5.0, 0]} center zIndexRange={[20, 0]}>
      <div className="truck-stars" data-testid={`truck-stars-${ownerId}`}>{"★".repeat(stars)}<span>{"★".repeat(3 - stars)}</span></div>
    </Html>
  );
}

function SlotHit({ slot, active, occupied, onClick }) {
  const mat = useRef();
  const [hover, setHover] = useState(false);
  const { size, offset } = SLOT_HIT[slot];
  useFrame((st) => {
    if (!mat.current) return;
    const t = st.clock.elapsedTime;
    mat.current.opacity = active ? 0.13 + Math.sin(t * 5) * 0.06 + (hover ? 0.16 : 0) : hover && occupied ? 0.14 : 0;
  });
  return (
    <mesh
      position={offset}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = "auto"; }}
    >
      <boxGeometry args={size} />
      <meshBasicMaterial ref={mat} color={active ? [2.4, 1.5, 0.5] : [2, 0.6, 0.6]} transparent opacity={0} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function Dressing({ ownerId }) {
  const active = useGame((s) => s.level.ownerId === ownerId);
  const placements = useGame((s) => (s.level.ownerId === ownerId && !["idle", "done"].includes(s.level.beat) ? s.level.placements : s.completed[ownerId]?.placements || (s.level.ownerId === ownerId ? s.level.placements : NONE)));
  const ribbon = useGame((s) => (s.level.ownerId === ownerId && s.level.beat !== "done" ? s.level.ribbon : s.completed[ownerId]?.ribbon || s.level.ribbon));
  const selected = useGame((s) => s.selected);
  const arranging = useGame((s) => active && (s.level.beat === "arrange" || (s.level.beat === "storm" && s.stormPhase === "countdown")));
  const placedFx = useGame((s) => (active ? s.placedFx : null));
  const blownFx = useGame((s) => (active ? s.blownFx : NO_FX));
  const clickSlot = useGame((s) => s.clickSlot);
  return Object.keys(SLOT_POS).map((slot, i) => (
    <group key={slot} position={SLOT_POS[slot]}>
      {placements[slot] && <SlotBouquet key={placements[slot]} slot={slot} id={placements[slot]} pop phase={i} ribbon={ribbon} />}
      {placedFx?.slot === slot && <PetalBurst key={placedFx.key} />}
      {blownFx.filter((b) => b.slot === slot).map((b) => <BlownBouquet key={b.key} slot={slot} id={b.id} />)}
      {arranging && <SlotHit slot={slot} active={!!selected} occupied={!!placements[slot]} onClick={() => clickSlot(slot)} />}
    </group>
  ));
}

export function Truck({ ownerId, phase = 0 }) {
  const t = TRUCKS[ownerId];
  const clickTruck = useGame((s) => s.clickTruck);
  const talking = useGame((s) => s.speaking?.ownerId === ownerId);
  const ref = useRef();
  useParade(ref, ownerId, t.pos, t.rotY);
  return (
    <group ref={ref} position={t.pos} rotation={[0, t.rotY, 0]}>
      <FinaleGlow color={t.neon} />
      <Clickable id={`truck-${ownerId}`} onClick={() => clickTruck(ownerId)} wiggle={0.015} bounce={0.07}>
        <TruckBody t={t} />
        <group position={[0.4, 2.42, 1.2]}><NeonSign lines={t.sign} color={t.neon} size={[3.9, 0.6]} intensity={1.3} /></group>
      </Clickable>
      <Clickable id={`owner-${ownerId}`} position={OWNER_POS} onClick={() => clickTruck(ownerId)} bubbleY={2.3}>
        <Persona id={ownerId} look={t.owner} phase={phase} talking={talking} />
      </Clickable>
      <Dressing ownerId={ownerId} />
      <OwnerBubble ownerId={ownerId} />
      <Stars ownerId={ownerId} />
    </group>
  );
}
