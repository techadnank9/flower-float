import "@/App.css";
import { Component, useState } from "react";
import World from "./scene/World";
import HUD from "./hud/HUD";

const NO_3D = "Your browser can't run 3D. Try Chrome on a laptop.";

function hasWebGL() {
  if (new URLSearchParams(window.location.search).get("nowebgl") === "1") return false;
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch { return false; }
}

class Guard extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

const NoWebGL = () => (
  <div className="no-webgl" data-testid="webgl-unavailable">
    <div className="no-webgl-zh">花車</div>
    <p>{NO_3D}</p>
  </div>
);

export default function App() {
  const [ok, setOk] = useState(hasWebGL);
  if (!ok) return <NoWebGL />;
  return (
    <Guard fallback={<NoWebGL />}>
      <div className="game-root">
        <div className="canvas-wrap"><World onFail={() => setOk(false)} /></div>
        <HUD />
      </div>
    </Guard>
  );
}
