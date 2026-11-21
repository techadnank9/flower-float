import * as THREE from "three";

export const stormFx = { level: 0, target: 0 };
export const nightFx = { level: 0 };
if (typeof window !== "undefined") window.__fache = Object.assign(window.__fache || {}, { fx: { stormFx, nightFx } });
export const registry = new Map();

const TARGET = { none: 0, t1: 0.45, t3: 0.75, t8: 1, countdown: 1, clear: 0 };
export const stormTarget = (phase) => TARGET[phase] ?? 0;

export function neonColor(hex, k = 2.6) {
  return new THREE.Color(hex).multiplyScalar(k);
}

export function makeTextTexture(lines, width = 1024, height = 256) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const g = c.getContext("2d");
  g.textAlign = "center";
  g.textBaseline = "middle";
  lines.forEach((l) => {
    g.fillStyle = l.color || "#fff";
    let size = l.size;
    const font = (s) => `900 ${s}px "Noto Sans HK", "Noto Sans TC", sans-serif`;
    g.font = font(size);
    while (g.measureText(l.text).width > width * 0.92 && size > 12) g.font = font(--size);
    g.shadowColor = l.color ? "transparent" : "#fff";
    g.shadowBlur = l.color ? 0 : size * 0.18;
    g.fillText(l.text, width / 2, l.y * height);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function loadSignFonts(texts) {
  const all = texts.join("");
  return Promise.race([
    Promise.all([document.fonts.load(`900 80px "Noto Sans HK"`, all), document.fonts.load(`900 80px "Noto Sans HK"`, "ABC")]),
    new Promise((r) => setTimeout(r, 4000)),
  ]).catch(() => null);
}
