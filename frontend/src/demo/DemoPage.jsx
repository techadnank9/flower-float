import { useEffect, useState } from "react";
import { Download, ArrowLeft, Film } from "lucide-react";

const VIDEO = "/demo/fa-che-gameplay.mp4";

export default function DemoPage() {
  const [hasVideo, setHasVideo] = useState(null);
  useEffect(() => {
    const prev = document.title;
    document.title = "FA CHE 花車: Gameplay video";
    return () => { document.title = prev; };
  }, []);
  useEffect(() => {
    fetch(VIDEO, { method: "HEAD", cache: "no-store" })
      .then((r) => setHasVideo(r.ok && (r.headers.get("content-type") || "").includes("video")))
      .catch(() => setHasVideo(false));
  }, []);
  return (
    <div className="demo-page" data-testid="demo-page">
      <div className="demo-card">
        <div className="demo-eyebrow">WEST KOWLOON · HARBOURFRONT</div>
        <h1 className="demo-title" data-testid="demo-title">FA CHE <span className="brand-zh">花車</span>: Gameplay video</h1>
        {hasVideo === null && <div className="demo-empty" data-testid="demo-checking">Checking for video…</div>}
        {hasVideo === false && (
          <div className="demo-empty" data-testid="demo-coming-soon"><Film size={28} /> Video coming soon</div>
        )}
        {hasVideo && (
          <>
            <video className="demo-video" data-testid="demo-video" src={VIDEO} controls playsInline preload="metadata" />
            <a className="btn-primary demo-download" data-testid="demo-download-button" href={VIDEO} download="fa-che-gameplay.mp4">
              <Download size={16} /> Download video
            </a>
          </>
        )}
        <a className="demo-back" data-testid="demo-back-link" href="/"><ArrowLeft size={14} /> Play the game</a>
      </div>
    </div>
  );
}
