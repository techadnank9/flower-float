import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGame } from "../game/store";
import { Character } from "./Character";

function ModelCharacter({ model, phase, wave, talking }) {
  const ref = useRef();
  const obj = useMemo(() => model.clone(true), [model]);
  useFrame((st) => {
    const t = st.clock.elapsedTime + phase;
    const g = ref.current;
    const cyc = t % 6.5;
    const waving = wave && cyc < 1.8;
    g.position.x = Math.sin(t * 0.9) * 0.05;
    g.rotation.z = Math.sin(t * 0.9) * 0.045 + (waving ? Math.sin(cyc * 9) * 0.06 : 0);
    g.rotation.y = waving ? Math.sin(cyc * 4.5) * 0.25 : 0;
    g.position.y = talking ? Math.abs(Math.sin(t * 8.5)) * 0.05 : waving ? Math.abs(Math.sin(cyc * 9)) * 0.03 : 0;
    g.scale.y = talking ? 1 + Math.sin(t * 17) * 0.015 : 1;
  });
  return <group ref={ref} name="glb-character"><primitive object={obj} /></group>;
}

export function Persona({ id, look, phase = 0, wave = true, talking = false }) {
  const model = useGame((s) => s.models?.[id]);
  if (model) return <ModelCharacter model={model} phase={phase} wave={wave} talking={talking} />;
  return <Character look={look} phase={phase} wave={wave} talking={talking} />;
}
