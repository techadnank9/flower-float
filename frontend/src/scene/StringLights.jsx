import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Clickable } from "./Clickable";

const F = [[-13, 3.4], [-4.5, 3.4], [4.5, 3.4], [13, 3.4]];
const B = [[-10, -5.8], [0, -6], [10, -5.8]];
const H = 5.4;
const SPANS = [[F[0], F[1]], [F[1], F[2]], [F[2], F[3]], [F[0], B[0]], [F[1], B[0]], [F[1], B[1]], [F[2], B[1]], [F[2], B[2]], [F[3], B[2]], [B[0], B[1]], [B[1], B[2]]];

function spanPoint(a, b, k) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const sag = len * 0.06;
  return new THREE.Vector3(a[0] + (b[0] - a[0]) * k, H - sag * 4 * k * (1 - k), a[1] + (b[1] - a[1]) * k);
}

const LANTERNS = [[0, 0.5], [2, 0.5], [9, 0.5], [10, 0.5]].map(([s, k]) => spanPoint(...SPANS[s], k));
const BULB_COLORS = [[2.6, 1.9, 1.0], [2.6, 1.3, 0.5], [2.6, 0.7, 0.6]];

function Lantern({ pos, i }) {
  const pivot = useRef();
  useFrame((st) => { pivot.current.rotation.z = Math.sin(st.clock.elapsedTime * 1.4 + i) * 0.14; pivot.current.rotation.x = Math.cos(st.clock.elapsedTime * 1.1 + i) * 0.06; });
  return (
    <group position={pos}>
      <group ref={pivot}>
        <Clickable id={`lantern-${i}`} anchorY={-0.82} bubbleY={-1.4} bubble="Swing!" wiggle={0.5} sparkle>
          <mesh position={[0, -0.25, 0]}><cylinderGeometry args={[0.01, 0.01, 0.5, 3]} /><meshStandardMaterial color="#222" /></mesh>
          <mesh position={[0, -0.82, 0]} scale={[1, 1.15, 1]} castShadow><icosahedronGeometry args={[0.32, 1]} /><meshStandardMaterial color="#d81e1e" emissive="#ff3a1a" emissiveIntensity={1.6} flatShading toneMapped={false} /></mesh>
          <mesh position={[0, -0.47, 0]}><cylinderGeometry args={[0.16, 0.16, 0.08, 8]} /><meshStandardMaterial color="#f5c242" metalness={0.6} /></mesh>
          <mesh position={[0, -1.18, 0]}><cylinderGeometry args={[0.16, 0.16, 0.08, 8]} /><meshStandardMaterial color="#f5c242" metalness={0.6} /></mesh>
          <mesh position={[0, -1.38, 0]}><coneGeometry args={[0.06, 0.32, 5]} /><meshStandardMaterial color="#f5c242" /></mesh>
        </Clickable>
      </group>
    </group>
  );
}

export function StringLights() {
  const bulbRef = useRef();
  const { bulbs, wire } = useMemo(() => {
    const bulbs = [];
    const wire = [];
    SPANS.forEach(([a, b]) => {
      const n = Math.max(6, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.65));
      for (let i = 0; i < n; i++) {
        const p = spanPoint(a, b, i / n);
        const q = spanPoint(a, b, (i + 1) / n);
        wire.push(p.x, p.y, p.z, q.x, q.y, q.z);
        if (i > 0) bulbs.push(p.add(new THREE.Vector3(0, -0.08, 0)));
      }
    });
    return { bulbs, wire: new Float32Array(wire) };
  }, []);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    const c = new THREE.Color();
    bulbs.forEach((p, i) => { d.position.copy(p); d.updateMatrix(); bulbRef.current.setMatrixAt(i, d.matrix); bulbRef.current.setColorAt(i, c.setRGB(...BULB_COLORS[i % 3])); });
    bulbRef.current.instanceMatrix.needsUpdate = true;
    bulbRef.current.instanceColor.needsUpdate = true;
  }, [bulbs]);
  return (
    <group>
      {[...F, ...B].map(([x, z]) => (
        <mesh key={`${x}${z}`} castShadow position={[x, H / 2, z]}><cylinderGeometry args={[0.06, 0.09, H, 6]} /><meshStandardMaterial color="#2a2438" metalness={0.4} /></mesh>
      ))}
      <lineSegments>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[wire, 3]} /></bufferGeometry>
        <lineBasicMaterial color="#1a1420" />
      </lineSegments>
      <instancedMesh ref={bulbRef} args={[undefined, undefined, bulbs.length]}>
        <icosahedronGeometry args={[0.07, 0]} /><meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      {LANTERNS.map((p, i) => <Lantern key={i} pos={p} i={i} />)}
    </group>
  );
}
