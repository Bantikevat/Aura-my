import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sfx } from '../lib/audioFx';

const BOSS_LIST = [
  {
    id: 'bug_titan',
    name: 'NullPointer Titan',
    avatar: '👾',
    title: 'Lord of Runtime Crashes',
    maxHp: 300,
    color: '#f43f5e',
    glow: 'rgba(244,63,94,0.3)',
    weakness: 'Safe Navigation & Guard Clauses',
  },
  {
    id: 'sql_behemoth',
    name: 'Syntax Glitcher',
    avatar: '🐉',
    title: 'Eater of Database Locks',
    maxHp: 350,
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.3)',
    weakness: 'Proper Indexes & Normalization',
  },
  {
    id: 'memory_leak',
    name: 'Memory Leaker Ω',
    avatar: '🤖',
    title: 'The Infinite RAM Consumer',
    maxHp: 400,
    color: '#06b6d4',
    glow: 'rgba(6,182,212,0.3)',
    weakness: 'Garbage Collection & Cleanups',
  },
];

const QUESTIONS = [
  {
    q: 'Database me Duplicate rows aur Anomaly rokne ke liye sabse zaroori kya hai?',
    options: ['Primary Key & Normalization', 'Hard Drive badalna', 'Restart karna', 'SELECT * query chalana'],
    ans: 0,
    dmg: 80,
    explanation: 'Primary Key har row ko uniquely identify karti hai aur Normalization data redundancy rokti hai!',
  },
  {
    q: 'Binary Search chalane ke liye array me kya shart honi chahiye?',
    options: ['Array Sorted hona chahiye', 'Array me sirf even numbers hon', 'Array size kam se kam 100 ho', 'Koi shart nahi hoti'],
    ans: 0,
    dmg: 75,
    explanation: 'Binary Search sirf SORTED data par chalta hai, tabhi har step me aadha data discard hota hai!',
  },
  {
    q: 'JavaScript me "===" aur "==" me kya fark hota hai?',
    options: ['"===" Type aur Value dono check karta hai', 'Dono bilkul same hain', '"==" sirf numbers ke liye hota hai', '"===" memory delete karta hai'],
    ans: 0,
    dmg: 85,
    explanation: '"===" strict equality hai jo data types bhi check karta hai bina type coercion ke.',
  },
  {
    q: 'E-commerce site par 10 Lakh products me se turant product dhoondhne ke liye kya use hota hai?',
    options: ['Database Index (B-Tree)', 'Ek-ek karke scan karna', 'Sabhi products ka printout', 'Page ko baar-baar reload karna'],
    ans: 0,
    dmg: 90,
    explanation: 'Index ki wajah se pure 10 lakh rows scan nahi karni padti, bas 15-20 jumps me data mil jata hai!',
  },
  {
    q: 'Stack data structure ka rule kaunsa hota hai?',
    options: ['LIFO (Last In First Out)', 'FIFO (First In First Out)', 'Random Access', 'Always Empty'],
    ans: 0,
    dmg: 70,
    explanation: 'Stack LIFO par chalta hai, jaise plate ke upar plate rakhna—aakhri plate pehle nikalti hai.',
  },
  {
    q: 'HTTP 404 Error ka matlab kya hota hai?',
    options: ['Page / Resource Not Found', 'Server Crash', 'Internet Disconnected', 'Password Wrong'],
    ans: 0,
    dmg: 65,
    explanation: '404 ka seedha matlab hai ki jo file ya URL maangi gayi hai wo server par maujood nahi hai.',
  },
  {
    q: 'React me component ke re-render hone par state maintain rakhne ke liye kya use hota hai?',
    options: ['useState Hook', 'var keyword', 'CSS file', 'HTML tag'],
    ans: 0,
    dmg: 80,
    explanation: 'useState hook React component ka state persist karta hai across renders!',
  },
  {
    q: 'ACID properties me "A" ka full form kya hai?',
    options: ['Atomicity (All or Nothing)', 'Accuracy', 'Automatic', 'Algorithms'],
    ans: 0,
    dmg: 90,
    explanation: 'Atomicity ka matlab transaction ya toh 100% complete hoga ya bilkul nahi hoga!',
  },
];

export default function StudyBossArena({ onGainXp }) {
  const [bossIdx, setBossIdx] = useState(0);
  const boss = BOSS_LIST[bossIdx];

  const [bossHp, setBossHp] = useState(boss.maxHp);
  const [playerHp, setPlayerHp] = useState(100);
  const [qIndex, setQIndex] = useState(0);
  const [combo, setCombo] = useState(0);
  const [shake, setShake] = useState(false);
  const [floatingDmg, setFloatingDmg] = useState(null);
  const [isWon, setIsWon] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const currentQ = QUESTIONS[qIndex % QUESTIONS.length];

  function attackBoss(selectedIdx) {
    if (selectedIdx === currentQ.ans) {
      // Hit Boss
      sfx.playLaser();
      setTimeout(() => sfx.playHit(), 100);

      const multiplier = combo > 1 ? 1 + combo * 0.2 : 1;
      const dmg = Math.round(currentQ.dmg * multiplier);
      const newBossHp = Math.max(0, bossHp - dmg);

      setBossHp(newBossHp);
      setCombo((c) => c + 1);
      setShake(true);
      setTimeout(() => setShake(false), 300);

      setFloatingDmg({ text: `-${dmg} HP!`, color: '#34d399', isCrit: combo > 1 });
      setTimeout(() => setFloatingDmg(null), 1200);

      onGainXp?.(dmg + (combo > 1 ? 20 : 0));

      setFeedback({ type: 'success', text: `💥 ZABARDAST HIT! ${currentQ.explanation}` });

      if (newBossHp === 0) {
        setIsWon(true);
        sfx.playLevelUp();
        onGainXp?.(200);
      } else {
        setTimeout(() => {
          setQIndex((q) => q + 1);
          setFeedback(null);
        }, 1400);
      }
    } else {
      // Boss attacks player
      sfx.playFail();
      setCombo(0);
      const hurt = 25;
      const newPlayerHp = Math.max(0, playerHp - hurt);
      setPlayerHp(newPlayerHp);

      setFloatingDmg({ text: `-${hurt} HP YOU!`, color: '#f43f5e', isCrit: false });
      setTimeout(() => setFloatingDmg(null), 1200);

      setFeedback({ type: 'error', text: `⚠️ GLITCH COUNTER-ATTACK! Sahi Jawab tha: "${currentQ.options[currentQ.ans]}". ${currentQ.explanation}` });

      if (newPlayerHp === 0) {
        setIsGameOver(true);
      } else {
        setTimeout(() => {
          setQIndex((q) => q + 1);
          setFeedback(null);
        }, 2200);
      }
    }
  }

  function resetBattle(nextBoss = false) {
    const nextIdx = nextBoss ? (bossIdx + 1) % BOSS_LIST.length : bossIdx;
    setBossIdx(nextIdx);
    setBossHp(BOSS_LIST[nextIdx].maxHp);
    setPlayerHp(100);
    setCombo(0);
    setIsWon(false);
    setIsGameOver(false);
    setFeedback(null);
    setQIndex((q) => q + 1);
  }

  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 via-[#0a071b] to-black p-5 sm:p-7 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
            </span>
            CYBER ARENA · BOSS BATTLE MODE
          </div>
          <h2 className="mt-2 font-display text-2xl font-black tracking-wide text-white sm:text-3xl">
            Battle of Concepts
          </h2>
          <p className="text-xs text-slate-400">
            Sahi answers se attack karo aur Boss ko harakar XP aur Cyber Gems jeeto!
          </p>
        </div>

        {/* Combo Multiplier badge */}
        <div className="flex items-center gap-3">
          {combo > 1 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5 rounded-xl border border-solar/40 bg-solar/20 px-3 py-1.5 text-xs font-black text-solar shadow-[0_0_15px_rgba(251,191,36,0.4)]"
            >
              <span>⚡</span> {combo}X COMBO MULTIPLIER!
            </motion.div>
          )}

          <button
            onClick={() => resetBattle(false)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10"
          >
            Restart Fight
          </button>
        </div>
      </div>

      {/* Battle Stage (Arena) */}
      <div className={`relative mt-6 rounded-2xl border border-white/[0.06] bg-black/40 p-5 transition-transform ${shake ? 'scale-[0.99] translate-x-1' : ''}`}>
        {/* Floating Damage Indicator */}
        <AnimatePresence>
          {floatingDmg && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.5 }}
              animate={{ opacity: 1, y: -40, scale: floatingDmg.isCrit ? 1.4 : 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute left-1/2 top-1/3 z-30 -translate-x-1/2 font-display text-3xl font-black drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
              style={{ color: floatingDmg.color }}
            >
              {floatingDmg.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Boss Display */}
        <div className="grid gap-6 sm:grid-cols-[1fr_auto_1fr] items-center">
          {/* Player HP */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-mint">🛡️ YOU (Cyber Cadet)</span>
              <span className="font-mono font-bold text-white">{playerHp} / 100 HP</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-mint to-cyan-400"
                animate={{ width: `${playerHp}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* VS Icon */}
          <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 font-display text-xs font-bold text-slate-400">
            VS
          </div>

          {/* Boss HP */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-400">
                {boss.avatar} {boss.name}
              </span>
              <span className="font-mono font-bold text-white">
                {bossHp} / {boss.maxHp} HP
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-500"
                animate={{ width: `${(bossHp / boss.maxHp) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* Boss Center Hologram */}
        <div className="my-6 flex flex-col items-center justify-center text-center">
          <motion.div
            animate={{
              y: [0, -8, 0],
              scale: isWon ? [1, 0] : [1, 1.05, 1],
              rotate: shake ? [-6, 6, -3, 3, 0] : 0,
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-24 w-24 items-center justify-center rounded-3xl border border-rose-500/40 bg-gradient-to-br from-rose-500/20 to-purple-600/20 text-5xl shadow-[0_0_40px_rgba(244,63,94,0.35)]"
          >
            {boss.avatar}
          </motion.div>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
            {boss.title}
          </p>
          <p className="text-[11px] text-slate-500">Weakness: {boss.weakness}</p>
        </div>

        {/* VICTORY OVERLAY */}
        {isWon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-mint/40 bg-mint/10 p-6 text-center"
          >
            <p className="text-4xl">🏆</p>
            <h3 className="mt-2 font-display text-2xl font-black text-mint">
              BOSS DEFEATED! VICTORY!
            </h3>
            <p className="mt-1 text-sm text-slate-300">
              Aapne Boss ko hara diya! You earned <b className="text-solar">+200 Bonus XP & 50 Cyber Gems!</b>
            </p>
            <button
              onClick={() => resetBattle(true)}
              className="mt-4 rounded-xl bg-mint px-6 py-2.5 text-sm font-bold text-slate-950 shadow-[0_0_20px_rgba(52,211,153,0.4)]"
            >
              Agla Boss Challenge Karo ➔
            </button>
          </motion.div>
        )}

        {/* GAME OVER OVERLAY */}
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-rose/40 bg-rose/10 p-6 text-center"
          >
            <p className="text-4xl">💀</p>
            <h3 className="mt-2 font-display text-2xl font-black text-rose">
              SHIELD DEPLETED!
            </h3>
            <p className="mt-1 text-sm text-slate-300">
              Boss ke attacks se aapki health khatam ho gayi. Fir se try karein!
            </p>
            <button
              onClick={() => resetBattle(false)}
              className="mt-4 rounded-xl bg-rose px-6 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]"
            >
              Revive & Retry Fight ⚡
            </button>
          </motion.div>
        )}

        {/* ACTIVE QUESTION & ATTACK BUTTONS */}
        {!isWon && !isGameOver && (
          <div className="mt-4">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-aurora">
                Battle Attack Question #{ (qIndex % QUESTIONS.length) + 1 }
              </span>
              <p className="mt-2 text-base font-semibold text-white sm:text-lg">
                {currentQ.q}
              </p>
            </div>

            {/* Answer Options as Weapon Attacks */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {currentQ.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => attackBoss(idx)}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 text-left text-sm text-slate-200 transition-all hover:border-violet-500/60 hover:bg-violet-950/30 hover:scale-[1.01] active:scale-[0.98]"
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 font-mono text-xs font-bold text-aurora group-hover:bg-violet-500/20 group-hover:text-white">
                    {['A', 'B', 'C', 'D'][idx]}
                  </span>
                  <span className="flex-1 font-medium">{opt}</span>
                  <span className="text-xs opacity-0 transition-opacity group-hover:opacity-100 text-violet-400">
                    ⚡ Attack
                  </span>
                </button>
              ))}
            </div>

            {/* Live Feedback */}
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 rounded-xl p-3 text-xs sm:text-sm font-medium ${
                  feedback.type === 'success'
                    ? 'border border-mint/40 bg-mint/10 text-mint'
                    : 'border border-rose/40 bg-rose/10 text-rose'
                }`}
              >
                {feedback.text}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
