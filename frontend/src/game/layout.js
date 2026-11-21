import * as THREE from "three";

export const TRUCKS = {
  jasmine: {
    pos: [-8.4, 0, -1.0], rotY: 0.42, body: "#f2862b", trim: "#18b5a4", roof: "#fde8b0", awning: ["#18b5a4", "#fff3dc"],
    neon: "#ff8a2a", sign: [{ text: "咖喱快", size: 76, y: 0.28 }, { text: "CURRY UP", size: 96, y: 0.7 }],
    owner: { shirt: "#ff9f43", apron: "#18b5a4", pants: "#2d3047", skin: "#e8b48f", hat: "bucket", hatColor: "#ff5fa2" },
  },
  wing: {
    pos: [0, 0, -3], rotY: 0, body: "#c8202f", trim: "#f5c242", roof: "#fff1d6", awning: ["#f5c242", "#c8202f"],
    neon: "#ffd04a", sign: [{ text: "榮記雞蛋仔", size: 76, y: 0.28 }, { text: "WING'S EGG WAFFLES", size: 96, y: 0.7 }],
    owner: { shirt: "#f4efe6", apron: "#b3132b", pants: "#2b2b38", skin: "#d9a27c", hat: "chef", hatColor: "#ffffff", band: "#e0b23a" },
  },
  fong: {
    pos: [8.4, 0, -1.0], rotY: -0.42, body: "#5fb89a", trim: "#fff1d0", roof: "#fff8e8", awning: ["#e6577a", "#fff1d0"],
    neon: "#62f5c8", sign: [{ text: "芳姐奶茶菠蘿包", size: 76, y: 0.28 }, { text: "FONG'S MILK TEA & PINEAPPLE BUNS", size: 96, y: 0.7 }],
    owner: { shirt: "#b39ddb", apron: "#fff3c4", pants: "#4a3b52", skin: "#efc4a0", hat: "scarf", hatColor: "#8e44ad" },
  },
};

export const KIT_LOOK = { shirt: "#2fa84f", apron: "#ff9f1c", pants: "#264653", skin: "#c98d66", hat: "helmet", hatColor: "#ffd60a" };

export const CART_POS = [-3.8, 0, 5.2];
export const KIT_POS = [-6.6, 0, 5.6];

export const SLOT_POS = {
  roof: [0.4, 2.72, 0],
  awning: [0.6, 1.83, 1.78],
  counter: [0.6, 1.3, 1.46],
  bumper: [0.4, 0.46, 1.24],
  stand: [3.5, 0, 1.3],
};

export const SLOT_HIT = {
  roof: { size: [3.8, 0.7, 1.6], offset: [0, 0.3, 0] },
  awning: { size: [3.0, 0.45, 0.5], offset: [0, -0.05, 0] },
  counter: { size: [3.0, 0.55, 0.6], offset: [0, 0.22, 0] },
  bumper: { size: [3.8, 0.45, 0.4], offset: [0, 0.05, 0] },
  stand: { size: [1.3, 2.0, 1.0], offset: [0, 1.0, 0] },
};

export const SLOT_LAYOUT = {
  roof: { xs: [-1.5, -0.75, 0, 0.75, 1.5], scale: 1.1, planter: [3.7, 0.2, 0.5] },
  awning: { xs: [-1.2, -0.6, 0, 0.6, 1.2], scale: 0.75, planter: null },
  counter: { xs: [-0.9, 0, 0.9], scale: 0.95, planter: [2.6, 0.12, 0.3] },
  bumper: { xs: [-1.6, -0.8, 0, 0.8, 1.6], scale: 0.8, planter: [3.7, 0.12, 0.2] },
  stand: { xs: [0], scale: 1.6, planter: null },
};

export const FLOWER_LOOK = {
  kumquat: { shape: "tree", bloom: ["#ff9a1f"], leaf: "#2f7d3a" },
  peach: { shape: "branch", bloom: ["#ff9ccf", "#ffc2e0"], leaf: "#7a4a32" },
  peony: { shape: "bloom", bloom: ["#e0244a", "#ff4d6d"], leaf: "#2f7d3a" },
  orchid: { shape: "bloom", bloom: ["#b45cf0", "#e0b0ff"], leaf: "#2f7d3a" },
  sunflower: { shape: "bloom", bloom: ["#ffcc1f", "#ffb000"], leaf: "#3d8b37" },
  ychrys: { shape: "bloom", bloom: ["#ffc93a", "#ffdb6e"], leaf: "#3d8b37" },
  wchrys: { shape: "bloom", bloom: ["#f4f4f0", "#ffffff"], leaf: "#3d8b37" },
  lily: { shape: "bloom", bloom: ["#fff2f6", "#ffd1e0"], leaf: "#3d8b37" },
  bamboo: { shape: "stalk", bloom: ["#7ccf5a"], leaf: "#5fbf4a" },
  pampas: { shape: "plume", bloom: ["#ecd8ae"], leaf: "#c9b48a" },
  edible: { shape: "bloom", bloom: ["#ff7a1a", "#a64dff", "#ffd23f"], leaf: "#3d8b37" },
  stand: { shape: "stand", bloom: ["#e0244a", "#f5c242"], leaf: "#2f7d3a" },
};

const v = (a) => new THREE.Vector3(...a);

function truckFrame(key, offset, look) {
  const t = TRUCKS[key];
  const rot = new THREE.Euler(0, t.rotY, 0);
  return { pos: v(offset).applyEuler(rot).add(v(t.pos)), look: v(look).applyEuler(rot).add(v(t.pos)) };
}

export function camFor(key) {
  if (key === "harbour") return { pos: v([0, 8, 20.5]), look: v([0, 1.2, -2]) };
  if (key === "parade") return { pos: v([0, 9.5, 25]), look: v([-2, 1.5, -2]) };
  if (key.endsWith("-wide")) return truckFrame(key.replace("-wide", ""), [3.2, 5.2, 15.5], [1.6, 1.0, 2.0]);
  return truckFrame(key, [0.8, 5.6, 12.6], [0.8, 1.25, 0]);
}

export const isTruckKey = (k) => k in TRUCKS;
