import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TRUCKS } from "../game/layout";
import { stormFx } from "./fx";

const PER = 6;
const EMITTERS = Object.values(TRUCKS).map((t) => new THREE.Vector3(1.8, 3.3, -0.5).applyEuler(new THREE.Euler(0, t.rotY, 0)).add(new THREE.Vector3(...t.pos)));

export function Steam() {
  const ref = useRef();
  const d = useMemo(() => new THREE.Object3D(), []);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    EMITTERS.forEach((e, ei) => {
      for (let i = 0; i < PER; i++) {
        const k = ((t / 2.6 + i / PER + ei * 0.17) % 1);
        const s = Math.sin(k * Math.PI) * 0.38 + 0.05;
        d.position.set(e.x + Math.sin(k * 5 + i) * 0.18 + k * 0.4, e.y + k * 1.7, e.z);
        d.scale.setScalar(s);
        d.updateMatrix();
        ref.current.setMatrixAt(ei * PER + i, d.matrix);
      }
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, EMITTERS.length * PER]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#f4ecf7" transparent opacity={0.42} depthWrite={false} flatShading />
    </instancedMesh>
  );
}

const RAIN = 1100;
const WIND = 80;

export function Weather() {
  const rain = useRef();
  const wind = useRef();
  const data = useMemo(() => {
    const r = new Float32Array(RAIN * 6);
    const seeds = Array.from({ length: RAIN }, () => [Math.random() * 44 - 22, Math.random() * 14, Math.random() * 30 - 12]);
    const w = new Float32Array(WIND * 6);
    const wseeds = Array.from({ length: WIND }, () => [Math.random() * 50 - 25, 0.5 + Math.random() * 6, Math.random() * 26 - 10, 1 + Math.random()]);
    return { r, seeds, w, wseeds };
  }, []);
  useFrame((st) => {
    const lvl = stormFx.level;
    rain.current.visible = wind.current.visible = lvl > 0.02;
    if (lvl <= 0.02) return;
    const t = st.clock.elapsedTime;
    const { r, seeds, w, wseeds } = data;
    seeds.forEach(([x, y, z], i) => {
      const yy = 14 - ((14 - y + t * 16) % 14);
      const xx = x + (14 - yy) * 0.35;
      r.set([xx, yy, z, xx + 0.12, yy - 0.55, z], i * 6);
    });
    wseeds.forEach(([x, y, z, sp], i) => {
      const xx = ((x + t * 22 * sp + 25) % 50) - 25;
      w.set([xx, y + Math.sin(t * 3 + i) * 0.2, z, xx + 1.6, y, z], i * 6);
    });
    rain.current.geometry.attributes.position.needsUpdate = true;
    wind.current.geometry.attributes.position.needsUpdate = true;
    rain.current.material.opacity = 0.55 * lvl;
    wind.current.material.opacity = 0.45 * lvl;
  });
  return (
    <group>
      <lineSegments ref={rain} frustumCulled={false}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[data.r, 3]} /></bufferGeometry>
        <lineBasicMaterial color="#bcd3ff" transparent depthWrite={false} />
      </lineSegments>
      <lineSegments ref={wind} frustumCulled={false}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[data.w, 3]} /></bufferGeometry>
        <lineBasicMaterial color="#ffffff" transparent depthWrite={false} />
      </lineSegments>
    </group>
  );
}
