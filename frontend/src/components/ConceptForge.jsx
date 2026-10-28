// ConceptForge — 5-stage deep learning engine (ULTRA edition).
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AI_BASE = 'http://127.0.0.1:5002';

const FORMULAS = {
  'n':                         n => n,
  'n*n':                       n => n * n,
  'n**2':                      n => n * n,
  'n*n*n':                     n => n * n * n,
  'n**3':                      n => n * n * n,
  '1':                         _ => 1,
  'Math.sqrt(n)':              n => Math.sqrt(n),
  'Math.log2(n)':              n => Math.log2(Math.max(2, n)),
  'Math.log(n)':               n => Math.log(Math.max(2, n)),
  'Math.ceil(Math.log2(n))':   n => Math.ceil(Math.log2(Math.max(2, n))),
  'n*Math.log2(n)':            n => n * Math.log2(Math.max(2, n)),
  'n*Math.ceil(Math.log2(n))': n => n * Math.ceil(Math.log2(Math.max(2, n))),
  'n*(n-1)/2':                 n => n * (n - 1) / 2,
  '2**n':                      n => Math.min(2 ** n, 1e15),
  'n!':                        n => { let f = 1; for (let i = 2; i <= Math.min(n, 20); i++) f *= i; return f; },
};

function evalFormula(formula, n) {
  const fn = FORMULAS[formula?.trim()];
  if (fn) return Math.max(1, Math.round(fn(n)));
  return n;
}

function fmt(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e7) return (num / 1e7).toFixed(1) + ' cr';
  if (num >= 1e5) return (num / 1e5).toFixed(1) + ' lakh';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return String(num);
}

// ── Animated counter ─────────────────────────────────────────
function Counter({ value, color }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const diff = value - prev.current;
    if (Math.abs(diff) < 2) { setDisplay(value); prev.current = value; return; }
    let start = null;
    const duration = 400;
    const from = prev.current;
    const raf = requestAnimationFrame(function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setDisplay(Math.round(from + diff * p));
      if (p < 1) requestAnimationFrame(step);
      else { prev.current = value; setDisplay(value); }
    });
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span style={{ color }}>{fmt(display)}</span>;
}

const STAGES = [
  { id: 1, icon: '⚡', label: 'Crisis', color: '#ff6e7a' },
  { id: 2, icon: '🎬', label: 'See It', color: '#60a5fa' },
  { id: 3, icon: '🎮', label: 'Play',   color: '#34d399' },
  { id: 4, icon: '🧠', label: 'Lock',   color: '#a78bfa' },
  { id: 5, icon: '⚔️', label: 'Battle', color: '#fbbf24' },
];

const LEVEL_COLOR = { basic: '#34d399', medium: '#fbbf24', gate: '#f472b6' };
const LEVEL_LABEL = { basic: 'Basic', medium: 'Medium', gate: '🔥 GATE' };

// ── Stage 1: Crisis ──────────────────────────────────────────
function StageCrisis({ lesson }) {
  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
        className="relative overflow-hidden rounded-2xl border border-[#ff6e7a]/40 p-5"
        style={{ background: 'linear-gradient(135deg, rgba(255,110,122,0.12), rgba(255,110,122,0.03))' }}>
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,110,122,0.25), transparent 70%)' }} />
        <p className="text-xs font-black uppercase tracking-widest text-[#ff6e7a]">⚡ WHY THIS MATTERS</p>
        <p className="mt-3 text-base leading-relaxed text-white">{lesson.problem}</p>
        {lesson.without_it && (
          <div className="mt-4 rounded-xl border border-[#ff6e7a]/30 bg-black/40 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Bina iske:</p>
            <p className="mt-1 text-sm font-bold text-[#ff6e7a]">{lesson.without_it}</p>
          </div>
        )}
      </motion.div>

      {lesson.real_world?.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {lesson.real_world.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-white/[0.08] p-3"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))' }}>
              <p className="text-sm font-bold text-[#e8c872]">{item.where}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.how}</p>
            </motion.div>
          ))}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-2xl border border-[rgba(232,200,114,0.35)] p-4"
        style={{ background: 'linear-gradient(135deg, rgba(232,200,114,0.1), rgba(232,200,114,0.03))' }}>
        <p className="text-xs font-black uppercase tracking-widest text-[#e8c872]">💡 Core Idea</p>
        <p className="mt-2 text-sm leading-relaxed text-white">{lesson.key_idea}</p>
      </motion.div>
    </div>
  );
}

// ── Stage 2: See It ──────────────────────────────────────────
function StageSeeIt({ lesson }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#60a5fa]/30 p-5"
        style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.08), rgba(96,165,250,0.02))' }}>
        <p className="text-xs font-black uppercase tracking-widest text-[#60a5fa]">🎬 3D Visualization</p>
        <p className="mt-3 text-sm text-slate-300">
          Upar <span className="font-bold text-[#e8c872]">Imagine 3D</span> tab mein jaao aur type karo:
        </p>
        <div className="mt-3 rounded-xl border border-[rgba(232,200,114,0.5)] bg-[rgba(232,200,114,0.1)] px-4 py-3">
          <p className="font-mono text-lg font-black text-[#e8c872]">"{lesson.title}"</p>
        </div>
        <p className="mt-3 text-xs text-slate-500">Step-by-step animation — har pointer explain hoga</p>
      </div>
      <div className="rounded-2xl border border-white/[0.06] p-4"
        style={{ background: 'rgba(255,255,255,0.02)' }}>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Analogy</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{lesson.analogy}</p>
      </div>
    </div>
  );
}

// ── Stage 3: Playground (THE UNIQUE FEATURE) ─────────────────
function StagePlayground({ playground }) {
  const pg = playground;
  const [n, setN] = useState(pg.param_default || 100);
  const naive = useMemo(() => evalFormula(pg.naive_formula, n), [pg.naive_formula, n]);
  const smart = useMemo(() => evalFormula(pg.smart_formula, n), [pg.smart_formula, n]);
  const ratio = naive > 0 && smart > 0 ? (naive / smart) : 1;
  const smartPct = Math.max(1, Math.min(99, (smart / Math.max(naive, 1)) * 100));
  const naivePct = 100;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center">
        <p className="text-xs font-black uppercase tracking-widest text-[#34d399]">🎮 LIVE COMPLEXITY LAB</p>
        <p className="mt-1 text-sm text-slate-400">Slider ghuma — real-time mein fark dekho</p>
      </div>

      {/* Giant slider */}
      <div className="rounded-3xl border border-white/[0.08] p-6"
        style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.06), rgba(0,0,0,0.4))' }}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400">{pg.param_label}</p>
          <motion.p key={n} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
            className="font-mono text-2xl font-black text-white">
            {fmt(n)}
          </motion.p>
        </div>
        <input type="range" min={pg.param_min} max={pg.param_max}
          step={Math.max(1, Math.floor((pg.param_max - pg.param_min) / 500))}
          value={n} onChange={e => setN(Number(e.target.value))}
          className="mt-4 w-full cursor-pointer"
          style={{ accentColor: '#34d399', height: '6px' }} />
        <div className="mt-1 flex justify-between text-[10px] text-slate-600">
          <span>{fmt(pg.param_min)}</span><span>{fmt(pg.param_max)}</span>
        </div>
      </div>

      {/* Side by side bars — THE WOW MOMENT */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Naive */}
        <div className="rounded-3xl border border-[#ff6e7a]/30 p-5"
          style={{ background: 'linear-gradient(135deg, rgba(255,110,122,0.1), rgba(0,0,0,0.4))' }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">❌</span>
            <p className="text-xs font-black uppercase tracking-wider text-[#ff6e7a]">{pg.naive_label}</p>
          </div>
          <p className="mt-3 font-mono text-4xl font-black">
            <Counter value={naive} color="#ff6e7a" />
          </p>
          <p className="text-xs text-slate-500">operations</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div className="h-full rounded-full bg-[#ff6e7a]"
              animate={{ width: `${naivePct}%` }} transition={{ type: 'spring', stiffness: 60 }} />
          </div>
          <p className="mt-1 font-mono text-[10px] text-slate-600">{pg.naive_formula}</p>
        </div>

        {/* Smart */}
        <div className="rounded-3xl border border-[#34d399]/30 p-5"
          style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.1), rgba(0,0,0,0.4))' }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <p className="text-xs font-black uppercase tracking-wider text-[#34d399]">{pg.smart_label}</p>
          </div>
          <p className="mt-3 font-mono text-4xl font-black">
            <Counter value={smart} color="#34d399" />
          </p>
          <p className="text-xs text-slate-500">operations</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div className="h-full rounded-full bg-[#34d399]"
              animate={{ width: `${smartPct}%` }} transition={{ type: 'spring', stiffness: 60 }} />
          </div>
          <p className="mt-1 font-mono text-[10px] text-slate-600">{pg.smart_formula}</p>
        </div>
      </div>

      {/* Speedometer */}
      <motion.div
        className="rounded-3xl border p-5 text-center"
        animate={{
          borderColor: ratio > 1000 ? 'rgba(232,200,114,0.6)' : ratio > 100 ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.08)',
          background: ratio > 1000 ? 'rgba(232,200,114,0.08)' : ratio > 100 ? 'rgba(167,139,250,0.06)' : 'rgba(255,255,255,0.02)',
        }}>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Smart approach is</p>
        <motion.p key={Math.round(ratio)} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="mt-1 font-mono text-5xl font-black"
          style={{ color: ratio > 1000 ? '#e8c872' : ratio > 100 ? '#a78bfa' : '#34d399' }}>
          {ratio >= 1e6 ? (ratio/1e6).toFixed(1)+'M×' : ratio >= 1000 ? (ratio/1000).toFixed(1)+'K×' : Math.round(ratio)+'×'}
        </motion.p>
        <p className="text-sm font-semibold text-slate-400">faster</p>
        {pg.insight && (
          <p className="mt-3 rounded-xl bg-[rgba(232,200,114,0.08)] px-4 py-2 text-xs font-medium text-[#e8c872]">
            💡 {pg.insight}
          </p>
        )}
      </motion.div>
    </div>
  );
}

// ── Stage 4: Memory Lock ─────────────────────────────────────
function StageMemoryLock({ lesson }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#a78bfa]/30 p-4"
        style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(0,0,0,0.3))' }}>
        <p className="text-xs font-black uppercase tracking-widest text-[#a78bfa]">🧠 MEMORY LOCK</p>
        <p className="mt-2 text-sm text-slate-300">
          Ek <span className="font-bold text-[#a78bfa]">Bollywood story</span> — padho, ankhein band karo, picture dekho. Concept <span className="font-bold text-white">kabhi nahi bhoologe.</span>
        </p>
      </div>

      <AnimatePresence>
        {!revealed ? (
          <motion.button exit={{ opacity: 0, scale: 0.9 }} onClick={() => setRevealed(true)}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="group w-full rounded-3xl border border-[rgba(167,139,250,0.4)] py-10 text-center transition"
            style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(0,0,0,0.4))' }}>
            <motion.p animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}
              className="text-5xl">🧠</motion.p>
            <p className="mt-3 text-base font-black text-[#a78bfa]">Tap to Unlock Memory</p>
            <p className="mt-1 text-xs text-slate-500">Ek baar padho — zindagi bhar yaad rahega</p>
          </motion.button>
        ) : (
          <motion.div key="story" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-[rgba(167,139,250,0.4)] p-6"
            style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(0,0,0,0.5))' }}>
            <p className="text-xs font-black uppercase tracking-widest text-[#a78bfa]">🎬 Your Memory Story</p>
            <p className="mt-4 text-base leading-relaxed text-white">{lesson.memory_story || lesson.analogy}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Stage 5: GATE Battle ─────────────────────────────────────
function StageGateBattle({ quiz, onXp }) {
  const [answers, setAnswers] = useState({});
  const [xpGiven, setXpGiven] = useState(false);
  const LEVEL_ORDER = { basic: 0, medium: 1, gate: 2 };
  const sorted = [...quiz].sort((a, b) => (LEVEL_ORDER[a.level||'basic']??0) - (LEVEL_ORDER[b.level||'basic']??0));

  function pick(qi, oi) {
    if (answers[qi] !== undefined) return;
    const next = { ...answers, [qi]: oi };
    setAnswers(next);
    if (Object.keys(next).length === sorted.length && !xpGiven) {
      const score = Object.entries(next).filter(([i,v]) => Number(v) === sorted[Number(i)]?.answer_index).length;
      onXp?.(score * 20); setXpGiven(true);
    }
  }

  const allDone = Object.keys(answers).length === sorted.length && sorted.length > 0;
  const correct = Object.entries(answers).filter(([i,v]) => Number(v) === sorted[Number(i)]?.answer_index).length;

  return (
    <div className="space-y-4">
      {sorted.length === 0 && <p className="text-sm text-slate-400">Koi questions nahi hain.</p>}

      {/* Score header */}
      {sorted.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-[#fbbf24]/20 bg-[rgba(251,191,36,0.05)] px-4 py-3">
          <p className="text-xs font-black uppercase tracking-widest text-[#fbbf24]">⚔️ GATE BATTLE</p>
          <p className="font-mono text-sm font-bold text-white">
            {Object.keys(answers).length}/{sorted.length} answered
          </p>
        </div>
      )}

      {sorted.map((q, qi) => {
        const lvl = q.level || 'basic';
        const chosen = answers[qi];
        const done = chosen !== undefined;
        return (
          <motion.div key={qi} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: qi * 0.08 }}
            className="rounded-2xl border border-white/[0.06] p-4"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(0,0,0,0.3))' }}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-white">{qi + 1}. {q.question}</p>
              <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black"
                style={{ background: LEVEL_COLOR[lvl]+'22', color: LEVEL_COLOR[lvl] }}>
                {LEVEL_LABEL[lvl]}
              </span>
            </div>
            <div className="mt-3 grid gap-2">
              {q.options.map((opt, oi) => {
                const isCorrect = done && oi === q.answer_index;
                const isWrong = done && chosen === oi && oi !== q.answer_index;
                return (
                  <motion.button key={oi} disabled={done} onClick={() => pick(qi, oi)}
                    whileHover={!done ? { x: 4 } : {}} whileTap={!done ? { scale: 0.98 } : {}}
                    className={`rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition ${
                      isCorrect ? 'border-[#34d399]/60 bg-[rgba(52,211,153,0.15)] text-[#34d399]' :
                      isWrong   ? 'border-[#ff6e7a]/60 bg-[rgba(255,110,122,0.12)] text-[#ff6e7a]' :
                      done      ? 'border-white/[0.04] text-slate-600' :
                      'border-white/[0.08] text-slate-300 hover:border-[rgba(232,200,114,0.4)] hover:bg-[rgba(232,200,114,0.06)]'
                    }`}>
                    {isCorrect ? '✅ ' : isWrong ? '❌ ' : <span className="mr-2 font-mono text-slate-600">{String.fromCharCode(65+oi)}.</span>}
                    {opt}
                  </motion.button>
                );
              })}
            </div>
            {done && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 overflow-hidden rounded-xl bg-white/[0.03] p-3">
                <p className="text-xs text-slate-400">
                  <span className="font-black text-[#e8c872]">Why: </span>{q.why}
                </p>
              </motion.div>
            )}
          </motion.div>
        );
      })}

      {allDone && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border p-6 text-center"
          style={{
            borderColor: correct === sorted.length ? 'rgba(232,200,114,0.5)' : correct >= sorted.length*0.6 ? 'rgba(52,211,153,0.4)' : 'rgba(255,110,122,0.3)',
            background: correct === sorted.length ? 'rgba(232,200,114,0.08)' : correct >= sorted.length*0.6 ? 'rgba(52,211,153,0.06)' : 'rgba(255,110,122,0.06)',
          }}>
          <p className="text-5xl">{correct === sorted.length ? '🏆' : correct >= sorted.length*0.6 ? '💪' : '📚'}</p>
          <p className="mt-3 text-2xl font-black text-white">{correct}/{sorted.length} sahi!</p>
          <p className="mt-2 text-sm text-slate-400">
            {correct === sorted.length ? 'PERFECT! Tu concept MASTER hai 🔥' :
             correct >= sorted.length*0.6 ? 'Solid! Galat wale dobara dekho.' :
             '3D visualization dobara dekho — aur clear ho jaayega.'}
          </p>
          {correct > 0 && <p className="mt-3 text-sm font-black text-[#e8c872]">+{correct*20} XP earned! ⚡</p>}
        </motion.div>
      )}
    </div>
  );
}

// ── Suggestions ───────────────────────────────────────────────
const SUGGESTIONS = [
  'Binary Search','Merge Sort',"Dijkstra's Algorithm",
  'Dynamic Programming','BFS & DFS','Hash Tables',
  'Quick Sort','Linked Lists','Binary Trees','Big-O Notation',
];

// ── Main ConceptForge ────────────────────────────────────────
export default function ConceptForge({ onXp }) {
  const [topic, setTopic] = useState('');
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState(1);
  const inputRef = useRef(null);

  async function loadTopic(t) {
    const q = (t || topic).trim();
    if (!q) { inputRef.current?.focus(); return; }
    setLoading(true); setError(''); setLesson(null); setStage(1);
    try {
      const res = await fetch(`${AI_BASE}/api/assistant/visualize`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Server error');
      setLesson(data);
    } catch (err) {
      setError(err.message || 'Server offline — backend terminal mein: node src/assistantServer.js');
    } finally { setLoading(false); }
  }

  const canAdvance = useCallback(s => s === 3 ? !!lesson?.playground : true, [lesson]);

  // ── Landing ──
  if (!lesson && !loading) return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.06] p-6"
      style={{ background: 'linear-gradient(135deg, rgba(232,200,114,0.05), rgba(10,10,20,0.95))' }}>
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(232,200,114,0.15), transparent 70%)' }} />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.1), transparent 70%)' }} />

      <p className="relative text-xs font-black uppercase tracking-widest text-[#e8c872]">🔥 CONCEPT FORGE</p>
      <h2 className="relative mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
        Koi bhi concept <br/>
        <span className="text-[#e8c872]">5 stages</span> mein master karo
      </h2>
      <p className="relative mt-2 text-sm text-slate-400">
        Crisis → See It → <span className="font-semibold text-[#34d399]">Live Playground</span> → Memory Lock → GATE Battle
      </p>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="relative mt-4 rounded-2xl border border-[#ff6e7a]/30 bg-[rgba(255,110,122,0.08)] px-4 py-3 text-sm text-[#ff6e7a]">
          ⚠️ {error}
        </motion.div>
      )}

      <div className="relative mt-6 flex gap-2">
        <input ref={inputRef} value={topic} onChange={e => setTopic(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && loadTopic()}
          placeholder='Topic type karo, e.g. "Binary Search"'
          className="flex-1 rounded-2xl border border-white/[0.12] bg-white/[0.04] px-4 py-3 text-sm
            text-white placeholder-slate-500 outline-none transition
            focus:border-[rgba(232,200,114,0.5)] focus:bg-white/[0.07]" />
        <motion.button onClick={() => loadTopic()} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          className="rounded-2xl px-5 py-3 text-sm font-black text-black transition"
          style={{ background: 'linear-gradient(135deg, #e8c872, #f59e0b)' }}>
          Forge 🔥
        </motion.button>
      </div>

      <div className="relative mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map(s => (
          <motion.button key={s} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { setTopic(s); loadTopic(s); }}
            className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs
              text-slate-400 hover:border-[rgba(232,200,114,0.4)] hover:text-[#e8c872] transition">
            {s}
          </motion.button>
        ))}
      </div>

      <div className="relative mt-8 grid gap-2 sm:grid-cols-5">
        {[
          { icon:'⚡', label:'Crisis',   desc:'Real problem',    color:'#ff6e7a' },
          { icon:'🎬', label:'See It',   desc:'3D visual',       color:'#60a5fa' },
          { icon:'🎮', label:'Play',     desc:'Live slider',     color:'#34d399' },
          { icon:'🧠', label:'Lock It',  desc:'Memory story',    color:'#a78bfa' },
          { icon:'⚔️', label:'Battle',   desc:'GATE questions',  color:'#fbbf24' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
            <p className="text-2xl">{s.icon}</p>
            <p className="mt-1 text-xs font-black text-white">{s.label}</p>
            <p className="text-[10px]" style={{ color: s.color }}>{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );

  // ── Loading ──
  if (loading) return (
    <section className="rounded-3xl border border-[rgba(232,200,114,0.2)] p-12 text-center"
      style={{ background: 'linear-gradient(135deg, rgba(232,200,114,0.06), rgba(10,10,20,0.95))' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        className="mx-auto h-14 w-14 rounded-full"
        style={{ border: '3px solid rgba(232,200,114,0.2)', borderTopColor: '#e8c872' }} />
      <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
        className="mt-5 text-base font-black text-[#e8c872]">
        AURA forging your lesson...
      </motion.p>
      <p className="mt-2 text-xs text-slate-500">5 stages ban rahe hain — 10-15 seconds</p>
    </section>
  );

  // ── Lesson view ──
  return (
    <section className="overflow-hidden rounded-3xl border border-white/[0.06]"
      style={{ background: 'linear-gradient(135deg, rgba(10,10,20,0.98), rgba(5,5,12,1))' }}>
      {/* Topic bar */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3"
        style={{ background: 'rgba(232,200,114,0.04)' }}>
        <motion.button whileHover={{ x: -2 }} onClick={() => { setLesson(null); setTopic(''); }}
          className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-slate-400 hover:text-white transition">
          ← Back
        </motion.button>
        <p className="flex-1 text-sm font-black text-[#e8c872]">{lesson.title}</p>
        <motion.button whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}
          onClick={() => loadTopic()}
          className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-slate-400 hover:text-white transition">
          ↺
        </motion.button>
      </div>

      {/* Stage nav */}
      <div className="flex gap-1 p-2">
        {STAGES.map((s, i) => (
          <button key={s.id} onClick={() => canAdvance(s.id) && setStage(s.id)}
            disabled={!canAdvance(s.id)}
            className={`group flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-center transition ${
              stage === s.id ? 'text-white' : canAdvance(s.id) ? 'text-slate-500 hover:text-slate-300' : 'cursor-not-allowed opacity-20'
            }`}
            style={stage === s.id ? {
              background: `linear-gradient(135deg, ${s.color}22, ${s.color}08)`,
              boxShadow: `inset 0 0 0 1px ${s.color}44`,
            } : {}}>
            <span className="text-base">{s.icon}</span>
            <span className="text-[10px] font-black">{s.label}</span>
            {stage === s.id && (
              <motion.div layoutId="stage-dot" className="h-1 w-1 rounded-full"
                style={{ background: s.color }} />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={stage} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
          className="p-4">
          {stage === 1 && <StageCrisis lesson={lesson} />}
          {stage === 2 && <StageSeeIt lesson={lesson} />}
          {stage === 3 && (lesson.playground
            ? <StagePlayground playground={lesson.playground} />
            : <p className="text-sm text-slate-400">Playground data nahi mila. Topic reload karo.</p>
          )}
          {stage === 4 && <StageMemoryLock lesson={lesson} />}
          {stage === 5 && <StageGateBattle quiz={lesson.quiz||[]} onXp={onXp} />}
        </motion.div>
      </AnimatePresence>

      {/* Next */}
      {stage < 5 && (
        <div className="border-t border-white/[0.04] p-3">
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={() => canAdvance(stage+1) && setStage(s => Math.min(5, s+1))}
            disabled={!canAdvance(stage+1)}
            className="w-full rounded-2xl py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-30"
            style={{
              background: `linear-gradient(135deg, ${STAGES[stage]?.color}22, ${STAGES[stage]?.color}08)`,
              border: `1px solid ${STAGES[stage]?.color}44`,
              color: STAGES[stage]?.color,
            }}>
            {STAGES[stage]?.icon} Next Stage: {STAGES[stage]?.label} →
          </motion.button>
        </div>
      )}
    </section>
  );
}
