import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../game/store";
import { camFor } from "../game/layout";
import { registry, stormFx } from "./fx";

const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const DURATION = 1000;

export function CameraRig() {
  const { camera, gl } = useThree();
  const flyId = useGame((s) => s.flyId);
  const skipToken = useGame((s) => s.skipFlyToken);
  const look = useRef(camFor("harbour").look.clone());
  const tw = useRef(null);

  useEffect(() => {
    const s = useGame.getState();
    const target = camFor(s.camKey);
    if (s.camInstant || !tw.current && flyId === 0) {
      camera.position.copy(target.pos);
      look.current.copy(target.look);
      tw.current = null;
      if (flyId > 0) s.arrived(s.camKey);
      return;
    }
    tw.current = { fromP: camera.position.clone(), fromL: look.current.clone(), toP: target.pos, toL: target.look, start: performance.now(), key: s.camKey };
    useGame.setState({ flying: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyId]);

  useEffect(() => { if (tw.current) tw.current.start = -1e9; }, [skipToken]);

  useEffect(() => {
    window.__fache = Object.assign(window.__fache || {}, {
      project: (id, dyArg) => {
        const entry = registry.get(id);
        const r = entry?.ref.current;
        if (!r) return null;
        const dy = dyArg ?? entry.dy;
        const p = r.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, dy, 0)).project(camera);
        const rect = gl.domElement.getBoundingClientRect();
        return { x: rect.left + ((p.x + 1) / 2) * rect.width, y: rect.top + ((1 - p.y) / 2) * rect.height };
      },
    });
  }, [camera, gl]);

  useFrame((st) => {
    const w = tw.current;
    if (w) {
      const k = Math.min(1, (performance.now() - w.start) / DURATION);
      const e = ease(k);
      camera.position.lerpVectors(w.fromP, w.toP, e);
      look.current.lerpVectors(w.fromL, w.toL, e);
      if (k >= 1) {
        tw.current = null;
        useGame.setState({ flying: false });
        useGame.getState().arrived(w.key);
      }
    }
    const lvl = stormFx.level;
    const t = st.clock.elapsedTime;
    const shake = lvl > 0.05 ? new THREE.Vector3(Math.sin(t * 37) * 0.07, Math.sin(t * 29 + 1) * 0.05, 0).multiplyScalar(lvl) : new THREE.Vector3();
    camera.lookAt(look.current.clone().add(shake));
    if (lvl > 0.05) camera.rotateZ(Math.sin(t * 23) * 0.006 * lvl);
  });
  return null;
}
