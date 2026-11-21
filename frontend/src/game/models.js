import * as THREE from "three";
import { useGame } from "./store";

const status = { manifest: null, loaded: [], failed: [], done: false };

function normalise(scene) {
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const k = size.y > 0 ? 1.75 / size.y : 1;
  scene.scale.setScalar(k);
  const c = box.getCenter(new THREE.Vector3());
  scene.position.set(-c.x * k, -box.min.y * k, -c.z * k);
  scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
  const wrap = new THREE.Group();
  wrap.add(scene);
  return wrap;
}

export async function loadModels(manifestUrl) {
  const q = new URLSearchParams(window.location.search).get("models");
  const url = manifestUrl || (q ? `/models/manifest.${q.replace(/[^a-z0-9-]/gi, "")}.json` : "/models/manifest.json");
  status.loaded = []; status.failed = []; status.done = false;
  let chars = {};
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) { status.manifest = await res.json(); chars = status.manifest.characters || {}; }
  } catch { /* no manifest: primitives only */ }
  const ids = Object.keys(chars).filter((id) => chars[id]?.url);
  if (!ids.length) { status.done = true; return; }
  useGame.setState({ assetsLoading: true });
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
    import("three/examples/jsm/loaders/GLTFLoader.js"),
    import("three/examples/jsm/libs/meshopt_decoder.module.js"),
  ]);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const models = {};
  await Promise.all(ids.map(async (id) => {
    try {
      const gltf = await loader.loadAsync(chars[id].url);
      models[id] = normalise(gltf.scene);
      status.loaded.push(id);
    } catch (e) {
      status.failed.push({ id, reason: String(e?.message || e).slice(0, 120) });
    }
  }));
  useGame.setState({ models, assetsLoading: false });
  status.done = true;
}

window.__fache = Object.assign(window.__fache || {}, {
  models: { status, reload: (url) => loadModels(url), clear: () => useGame.setState({ models: {} }) },
});
