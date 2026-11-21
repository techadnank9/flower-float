import { useEffect, useRef, useState } from "react";
import { Send, Store, Loader2 } from "lucide-react";
import { useGame } from "../game/store";
import { MicButton, Waveform } from "./Mic";

const NEEDS = [["budget", "Budget"], ["colours", "Colours"], ["goal", "Goal"], ["taboo", "Taboo"]];

export function Notebook() {
  const needs = useGame((s) => s.level.needs);
  return (
    <div className="notebook" data-testid="needs-notebook">
      <div className="notebook-title">Needs notebook</div>
      {NEEDS.map(([k, label]) => (
        <div key={k} className={`need-row ${needs[k] ? "is-filled" : ""}`} data-testid={`notebook-${k}`}>
          <span className="need-label">{label}</span>
          <span className="need-value" data-testid={`notebook-${k}-value`}>{needs[k] || "?"}</span>
        </div>
      ))}
    </div>
  );
}

function Log() {
  const convo = useGame((s) => s.level.conversation);
  const pending = useGame((s) => s.pending);
  const name = useGame((s) => s.data?.owners[s.level.ownerId]?.name);
  const ref = useRef();
  useEffect(() => { ref.current?.scrollTo({ top: 1e6, behavior: "smooth" }); }, [convo.length, pending]);
  return (
    <div className="chat-log" ref={ref} data-testid="conversation-log">
      {convo.map((m, i) => (
        <div key={i} className={`msg msg-${m.role}`} data-testid={`chat-msg-${m.role}`}>{m.text}</div>
      ))}
      {pending && <div className="msg msg-owner is-pending" data-testid="reply-pending"><Loader2 size={14} className="spin" /> {name} is thinking…</div>}
    </div>
  );
}

function Composer() {
  const [text, setText] = useState("");
  const input = useRef();
  const pending = useGame((s) => s.pending);
  const send = useGame((s) => s.sendMessage);
  const listening = useGame((s) => s.micListening === "talk");
  const before = useRef("");
  const setBox = (v) => { input.current.value = v; setText(v); };
  useEffect(() => {
    const id = setInterval(() => { const v = input.current?.value ?? ""; if (v !== text) setText(v); }, 400);
    return () => clearInterval(id);
  }, [text]);
  const submit = (e) => {
    e.preventDefault();
    const v = input.current.value;
    if (!v.trim() || pending) return;
    send(v);
    setText("");
    input.current.value = "";
  };
  return (
    <>
    {listening && <div className="listening-row" data-testid="mic-listening"><Waveform /> <span>Listening…</span></div>}
    <form className="composer" onSubmit={submit}>
      <input
        ref={input} className="text-input" data-testid="dialogue-text-input" placeholder="Say something…" maxLength={400}
        value={text} onChange={(e) => setText(e.target.value)} onInput={(e) => setText(e.currentTarget.value)}
      />
      <MicButton
        target="talk" testId="dialogue-mic-button" disabled={pending}
        onStart={() => { before.current = input.current.value; }}
        onInterim={(t) => setBox(t)}
        onFinal={(t) => { setBox(""); send(t); }}
        onCancel={() => setBox(before.current)}
      />
      <button type="submit" className="btn-send" data-testid="dialogue-send-button" disabled={!text.trim() || pending}><Send size={16} /> Send</button>
    </form>
    </>
  );
}

export function TalkPanel() {
  const chips = useGame((s) => s.level.chips);
  const pending = useGame((s) => s.pending);
  const send = useGame((s) => s.sendMessage);
  const askMarket = useGame((s) => s.askMarket);
  const researching = useGame((s) => s.intelLoading);
  const owner = useGame((s) => s.data?.owners[s.level.ownerId]);
  return (
    <div className="hud-panel talk-panel" data-testid="conversation-panel">
      <div className="panel-head">
        <div>
          <div className="panel-heading" data-testid="talk-owner-name">{owner?.name}</div>
          <div className="panel-sub">{owner?.truck_zh} · {owner?.truck}</div>
        </div>
        <button className="btn-market" data-testid="ask-market-button" disabled={researching} onClick={askMarket}>
          {researching ? <Loader2 size={15} className="spin" /> : <Store size={15} />} {researching ? "Researching…" : "Ask the market"}
        </button>
      </div>
      <Log />
      <div className="chips" data-testid="reply-chips">
        {chips.map((c, i) => (
          <button key={c} className="chip" data-testid={`reply-chip-${i}`} disabled={pending} onClick={() => send(c)}>{c}</button>
        ))}
      </div>
      <Composer />
      <Notebook />
    </div>
  );
}
