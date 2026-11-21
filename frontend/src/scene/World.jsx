import { Suspense, useEffect, useRef, useState } from "react";
import { useGame } from "../game/store";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { CameraRig } from "./CameraRig";
import { Sky, Lights, Water, Ground, StormController } from "./Environment";
import { Skyline } from "./Skyline";
import { Ferry } from "./Ferry";
import { StringLights } from "./StringLights";
import { Truck } from "./Truck";
import { Cart, Kit } from "./Cart";
import { Crowd } from "./Crowd";
import { Steam, Weather } from "./Steam";
import { HarbourSign } from "./NeonSign";
import { Fireworks } from "./Finale";

function PerfProbe() {
  const gl = useThree((s) => s.gl);
  const stat = useRef({ frames: 0, t0: performance.now(), fps: 0, calls: 0, triangles: 0 });
  useEffect(() => {
    gl.info.autoReset = false;
    window.__fache = Object.assign(window.__fache || {}, { perf: () => ({ ...stat.current, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures }) });
  }, [gl]);
  useFrame(() => {
    const s = stat.current;
    s.calls = gl.info.render.calls; s.triangles = gl.info.render.triangles;
    gl.info.reset();
    s.frames++;
    const now = performance.now();
    if (now - s.t0 > 1000) { s.fps = Math.round((s.frames * 1000) / (now - s.t0)); s.frames = 0; s.t0 = now; }
  }, -100);
  return null;
}

export default function World({ onFail }) {
  const ready = useGame((s) => !!s.data);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!ready || mounted) return;
    const id = setTimeout(() => setMounted(true), 250);
    return () => clearTimeout(id);
  }, [ready, mounted]);
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ fov: 45, near: 0.1, far: 900, position: [0, 8, 20.5] }}
      gl={{ antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      data-testid="game-canvas"
      onCreated={({ gl }) => { if (!gl.getContext()) onFail?.(); }}
    >
      <color attach="background" args={["#1a1240"]} />
      <PerfProbe />
      <StormController />
      <CameraRig />
      {mounted && <Suspense fallback={null}>
        <Sky />
        <Lights />
        <Water />
        <Ground />
        <Skyline />
        <Ferry />
        <StringLights />
        <Truck ownerId="jasmine" phase={0.8} />
        <Truck ownerId="wing" phase={0} />
        <Truck ownerId="fong" phase={2.4} />
        <Cart />
        <Kit />
        <Crowd />
        <Steam />
        <Weather />
        <Fireworks />
        <HarbourSign id="sign-westk" position={[-17.8, 0, -4.4]} rotation={[0, 0.36, 0]} color="#3fe3ff" size={[4.6, 1.3]}
          lines={[{ text: "西九文化區", size: 110, y: 0.33 }, { text: "WEST KOWLOON", size: 72, y: 0.77 }]} />
        <HarbourSign id="sign-harbour" position={[17.8, 0, -4.4]} rotation={[0, -0.36, 0]} color="#ff4f8b" size={[4.6, 1.3]}
          lines={[{ text: "海濱長廊", size: 110, y: 0.33 }, { text: "HARBOURFRONT", size: 72, y: 0.77 }]} />
      </Suspense>}
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={1.05} radius={0.75} />
        <Vignette offset={0.3} darkness={0.55} />
      </EffectComposer>
    </Canvas>
  );
}
