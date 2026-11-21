import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

const M = ({ c, ...p }) => <meshStandardMaterial color={c} flatShading roughness={0.75} {...p} />;

function Hat({ type, color, band }) {
  if (type === "chef") return (
    <group position={[0, 1.66, 0]}>
      <mesh castShadow position={[0, 0.12, 0]}><cylinderGeometry args={[0.2, 0.22, 0.26, 8]} /><M c={color} /></mesh>
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.225, 0.225, 0.07, 8]} /><M c={band} /></mesh>
      <mesh castShadow position={[0, 0.3, 0]}><icosahedronGeometry args={[0.2, 0]} /><M c={color} /></mesh>
    </group>
  );
  if (type === "bucket") return (
    <group position={[0, 1.64, 0]}>
      <mesh castShadow position={[0, 0.08, 0]}><cylinderGeometry args={[0.17, 0.23, 0.18, 8]} /><M c={color} /></mesh>
      <mesh castShadow><cylinderGeometry args={[0.33, 0.33, 0.03, 10]} /><M c={color} /></mesh>
    </group>
  );
  if (type === "scarf") return (
    <group position={[0, 1.54, 0]}>
      <mesh castShadow position={[0, 0.04, -0.02]}><sphereGeometry args={[0.24, 8, 6, 0, Math.PI * 2, 0, Math.PI / 1.8]} /><M c={color} /></mesh>
      <mesh castShadow position={[0, 0.16, -0.2]}><icosahedronGeometry args={[0.11, 0]} /><M c="#2b1d14" /></mesh>
    </group>
  );
  return (
    <group position={[0, 1.55, 0]}>
      <mesh castShadow><sphereGeometry args={[0.26, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} /><M c={color} metalness={0.2} /></mesh>
      <mesh position={[0, -0.02, 0.2]}><boxGeometry args={[0.36, 0.08, 0.1]} /><M c="#1b263b" /></mesh>
    </group>
  );
}

export function Character({ look, phase = 0, wave = true, talking = false }) {
  const mouth = useRef();
  const head = useRef();
  const body = useRef();
  const armR = useRef();
  const armL = useRef();
  useFrame((st) => {
    const t = st.clock.elapsedTime + phase;
    body.current.position.x = Math.sin(t * 0.9) * 0.05;
    body.current.rotation.z = Math.sin(t * 0.9) * 0.045;
    const cyc = t % 6.5;
    const waving = wave && cyc < 1.8;
    const target = waving ? 2.7 + Math.sin(cyc * 11) * 0.35 : 0.12;
    armR.current.rotation.z += (target - armR.current.rotation.z) * 0.12;
    armL.current.rotation.z = -0.12 - Math.sin(t * 0.9) * 0.05;
    const talk = talking ? Math.abs(Math.sin(t * 17)) : 0;
    body.current.position.y = talking ? Math.abs(Math.sin(t * 8.5)) * 0.05 : 0;
    mouth.current.scale.y = 1 + talk * 4;
    head.current.rotation.x = talking ? Math.sin(t * 8.5) * 0.08 : 0;
  });
  const { skin, shirt, apron, pants, hat, hatColor, band = "#333" } = look;
  return (
    <group ref={body}>
      {[-0.11, 0.11].map((x) => (
        <mesh key={x} castShadow position={[x, 0.35, 0]}><boxGeometry args={[0.15, 0.7, 0.17]} /><M c={pants} /></mesh>
      ))}
      <mesh castShadow position={[0, 0.98, 0]}><boxGeometry args={[0.5, 0.62, 0.3]} /><M c={shirt} /></mesh>
      <mesh position={[0, 0.88, 0.16]}><boxGeometry args={[0.44, 0.58, 0.03]} /><M c={apron} /></mesh>
      <mesh position={[0, 1.16, 0.15]}><boxGeometry args={[0.2, 0.04, 0.02]} /><M c={apron} /></mesh>
      <group ref={armR} position={[0.31, 1.24, 0]}>
        <mesh castShadow position={[0, -0.25, 0]}><boxGeometry args={[0.13, 0.5, 0.14]} /><M c={shirt} /></mesh>
        <mesh position={[0, -0.53, 0]}><icosahedronGeometry args={[0.07, 0]} /><M c={skin} /></mesh>
      </group>
      <group ref={armL} position={[-0.31, 1.24, 0]}>
        <mesh castShadow position={[0, -0.25, 0]}><boxGeometry args={[0.13, 0.5, 0.14]} /><M c={shirt} /></mesh>
        <mesh position={[0, -0.53, 0]}><icosahedronGeometry args={[0.07, 0]} /><M c={skin} /></mesh>
      </group>
      <group ref={head} position={[0, 1.47, 0]}>
        <mesh castShadow><icosahedronGeometry args={[0.22, 1]} /><M c={skin} /></mesh>
        {[-0.08, 0.08].map((x) => (
          <mesh key={x} position={[x, 0.03, 0.2]}><boxGeometry args={[0.04, 0.05, 0.02]} /><meshBasicMaterial color="#1a1a1a" /></mesh>
        ))}
        <mesh ref={mouth} position={[0, -0.09, 0.205]}><boxGeometry args={[0.1, 0.018, 0.02]} /><meshBasicMaterial color="#5a1414" /></mesh>
        <group position={[0, -1.47, 0]}><Hat type={hat} color={hatColor} band={band} /></group>
      </group>
    </group>
  );
}
