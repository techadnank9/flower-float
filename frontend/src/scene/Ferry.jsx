import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Clickable } from "./Clickable";

const M = ({ c, ...p }) => <meshStandardMaterial color={c} flatShading roughness={0.7} {...p} />;

export function Ferry() {
  const g = useRef();
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    g.current.position.x = ((t * 2.0 + 40) % 160) - 80;
    g.current.position.y = -0.4 + Math.sin(t * 1.4) * 0.12;
    g.current.rotation.z = Math.sin(t * 1.1) * 0.03;
  });
  return (
    <group ref={g} position={[0, -0.4, -27]}>
      <Clickable id="ferry" bubble="Toot toot! 嗚嗚!" bubbleY={4} sparkle>
        <mesh castShadow position={[0, 0.4, 0]}><boxGeometry args={[7, 1, 2.4]} /><M c="#1f6b45" /></mesh>
        <mesh position={[0, 0.95, 0]}><boxGeometry args={[7.05, 0.12, 2.45]} /><M c="#f3efe3" /></mesh>
        <mesh castShadow position={[0, 1.45, 0]}><boxGeometry args={[5.6, 0.9, 2.1]} /><M c="#f3efe3" /></mesh>
        <mesh position={[0, 1.5, 1.07]}><boxGeometry args={[5.2, 0.32, 0.02]} /><meshBasicMaterial color={[2.4, 1.9, 1.1]} toneMapped={false} /></mesh>
        <mesh position={[0, 1.5, -1.07]}><boxGeometry args={[5.2, 0.32, 0.02]} /><meshBasicMaterial color={[2.4, 1.9, 1.1]} toneMapped={false} /></mesh>
        <mesh castShadow position={[0, 2.0, 0]}><boxGeometry args={[6.0, 0.14, 2.4]} /><M c="#1f6b45" /></mesh>
        <mesh castShadow position={[0, 2.35, 0]}><boxGeometry args={[1.6, 0.6, 1.2]} /><M c="#f3efe3" /></mesh>
        <mesh position={[0, 2.8, 0]}><sphereGeometry args={[0.12, 6, 4]} /><meshBasicMaterial color={[3, 0.5, 0.4]} toneMapped={false} /></mesh>
      </Clickable>
    </group>
  );
}
