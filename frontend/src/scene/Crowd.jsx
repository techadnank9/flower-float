import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../game/store";
import { TRUCKS } from "../game/layout";

const N = 40;
const LOCAL_Q = Array.from({ length: 5 }, (_, i) => (i < 3 ? [1.0, 0, 2.25 + i * 0.62] : [1.0 + (i - 2) * 0.62, 0, 3.5]));
const QUEUES = Object.fromEntries(Object.entries(TRUCKS).map(([k, t]) => [k, LOCAL_Q.map((p) => new THREE.Vector3(...p).applyEuler(new THREE.Euler(0, t.rotY, 0)).add(new THREE.Vector3(...t.pos)))]));
const LOOKS = [
  { shirts: ["#ff6b6b", "#ffd166", "#06d6a0", "#4cc9f0", "#f78c6b"], legs: "#c9b79c", hat: "#f1e3b5", bag: "#3a86ff", hatOn: 1 },
  { shirts: ["#2b2d42", "#3d405b", "#22333b", "#4a4e69"], legs: "#1b1b1f", hat: "#000", bag: "#6b4226", hatOn: 0 },
  { shirts: ["#f8f9fa", "#edf2f4"], legs: "#1d3557", hat: "#1d3557", bag: "#e63946", hatOn: 0.6 },
];
const SKIN = ["#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#ffdbac"];

function makeAgents() {
  let q = 0;
  const list = Array.from({ length: N }, (_, i) => ({
    type: i % 3, x: -24 + Math.random() * 48, z: i % 5 < 3 ? -5.0 - Math.random() * 0.7 : 3.2 + Math.random() * 1.0, back: i % 5 < 3, dir: Math.random() < 0.5 ? 1 : -1,
    speed: 0.9 + Math.random() * 0.7, phase: Math.random() * 6, q: -1, rot: 0,
  }));
  list.forEach((a) => { if (!a.back) a.q = q++; });
  return list;
}

const TMP = { v: new THREE.Vector3(), e: new THREE.Euler(), q: new THREE.Quaternion(), s: new THREE.Vector3(), local: new THREE.Matrix4(), m: new THREE.Matrix4() };

export function Crowd() {
  const refs = { body: useRef(), head: useRef(), legs: useRef(), hat: useRef(), bag: useRef() };
  const agents = useMemo(makeAgents, []);
  const snap = useRef(0);
  const d = useMemo(() => new THREE.Object3D(), []);
  const colored = useRef(false);

  useFrame((st, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const t = st.clock.elapsedTime;
    const s = useGame.getState();
    const slots = [];
    if (!s.finale) {
      Object.keys(TRUCKS).forEach((k) => {
        const stars = s.completed[k]?.stars || (s.level.ownerId === k && ["reveal", "score"].includes(s.level.beat) ? s.level.score?.stars || 0 : 0);
        QUEUES[k].slice(0, [0, 2, 4, 5][stars]).forEach((p) => slots.push([p, TRUCKS[k].pos]));
      });
    }
    const doSnap = s.queueSnap !== snap.current;
    snap.current = s.queueSnap;
    if (!colored.current) {
      const c = new THREE.Color();
      agents.forEach((a, i) => {
        const L = LOOKS[a.type];
        refs.body.current.setColorAt(i, c.set(L.shirts[i % L.shirts.length]));
        refs.head.current.setColorAt(i, c.set(SKIN[i % SKIN.length]));
        refs.hat.current.setColorAt(i, c.set(L.hat));
        refs.bag.current.setColorAt(i, c.set(L.bag));
        refs.legs.current.setColorAt(i * 2, c.set(L.legs));
        refs.legs.current.setColorAt(i * 2 + 1, c.set(L.legs));
      });
      colored.current = true;
    }
    let walkingQueuers = 0;
    agents.forEach((a, i) => {
      const queuer = a.q >= 0 && a.q < slots.length;
      let walking = true;
      if (queuer) {
        const [qp, tp] = slots[a.q];
        const qx = qp.x; const qz = qp.z;
        const dx = qx - a.x; const dz = qz - a.z; const dist = Math.hypot(dx, dz);
        if (doSnap || dist < 0.05) { a.x = qx; a.z = qz; walking = false; a.rot += (Math.atan2(tp[0] - a.x, tp[2] - a.z) - a.rot) * 0.1; }
        else { walkingQueuers++; const step = Math.min(dist, a.speed * 1.3 * dt); a.x += (dx / dist) * step; a.z += (dz / dist) * step; a.rot = Math.atan2(dx, dz); }
      } else {
        const home = a.back ? -5.35 : 3.7;
        if (Math.abs(a.z - home) > 0.6) a.z += (home - a.z) * dt * 0.8;
        a.x += a.dir * a.speed * dt;
        a.rot = a.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        if (a.x > 25) a.x = -25; if (a.x < -25) a.x = 25;
      }
      const ph = t * 8 * a.speed + a.phase;
      const bob = walking ? Math.abs(Math.sin(ph)) * 0.05 : Math.sin(t * 2 + a.phase) * 0.01;
      const swing = walking ? Math.sin(ph) * 0.5 : 0;
      const L = LOOKS[a.type];
      const set = (ref, idx, x, y, z, sx, sy, sz, rx = 0) => {
        d.position.set(a.x, 0, a.z); d.rotation.set(0, a.rot, 0); d.updateMatrix();
        TMP.v.set(x, y + bob, z); TMP.e.set(rx, 0, 0); TMP.q.setFromEuler(TMP.e); TMP.s.set(sx, sy, sz);
        TMP.local.compose(TMP.v, TMP.q, TMP.s);
        ref.current.setMatrixAt(idx, TMP.m.copy(d.matrix).multiply(TMP.local));
      };
      set(refs.body, i, 0, 0.98, 0, 1, 1, 1);
      set(refs.head, i, 0, 1.45, 0, 1, 1, 1);
      set(refs.legs, i * 2, -0.1, 0.6, 0, 1, 1, 1, swing);
      set(refs.legs, i * 2 + 1, 0.1, 0.6, 0, 1, 1, 1, -swing);
      const hatOn = (i * 0.37) % 1 < L.hatOn ? 1 : 0;
      set(refs.hat, i, 0, 1.62, 0, hatOn, hatOn, hatOn);
      if (a.type === 1) set(refs.bag, i, 0.3, 0.7, 0, 0.5, 0.7, 1.1);
      else set(refs.bag, i, 0, 1.0, -0.2, 1, 1, 1);
    });
    const queueing = walkingQueuers > 0 && !s.finale && s.screen === "game";
    if (queueing !== s.queueing) useGame.setState({ queueing });
    Object.values(refs).forEach((r) => { r.current.instanceMatrix.needsUpdate = true; if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true; });
  });

  const mat = <meshStandardMaterial flatShading roughness={0.8} />;
  return (
    <group>
      <instancedMesh ref={refs.body} args={[undefined, undefined, N]} castShadow frustumCulled={false}><boxGeometry args={[0.42, 0.56, 0.26]} />{mat}</instancedMesh>
      <instancedMesh ref={refs.head} args={[undefined, undefined, N]} castShadow frustumCulled={false}><icosahedronGeometry args={[0.17, 0]} />{mat}</instancedMesh>
      <instancedMesh ref={refs.legs} args={[undefined, undefined, N * 2]} castShadow frustumCulled={false}>
        <boxGeometry args={[0.13, 0.6, 0.13]} onUpdate={(g) => g.translate(0, -0.3, 0)} />{mat}
      </instancedMesh>
      <instancedMesh ref={refs.hat} args={[undefined, undefined, N]} frustumCulled={false}><cylinderGeometry args={[0.15, 0.26, 0.1, 8]} />{mat}</instancedMesh>
      <instancedMesh ref={refs.bag} args={[undefined, undefined, N]} castShadow frustumCulled={false}><boxGeometry args={[0.32, 0.36, 0.16]} />{mat}</instancedMesh>
    </group>
  );
}
