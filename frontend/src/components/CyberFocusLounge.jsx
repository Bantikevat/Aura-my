import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sfx } from '../lib/audioFx';

export default function CyberFocusLounge({ onGainXp }) {
  // Timer state
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('focus'); // 'focus' | 'break'
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  // Ambient sound state
  const [activeAmbient, setActiveAmbient] = useState(null); // null | 'rain' | 'space' | 'binaural'

  useEffect(() => {
    let interval = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsRunning(false);
      sfx.playLevelUp();
      if (mode === 'focus') {
        setSessionsCompleted((c) => c + 1);
        onGainXp?.(50);
        setMode('break');
        setSecondsLeft(5 * 60);
      } else {
        setMode('focus');
        setSecondsLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft, mode, onGainXp]);

  function toggleTimer() {
    sfx.playBleep();
    setIsRunning(!isRunning);
  }

  function resetTimer(newMinutes = 25, newMode = 'focus') {
    sfx.playBleep();
    setIsRunning(false);
    setMode(newMode);
    setSecondsLeft(newMinutes * 60);
  }

  function handleAmbient(type) {
    sfx.playBleep(true);
    if (activeAmbient === type) {
      sfx.stopAmbient();
      setActiveAmbient(null);
    } else {
      sfx.startAmbient(type);
      setActiveAmbient(type);
    }
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const totalSecs = mode === 'focus' ? 25 * 60 : 5 * 60;
  const progressPercent = ((totalSecs - secondsLeft) / totalSecs) * 100;

  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-[#07131e] to-black p-5 sm:p-7 shadow-[0_0_35px_rgba(6,182,212,0.12)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
            <span>🎧</span> CYBER LO-FI STUDY LOUNGE & POMODORO
          </div>
          <h2 className="mt-2 font-display text-2xl font-black text-white sm:text-3xl">
            Deep Focus Station
          </h2>
          <p className="text-xs text-slate-400">
            Ambient synth soundscapes ke saath bina distraction 25 minute padho aur XP earn karo!
          </p>
        </div>

        {/* Sessions Counter */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-right">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Sessions Done</p>
          <p className="font-mono text-lg font-bold text-cyan-400">🔥 {sessionsCompleted} Focus Blocks</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* TIMER COLUMN */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-black/40 p-6 text-center">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-1 text-xs font-semibold">
            <button
              onClick={() => resetTimer(25, 'focus')}
              className={`rounded-lg px-3 py-1.5 transition ${
                mode === 'focus' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              25m Focus Flow
            </button>
            <button
              onClick={() => resetTimer(5, 'break')}
              className={`rounded-lg px-3 py-1.5 transition ${
                mode === 'break' ? 'bg-mint text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              5m Cyber Chill
            </button>
          </div>

          {/* Big Clock Dial */}
          <div className="relative my-6 flex h-48 w-48 items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="h-full w-full -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="84"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="8"
              />
              <circle
                cx="96"
                cy="96"
                r="84"
                fill="none"
                stroke={mode === 'focus' ? '#06b6d4' : '#34d399'}
                strokeWidth="8"
                strokeDasharray={527.7}
                strokeDashoffset={527.7 - (527.7 * progressPercent) / 100}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-4xl font-black text-white tracking-wider">
                {timeFormatted}
              </span>
              <span className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-cyan-400">
                {mode === 'focus' ? (isRunning ? 'Flow State Active' : 'Ready to Focus') : 'Resting Eyes'}
              </span>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTimer}
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-black transition-transform active:scale-95 ${
                isRunning
                  ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                  : 'bg-cyan-400 text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.45)]'
              }`}
            >
              {isRunning ? '⏸ Pause' : '▶ Start Focus'}
            </button>
            <button
              onClick={() => resetTimer(mode === 'focus' ? 25 : 5, mode)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10"
            >
              ↺ Reset
            </button>
          </div>
        </div>

        {/* AMBIENT SOUNDSCAPE COLUMN */}
        <div className="flex flex-col justify-between rounded-2xl border border-white/[0.06] bg-black/40 p-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Live Ambient Audio Synthesizer
              </span>
              {/* Equalizer animation */}
              <div className="flex items-end gap-1 h-4">
                {[40, 90, 60, 100, 30].map((h, i) => (
                  <motion.span
                    key={i}
                    className="w-1 rounded-full bg-cyan-400"
                    animate={{
                      height: activeAmbient ? [`${h * 0.2}%`, `${h}%`, `${h * 0.4}%`] : '20%',
                    }}
                    transition={{
                      duration: 0.6 + i * 0.1,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Web Audio synthesizer se seedhe aapke browser me generated relax aur focus frequencies.
            </p>

            <div className="mt-4 space-y-3">
              <button
                onClick={() => handleAmbient('rain')}
                className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left text-sm transition ${
                  activeAmbient === 'rain'
                    ? 'border-cyan-400 bg-cyan-500/15 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🌧️</span>
                  <div>
                    <p className="font-bold">Neon Cyber Rain</p>
                    <p className="text-[11px] text-slate-400">Pink noise rain on neon glass window</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {activeAmbient === 'rain' ? 'ACTIVE 🔊' : 'PLAY ▶'}
                </span>
              </button>

              <button
                onClick={() => handleAmbient('space')}
                className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left text-sm transition ${
                  activeAmbient === 'space'
                    ? 'border-violet-400 bg-violet-500/15 text-white shadow-[0_0_15px_rgba(139,92,246,0.25)]'
                    : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🌌</span>
                  <div>
                    <p className="font-bold">Deep Space Cosmic Hum</p>
                    <p className="text-[11px] text-slate-400">65Hz low frequency sub-harmonic drone</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-violet-400">
                  {activeAmbient === 'space' ? 'ACTIVE 🔊' : 'PLAY ▶'}
                </span>
              </button>

              <button
                onClick={() => handleAmbient('binaural')}
                className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left text-sm transition ${
                  activeAmbient === 'binaural'
                    ? 'border-mint bg-mint/15 text-white shadow-[0_0_15px_rgba(52,211,153,0.25)]'
                    : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🧘</span>
                  <div>
                    <p className="font-bold">Alpha Wave Binaural (10Hz)</p>
                    <p className="text-[11px] text-slate-400">Focus enhancement for headphones</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-mint">
                  {activeAmbient === 'binaural' ? 'ACTIVE 🔊' : 'PLAY ▶'}
                </span>
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-center text-xs text-slate-400">
            💡 <b>Student Pro Tip:</b> 25-minute Pomodoro khatam hone par aapko <span className="text-solar font-bold">+50 XP</span> milega!
          </div>
        </div>
      </div>
    </section>
  );
}
