import { useGame } from "../game/store";
import { CART_POS, KIT_POS, KIT_LOOK } from "../game/layout";
import { Clickable } from "./Clickable";
import { Persona } from "./Persona";
import { NeonSign } from "./NeonSign";
import { Bouquet } from "./Flowers";
import { useRef } from "react";
import { useParade } from "./Finale";

const M = ({ c, ...p }) => <meshStandardMaterial color={c} flatShading roughness={0.75} {...p} />;
const CART_FLOWERS = ["peony", "sunflower", "peach", "orchid", "ychrys", "bamboo", "kumquat", "lily"].map((id, i) => ({ id, at: [-0.9 + (i % 4) * 0.6, 1.36, i < 4 ? 0.25 : -0.25], scale: 1.05 }));

export function Cart() {
  const ref = useRef();
  useParade(ref, "cart", CART_POS, 0.28);
  return (
    <group ref={ref} position={CART_POS} rotation={[0, 0.28, 0]}>
      <Clickable id="cart" sparkle bubble="Fa Che Florist, three generations on Flower Market Road!" bubbleY={3.4}>
        <mesh castShadow receiveShadow position={[0, 0.95, 0]}><boxGeometry args={[2.6, 0.7, 1.3]} /><M c="#9c5b34" /></mesh>
        <mesh position={[0, 0.62, 0.66]}><boxGeometry args={[2.62, 0.1, 0.02]} /><M c="#f5c242" /></mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} castShadow position={[s * 0.75, 0.48, 0.72]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.46, 0.46, 0.1, 12]} /><M c="#3b2a20" /></mesh>
        ))}
        {[[-1.2, 0.6], [1.2, 0.6], [-1.2, -0.6], [1.2, -0.6]].map(([x, z]) => (
          <mesh key={`${x}${z}`} castShadow position={[x, 1.75, z]}><cylinderGeometry args={[0.04, 0.04, 1.6, 5]} /><M c="#5b3a22" /></mesh>
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} castShadow position={[-1.17 + i * 0.47, 2.6, 0]} rotation={[0, 0, 0]}><boxGeometry args={[0.47, 0.08, 1.55]} /><M c={i % 2 ? "#fff3dc" : "#d6283a"} /></mesh>
        ))}
        {CART_FLOWERS.map((f, i) => (
          <mesh key={i} castShadow position={[f.at[0], 1.42, f.at[2]]}><cylinderGeometry args={[0.16, 0.12, 0.28, 7]} /><M c="#4a6fa5" metalness={0.3} /></mesh>
        ))}
        <Bouquet items={CART_FLOWERS.map((f) => ({ ...f, at: [f.at[0], 1.5, f.at[2]] }))} phase={2} />
        <group position={[0, 2.98, 0.6]}>
          <NeonSign lines={[{ text: "花車", size: 150, y: 0.38 }, { text: "FA CHE FLORIST", size: 62, y: 0.82 }]} color="#ff5fa2" size={[2.5, 0.78]} />
        </group>
      </Clickable>
    </group>
  );
}

function Scooter() {
  return (
    <group>
      <mesh castShadow position={[0, 0.5, 0]}><boxGeometry args={[0.5, 0.35, 1.4]} /><M c="#17a2b8" /></mesh>
      <mesh castShadow position={[0, 0.78, -0.25]}><boxGeometry args={[0.42, 0.12, 0.6]} /><M c="#1d1d24" /></mesh>
      <mesh castShadow position={[0, 0.95, 0.62]} rotation={[0.25, 0, 0]}><boxGeometry args={[0.45, 0.8, 0.12]} /><M c="#17a2b8" /></mesh>
      <mesh position={[0, 1.38, 0.68]}><boxGeometry args={[0.7, 0.05, 0.05]} /><M c="#333" /></mesh>
      <mesh position={[0, 1.12, 0.76]}><sphereGeometry args={[0.07, 6, 4]} /><meshBasicMaterial color={[2.8, 2.6, 1.6]} toneMapped={false} /></mesh>
      {[-0.55, 0.6].map((z) => (
        <mesh key={z} castShadow position={[0, 0.22, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.22, 0.22, 0.14, 10]} /><M c="#111" /></mesh>
      ))}
      <mesh castShadow position={[0, 1.1, -0.55]}><boxGeometry args={[0.6, 0.5, 0.5]} /><M c="#ff9f1c" /></mesh>
    </group>
  );
}

export function Kit() {
  const kit = useGame((s) => s.data?.kit);
  const pick = () => kit?.reactions[Math.floor(Math.random() * kit.reactions.length)];
  return (
    <group position={KIT_POS} rotation={[0, 0.35, 0]}>
      <Clickable id="kit" bubble={pick} bubbleY={2.3}>
        <Persona id="kit" look={KIT_LOOK} phase={1.7} />
      </Clickable>
      <group position={[0.95, 0, -0.1]} rotation={[0, -0.2, 0]}><Scooter /></group>
    </group>
  );
}
