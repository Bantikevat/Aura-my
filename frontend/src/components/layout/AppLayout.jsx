import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import AssistantDock from '../AssistantDock';
import CosmicBackground from '../CosmicBackground';
import CyberCursor from '../CyberCursor';
import DimensionalIntro from '../DimensionalIntro';
import DailyBriefing from '../DailyBriefing';
import { useAuraStore } from '../../store/useAuraStore';
import { startAutoSync } from '../../lib/cloud';

export default function AppLayout() {
  const location = useLocation();
  const sidebarOpen = useAuraStore((s) => s.sidebarOpen);

  // Show dimensional warp portal on first opening or when triggered
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return !sessionStorage.getItem('aura-dimension-entered');
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const onWarp = () => setShowIntro(true);
    window.addEventListener('aura-warp-jump', onWarp);
    return () => window.removeEventListener('aura-warp-jump', onWarp);
  }, []);

  // Enable background cloud auto-backup (only acts while signed in and auto-sync is on).
  useEffect(() => { startAutoSync(); }, []);

  const handleIntroComplete = () => {
    try {
      sessionStorage.setItem('aura-dimension-entered', 'true');
    } catch { /* ignore */ }
    setShowIntro(false);
  };

  return (
    <div className="relative flex h-screen overflow-hidden text-slate-100 select-none">
      {/* 1. Cinematic Dimensional Warp Intro Gate */}
      <AnimatePresence>
        {showIntro && (
          <DimensionalIntro onComplete={handleIntroComplete} />
        )}
      </AnimatePresence>

      {/* 2. Interactive Cosmic Particle Cursor Trail */}
      <CyberCursor />

      {/* 3. 60fps Deep Space Starfield & Cyber Aura */}
      <CosmicBackground />

      {/* 4. Left Nav Sidebar */}
      <Sidebar />

      {/* 5. Main Content Area */}
      <div
        className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ml-0 ${
          sidebarOpen ? 'md:ml-[260px]' : 'md:ml-[72px]'
        }`}
      >
        <TopBar onTriggerWarp={() => setShowIntro(true)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {!showIntro && <DailyBriefing />}

      {/* 6. 3D JARVIS Holographic Core Assistant */}
      <AssistantDock />
    </div>
  );
}
