import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuraStore, WORLDS } from '../../store/useAuraStore';
import { sfx } from '../../lib/audioFx';
import { loadAuth, lockSession } from '../../lib/auth';
import CloudSync from '../CloudSync';

export default function TopBar({ onTriggerWarp }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { getFormattedDate, getFormattedTime, viewMode, setViewMode, toggleSidebar } = useAuraStore();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cloudOpen, setCloudOpen] = useState(false);

  // Find current world
  const currentWorld = WORLDS.find((w) => w.path === location.pathname) || WORLDS[0];
  const isUniverse = location.pathname === '/universe';

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) sfx.playSuccess();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/[0.08] bg-black/40 px-3 sm:px-6 backdrop-blur-xl">
      {/* Left — hamburger (mobile) + breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Hamburger: only on mobile */}
        <button
          onClick={toggleSidebar}
          className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.07] transition"
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="relative flex h-3 w-3">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ backgroundColor: isUniverse ? '#e8c872' : currentWorld.color }}
          />
          <span
            className="relative inline-flex h-3 w-3 rounded-full shadow-[0_0_10px_currentColor]"
            style={{ backgroundColor: isUniverse ? '#e8c872' : currentWorld.color, color: isUniverse ? '#e8c872' : currentWorld.color }}
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black tracking-wide text-white">
              {isUniverse ? 'Virtual Universe' : currentWorld.name}
            </h2>
            <span className="rounded-full border border-mint/30 bg-mint/10 px-2 py-0.5 text-[9px] font-mono font-bold text-mint">
              SYS-OK
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isUniverse ? 'Spatial Mission Radar' : currentWorld.subtitle}
          </p>
        </div>
      </div>

      {/* Center — search & Quick AI trigger */}
      <div className="hidden md:block">
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search tasks, worlds, cyber missions..."
            className="w-72 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-500 outline-none transition-all focus:w-96 focus:border-cyan-400/50 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] text-slate-400">
            Ctrl + K
          </kbd>
        </div>
      </div>

      {/* Right — controls */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Dimensional Warp Jump Button */}
        <button
          onClick={() => {
            sfx.playLaser();
            if (onTriggerWarp) onTriggerWarp();
            else window.dispatchEvent(new CustomEvent('aura-warp-jump'));
          }}
          title="Warp Jump"
          className="flex items-center gap-1 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-950/40 to-purple-950/40 px-2 sm:px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition hover:scale-105 active:scale-95"
        >
          <span className="animate-spin [animation-duration:10s]">🌀</span>
          <span className="hidden sm:inline text-[10px]">WARP</span>
        </button>

        {/* Cloud Sync — hidden on very small screens */}
        <button
          onClick={() => { setCloudOpen(true); sfx.playBleep(); }}
          title="Cloud Sync"
          className="hidden sm:flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-400 transition hover:bg-cyan-500/20"
        >
          <span>☁️</span>
          <span className="hidden lg:inline text-[10px]">SYNC</span>
        </button>

        {/* Sound FX Toggle — hidden on small screens */}
        <button
          onClick={toggleSound}
          title={soundEnabled ? 'SFX On' : 'SFX Off'}
          className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-mono font-bold transition ${
            soundEnabled
              ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'border-white/10 bg-white/[0.02] text-slate-500'
          }`}
        >
          <span>{soundEnabled ? '🔊' : '🔇'}</span>
        </button>

        {/* View toggle */}
        <div className="hidden sm:flex rounded-xl border border-white/[0.08] bg-black/40 p-0.5 text-xs font-bold">
          <button
            onClick={() => {
              setViewMode('3d');
              sfx.playBleep();
            }}
            className={`rounded-lg px-3 py-1 transition-all ${
              viewMode === '3d'
                ? 'bg-gradient-to-r from-ice to-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(96,165,250,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3D
          </button>
          <button
            onClick={() => {
              setViewMode('panel');
              sfx.playBleep();
            }}
            className={`rounded-lg px-3 py-1 transition-all ${
              viewMode === 'panel'
                ? 'bg-gradient-to-r from-ice to-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(96,165,250,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            HUD
          </button>
        </div>

        {/* Date/time with Cyber Telemetry */}
        <div className="hidden text-right lg:block">
          <p className="font-mono text-[10px] tracking-widest text-slate-400">
            {getFormattedDate()}
          </p>
          <p className="font-mono text-[10px] font-bold tracking-widest text-cyan-400">
            {getFormattedTime()} UTC+5.5
          </p>
        </div>

        {/* User avatar with status ring */}
        <div className="relative">
          <button onClick={() => { lockSession(); window.dispatchEvent(new Event('aura-lock')); }} title="Lock AURA" aria-label="Lock AURA" className="flex h-8 w-8 items-center justify-center rounded-xl border border-gold/40 bg-gradient-to-br from-gold/30 to-purple-600/30 text-xs font-black text-white shadow-[0_0_15px_rgba(232,200,114,0.3)]">
            {(loadAuth()?.name || 'S').charAt(0).toUpperCase()}
          </button>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-black bg-mint" />
        </div>
      </div>

      {cloudOpen && <CloudSync onClose={() => setCloudOpen(false)} />}
    </header>
  );
}
