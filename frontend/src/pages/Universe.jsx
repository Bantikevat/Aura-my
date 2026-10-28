import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard, Environment, Float, Grid, MeshReflectorMaterial, OrbitControls, RoundedBox, Sparkles, Text as DreiText } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { useAuraStore, WORLDS } from '../store/useAuraStore';
import NewTaskModal from '../components/NewTaskModal';
import { sfx } from '../lib/audioFx';

// drei's Text fetches its font over the network and suspends; isolate it
function Text(props) {
  return <Suspense fallback={null}><DreiText {...props} /></Suspense>;
}

function VRSessionButton() {
  const { gl } = useThree();

  useEffect(() => {
    gl.xr.enabled = true;
    const button = VRButton.createButton(gl);
    button.className = 'aura-vr-button';
    document.body.appendChild(button);
    return () => button.remove();
  }, [gl]);

  return null;
}

// Thin gold border built from four slim boxes
function GoldFrame({ color }) {
  const bars = [[0, 1.65, 2.5, 0.03], [0, -1.45, 2.5, 0.03], [-1.25, 0.1, 0.03, 3.1], [1.25, 0.1, 0.03, 3.1]];
  return <group position={[0, 0, 0.13]}>
    {bars.map(([x, y, w, h], i) => <mesh key={i} position={[x, y, 0]}><boxGeometry args={[w, h, 0.02]} /><meshBasicMaterial color={color} /></mesh>)}
  </group>;
}

function HoloPortal({ world, index, count, taskCount, onEnter, active, setActive }) {
  const spread = THREE.MathUtils.lerp(-1.05, 1.05, count > 1 ? index / (count - 1) : 0.5);
  const group = useRef();
  const ring = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (ring.current) ring.current.rotation.z = clock.getElapsedTime() * 0.35;
    if (group.current) group.current.position.y = 0.4 + Math.sin(clock.getElapsedTime() * 1.4 + index) * 0.06;
  });

  const isActive = active === world.id || hovered;
  return <group ref={group} position={[Math.sin(spread) * 6.8, 0.4, -2 - Math.cos(spread) * 6.2]} rotation={[0, -spread, 0]}>
    <group
      onClick={(event) => {
        event.stopPropagation();
        sfx.playLaser();
        onEnter(world);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        setActive(world.id);
        sfx.playBleep(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        setActive(null);
        document.body.style.cursor = 'default';
      }}
    >
      <RoundedBox args={[2.5, 3.1, 0.22]} radius={0.15} smoothness={4} position={[0, 0.1, 0]}>
        <meshStandardMaterial color={world.color} emissive={world.color} emissiveIntensity={isActive ? 1.4 : 0.35} transparent opacity={0.25} metalness={0.65} roughness={0.2} />
      </RoundedBox>
      <GoldFrame color={isActive ? '#f6e3a1' : '#8a6d2b'} />
      <mesh ref={ring} position={[0, 0.1, 0.16]}>
        <torusGeometry args={[0.82, 0.035, 12, 48]} />
        <meshBasicMaterial color={world.color} transparent opacity={isActive ? 1 : 0.5} />
      </mesh>
      <mesh position={[0, 0.1, 0.1]}>
        <circleGeometry args={[0.78, 48]} />
        <meshBasicMaterial color={world.color} transparent opacity={isActive ? 0.35 : 0.13} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color={world.color} intensity={isActive ? 3.5 : 1.2} distance={5} />
      <Text position={[0, -1.25, 0.25]} fontSize={0.22} color="#f8fafc" anchorX="center">{world.name}</Text>
      <Text position={[0, -1.56, 0.25]} fontSize={0.11} color={world.color} anchorX="center">{taskCount} ACTIVE TASKS · CLICK TO ENTER</Text>
    </group>
  </group>;
}

// Centre-piece: polished gold knot orbited by thin rings
function AuraCore() {
  const knot = useRef();
  const ringA = useRef();
  const ringB = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (knot.current) { knot.current.rotation.x = t * 0.18; knot.current.rotation.y = t * 0.26; }
    if (ringA.current) ringA.current.rotation.z = t * 0.4;
    if (ringB.current) ringB.current.rotation.x = -t * 0.3;
  });
  return <Float speed={1.4} floatIntensity={0.35} rotationIntensity={0.05} position={[0, 1.55, -2.2]}>
    <mesh ref={knot}>
      <torusKnotGeometry args={[0.62, 0.17, 220, 32, 2, 3]} />
      <meshPhysicalMaterial color="#e8c872" metalness={1} roughness={0.12} clearcoat={1} clearcoatRoughness={0.05} envMapIntensity={1.8} />
    </mesh>
    <mesh ref={ringA} rotation={[1.2, 0, 0]}><torusGeometry args={[1.25, 0.012, 16, 160]} /><meshBasicMaterial color="#f6e3a1" /></mesh>
    <mesh ref={ringB} rotation={[0, 1.1, 0.4]}><torusGeometry args={[1.55, 0.008, 16, 160]} /><meshBasicMaterial color="#b8923a" /></mesh>
    <pointLight color="#f6e3a1" intensity={4} distance={7} />
  </Float>;
}

function CommandDesk() {
  return <group position={[0, -1.18, 0]}>
    <RoundedBox args={[3.1, 0.18, 1.25]} radius={0.08} smoothness={4}><meshStandardMaterial color="#1b1a22" metalness={0.7} roughness={0.25} /></RoundedBox>
    <RoundedBox args={[1.75, 0.9, 0.08]} radius={0.06} smoothness={4} position={[0, 0.62, -0.38]} rotation={[-0.18, 0, 0]}><meshStandardMaterial color="#13110d" emissive="#e8c872" emissiveIntensity={0.22} metalness={0.8} /></RoundedBox>
    <Text position={[0, 0.65, -0.32]} rotation={[-0.18, 0, 0]} fontSize={0.14} color="#e8c872" anchorX="center">AURA 3D COMMAND COCKPIT</Text>
    <pointLight position={[0, 0.75, 0.2]} color="#e8c872" intensity={1.5} distance={3} />
  </group>;
}

function TaskHologram({ task, index, selected, onSelect }) {
  const colors = { high: '#fb7185', medium: '#fbbf24', low: '#60a5fa' };
  const color = colors[task.priority] || colors.medium;
  const angle = index * 1.65 + 0.45;
  const position = [Math.cos(angle) * 4.6, -0.5 + (index % 2) * 0.55, -1.2 + Math.sin(angle) * 2.8];
  return <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.18} position={position} scale={0.8}>
    <group
      onClick={(event) => {
        event.stopPropagation();
        sfx.playBleep();
        onSelect(task.id);
      }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      <RoundedBox args={[2.25, 0.92, 0.12]} radius={0.09} smoothness={4}>
        <meshStandardMaterial color="#0e0e15" emissive={color} emissiveIntensity={selected ? 0.75 : 0.15} metalness={0.7} roughness={0.25} />
      </RoundedBox>
      <Billboard position={[0, 0, 0.09]}>
        <Text maxWidth={1.75} fontSize={0.14} lineHeight={1.2} color="#f8fafc" anchorX="center" anchorY="middle">{task.title}</Text>
        <Text position={[0, -0.37, 0.01]} fontSize={0.08} color={color} anchorX="center">{task.priority.toUpperCase()} · {task.due}</Text>
      </Billboard>
      <mesh position={[0, 0, -0.12]}><planeGeometry args={[2.7, 1.35]} /><meshBasicMaterial color={color} transparent opacity={selected ? 0.2 : 0.06} /></mesh>
      <pointLight color={color} intensity={selected ? 2.5 : 0.8} distance={3.5} />
    </group>
  </Float>;
}

function ImmersiveRoom({ onEnter, active, setActive, selectedTaskId, onSelectTask }) {
  const tasks = useAuraStore((state) => state.tasks);
  const activeTasks = tasks.filter((task) => task.status !== 'done');
  return <>
    <ambientLight intensity={0.35} />
    <color attach="background" args={['#06060a']} />
    <fog attach="fog" args={['#06060a', 9, 26]} />
    <Suspense fallback={null}><Environment preset="city" /></Suspense>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.3, 0]}>
      <planeGeometry args={[44, 44]} />
      <MeshReflectorMaterial blur={[300, 100]} resolution={512} mixBlur={1} mixStrength={42} mirror={0.5} roughness={1} depthScale={1.2} minDepthThreshold={0.4} maxDepthThreshold={1.4} color="#0a0a0f" metalness={0.6} />
    </mesh>
    <Grid position={[0, -1.28, 0]} args={[30, 30]} cellSize={0.5} cellThickness={0.45} cellColor="#3b3220" sectionSize={3} sectionThickness={0.9} sectionColor="#b8923a" fadeDistance={22} fadeStrength={1.2} infiniteGrid />
    <mesh position={[0, 4, -7]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[22, 10]} /><meshBasicMaterial color="#0d0c11" transparent opacity={0.62} /></mesh>
    <Sparkles count={150} scale={[17, 7, 12]} size={1.8} speed={0.25} color="#e8c872" />
    <AuraCore />
    <Float speed={1} rotationIntensity={0.1} floatIntensity={0.15}><CommandDesk /></Float>
    <Text position={[0, 4.15, -3.7]} fontSize={0.5} color="#f6e3a1" anchorX="center" anchorY="middle" outlineWidth={0.004} outlineColor="#b8923a">A U R A</Text>
    <Text position={[0, 3.7, -3.7]} fontSize={0.12} letterSpacing={0.12} color="#a89a78" anchorX="center">3D SPATIAL MISSION ROOM · VIRTUAL UNIVERSE</Text>
    {WORLDS.filter((world) => world.id !== 'hub').map((world, index, list) => <HoloPortal key={world.id} world={world} index={index} count={list.length} taskCount={tasks.filter((task) => task.worldId === world.id && task.status !== 'done').length} onEnter={onEnter} active={active} setActive={setActive} />)}
    {activeTasks.map((task, index) => <TaskHologram key={task.id} task={task} index={index} selected={task.id === selectedTaskId} onSelect={onSelectTask} />)}
    <OrbitControls target={[0, 0.6, -2]} minDistance={5} maxDistance={15} maxPolarAngle={Math.PI * 0.48} enablePan={false} minAzimuthAngle={-1.1} maxAzimuthAngle={1.1} />
    <EffectComposer multisampling={4}>
      <Bloom intensity={0.85} luminanceThreshold={0.55} luminanceSmoothing={0.25} mipmapBlur />
      <Vignette eskil={false} offset={0.2} darkness={0.75} />
    </EffectComposer>
  </>;
}

export default function Universe() {
  const navigate = useNavigate();
  const [active, setActive] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const viewMode = useAuraStore((state) => state.viewMode);
  const tasks = useAuraStore((state) => state.tasks);
  const completeTask = useAuraStore((state) => state.completeTask);
  const addTask = useAuraStore((state) => state.addTask);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId && task.status !== 'done');

  if (viewMode === 'panel') {
    return <div><header className="mb-6"><p className="section-label">AURA Spaces</p><h1 className="mt-2 font-display text-2xl font-bold">Virtual Universe</h1><p className="mt-1 text-sm text-slate-400">Switch to 3D to enter the immersive Command Room.</p></header><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{WORLDS.map((world) => <button key={world.id} onClick={() => navigate(world.path)} className="world-card text-left" style={{ '--world-glow': world.glowColor }}><div className="relative z-10"><p className="font-display text-base font-semibold text-white">{world.name}</p><p className="mt-1 text-xs text-slate-500">{world.subtitle}</p><p className="mt-4 text-xs" style={{ color: world.color }}>{tasks.filter((task) => task.worldId === world.id && task.status !== 'done').length} active tasks</p></div></button>)}</div></div>;
  }

  return (
    <div className="relative -m-6 lg:-m-8" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Three.js 3D Canvas */}
      <Canvas camera={{ position: [0, 1.4, 10], fov: 55 }} dpr={[1, 1.75]} gl={{ antialias: true }}>
        <VRSessionButton />
        <ImmersiveRoom onEnter={(world) => navigate(world.path)} active={active} setActive={setActive} selectedTaskId={selectedTaskId} onSelectTask={setSelectedTaskId} />
      </Canvas>

      {/* TOP LEFT: TITLE & WHAT IS THIS BUTTON */}
      <div className="absolute left-6 top-6 z-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-black text-gold">
          <span>🌌</span> 3D SPATIAL MISSION COCKPIT
        </div>
        <h1 className="mt-2 font-display text-2xl sm:text-3xl font-black text-white">
          AURA Command Universe
        </h1>
        <p className="text-xs text-slate-300">
          3D room me ghoomein, portals me enter karein ya floating tasks complete karein.
        </p>

        <button
          onClick={() => {
            sfx.playBleep();
            setShowHelp((v) => !v);
          }}
          className="mt-3 flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-950/40 px-3 py-1.5 text-xs font-bold text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] backdrop-blur-md transition hover:bg-cyan-500/20"
        >
          <span>❓</span> {showHelp ? 'Hide Guide' : 'Yeh Room Kaise Use Karein? (Click Here)'}
        </button>
      </div>

      {/* WHAT IS THIS ROOM MODAL / TOOLTIP */}
      {showHelp && (
        <div className="absolute left-6 top-36 z-30 w-[min(380px,calc(100vw-48px))] rounded-2xl border border-cyan-500/40 bg-black/90 p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <h3 className="font-display text-sm font-bold text-cyan-300">🛸 3D Universe Room Ka Use:</h3>
            <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-200">
            <p>
              🚪 <b>1. Glowing Portals (Darwaze):</b> Saamne 5 glowing gate khade hain (Career, Study, Projects, Life, Knowledge). Kisi bhi portal par click karo aur aap seedha us world me enter ho jaoge!
            </p>
            <p>
              📦 <b>2. Floating Task Blocks:</b> Hawa me tairte hue cards aapke actual to-do tasks hain. Kisi bhi card par click karke aap usko 3D me hi <b>"Complete"</b> kar sakte ho!
            </p>
            <p>
              🖱️ <b>3. 360° Mouse Controls:</b> Mouse daba kar ghumao, pura 3D room ghoomega. Scroll wheel se zoom-in / zoom-out hota hai!
            </p>
          </div>
        </div>
      )}

      {/* TOP RIGHT: CREATE TASK & MISSION COUNTER */}
      <div className="absolute right-6 top-6 z-20 flex items-center gap-2">
        <button
          onClick={() => {
            sfx.playBleep();
            setCreating(true);
          }}
          className="rounded-xl bg-gradient-to-r from-ice to-cyan-400 px-4 py-2 text-xs font-black text-slate-950 shadow-[0_0_20px_rgba(96,165,250,0.35)] transition hover:scale-105 active:scale-95"
        >
          + Create Task
        </button>
        <span className="rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2 text-xs font-mono font-bold text-slate-300 backdrop-blur-md">
          {tasks.filter((t) => t.status !== 'done').length} Missions Active
        </span>
      </div>

      {/* BOTTOM CENTER: QUICK TELEPORT DOCK */}
      <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/70 px-4 py-2.5 shadow-2xl backdrop-blur-xl">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
          Teleport:
        </span>
        {WORLDS.filter((w) => w.id !== 'hub').map((w) => (
          <button
            key={w.id}
            onClick={() => {
              sfx.playLaser();
              navigate(w.path);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:border-cyan-400 hover:bg-cyan-500/15 hover:text-white active:scale-95"
          >
            <span style={{ color: w.color }}>{w.icon}</span>
            <span>{w.name}</span>
          </button>
        ))}
      </div>

      {/* BOTTOM RIGHT: SELECTED TASK CARD DETAIL */}
      {selectedTask && (
        <div className="absolute bottom-20 right-6 z-30 w-[min(360px,calc(100vw-48px))] rounded-2xl border border-cyan-400/40 bg-black/95 p-5 shadow-[0_0_40px_rgba(6,182,212,0.3)] backdrop-blur-xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-cyan-400">
            SELECTED 3D MISSION
          </p>
          <h2 className="mt-1 font-display text-base font-bold text-white">
            {selectedTask.title}
          </h2>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>World: <b className="text-white">{WORLDS.find((w) => w.id === selectedTask.worldId)?.name}</b></span>
            <span>Due: <b className="text-amber-300">{selectedTask.due}</b></span>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                sfx.playSuccess();
                completeTask(selectedTask.id);
                setSelectedTaskId(null);
              }}
              className="flex-1 rounded-xl bg-gradient-to-r from-mint to-cyan-400 py-2.5 text-xs font-black text-slate-950 shadow-[0_0_15px_rgba(52,211,153,0.4)]"
            >
              ✓ Complete Mission
            </button>
            <button
              onClick={() => {
                sfx.playBleep();
                setSelectedTaskId(null);
              }}
              className="rounded-xl border border-white/10 px-3 py-2.5 text-xs text-slate-300 hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* New task modal */}
      {creating && <NewTaskModal onClose={() => setCreating(false)} onCreate={addTask} />}
    </div>
  );
}
