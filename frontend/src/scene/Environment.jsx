import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../game/store";
import { nightFx, stormFx, stormTarget } from "./fx";

const SKY_V = `varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const SKY_F = `uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; uniform float storm; uniform float night; varying vec3 vPos;
void main(){ float h = normalize(vPos).y; vec3 c = mix(horizon, mid, smoothstep(-0.02, 0.16, h)); c = mix(c, top, smoothstep(0.16, 0.55, h));
vec3 s = mix(vec3(0.05,0.055,0.07), vec3(0.13,0.14,0.17), smoothstep(-0.1, 0.5, h)); vec3 n = mix(vec3(0.07,0.06,0.16), vec3(0.01,0.012,0.04), smoothstep(0.0, 0.5, h));
gl_FragColor = vec4(mix(mix(c, s, storm), n, night), 1.0); }`;

export function StormController() {
  const fogRef = useRef();
  useFrame((st, dt) => {
    stormFx.target = stormTarget(useGame.getState().stormPhase);
    stormFx.level += (stormFx.target - stormFx.level) * Math.min(1, dt * 1.6);
    nightFx.level += ((useGame.getState().finale ? 1 : 0) - nightFx.level) * Math.min(1, dt * 1.2);
    const fog = st.scene.fog;
    if (fog) { fog.color.lerpColors(DUSK_FOG, STORM_FOG, stormFx.level); fog.color.lerp(NIGHT_FOG, nightFx.level); }
  });
  return <fogExp2 ref={fogRef} attach="fog" args={["#3a1f45", 0.0105]} />;
}
const DUSK_FOG = new THREE.Color("#3a1f45");
const STORM_FOG = new THREE.Color("#15171d");
const NIGHT_FOG = new THREE.Color("#080a1c");
const SUN_DUSK = new THREE.Color("#ffa062");
const SUN_NIGHT = new THREE.Color("#7f8fe0");

export function Sky() {
  const uniforms = useMemo(() => ({
    top: { value: new THREE.Color("#1a1240") }, mid: { value: new THREE.Color("#8a3768") },
    horizon: { value: new THREE.Color("#ff8a4c") }, storm: { value: 0 }, night: { value: 0 },
  }), []);
  useFrame(() => { uniforms.storm.value = stormFx.level; uniforms.night.value = nightFx.level; });
  return (
    <mesh scale={420} renderOrder={-1}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial vertexShader={SKY_V} fragmentShader={SKY_F} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

export function Lights() {
  const sun = useRef();
  const hemi = useRef();
  const fill = useRef();
  useFrame(() => {
    const k = (1 - stormFx.level * 0.65) * (1 - nightFx.level * 0.75);
    sun.current.color.lerpColors(SUN_DUSK, SUN_NIGHT, nightFx.level);
    sun.current.intensity = 2.1 * k;
    hemi.current.intensity = 1.1 * (1 - stormFx.level * 0.45);
    fill.current.intensity = 0.7 * k;
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={["#8c6bd1", "#5a3326", 1.1]} />
      <directionalLight
        ref={sun} position={[-16, 13, -14]} color="#ffa062" castShadow
        shadow-mapSize={[1536, 1536]} shadow-bias={-0.0006} shadow-normalBias={0.03}
        shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-near={1} shadow-camera-far={60}
      />
      <directionalLight ref={fill} position={[6, 9, 18]} color="#ffcf9e" />
      <pointLight position={[0, 4.2, 1]} color="#ffb056" intensity={14} distance={14} />
      <pointLight position={[-8.5, 4, 1.5]} color="#ff7a3a" intensity={10} distance={12} />
      <pointLight position={[8.5, 4, 1.5]} color="#4af2c5" intensity={8} distance={12} />
    </>
  );
}

export function Water() {
  const ref = useRef();
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(320, 150, 96, 44);
    g.rotateX(-Math.PI / 2);
    g.userData.base = Float32Array.from(g.attributes.position.array);
    return g;
  }, []);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    const amp = 0.22 + stormFx.level * 0.45;
    const pos = geo.attributes.position.array;
    const base = geo.userData.base;
    for (let i = 0; i < pos.length; i += 3) {
      const x = base[i]; const z = base[i + 2];
      pos[i + 1] = amp * (Math.sin(x * 0.17 + t * 0.9) + Math.cos(z * 0.21 + t * 1.15) * 0.8 + Math.sin((x + z) * 0.4 + t * 1.7) * 0.25);
    }
    geo.attributes.position.needsUpdate = true;
  });
  return (
    <mesh ref={ref} geometry={geo} position={[0, -0.75, -82]} receiveShadow>
      <meshStandardMaterial color="#2a3a78" emissive="#120c2e" flatShading roughness={0.35} metalness={0.25} />
    </mesh>
  );
}

export function Ground() {
  const posts = useMemo(() => Array.from({ length: 46 }, (_, i) => -45 + i * 2), []);
  const postRef = useRef();
  useFrame(() => {
    if (postRef.current.userData.done) return;
    const d = new THREE.Object3D();
    posts.forEach((x, i) => { d.position.set(x, 0.5, -6.35); d.updateMatrix(); postRef.current.setMatrixAt(i, d.matrix); });
    postRef.current.instanceMatrix.needsUpdate = true;
    postRef.current.userData.done = true;
  });
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 6.5]}>
        <planeGeometry args={[96, 26]} />
        <meshStandardMaterial color="#6e5662" roughness={0.95} />
      </mesh>
      <mesh receiveShadow position={[0, -0.45, -6.55]}><boxGeometry args={[96, 0.9, 0.4]} /><meshStandardMaterial color="#3d3140" /></mesh>
      <instancedMesh ref={postRef} args={[undefined, undefined, posts.length]} castShadow>
        <boxGeometry args={[0.1, 1, 0.1]} /><meshStandardMaterial color="#c9c2d6" metalness={0.6} roughness={0.4} />
      </instancedMesh>
      <mesh position={[0, 1.0, -6.35]}><boxGeometry args={[92, 0.07, 0.1]} /><meshStandardMaterial color="#e2dcef" metalness={0.6} roughness={0.3} /></mesh>
      <mesh position={[0, 1.0, -6.33]}><boxGeometry args={[92, 0.025, 0.02]} /><meshBasicMaterial color={[1.6, 1.1, 0.6]} toneMapped={false} /></mesh>
    </group>
  );
}
