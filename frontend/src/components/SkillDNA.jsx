// SkillDNA — teri skills ek 3D rotating DNA helix mein.
// Har rung = ek skill. Color = category. Glow = strength.
import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useAuraStore } from '../store/useAuraStore';

// ── categories ──────────────────────────────────────────────
const CATS = {
  frontend: { color: '#60a5fa', label: 'Frontend', icon: '🎨' },
  backend:  { color: '#34d399', label: 'Backend',  icon: '⚙️' },
  database: { color: '#fbbf24', label: 'Database', icon: '🗄️' },
  devops:   { color: '#a78bfa', label: 'DevOps',   icon: '🚀' },
  ai:       { color: '#e8c872', label: 'AI & ML',  icon: '🤖' },
  other:    { color: '#94a3b8', label: 'Other',    icon: '✦' },
};

function cat(skill) {
  const s = skill.toLowerCase();
  if (/react|next|vue|angular|html|css|tailwind|bootstrap|framer|svelte|typescript|sass/.test(s)) return 'frontend';
  if (/node|express|django|fastapi|spring|php|go|rust|\bjava\b|python|api|rest|graphql|socket/.test(s)) return 'backend';
  if (/mongo|mysql|postgres|redis|firebase|supabase|dynamo|sqlite|database|\bdb\b/.test(s)) return 'database';
  if (/git|docker|aws|azure|gcp|nginx|linux|cicd|kubernetes|render|netlify|vercel|ubuntu/.test(s)) return 'devops';
  if (/\bai\b|ml\b|machine learn|deep learn|llm|gpt|prompt|automat|langchain|tensorflow|pytorch|agent/.test(s)) return 'ai';
  return 'other';
}

// ── geometry helpers ─────────────────────────────────────────
function helixPos(i, total, r = 2.4) {
  const t  = (i / Math.max(total - 1, 1)) * Math.PI * 3.5; // ~1.75 full turns
  const y  = (i / Math.max(total - 1, 1)) * Math.max(total * 0.5, 6) - Math.max(total * 0.5, 6) / 2;
  return {
    a: [ Math.cos(t) * r,          y,  Math.sin(t) * r],
    b: [ Math.cos(t + Math.PI) * r, y,  Math.sin(t + Math.PI) * r],
  };
}

// ── 3-D pieces ───────────────────────────────────────────────
function Strand({ positions, color }) {
  const pts = positions.map(p => new THREE.Vector3(...p));
  const curve = new THREE.CatmullRomCurve3(pts);
  return (
    <mesh>
      <tubeGeometry args={[curve, positions.length * 5, 0.045, 6, false]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55}
        metalness={0.4} roughness={0.3} transparent opacity={0.75} />
    </mesh>
  );
}

function Dot({ pos, color, bright }) {
  const ref = useRef();
  useFrame((_, dt) => {
    if (ref.current)
      ref.current.material.emissiveIntensity = THREE.MathUtils.damp(
        ref.current.material.emissiveIntensity, bright ? 2.2 : 0.9, 4, dt);
  });
  return (
    <mesh ref={ref} position={pos}>
      <sphereGeometry args={[bright ? 0.16 : 0.11, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9}
        metalness={0.3} roughness={0.35} />
    </mesh>
  );
}

function Rung({ posA, posB, color, label, active, onClick }) {
  const ref = useRef();
  const mid = [(posA[0]+posB[0])/2, (posA[1]+posB[1])/2, (posA[2]+posB[2])/2];
  const dir = new THREE.Vector3(...posB).sub(new THREE.Vector3(...posA));
  const len = dir.length();
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0), dir.normalize());

  useFrame((_, dt) => {
    if (ref.current)
      ref.current.material.emissiveIntensity = THREE.MathUtils.damp(
        ref.current.material.emissiveIntensity, active ? 2 : 0.35, 5, dt);
  });

  return (
    <group onClick={onClick} style={{ cursor: 'pointer' }}>
      <mesh ref={ref} position={mid} quaternion={quat}>
        <cylinderGeometry args={[active ? 0.07 : 0.032, active ? 0.07 : 0.032, len, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35}
          transparent opacity={active ? 1 : 0.55} />
      </mesh>
      <Html position={mid} center distanceFactor={11} style={{ pointerEvents: 'none' }}>
        <span style={{
          color: active ? color : 'rgba(255,255,255,0.38)',
          font: `${active ? 700 : 400} ${active ? 13 : 10}px system-ui`,
          whiteSpace: 'nowrap',
          textShadow: '0 0 8px #000',
          letterSpacing: active ? '0.04em' : 0,
          transition: 'all 0.25s',
        }}>{label}</span>
      </Html>
    </group>
  );
}

function DNAScene({ skills, activeIdx, onSelect }) {
  const groupRef = useRef();
  const { invalidate } = useThree();

  useFrame((_, dt) => {
    if (groupRef.current) { groupRef.current.rotation.y += dt * 0.3; invalidate(); }
  });

  const strandA = [], strandB = [];
  skills.forEach((_, i) => { const { a, b } = helixPos(i, skills.length); strandA.push(a); strandB.push(b); });

  return (
    <group ref={groupRef}>
      {strandA.length > 1 && <Strand positions={strandA} color="#e8c872" />}
      {strandB.length > 1 && <Strand positions={strandB} color="#60a5fa" />}
      {skills.map((skill, i) => {
        const { a, b } = helixPos(i, skills.length);
        const c = CATS[cat(skill)].color;
        const active = activeIdx === i;
        return (
          <group key={i}>
            <Dot pos={a} color="#e8c872" bright={active} />
            <Dot pos={b} color="#60a5fa" bright={active} />
            <Rung posA={a} posB={b} color={c} label={skill} active={active}
              onClick={() => onSelect(activeIdx === i ? null : i)} />
          </group>
        );
      })}
    </group>
  );
}

// ── main component ───────────────────────────────────────────
export default function SkillDNA() {
  const profile = useAuraStore(s => s.careerProfile);
  const [activeIdx, setActiveIdx] = useState(null);

  const skills = useMemo(() => {
    const raw = profile.skills || '';
    return raw.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 32).slice(0, 30);
  }, [profile.skills]);

  const activeCat  = activeIdx !== null ? cat(skills[activeIdx]) : null;
  const activeInfo = activeCat ? CATS[activeCat] : null;

  const breakdown = useMemo(() =>
    Object.entries(CATS).map(([key, info]) => ({
      ...info, key,
      count: skills.filter(s => cat(s) === key).length,
    })).filter(d => d.count > 0),
  [skills]);

  if (!skills.length) return (
    <section className="glass-strong rounded-3xl p-6">
      <p className="section-label">Skill DNA</p>
      <p className="mt-3 text-sm text-slate-400">
        Career World → Profile → Skills mein apni skills add karo (comma se alag karke).
      </p>
    </section>
  );

  return (
    <section className="glass-strong relative overflow-hidden rounded-3xl p-6">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full
        bg-[radial-gradient(circle,rgba(96,165,250,0.13),transparent_70%)]" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full
        bg-[radial-gradient(circle,rgba(232,200,114,0.10),transparent_70%)]" />

      <p className="section-label">Skill DNA</p>
      <h2 className="font-luxe mt-1 text-3xl font-semibold text-white">
        Tera <span className="text-gold">knowledge</span> ka DNA
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        {skills.length} skills · har rung ek skill hai · click karo detail dekhne ke liye
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_270px]">
        {/* ── 3D canvas ── */}
        <div className="h-[500px] overflow-hidden rounded-2xl border border-white/[0.08]">
          <Canvas camera={{ position: [0, 0, 11], fov: 48 }} dpr={[1, 1.5]}
            frameloop="always"
            gl={{ antialias: false, powerPreference: 'default', failIfMajorPerformanceCaveat: false }}
            onCreated={({ gl }) => {
              gl.domElement.addEventListener('webglcontextlost', e => e.preventDefault(), false);
            }}>
            <color attach="background" args={['#07070b']} />
            <ambientLight intensity={0.35} />
            <pointLight position={[6, 6, 6]}  color="#e8c872" intensity={18} distance={22} />
            <pointLight position={[-6,-6, 6]} color="#60a5fa" intensity={12} distance={22} />
            <DNAScene skills={skills} activeIdx={activeIdx} onSelect={setActiveIdx} />
            <OrbitControls enablePan={false} minDistance={6} maxDistance={20}
              maxPolarAngle={Math.PI * 0.85} />
            <EffectComposer>
              <Bloom intensity={1.0} luminanceThreshold={0.38} mipmapBlur />
            </EffectComposer>
          </Canvas>
        </div>

        {/* ── right panel ── */}
        <div className="space-y-4">
          {/* selected skill */}
          {activeIdx !== null ? (
            <div className="rounded-2xl border p-4 transition-all"
              style={{ borderColor: activeInfo.color + '55', background: activeInfo.color + '0e' }}>
              <p className="section-label">Selected</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl">{activeInfo.icon}</span>
                <h3 className="text-lg font-bold text-white">{skills[activeIdx]}</h3>
              </div>
              <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: activeInfo.color + '22', color: activeInfo.color }}>
                {activeInfo.label}
              </span>
              <ul className="mt-3 space-y-1 text-xs text-slate-300">
                {activeCat === 'frontend' && <>
                  <li>→ User-facing UI/UX banana</li>
                  <li>→ Browser mein code chalana</li>
                  <li>→ Performance & animation</li></>}
                {activeCat === 'backend' && <>
                  <li>→ REST / GraphQL APIs</li>
                  <li>→ Business logic & auth</li>
                  <li>→ Server-side processing</li></>}
                {activeCat === 'database' && <>
                  <li>→ Data store & retrieve</li>
                  <li>→ Queries optimize karna</li>
                  <li>→ Schema design</li></>}
                {activeCat === 'devops' && <>
                  <li>→ App deploy & host karna</li>
                  <li>→ CI/CD pipelines</li>
                  <li>→ Infrastructure manage</li></>}
                {activeCat === 'ai' && <>
                  <li>→ Intelligent apps banana</li>
                  <li>→ Automation workflows</li>
                  <li>→ LLM integration</li></>}
                {activeCat === 'other' && <>
                  <li>→ General problem solving</li>
                  <li>→ Cross-domain skill</li></>}
              </ul>
              <button onClick={() => setActiveIdx(null)}
                className="mt-3 text-[11px] text-slate-500 underline hover:text-slate-300">
                Deselect
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="section-label">Kaise use karein</p>
              <p className="mt-2 text-sm text-slate-300">
                DNA mein kisi bhi <span className="text-gold font-semibold">rung</span> pe click karo
                skill ka detail dekhne ke liye.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                🟡 Gold strand = expertise backbone<br />
                🔵 Blue strand = growth axis<br />
                Colored rungs = skill categories
              </p>
            </div>
          )}

          {/* breakdown */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="section-label">Skill Breakdown</p>
            <div className="mt-3 space-y-2.5">
              {breakdown.map(({ key, color, label, icon, count }) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-base">{icon}</span>
                  <span className="flex-1 text-xs text-slate-300">{label}</span>
                  <span className="w-5 text-right font-mono text-xs font-bold" style={{ color }}>
                    {count}
                  </span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(count / skills.length) * 100}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 font-mono text-[11px] text-slate-500">
              {skills.length} total · {breakdown.length} categories
            </p>
          </div>

          {/* motivational */}
          <div className="rounded-2xl border border-[rgba(232,200,114,0.2)] bg-[rgba(232,200,114,0.04)] p-4">
            <p className="text-xs font-semibold text-gold">AURA says:</p>
            <p className="mt-1 text-sm text-slate-300">
              {skills.length >= 15
                ? `${skills.length} skills — tu ek full-stack powerhouse hai! 🚀`
                : skills.length >= 8
                ? `${skills.length} skills solid hain. 5-7 aur add karo — T-shaped developer ban jao.`
                : `Foundation achha hai. Aur skills seekho — har nai skill ek naya door kholti hai.`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
