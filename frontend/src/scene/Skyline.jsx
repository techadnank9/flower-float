import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

function windowTexture() {
  const c = document.createElement("canvas");
  c.width = 64; c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "rgba(0,0,0,0)";
  g.fillRect(0, 0, 64, 128);
  for (let y = 4; y < 124; y += 8) for (let x = 4; x < 60; x += 8) {
    if (Math.random() < 0.55) { g.fillStyle = `rgba(255,${200 + Math.random() * 55},${140 + Math.random() * 90},${0.5 + Math.random() * 0.5})`; g.fillRect(x, y, 5, 4); }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  return t;
}

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

export function Skyline() {
  const bRef = useRef();
  const wRef = useRef();
  const tex = useMemo(windowTexture, []);
  const towers = useMemo(() => {
    seed = 7;
    const out = [];
    for (let x = -110; x < 110; x += 3 + rnd() * 3.5) {
      const center = Math.max(0, 1 - Math.abs(x) / 70);
      const h = 6 + rnd() * 14 + center * 20 * rnd();
      out.push({ x, z: -84 - rnd() * 22, w: 2.6 + rnd() * 4, d: 3 + rnd() * 3, h });
    }
    out.push({ x: -14, z: -82, w: 4.2, d: 4.2, h: 52 });
    out.push({ x: 22, z: -86, w: 3.6, d: 3.6, h: 40 });
    return out;
  }, []);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    const c = new THREE.Color();
    const warm = [[2.2, 1.6, 0.9], [1.4, 1.8, 2.4], [2.4, 1.2, 1.6], [2.0, 2.0, 1.6]];
    towers.forEach((b, i) => {
      d.position.set(b.x, b.h / 2 - 0.5, b.z); d.scale.set(b.w, b.h, b.d); d.updateMatrix();
      bRef.current.setMatrixAt(i, d.matrix);
      bRef.current.setColorAt(i, c.setHSL(0.7 + rnd() * 0.08, 0.35, 0.09 + rnd() * 0.06));
      d.position.set(b.x, b.h / 2 - 0.5, b.z + b.d / 2 + 0.05); d.scale.set(b.w * 0.86, b.h * 0.92, 1); d.updateMatrix();
      wRef.current.setMatrixAt(i, d.matrix);
      wRef.current.setColorAt(i, c.setRGB(...warm[i % warm.length]));
    });
    [bRef, wRef].forEach((r) => { r.current.instanceMatrix.needsUpdate = true; r.current.instanceColor.needsUpdate = true; });
  }, [towers]);
  return (
    <group>
      <instancedMesh ref={bRef} args={[undefined, undefined, towers.length]}>
        <boxGeometry /><meshStandardMaterial flatShading roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={wRef} args={[undefined, undefined, towers.length]}>
        <planeGeometry /><meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} />
      </instancedMesh>
      <mesh position={[-14, 52.5, -82]}><coneGeometry args={[2.2, 5, 4]} /><meshBasicMaterial color={[2.6, 2.0, 1.2]} toneMapped={false} /></mesh>
      <mesh position={[22, 40.5, -86]}><sphereGeometry args={[0.5, 6, 4]} /><meshBasicMaterial color={[3, 0.4, 0.4]} toneMapped={false} /></mesh>
      <mesh position={[0, 10, -84]}><boxGeometry args={[60, 0.15, 0.15]} /><meshBasicMaterial color={[0.6, 2.2, 2.6]} toneMapped={false} /></mesh>
      {[[-70, 34, 46], [-25, 46, 52], [20, 38, 48], [65, 30, 42]].map(([x, h, r]) => (
        <mesh key={x} position={[x, h / 2 - 2, -140]}><coneGeometry args={[r, h, 5]} /><meshStandardMaterial color="#2a1a44" flatShading /></mesh>
      ))}
    </group>
  );
}
