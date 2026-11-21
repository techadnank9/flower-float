const BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

async function req(path, body, headers = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json", ...headers } : headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

const forceFallback = () => new URLSearchParams(window.location.search).get("force_fallback") === "1";

export const api = {
  gameData: () => req("/game/data"),
  ribbon: async (ownerId, history) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    try {
      const res = await fetch(`${BASE}/ribbon`, {
        method: "POST", signal: ctrl.signal,
        headers: { "Content-Type": "application/json", ...(forceFallback() ? { "X-Force-Fallback": "1" } : {}) },
        body: JSON.stringify({ owner_id: ownerId, history }),
      });
      if (!res.ok) throw new Error(`/ribbon ${res.status}`);
      return await res.json();
    } finally { clearTimeout(timer); }
  },
  intel: async (sessionId, ownerId = "wing") => {
    const q = new URLSearchParams(window.location.search);
    const headers = {};
    if (forceFallback()) headers["X-Force-Fallback"] = "1";
    if (q.get("intel_fail")) headers["X-Intel-Fail"] = q.get("intel_fail");
    if (q.get("intel_slow") === "1") headers["X-Intel-Slow"] = "1";
    if (q.get("intel_mock") === "1") headers["X-Intel-Mock"] = "1";
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4300);
    try {
      const res = await fetch(`${BASE}/intel?owner_id=${ownerId}&session_id=${encodeURIComponent(sessionId)}`, { headers, signal: ctrl.signal });
      if (res.ok) return await res.json();
    } catch { /* fall through to offline */ } finally { clearTimeout(timer); }
    return req(`/intel?owner_id=${ownerId}&session_id=${encodeURIComponent(sessionId)}`, null, { "X-Force-Fallback": "1" });
  },
  dialogue: (body, force) => req("/dialogue", body, force || forceFallback() ? { "X-Force-Fallback": "1" } : {}),
  tts: async (ownerId, text) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4500);
    try {
      const res = await fetch(`${BASE}/tts`, {
        method: "POST", signal: ctrl.signal,
        headers: { "Content-Type": "application/json", ...(forceFallback() ? { "X-Force-Fallback": "1" } : {}) },
        body: JSON.stringify({ owner_id: ownerId, text }),
      });
      return res.status === 200 ? await res.arrayBuffer() : null;
    } catch { return null; } finally { clearTimeout(timer); }
  },
  evaluate: (ownerId, body) => req(`/owners/${ownerId}/evaluate`, body),
  score: (ownerId, body) => req(`/owners/${ownerId}/score`, body),
};
