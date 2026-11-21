"""Writes tiny test GLBs + manifests so the GLB runtime path can be tested without Meshy."""
import json
import struct
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "frontend" / "public" / "models"


def box(x0, y0, z0, x1, y1, z1, base):
    faces = [((1, 0, 0), [(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)]), ((-1, 0, 0), [(x0, y0, z1), (x0, y1, z1), (x0, y1, z0), (x0, y0, z0)]),
             ((0, 1, 0), [(x0, y1, z0), (x0, y1, z1), (x1, y1, z1), (x1, y1, z0)]), ((0, -1, 0), [(x0, y0, z1), (x0, y0, z0), (x1, y0, z0), (x1, y0, z1)]),
             ((0, 0, 1), [(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]), ((0, 0, -1), [(x1, y0, z0), (x0, y0, z0), (x0, y1, z0), (x1, y1, z0)])]
    pos, nrm, idx = [], [], []
    for n, quad in faces:
        b = base + len(pos)
        pos += quad; nrm += [n] * 4; idx += [b, b + 1, b + 2, b, b + 2, b + 3]
    return pos, nrm, idx


def glb(parts):
    meshes, bin_ = [], b""
    accessors, views = [], []
    for color, (pos, nrm, idx) in parts:
        def view(data, target):
            nonlocal bin_
            views.append({"buffer": 0, "byteOffset": len(bin_), "byteLength": len(data), "target": target})
            bin_ += data + b"\0" * ((4 - len(data) % 4) % 4)
            return len(views) - 1
        pv = view(struct.pack(f"{len(pos) * 3}f", *[c for p in pos for c in p]), 34962)
        nv = view(struct.pack(f"{len(nrm) * 3}f", *[c for p in nrm for c in p]), 34962)
        iv = view(struct.pack(f"{len(idx)}H", *idx), 34963)
        a = len(accessors)
        accessors += [{"bufferView": pv, "componentType": 5126, "count": len(pos), "type": "VEC3",
                       "min": [min(p[i] for p in pos) for i in range(3)], "max": [max(p[i] for p in pos) for i in range(3)]},
                      {"bufferView": nv, "componentType": 5126, "count": len(nrm), "type": "VEC3"},
                      {"bufferView": iv, "componentType": 5123, "count": len(idx), "type": "SCALAR"}]
        meshes.append({"primitives": [{"attributes": {"POSITION": a, "NORMAL": a + 1}, "indices": a + 2, "material": len(meshes)}]})
    doc = {"asset": {"version": "2.0", "generator": "fa-che test"}, "scene": 0, "scenes": [{"nodes": list(range(len(meshes)))}],
           "nodes": [{"mesh": i} for i in range(len(meshes))], "meshes": meshes,
           "materials": [{"pbrMetallicRoughness": {"baseColorFactor": c, "metallicFactor": 0, "roughnessFactor": 0.8}} for c, _ in parts],
           "accessors": accessors, "bufferViews": views, "buffers": [{"byteLength": len(bin_)}]}
    js = json.dumps(doc).encode()
    js += b" " * ((4 - len(js) % 4) % 4)
    total = 12 + 8 + len(js) + 8 + len(bin_)
    return struct.pack("<III", 0x46546C67, 2, total) + struct.pack("<II", len(js), 0x4E4F534A) + js + struct.pack("<II", len(bin_), 0x004E4942) + bin_


def person(shirt, hat):
    return glb([([0.35, 0.25, 0.2, 1], box(-0.2, 0, -0.1, 0.2, 0.75, 0.1, 0)), (shirt, box(-0.28, 0.75, -0.16, 0.28, 1.35, 0.16, 0)),
                ([0.95, 0.78, 0.62, 1], box(-0.18, 1.35, -0.18, 0.18, 1.68, 0.18, 0)), (hat, box(-0.22, 1.66, -0.22, 0.22, 1.8, 0.22, 0))])


if __name__ == "__main__":
    t = OUT / "test"
    t.mkdir(parents=True, exist_ok=True)
    (t / "kit-block.glb").write_bytes(person([0.95, 0.4, 0.6, 1], [0.2, 0.6, 0.3, 1]))
    (t / "fong-block.glb").write_bytes(person([0.2, 0.6, 0.45, 1], [0.6, 0.6, 0.6, 1]))
    (t / "corrupt.glb").write_bytes(b"glTF-not-really" + bytes(range(256)) * 4)
    (OUT / "manifest.test-good.json").write_text(json.dumps({"version": 1, "characters": {
        "kit": {"url": "/models/test/kit-block.glb"}, "fong": {"url": "/models/test/fong-block.glb"}}}, indent=2))
    (OUT / "manifest.test-bad.json").write_text(json.dumps({"version": 1, "characters": {
        "wing": {"url": "/models/test/missing.glb"}, "fong": {"url": "/models/test/corrupt.glb"}, "kit": {"url": "/models/test/kit-block.glb"}}}, indent=2))
    print("test GLBs written")
