import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sfx } from '../lib/audioFx';

export default function DimensionalIntro({ onComplete, autoStart = false }) {
  const [stage, setStage] = useState(0); // 0: standby, 1: scanning, 2: warp jump, 3: flash arrive
  const [telemetry, setTelemetry] = useState('STANDBY FOR DIMENSIONAL TRANSLATION');
  const canvasRef = useRef(null);

  // Hyperspace Warp Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const cx = width / 2;
    const cy = height / 2;
    const stars = Array.from({ length: 250 }, () => ({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: Math.random() * width,
      color: ['#06b6d4', '#e8c872', '#ffffff', '#a78bfa', '#f472b6'][Math.floor(Math.random() * 5)],
    }));

    const render = () => {
      ctx.fillStyle = 'rgba(6, 7, 13, 0.28)';
      ctx.fillRect(0, 0, width, height);

      const speed = stage === 2 ? 38 : 3.5;

      for (const s of stars) {
        s.z -= speed;
        if (s.z <= 0) {
          s.z = width;
          s.x = (Math.random() - 0.5) * width * 2;
          s.y = (Math.random() - 0.5) * height * 2;
        }

        const k = 250 / s.z;
        const px = s.x * k + cx;
        const py = s.y * k + cy;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const size = Math.max(0.5, (1 - s.z / width) * (stage === 2 ? 4 : 2.2));
          ctx.fillStyle = s.color;
          ctx.beginPath();

          if (stage === 2) {
            // Stretch into lightspeed warp streaks
            const prevK = 250 / (s.z + speed * 2.5);
            const prevPx = s.x * prevK + cx;
            const prevPy = s.y * prevK + cy;
            ctx.strokeStyle = s.color;
            ctx.lineWidth = size;
            ctx.moveTo(prevPx, prevPy);
            ctx.lineTo(px, py);
            ctx.stroke();
          } else {
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, [stage]);

  // Initiate Warp Jump Sequence
  function initiateWarp() {
    setStage(1);
    sfx.playLaser();
    setTelemetry('BIOMETRIC NEURAL SIGNATURE DETECTED · SYNCHRONIZING...');

    setTimeout(() => {
      setStage(2);
      sfx.playWarpJump();
      setTelemetry('HYPERSPACE WARP TUNNEL ACTIVE · ENTERING PARALLEL REALM 09');
    }, 1200);

    setTimeout(() => {
      setStage(3);
    }, 2800);

    setTimeout(() => {
      onComplete();
    }, 3500);
  }

  return (
    <div className="fixed inset-0 z-[100000] flex flex-col items-center justify-center overflow-hidden bg-[#05060b]">
      {/* 3D Warp Stars Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />

      {/* Flash Arrival Shockwave */}
      <AnimatePresence>
        {stage === 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-50 bg-gradient-to-tr from-cyan-400 via-amber-200 to-white"
          />
        )}
      </AnimatePresence>

      {/* Central Hologram Portal Gate */}
      <div className="relative z-10 flex flex-col items-center text-center p-6 max-w-xl">
        {/* Concentric Holographic Portal Rings */}
        <div className="relative flex h-48 w-48 items-center justify-center sm:h-64 sm:w-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/50 shadow-[0_0_35px_rgba(6,182,212,0.3)]"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-3 rounded-full border border-gold/60 shadow-[0_0_25px_rgba(232,200,114,0.4)]"
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.2, repeat: Infinity }}
            className="absolute inset-8 rounded-full bg-gradient-to-tr from-cyan-500/25 via-gold/30 to-purple-600/30 blur-xl"
          />

          {/* Central Portal Eye */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/40 bg-black/80 shadow-[0_0_40px_rgba(232,200,114,0.8)] backdrop-blur-md">
            <span className="font-display text-3xl font-black text-gold animate-pulse">
              {stage === 2 ? '⚡' : '✦'}
            </span>
          </div>
        </div>

        {/* Cinematic Title */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
          <p className="font-mono text-xs font-black tracking-[0.3em] text-cyan-400 uppercase">
            [ DIMENSIONAL WARP GATEWAY · PROTOCOL 2099 ]
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
            A U R A <span className="text-gold">N E X U S</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 font-medium">
            Dusri duniya ka futuristic command center. Real-world physical boundaries se aage.
          </p>
        </motion.div>

        {/* Live Telemetry Status */}
        <div className="mt-6 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-5 py-2 font-mono text-[11px] text-cyan-300 shadow-xl backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{telemetry}</span>
        </div>

        {/* Launch Button / Skip */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          {stage === 0 ? (
            <button
              onClick={initiateWarp}
              className="group relative flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-300 to-gold px-8 py-4 font-display text-sm font-black text-slate-950 shadow-[0_0_40px_rgba(6,182,212,0.6)] transition-all hover:scale-105 active:scale-95"
            >
              <span>🌀 ENTER THE OTHERWORLD</span>
              <span className="transition-transform group-hover:translate-x-1">➔</span>
            </button>
          ) : (
            <div className="font-mono text-xs font-bold text-gold animate-pulse tracking-widest">
              WARPING TO SECTOR 09...
            </div>
          )}

          <button
            onClick={onComplete}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs text-slate-400 hover:text-white"
          >
            Skip Intro
          </button>
        </div>
      </div>
    </div>
  );
}
