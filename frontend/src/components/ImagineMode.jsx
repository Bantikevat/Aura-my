import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Line, OrbitControls, RoundedBox } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import { ASSISTANT_URL } from '../lib/assistant';
import { useAuraStore } from '../store/useAuraStore';

const CACHE_KEY = 'aura-imagine-cache';
const KIND_COLOR = { compare: '#60a5fa', active: '#e8c872', found: '#34d399', swap: '#f472b6', sorted: '#a78bfa', discard: '#3a3a46' };
const BASE_COLOR = '#8b8a99';
const EXAMPLES = ['Binary Search', 'Bubble Sort', 'BST insertion', 'Dijkstra', 'SQL INNER JOIN', 'Newton\'s Second Law', 'Quadratic equation', 'Photosynthesis', 'Compound interest', 'Ohm\'s Law', 'Pythagoras theorem'];

const readCache = () => { try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; } catch { return {}; } };
const writeCache = (cache) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch { /* storage full or blocked */ } };

// Lessons saved before graph/table scenes existed have numeric values and `index` marks.
function normalizeLesson(lesson) {
  if (lesson.scene) return lesson;
  const fix = (list) => (list || []).map(({ index, ...rest }) => ({ ...rest, target: String(index) }));
  return { ...lesson, scene: 'array', frames: lesson.frames.map((f) => ({ ...f, values: f.values.map(String), rows: [], marks: fix(f.marks), pointers: fix(f.pointers) })) };
}

const colorOf = (kind) => (kind ? KIND_COLOR[kind] : BASE_COLOR);
const markMap = (frame) => new Map(frame.marks.map((m) => [String(m.target), m.kind]));
const pointerMap = (frame) => {
  const map = new Map();
  frame.pointers.forEach((p) => map.set(String(p.target), [...(map.get(String(p.target)) || []), p.name]));
  return map;
};

// Drives the render loop while glide animations are settling, then goes idle.
// This lets the Canvas run with frameloop="demand" (no continuous 60fps drain).
function GlideDriver() {
  const { invalidate } = useThree();
  const endAt = useRef(0);
  useEffect(() => { endAt.current = performance.now() + 1800; invalidate(); });
  useFrame(() => { if (performance.now() < endAt.current) invalidate(); });
  return null;
}

// Eased colour/size changes so each step glides instead of jumping.
function useGlide(ref, color, emissive = true) {
  useFrame((_, dt) => {
    const m = ref.current?.material;
    if (!m) return;
    const target = new THREE.Color(color);
    m.color.lerp(target, Math.min(1, dt * 9));
    if (emissive) m.emissive.lerp(target, Math.min(1, dt * 9));
  });
}

function Label({ children, y = 0, z = 0, color = '#f5e9c8', size = 15, weight = 600 }) {
  return <Html position={[0, y, z]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
    <span style={{ color, font: `${weight} ${size}px system-ui`, whiteSpace: 'nowrap', textShadow: '0 0 8px #000' }}>{children}</span>
  </Html>;
}

// ---------- array ----------
function Bar({ x, text, height, color, names }) {
  const ref = useRef();
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.scale.y = THREE.MathUtils.damp(ref.current.scale.y, height, 7, dt);
    ref.current.position.y = ref.current.scale.y / 2;
  });
  useGlide(ref, color);
  return <group position={[x, 0, 0]}>
    <RoundedBox ref={ref} args={[0.8, 1, 0.8]} radius={0.08} smoothness={3}>
      <meshStandardMaterial color={BASE_COLOR} emissive={BASE_COLOR} emissiveIntensity={0.35} metalness={0.7} roughness={0.25} />
    </RoundedBox>
    <Label y={-0.35} z={0.6}>{text}</Label>
    {names && <Label y={height + 0.55} color="#e8c872" size={14} weight={700}>▼ {names.join(', ')}</Label>}
  </group>;
}

function ArrayScene({ frame }) {
  const nums = frame.values.map((v) => parseFloat(v));
  const numeric = nums.every((n) => Number.isFinite(n));
  const max = numeric ? Math.max(...nums, 1) : 1;
  const marks = markMap(frame);
  const pointers = pointerMap(frame);
  const span = (frame.values.length - 1) * 1.1;
  return <group position={[-span / 2, 0, 0]}>
    {frame.values.map((text, i) => <Bar key={i} x={i * 1.1} text={text} height={numeric ? 0.35 + (Math.max(nums[i], 0) / max) * 3.2 : 1.2}
      color={colorOf(marks.get(String(i)))} names={pointers.get(String(i))} />)}
  </group>;
}

// ---------- graph ----------
function layoutGraph(graph) {
  const pos = {};
  const ids = graph.nodes.map((n) => n.id);
  if (graph.layout === 'tree') {
    const children = {};
    graph.edges.forEach((e) => { (children[e.from] ||= []).push(e.to); });
    const levels = [];
    const seen = new Set();
    let frontier = [ids[0]];
    while (frontier.length) {
      frontier = frontier.filter((id) => !seen.has(id));
      if (!frontier.length) break;
      frontier.forEach((id) => seen.add(id));
      levels.push(frontier);
      frontier = frontier.flatMap((id) => children[id] || []);
    }
    const loose = ids.filter((id) => !seen.has(id));
    if (loose.length) levels.push(loose);
    const widest = Math.max(...levels.map((l) => l.length));
    const gap = Math.min(2.6, 13 / Math.max(widest, 1));
    levels.forEach((level, d) => level.forEach((id, i) => { pos[id] = [(i - (level.length - 1) / 2) * gap, ((levels.length - 1) / 2 - d) * 1.9, 0]; }));
  } else {
    const radius = Math.max(2.6, ids.length * 0.5);
    ids.forEach((id, i) => { const a = (i / ids.length) * Math.PI * 2 - Math.PI / 2; pos[id] = [Math.cos(a) * radius, Math.sin(a) * radius * 0.8, 0]; });
  }
  return pos;
}

function Edge({ from, to, color, label, directed }) {
  const ref = useRef();
  const { mid, length, quat } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    return { mid: a.clone().add(b).multiplyScalar(0.5), length: dir.length(), quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()) };
  }, [from, to]);
  useGlide(ref, color);
  const active = color !== BASE_COLOR;
  return <group position={mid} quaternion={quat}>
    <mesh ref={ref}><cylinderGeometry args={[active ? 0.07 : 0.035, active ? 0.07 : 0.035, length, 8]} /><meshStandardMaterial color={BASE_COLOR} emissive={BASE_COLOR} emissiveIntensity={0.5} /></mesh>
    {directed && <mesh position={[0, length / 2 - 0.62, 0]}><coneGeometry args={[0.15, 0.32, 12]} /><meshBasicMaterial color={color} /></mesh>}
    {label && <group rotation={[0, 0, 0]}><Label y={0} z={0.2} color="#e8c872" size={13}>{label}</Label></group>}
  </group>;
}

function Node({ position, text, color, names }) {
  const ref = useRef();
  useGlide(ref, color);
  return <group position={position}>
    <mesh ref={ref}><sphereGeometry args={[0.46, 32, 32]} /><meshStandardMaterial color={BASE_COLOR} emissive={BASE_COLOR} emissiveIntensity={0.4} metalness={0.6} roughness={0.25} /></mesh>
    <Label z={0.55} size={15}>{text}</Label>
    {names && <Label y={0.95} color="#e8c872" size={13} weight={700}>▼ {names.join(', ')}</Label>}
  </group>;
}

function GraphScene({ lesson, frame }) {
  const graph = lesson.graph;
  const pos = useMemo(() => layoutGraph(graph), [graph]);
  const marks = markMap(frame);
  const pointers = pointerMap(frame);
  return <>
    {graph.edges.map((e, i) => {
      const kind = marks.get(`${e.from}>${e.to}`) || (!graph.directed ? marks.get(`${e.to}>${e.from}`) : undefined);
      return <Edge key={i} from={pos[e.from]} to={pos[e.to]} color={colorOf(kind)} label={e.label} directed={graph.directed} />;
    })}
    {graph.nodes.map((n) => <Node key={n.id} position={pos[n.id]} text={n.label} color={colorOf(marks.get(n.id))} names={pointers.get(n.id)} />)}
  </>;
}

// ---------- table ----------
function Cell({ position, text, color, header }) {
  const ref = useRef();
  useGlide(ref, color);
  return <group position={position}>
    <RoundedBox ref={ref} args={[1.72, 0.58, 0.14]} radius={0.06} smoothness={3}>
      <meshStandardMaterial color={BASE_COLOR} emissive={BASE_COLOR} emissiveIntensity={header ? 0.15 : 0.3} metalness={0.5} roughness={0.35} />
    </RoundedBox>
    <Label z={0.12} size={12} weight={header ? 700 : 600} color={header ? '#1a1405' : '#f5e9c8'}>{String(text).slice(0, 16)}</Label>
  </group>;
}

function TableScene({ lesson, frame }) {
  const cols = lesson.columns;
  const marks = markMap(frame);
  const rows = frame.rows;
  const x = (c) => (c - (cols.length - 1) / 2) * 1.85;
  const y = (r) => ((rows.length - 1) / 2 - r) * 0.72 - 0.4;
  return <>
    {cols.map((name, c) => <Cell key={`h${c}`} position={[x(c), ((rows.length - 1) / 2 + 1) * 0.72 - 0.4, 0]} text={name} color="#b8923a" header />)}
    {rows.map((row, r) => row.map((text, c) => <Cell key={`${r}-${c}`} position={[x(c), y(r), 0]} text={text} color={colorOf(marks.get(`${r},${c}`) || marks.get(String(r)))} />))}
  </>;
}

// ---------- plot (maths / physics function graphs) ----------
const CURVE_COLORS = ['#60a5fa', '#f472b6', '#34d399'];
function PlotScene({ lesson, step, total }) {
  const plot = lesson.plot;
  const map = useMemo(() => {
    const all = plot.curves.flatMap((c) => c.points);
    const xs = all.map((p) => Number(p[0])); const ys = all.map((p) => Number(p[1]));
    const xmin = Math.min(...xs), xmax = Math.max(...xs), ymin = Math.min(...ys), ymax = Math.max(...ys);
    const W = 10, H = 6;
    const sx = xmax === xmin ? 1 : W / (xmax - xmin);
    const sy = ymax === ymin ? 1 : H / (ymax - ymin);
    return (x, y) => [(Number(x) - xmin) * sx - W / 2, (Number(y) - ymin) * sy - H / 2, 0];
  }, [plot]);
  const frac = total > 1 ? Math.min(1, (step + 1) / total) : 1;
  return <>
    <Line points={[[-5.4, -3.3, 0], [5.4, -3.3, 0]]} color="#3a3a46" lineWidth={1.5} />
    <Line points={[[-5.4, -3.3, 0], [-5.4, 3.3, 0]]} color="#3a3a46" lineWidth={1.5} />
    {plot.curves.map((c, i) => {
      const n = Math.max(2, Math.ceil(c.points.length * frac));
      const pts = c.points.slice(0, n).map((p) => map(p[0], p[1]));
      return <group key={i}>
        <Line points={pts} color={CURVE_COLORS[i % CURVE_COLORS.length]} lineWidth={3.2} />
        <Html position={pts[pts.length - 1]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
          <span style={{ color: CURVE_COLORS[i % CURVE_COLORS.length], font: '700 13px system-ui', whiteSpace: 'nowrap', textShadow: '0 0 8px #000' }}>{c.label}</span>
        </Html>
      </group>;
    })}
    <Label y={-3.85} color="#9a99a6" size={13}>{plot.x_label}</Label>
    <Html position={[-6, 0, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
      <span style={{ color: '#9a99a6', font: '600 13px system-ui', whiteSpace: 'nowrap', textShadow: '0 0 8px #000' }}>{plot.y_label}</span>
    </Html>
  </>;
}

const CAMERA = { array: { position: [0, 4.2, 10], target: [0, 1.4, 0], floor: true }, graph: { position: [0, 0, 11], target: [0, 0, 0] }, table: { position: [0, 0, 10], target: [0, 0, 0] }, plot: { position: [0, 0, 11], target: [0, 0, 0] } };

function Scene({ lesson, frame, step, total }) {
  const cam = CAMERA[lesson.scene];
  return <>
    <GlideDriver />
    <color attach="background" args={['#07070b']} />
    <ambientLight intensity={0.55} />
    <directionalLight position={[4, 8, 6]} intensity={1.4} />
    <pointLight position={[0, 4, 4]} color="#e8c872" intensity={20} distance={16} />
    {cam.floor && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}><planeGeometry args={[40, 20]} /><meshStandardMaterial color="#0c0c12" metalness={0.8} roughness={0.35} /></mesh>}
    {lesson.scene === 'array' && <ArrayScene frame={frame} />}
    {lesson.scene === 'graph' && <GraphScene lesson={lesson} frame={frame} />}
    {lesson.scene === 'table' && <TableScene lesson={lesson} frame={frame} />}
    {lesson.scene === 'plot' && <PlotScene lesson={lesson} step={step} total={total} />}
    <OrbitControls target={cam.target} enablePan={false} minDistance={5} maxDistance={22} maxPolarAngle={cam.floor ? Math.PI * 0.49 : Math.PI} />
    <EffectComposer><Bloom intensity={0.6} luminanceThreshold={0.55} mipmapBlur /></EffectComposer>
  </>;
}

function Quiz({ quiz }) {
  const [picked, setPicked] = useState({});
  return <div className="space-y-4">
    {quiz.map((q, qi) => <div key={qi} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="text-sm font-medium text-white">{qi + 1}. {q.question}</p>
      <div className="mt-3 grid gap-2">
        {q.options.map((option, oi) => {
          const chosen = picked[qi] === oi;
          const correct = picked[qi] !== undefined && oi === q.answer_index;
          return <button key={oi} disabled={picked[qi] !== undefined} onClick={() => setPicked((p) => ({ ...p, [qi]: oi }))}
            className={`rounded-xl border px-3 py-2 text-left text-xs transition ${correct ? 'border-mint/50 bg-mint/10 text-mint' : chosen ? 'border-rose/50 bg-rose/10 text-rose' : 'border-white/[0.08] text-slate-300 hover:border-[rgba(232,200,114,0.4)]'}`}>{option}</button>;
        })}
      </div>
      {picked[qi] !== undefined && <p className="mt-3 text-xs text-slate-400"><span className="text-gold font-semibold">Kyun: </span>{q.why}</p>}
    </div>)}
  </div>;
}

// Speak text aloud (free, browser built-in). Hindi/Hinglish → en-IN voice.
function speak(text) {
  try {
    if (!window.speechSynthesis || !text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-IN'; u.rate = 1.03;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch { /* ignore */ }
}

// Fixed growth curves — the AI only picks a name, the maths lives here (no code evaluation).
const GROWTH = {
  constant: () => 1,
  log: (n) => Math.log2(Math.max(1, n)),
  sqrt: (n) => Math.sqrt(n),
  linear: (n) => n,
  nlogn: (n) => n * Math.log2(Math.max(1, n)),
  quadratic: (n) => n * n,
  cubic: (n) => n * n * n,
  exponential: (n) => Math.pow(2, Math.min(n, 60)),
};

// Interactive "what if?" — the student drags n and sees naive vs smart live.
function Playground({ pg }) {
  const [n, setN] = useState(() => Number(pg.param_default) || 100);
  const curve = (key) => GROWTH[key] || GROWTH.linear;
  const naive = curve(pg.naive_growth)(n);
  const smart = curve(pg.smart_growth)(n);
  const fmt = (x) => !Number.isFinite(x) ? '—'
    : x >= 1e7 ? `${(x / 1e7).toFixed(2)} crore`
    : x >= 1000 ? Math.round(x).toLocaleString('en-IN')
    : String(Math.round(x));
  const times = Number.isFinite(naive) && Number.isFinite(smart) && smart > 0 ? Math.round(naive / smart) : null;

  return <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-4">
    <p className="section-label text-cyan-300">Khud try karo — slider ghumao</p>
    <p className="mt-2 text-sm text-slate-300">{pg.param_label}: <b className="font-mono text-cyan-300">{n.toLocaleString('en-IN')}</b></p>
    <input type="range" min={pg.param_min} max={pg.param_max} value={n} onChange={(e) => setN(Number(e.target.value))} className="mt-2 w-full accent-cyan-400" aria-label={pg.param_label} />
    <div className="mt-3 grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-rose/10 p-3 text-center">
        <p className="text-[10px] uppercase tracking-wider text-rose">{pg.naive_label}</p>
        <p className="mt-1 font-mono text-lg font-black text-rose">{fmt(naive)}</p>
      </div>
      <div className="rounded-xl bg-mint/10 p-3 text-center">
        <p className="text-[10px] uppercase tracking-wider text-mint">{pg.smart_label}</p>
        <p className="mt-1 font-mono text-lg font-black text-mint">{fmt(smart)}</p>
      </div>
    </div>
    {times > 1 && <p className="mt-3 text-center text-xs text-gold">⚡ {times.toLocaleString('en-IN')}× tez!</p>}
    {pg.insight && <p className="mt-2 text-xs leading-relaxed text-slate-400">{pg.insight}</p>}
  </div>;
}

export default function ImagineMode() {
  const [topic, setTopic] = useState('');
  const [input, setInput] = useState('');
  const [lesson, setLesson] = useState(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [narrate, setNarrate] = useState(false);
  const [intro, setIntro] = useState(false);
  const [flashBusy, setFlashBusy] = useState(false);
  const [flashMsg, setFlashMsg] = useState('');
  const addFlashcards = useAuraStore((s) => s.addFlashcards);
  const pendingImagineTopic = useAuraStore((s) => s.pendingImagineTopic);
  const clearPendingImagine = useAuraStore((s) => s.clearPendingImagine);

  // The Exam Compressor's "Imagine" button fills in the topic from here.
  useEffect(() => {
    const onImagine = (event) => { setTopic(String(event.detail || '')); setInput(''); };
    window.addEventListener('aura-imagine', onImagine);
    return () => window.removeEventListener('aura-imagine', onImagine);
  }, []);

  // Another tab asked to open a concept's world — load and show it straight away.
  useEffect(() => {
    if (!pendingImagineTopic) return;
    const t = pendingImagineTopic;
    clearPendingImagine();
    setTopic(t); setInput('');
    build(false, t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingImagineTopic]);

  useEffect(() => {
    if (!playing || !lesson) return undefined;
    const timer = setInterval(() => setStep((s) => { if (s >= lesson.frames.length - 1) { setPlaying(false); return s; } return s + 1; }), 1400);
    return () => clearInterval(timer);
  }, [playing, lesson]);

  function show(next) { setLesson(normalizeLesson(next)); setStep(0); setPlaying(false); setIntro(true); }

  // Step into the concept's world: dismiss the story, start the guided, narrated playback.
  function enterWorld() {
    setIntro(false); setStep(0); setNarrate(true); setPlaying(true);
  }

  // Narrate each step aloud as it appears, so the concept "speaks" to the student.
  useEffect(() => {
    if (narrate && lesson?.frames[step]?.note) speak(lesson.frames[step].note);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, narrate, lesson]);
  useEffect(() => () => { try { window.speechSynthesis?.cancel(); } catch { /* ignore */ } }, []);

  // Turn the concept the student just saw into spaced-repetition flashcards (free).
  async function makeFlashcards() {
    if (!lesson || flashBusy) return;
    setFlashBusy(true); setFlashMsg('Cards ban rahe…');
    try {
      const res = await fetch(`${ASSISTANT_URL}/flashcards`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: lesson.title || topic, count: 6 }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || `Error ${res.status}`);
      if (!body.cards?.length) throw new Error('Cards nahi bane.');
      addFlashcards(body.cards, lesson.title || topic);
      setFlashMsg(`✓ ${body.cards.length} flashcards Study World me add ho gaye.`);
    } catch (e) {
      setFlashMsg(`✕ ${e instanceof TypeError ? 'Assistant server band hai.' : e.message}`);
    } finally {
      setFlashBusy(false);
    }
  }

  async function build(regenerate = false, overrideTopic) {
    const name = (overrideTopic ?? topic).trim();
    if (!name || busy) return;
    const key = `${name.toLowerCase()}|${input.trim()}`;
    const cached = readCache()[key];
    setError('');
    if (cached && !regenerate) { show(cached); return; }
    setBusy(true);
    try {
      const res = await fetch(`${ASSISTANT_URL}/visualize`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: name, input: input.trim() }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || `Error ${res.status}`);
      writeCache({ ...readCache(), [key]: body });
      show(body);
    } catch (e) {
      setError(e instanceof TypeError ? 'Assistant server is not running. Start it with "npm run dev:ai".' : e.message);
    } finally {
      setBusy(false);
    }
  }

  const frame = lesson?.frames[Math.min(step, lesson.frames.length - 1)];
  const last = lesson ? lesson.frames.length - 1 : 0;
  const legend = useMemo(() => Object.entries(KIND_COLOR), []);

  return <section className="glass-strong relative mb-8 overflow-hidden rounded-3xl p-6">
    <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(232,200,114,0.16),transparent_70%)]" />
    <p className="section-label">Imagine mode</p>
    <h2 className="font-luxe mt-1 text-3xl font-semibold text-white">Padho mat, <span className="text-gold">dekho</span></h2>
    <p className="mt-1 text-sm text-slate-400">Koi bhi concept likho — coding, maths, physics, chemistry, biology. AI use 3D mein step-by-step chalakar dikhata hai, asli zindagi ki misaal, kahani, interactive slider aur quiz ke saath.</p>

    <form onSubmit={(e) => { e.preventDefault(); build(); }} className="mt-4 flex flex-wrap gap-2">
      <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic, jaise: Binary Search" className="field min-w-[220px] flex-1" />
      <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Apna input (optional): 4, 9, 15, 23" className="field min-w-[220px] flex-1" />
      <button disabled={busy || !topic.trim()} className="rounded-xl bg-ice px-5 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-40">{busy ? 'Ban raha hai…' : 'Dikhao'}</button>
    </form>
    <div className="mt-3 flex flex-wrap gap-2">{EXAMPLES.map((ex) => <button key={ex} onClick={() => setTopic(ex)} className="rounded-full border border-[rgba(232,200,114,0.25)] px-3 py-1 text-xs text-slate-300 hover:bg-[rgba(232,200,114,0.08)]">{ex}</button>)}</div>
    {error && <p className="mt-3 rounded-lg bg-rose/10 p-3 text-xs text-rose">{error}</p>}

    <AnimatePresence>
      {lesson && intro && <motion.div key="intro" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
        className="relative mt-6 overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-[#0a0a12] via-[#0d0b1e] to-[#15090f] p-8 text-center sm:p-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(232,200,114,0.12),transparent_60%)]" />
        <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="section-label text-gold">Is question ki duniya me chalo</motion.p>
        <motion.h3 initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="font-luxe mt-2 text-2xl font-bold text-white sm:text-3xl">{lesson.title}</motion.h3>
        <motion.p initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }} className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">{lesson.problem}</motion.p>
        {lesson.without_it && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mx-auto mt-4 max-w-2xl text-sm text-rose"><span className="font-semibold">Iske bina: </span>{lesson.without_it}</motion.p>}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-7 flex flex-wrap justify-center gap-3">
          <button onClick={() => speak(`${lesson.problem} ${lesson.without_it || ''}`)} className="rounded-xl border border-white/[0.15] px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.06]">🔊 Suno</button>
          <button onClick={enterWorld} className="rounded-xl bg-gradient-to-r from-gold to-amber-500 px-6 py-2.5 text-sm font-black text-slate-950 shadow-[0_0_25px_rgba(232,200,114,0.35)]">Is duniya me jao →</button>
        </motion.div>
      </motion.div>}
    </AnimatePresence>

    {lesson && frame && !intro && <div className="mt-6 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <div>
        <div className="h-[420px] overflow-hidden rounded-2xl border border-white/[0.08]">
          <Canvas
            key={lesson.scene}
            camera={{ position: CAMERA[lesson.scene].position, fov: 45 }}
            dpr={[1, 1.5]}
            frameloop="demand"
            gl={{ powerPreference: 'default', antialias: false, failIfMajorPerformanceCaveat: false }}
            onCreated={({ gl }) => {
              // Recover automatically if GPU drops the context (common on integrated GPUs)
              gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault(), false);
              gl.domElement.addEventListener('webglcontextrestored', () => gl.forceContextRestore?.(), false);
            }}
          >
            <Scene lesson={lesson} frame={frame} step={step} total={lesson.frames.length} />
          </Canvas>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={() => { if (step >= last) setStep(0); setPlaying((p) => !p); }} className="rounded-xl bg-ice px-4 py-2 text-xs font-bold text-slate-950">{playing ? 'Pause' : step >= last ? 'Replay' : 'Play'}</button>
          <button onClick={() => { setNarrate((v) => { if (v) window.speechSynthesis?.cancel(); else if (frame?.note) speak(frame.note); return !v; }); }} title="Concept bol ke samjhaye" className={`rounded-lg border px-3 py-2 text-xs ${narrate ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300' : 'border-white/[0.12] text-slate-300'}`}>{narrate ? '🔊' : '🔈'}</button>
          <button onClick={() => { setPlaying(false); window.speechSynthesis?.cancel(); setIntro(true); }} title="Kahani dubara dekho" className="rounded-lg border border-white/[0.12] px-3 py-2 text-xs text-slate-300">📖</button>
          <button onClick={() => { setPlaying(false); setStep((s) => Math.max(0, s - 1)); }} className="rounded-lg border border-white/[0.12] px-3 py-2 text-xs text-slate-300">◀</button>
          <input type="range" min="0" max={last} value={step} onChange={(e) => { setPlaying(false); setStep(Number(e.target.value)); }} className="flex-1 accent-[#e8c872]" aria-label="Step" />
          <button onClick={() => { setPlaying(false); setStep((s) => Math.min(last, s + 1)); }} className="rounded-lg border border-white/[0.12] px-3 py-2 text-xs text-slate-300">▶</button>
          <span className="w-14 text-right font-mono text-xs text-slate-500">{step + 1}/{last + 1}</span>
        </div>
        <p className="mt-3 rounded-xl border border-[rgba(232,200,114,0.2)] bg-[rgba(232,200,114,0.05)] px-4 py-3 text-sm text-slate-200">{frame.note}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">{legend.map(([kind, color]) => <span key={kind} className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />{kind}</span>)}</div>
      </div>

      <div className="space-y-4">
        {lesson.problem && <div className="rounded-2xl border border-[rgba(232,200,114,0.25)] bg-[rgba(232,200,114,0.05)] p-4">
          <p className="section-label">Pehle problem samjho</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-200">{lesson.problem}</p>
          {lesson.without_it && <p className="mt-3 text-sm text-slate-300"><span className="font-semibold text-rose">Iske bina: </span>{lesson.without_it}</p>}
        </div>}
        {lesson.real_world?.length > 0 && <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="section-label">Asli zindagi mein kahan lagta hai</p>
          <ul className="mt-2 space-y-2">{lesson.real_world.map((item, i) => <li key={i} className="text-sm text-slate-300"><span className="font-semibold text-gold">{item.where}: </span>{item.how}</li>)}</ul>
        </div>}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="section-label">{lesson.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{lesson.analogy}</p>
          <p className="mt-3 text-sm font-medium text-white"><span className="text-gold">Yaad rakho: </span>{lesson.key_idea}</p>
        </div>
        {lesson.playground && <Playground key={lesson.title} pg={lesson.playground} />}
        {lesson.memory_story && <div className="rounded-2xl border border-purple-500/25 bg-purple-950/15 p-4">
          <p className="section-label text-purple-300">Kahani se yaad rakho 🎬</p>
          <p className="mt-2 text-sm italic leading-relaxed text-slate-200">{lesson.memory_story}</p>
        </div>}
        <Quiz key={lesson.title + lesson.frames.length} quiz={lesson.quiz} />
        <button onClick={makeFlashcards} disabled={flashBusy} className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{flashBusy ? 'Ban rahe…' : '🃏 Is concept ke flashcards banao'}</button>
        {flashMsg && <p className={`text-[11px] ${flashMsg.startsWith('✕') ? 'text-rose' : 'text-mint'}`}>{flashMsg}</p>}
        <button onClick={() => build(true)} disabled={busy} className="text-xs text-slate-500 underline hover:text-slate-300">Galat ya ajeeb laga? Dobara banao</button>
      </div>
    </div>}
  </section>;
}
