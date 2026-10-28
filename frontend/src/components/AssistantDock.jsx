import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuraStore } from '../store/useAuraStore';
import { buildStateBlock, pingAssistant, runTool, sendToAssistant } from '../lib/assistant';
import { sfx } from '../lib/audioFx';

const MAX_TOOL_ROUNDS = 8;
const QUICK = [
  'Aaj ka plan banao',
  'Ye job apply karo: ',
  'Is question ka answer likho: Why do you want this role?',
  'Mere baare mein kya yaad rakha hai?',
];

export default function AssistantDock() {
  const navigate = useNavigate();
  const memory = useAuraStore((s) => s.assistantMemory);
  const removeMemory = useAuraStore((s) => s.removeAssistantMemory);
  const [open, setOpen] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [items, setItems] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // null = unknown, false = server down, object = health
  const history = useRef([]); // raw API messages, append-only so Claude's reasoning stays valid
  const scroller = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen((v) => !v); }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    pingAssistant().then((health) => setStatus(health || false));
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' }); }, [items, busy]);

  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const recognitionRef = useRef(null);

  const push = useCallback((item) => setItems((current) => [...current, { id: crypto.randomUUID(), ...item }]), []);

  // Speak the assistant's reply aloud (free, built into the browser). Hindi/Hinglish → en-IN voice.
  const speak = useCallback((text) => {
    try {
      if (!voiceOn || !window.speechSynthesis || !text) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-IN'; u.rate = 1.05;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { /* ignore */ }
  }, [voiceOn]);

  // Listen to the user's voice and send it as a message.
  function toggleMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { push({ role: 'error', text: 'Is browser me voice support nahi hai — Chrome use karo.' }); return; }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.lang = 'en-IN'; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onresult = (e) => { const t = e.results[0]?.[0]?.transcript; setListening(false); if (t) send(t); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    try { rec.start(); setListening(true); sfx.playBleep(); } catch { setListening(false); }
  }

  async function send(text) {
    const message = text.trim();
    if (!message || busy) return;
    setInput('');
    setBusy(true);
    push({ role: 'user', text: message });
    const checkpoint = history.current.length;
    history.current = [...history.current, { role: 'user', content: `${buildStateBlock()}\n\n${message}` }];
    try {
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const reply = await sendToAssistant(history.current);
        history.current = [...history.current, { role: 'assistant', content: reply.content }];
        for (const block of reply.content) {
          if (block.type === 'text' && block.text.trim()) { push({ role: 'assistant', text: block.text }); speak(block.text); }
        }
        if (reply.stop_reason === 'refusal') { push({ role: 'error', text: 'The assistant declined this request.' }); break; }
        if (reply.stop_reason !== 'tool_use') break;

        const results = reply.content.filter((b) => b.type === 'tool_use').map((call) => {
          const outcome = runTool(call.name, call.input, navigate);
          push({ role: 'action', text: outcome.text, failed: !outcome.ok });
          return { type: 'tool_result', tool_use_id: call.id, content: outcome.text, ...(outcome.ok ? {} : { is_error: true }) };
        });
        history.current = [...history.current, { role: 'user', content: results }];
        if (round === MAX_TOOL_ROUNDS - 1) push({ role: 'error', text: 'Stopped after too many steps. Ask again to continue.' });
      }
    } catch (error) {
      history.current = history.current.slice(0, checkpoint); // drop the failed turn so the next one starts clean
      push({ role: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  function newChat() { history.current = []; setItems([]); sfx.playBleep(); }

  return <>
    {/* Holographic JARVIS Cyber Core Orb Button */}
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => {
          setOpen(true);
          sfx.playLaser();
        }}
        aria-label="Open AURA AI Core (Ctrl+K)"
        className="group relative flex h-16 w-16 items-center justify-center transition-transform hover:scale-110 active:scale-95"
      >
        {/* Outer Counter-Rotating Hologram Ring */}
        <div className="absolute inset-0 animate-spin rounded-full border border-dashed border-cyan-400/60 [animation-duration:12s] group-hover:border-cyan-300" />
        
        {/* Middle Clockwise Ring */}
        <div className="absolute inset-1 rounded-full border border-gold/50 animate-spin [animation-direction:reverse] [animation-duration:8s] group-hover:border-gold" />

        {/* Outer Atmospheric Aura Glow */}
        <div className="absolute inset-2 animate-pulse rounded-full bg-gradient-to-tr from-cyan-500/30 via-gold/30 to-purple-600/30 blur-md group-hover:blur-lg" />

        {/* Center Glowing Plasma Core */}
        <div
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-lg font-black text-slate-950 shadow-[0_0_25px_rgba(232,200,114,0.7)] transition-all group-hover:shadow-[0_0_35px_rgba(6,182,212,0.9)]"
          style={{ background: 'radial-gradient(circle at 35% 35%, #fff, #f6e3a1 40%, #e8c872 75%, #b8923a)' }}
        >
          <span className="animate-spin [animation-duration:20s]">✦</span>
        </div>

        {/* Hover Cyber Badge */}
        <span className="pointer-events-none absolute -top-8 right-0 rounded-full border border-cyan-400/30 bg-black/80 px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest text-cyan-300 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
          JARVIS AI · Ctrl+K
        </span>
      </button>
    </div>

    <AnimatePresence>
      {open && <motion.aside initial={{ opacity: 0, y: 24, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.95 }} transition={{ duration: 0.25 }}
        className="glass-strong fixed bottom-6 right-6 z-[70] flex h-[min(680px,calc(100vh-48px))] w-[min(450px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)]">
        
        {/* Holographic Header */}
        <header className="flex items-center justify-between border-b border-white/[0.08] bg-black/40 px-5 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-gold/40 bg-gold/10 text-gold shadow-[0_0_15px_rgba(232,200,114,0.3)]">
              <span className="animate-pulse">✦</span>
            </div>
            <div>
              <p className="font-display text-lg font-black tracking-wide text-white">AURA Core Assistant</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-mint animate-ping" />
                <p className="font-mono text-[10px] text-cyan-400">
                  {status === null ? 'Scanning systems…' : status === false ? 'Core offline' : status.keyConfigured ? `Online · ${status.model || 'Gemini 2.5'}` : 'Key missing'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <button onClick={() => { setVoiceOn((v) => !v); sfx.playBleep(); if (voiceOn) window.speechSynthesis?.cancel(); }} title="Speak replies" aria-label="Toggle voice replies" className={`rounded-lg px-2.5 py-1.5 text-sm ${voiceOn ? 'text-cyan-300' : 'text-slate-500 hover:bg-white/[0.06] hover:text-white'}`}>{voiceOn ? '🔊' : '🔈'}</button>
            <button onClick={() => { setShowMemory((v) => !v); sfx.playBleep(); }} className="rounded-lg px-2.5 py-1.5 text-xs text-slate-400 hover:bg-white/[0.06] hover:text-white">Vault ({memory.length})</button>
            <button onClick={newChat} className="rounded-lg px-2.5 py-1.5 text-xs text-slate-400 hover:bg-white/[0.06] hover:text-white">Reset</button>
            <button onClick={() => { setOpen(false); sfx.playBleep(); }} aria-label="Close" className="rounded-lg px-2.5 py-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white">✕</button>
          </div>
        </header>

        {showMemory && <div className="max-h-44 space-y-1.5 overflow-y-auto border-b border-white/[0.08] bg-black/30 px-5 py-3">
          {memory.length === 0 && <p className="text-xs text-slate-400">Nothing saved yet. Tell me how you like things done and I will remember it.</p>}
          {memory.map((m) => <div key={m.id} className="flex items-start justify-between gap-2 text-xs text-slate-300"><span>{m.note}</span><button onClick={() => removeMemory(m.id)} className="text-slate-500 hover:text-rose" aria-label="Forget">✕</button></div>)}
        </div>}

        <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-5 py-4 bg-gradient-to-b from-black/20 to-black/60">
          {status === false && <div className="rounded-2xl border border-solar/30 bg-solar/[0.06] p-4 text-xs text-slate-300">
            <p className="font-medium text-solar">Assistant server is not running</p>
            <p className="mt-1">Run <code className="rounded bg-white/10 px-1.5 py-0.5">npm run assistant</code> in backend terminal.</p>
          </div>}

          {items.length === 0 && <div className="pt-2">
            <p className="font-display text-2xl font-black text-white">Namaste! Boliye, kya command hai?</p>
            <p className="mt-2 text-xs text-slate-400">Main aapka personal AI pilot hoon. Tasks add karne hon, study routine banani ho ya concepts samajhne hon, sab main handle karunga.</p>
            <div className="mt-4 flex flex-wrap gap-2">{QUICK.map((q) => <button key={q} onClick={() => { sfx.playBleep(); q.endsWith(': ') ? (setInput(q), inputRef.current?.focus()) : send(q); }} className="rounded-xl border border-cyan-500/25 bg-cyan-950/20 px-3 py-1.5 text-xs text-cyan-200 transition hover:bg-cyan-500/20 hover:border-cyan-400/50">{q}</button>)}</div>
          </div>}

          {items.map((item) => item.role === 'action'
            ? <p key={item.id} className={`rounded-xl px-3 py-1.5 text-xs font-mono ${item.failed ? 'bg-rose/10 text-rose border border-rose/30' : 'bg-mint/10 text-mint border border-mint/30'}`}>{item.failed ? '✕' : '✓'} {item.text}</p>
            : <div key={item.id} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <p className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${item.role === 'user' ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/30 border border-amber-500/30 text-white' : item.role === 'error' ? 'bg-rose/10 border border-rose/30 text-rose' : 'bg-white/[0.04] border border-white/[0.08] text-slate-200'}`}>{item.text}</p>
            </div>)}

          {busy && (
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
              <span className="animate-spin text-sm">✦</span>
              <span>AURA Core Neural Processing…</span>
            </div>
          )}
        </div>

        <form onSubmit={(event) => { event.preventDefault(); send(input); }} className="border-t border-white/[0.08] bg-black/40 p-3">
          <div className="flex items-end gap-2">
            <textarea ref={inputRef} value={input} rows={1} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask anything or command AURA… (Enter = send)" className="field max-h-28 resize-none text-xs bg-black/50 border-white/10" />
            <button type="button" onClick={toggleMic} aria-label="Voice input" title="Bol ke poochho" className={`rounded-xl px-3 py-2.5 text-sm ${listening ? 'animate-pulse bg-rose/20 text-rose' : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.12]'}`}>{listening ? '●' : '🎤'}</button>
            <button disabled={busy || !input.trim()} onClick={() => sfx.playLaser()} className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-40">Execute</button>
          </div>
        </form>
      </motion.aside>}
    </AnimatePresence>
  </>;
}
