import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sfx } from '../lib/audioFx';
import { ASSISTANT_URL } from '../lib/assistant';

// Pre-cached high-voltage topics for instant 0ms access
const PRESETS = [
  {
    topic: 'Database Deadlock',
    oneLineHook: "Jab do process ek doosre ke resources pe 'atke' reh jaayen, forever wala JAAM!",
    crazyStory: "Imagine, bhai, ek narrow crossroads pe do auto-rickshaw aamne-saamne aa gaye. Pehla bolta hai 'Tu pehle peeche kar', doosra bolta hai 'Tu pehle peeche kar'. Dono horn baja rahe hain, koi nahi hil raha, road permanently block! Yahi hai computer me Deadlock!",
    disasterScenario: {
      title: 'Bina iske kya tabahi machegi?',
      chaos: 'Socho aap UPI se dost ko ₹500 bhej rahe ho aur wo bhi same second aapko ₹500 bhej raha hai. Dono ke bank accounts lock ho gaye, na paise gaye na wapas aaye! Lakhs of UPI payments freeze ho jaati!',
      withIt: 'Database me Deadlock Detector hota hai jo ek auto ko bolta hai "Bhai tu side lele, doosre ko nikalne de" (Rollback & Retry), aur system bina crash hue smooth chalta hai!'
    },
    feynmanAnalogy: 'Do bache ek room me hain. Ek ke paas Pencil hai, doosre ke paas Eraser. Dono bolte hain jab tak tu apna saman nahi dega, main apna nahi dunga. Dono chupchap baithe reh gaye!',
    coreConcept: 'Circular Waiting: Transaction A needs resource held by B, and B needs resource held by A.',
    memoryTrigger: 'DO RESOURCE, DO CLIENT, DONO WAITING = DEADLOCK!',
    quickCheck: {
      question: 'Deadlock ki sabse mukhya wajah kya hoti hai?',
      options: ['Circular Waiting (Dono ek-doosre ke lock khulne ka intezaar karte hain)', 'Computer ka fan band hona', 'Internet slow hona', 'Password bhool jana'],
      ans: 0,
      why: 'Dono process circular dependency me fas jaate hain, isliye circular waiting deadlock ka core reason hai.'
    }
  },
  {
    topic: 'Binary Search',
    oneLineHook: '1000 panno ki dictionary me se shabd 10 second me nikalne ka super-hack!',
    crazyStory: "Agar aapko dictionary me 'Mango' dhoondhna ho, toh kya aap Page 1 se ek-ek panna palatte ho? Bilkul nahi! Aap theek beech me kholte ho. Agar wahan 'Parrot' aaya, toh samajh gaye ki Mango pichhle aadhe hisse me hai—aage ke 500 panne seedha raddi ki tarah discard!",
    disasterScenario: {
      title: 'Bina iske kya tabahi machegi?',
      chaos: 'Instagram par 200 crore users hain. Agar bina binary search ke kisi dost ka username search karte, toh phone 2 ghante ghoomta aur battery khatam ho jati!',
      withIt: 'Sorted binary search se 200 crore me se bhi sirf 31 jumps me sahi dost ki profile mil jati hai!'
    },
    feynmanAnalogy: 'Aap kisi se number guess karwate ho: "50 se bada ya chota?" Wo bolta hai "Bada", toh aap 1 se 50 ko turant dimag se nikaal dete ho!',
    coreConcept: 'Divide and Conquer: Data sorted hona chahiye, har step me remaining search space 50% kat jati hai.',
    memoryTrigger: 'SORTED HAI? BEECH ME KHOLO AUR AADHA PHENK DO!',
    quickCheck: {
      question: '10,00,000 items me se item dhoondhne ke liye Binary Search ko maximum kitne checks lagte hain?',
      options: ['Sirf lagbhag 20 checks!', '10,00,000 checks', '5,00,000 checks', '1,000 checks'],
      ans: 0,
      why: '2^20 lagbhag 10 lakh hota hai, isliye max 20 comparisons me answer mil jata hai (Log2 N).'
    }
  },
  {
    topic: 'ACID Properties (Databases)',
    oneLineHook: 'ATM se paise nikalne aur katne ka "Kasam Khuda Ki" 100% guarantee rule!',
    crazyStory: "Aap ATM me khade ho. Machine ne ₹2000 count kiya, tabhi bijli chali gayi! Agar database me ACID na hota, toh aapke account se ₹2000 kat jaate aur haath me kuch na aata! ACID bolta hai: 'Ya toh pura transaction hoga, ya kuch nahi hoga!'",
    disasterScenario: {
      title: 'Bina iske kya tabahi machegi?',
      chaos: 'Banks me roz hazaron crashes aur duplicate payments hoti. Ek banda ₹500 bhejta, samne wale ke paas 5 baar ₹500 chale jaate aur bank diwala nikal jata!',
      withIt: 'ACID ke rollback aur WAL (Write-Ahead Logging) se crash ke baad bhi 1 rupye ka bhi hisaab galat nahi hota!'
    },
    feynmanAnalogy: 'Online shopping me jab tak Payment, Address aur Order confirm nahi hota, tab tak transaction poora nahi maana jata.',
    coreConcept: 'Atomicity (All or nothing), Consistency (Rules valid), Isolation (No interference), Durability (Saved permanently).',
    memoryTrigger: 'A = ALL OR NOTHING, C = CORRECT RULES, I = ISOLATED, D = DAMAGE PROOF!',
    quickCheck: {
      question: 'Atomicity ka kya matlab hota hai?',
      options: ['Ya toh saare steps 100% complete honge, ya ek bhi nahi hoga', 'Database bohot tez chalega', 'Database ka size chota hoga', 'Password encrypt hoga'],
      ans: 0,
      why: 'Atomicity ka seedha matlab: All or Nothing. Beech me rukne par roll back ho jata hai.'
    }
  }
];

export default function NeuroMemoryLock({ onGainXp }) {
  const [activeTopic, setActiveTopic] = useState(PRESETS[0]);
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Retention progress (25% -> 50% -> 75% -> 100%)
  const [step, setStep] = useState(1);
  const [quizAnswered, setQuizAnswered] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  async function fetchCustomMemoryLock(topicName) {
    const q = topicName || customInput.trim();
    if (!q) return;

    // Check if in presets
    const found = PRESETS.find((p) => p.topic.toLowerCase() === q.toLowerCase());
    if (found) {
      setActiveTopic(found);
      setStep(1);
      setQuizAnswered(null);
      setIsLocked(false);
      sfx.playSuccess();
      return;
    }

    setLoading(true);
    setError('');
    sfx.playLaser();

    try {
      const res = await fetch(`${ASSISTANT_URL}/neuro-lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: q })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'AI error');
      setActiveTopic(data);
      setStep(1);
      setQuizAnswered(null);
      setIsLocked(false);
      setCustomInput('');
      sfx.playSuccess();
    } catch (e) {
      setError(e.message || 'Could not generate memory lock. Check if server is running.');
      sfx.playFail();
    } finally {
      setLoading(false);
    }
  }

  function advanceStep(nextStep) {
    sfx.playBleep(true);
    setStep(nextStep);
  }

  function handleQuiz(idx) {
    if (idx === activeTopic.quickCheck.ans) {
      sfx.playSuccess();
      setQuizAnswered({ correct: true, text: `🎉 BINGO! Sahi Jawab! ${activeTopic.quickCheck.why}` });
      setIsLocked(true);
      sfx.playLevelUp();
      onGainXp?.(100);
    } else {
      sfx.playFail();
      setQuizAnswered({
        correct: false,
        text: `⚠️ Galat prediction! Sahi answer tha: "${activeTopic.quickCheck.options[activeTopic.quickCheck.ans]}". ${activeTopic.quickCheck.why}`
      });
    }
  }

  const retentionPercent = isLocked ? 100 : step * 25;

  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/25 via-[#130d06] to-black p-5 sm:p-7 shadow-[0_0_40px_rgba(245,158,11,0.15)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-400">
            <span>🧠</span> 500X PERMANENT MEMORY ENGRAVER · LIFE-LOCK ENGINE
          </div>
          <h2 className="mt-2 font-display text-2xl font-black text-white sm:text-3xl">
            Zindagi Bhar Ke Liye Yaad Karne Ka Engine
          </h2>
          <p className="text-xs text-slate-400">
            Bina ratta maare: Crazy Real-Life Analogy + Disaster Scenario + Active Recall se dimag me permanently lock karo!
          </p>
        </div>

        {/* Brain Retention Meter */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 px-5 py-3 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Brain Retention Strength
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-2xl font-black text-gold">
              {retentionPercent}%
            </span>
            <span className="text-xs font-bold text-slate-300">
              {isLocked ? '🔒 LOCKED FOR LIFE' : '⏳ ENGRAVING...'}
            </span>
          </div>
        </div>
      </div>

      {/* TOPIC SEARCH & PRESETS */}
      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Fast 0ms Pre-loads:</span>
          {PRESETS.map((p) => (
            <button
              key={p.topic}
              onClick={() => {
                setActiveTopic(p);
                setStep(1);
                setQuizAnswered(null);
                setIsLocked(false);
                sfx.playBleep();
              }}
              className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                activeTopic.topic === p.topic
                  ? 'border-gold bg-gold/20 text-gold shadow-[0_0_15px_rgba(232,200,114,0.3)]'
                  : 'border-white/[0.08] bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
              }`}
            >
              ⚡ {p.topic}
            </button>
          ))}
        </div>

        {/* AI Custom Input */}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCustomMemoryLock()}
            placeholder="Type ANY custom topic (e.g. Recursion, Pointer, DNS, Git Rebase, Quantum Physics)..."
            className="field flex-1 text-sm bg-black/40 border-white/10 text-white placeholder-slate-500 focus:border-gold"
          />
          <button
            onClick={() => fetchCustomMemoryLock()}
            disabled={loading || !customInput.trim()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 px-5 py-2.5 text-sm font-black text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.35)] disabled:opacity-40"
          >
            {loading ? 'AI Engraving…' : '✨ 500x AI Lock'}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
      </div>

      {/* ACTIVE MEMORY LOCK CARD */}
      <div className="mt-6 rounded-2xl border border-white/[0.08] bg-black/50 p-6">
        {/* Topic Title & Hook */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gold">
              TOPIC IN FOCUS
            </span>
            <h3 className="text-2xl font-black text-white">{activeTopic.topic}</h3>
            <p className="mt-1 text-sm font-semibold text-amber-300">
              💡 {activeTopic.oneLineHook}
            </p>
          </div>

          {/* Stepper indicators */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <span
                key={s}
                className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                  s === step
                    ? 'bg-gold text-slate-950 ring-2 ring-gold/40'
                    : s < step || isLocked
                    ? 'bg-mint text-slate-950'
                    : 'bg-white/5 text-slate-500'
                }`}
              >
                {s < step || isLocked ? '✓' : s}
              </span>
            ))}
          </div>
        </div>

        {/* STEP-BY-STEP NEURAL RETENTION PATHWAY */}
        <div className="mt-6 space-y-6">
          {/* STEP 1: CRAZY MENTAL CINEMA */}
          <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-r from-purple-950/25 to-transparent p-5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-400">
              <span>🎬 PHASE 1 · UNFORGETTABLE MENTAL CINEMA</span>
            </div>
            <h4 className="mt-2 text-base font-bold text-white">
              Imagine This Funny / Dramatic Scene:
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">
              {activeTopic.crazyStory}
            </p>
            {step === 1 && (
              <button
                onClick={() => advanceStep(2)}
                className="mt-4 rounded-xl bg-purple-500 px-4 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
              >
                Samajh aa gaya! Next: Disaster Scenario ➔
              </button>
            )}
          </div>

          {/* STEP 2: REAL-LIFE DISASTER SCENARIO */}
          {step >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-rose-500/25 bg-gradient-to-r from-rose-950/25 to-transparent p-5"
            >
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-400">
                <span>💥 PHASE 2 · THE HIGH-STAKES DISASTER</span>
              </div>
              <h4 className="mt-2 text-base font-bold text-white">
                {activeTopic.disasterScenario?.title || 'Bina iske kya tabahi machegi?'}
              </h4>
              <div className="mt-3 rounded-xl bg-rose-500/10 p-3.5 border border-rose-500/20">
                <p className="text-xs font-bold text-rose-300">🔥 CATASTROPHE IN REAL SYSTEMS:</p>
                <p className="mt-1 text-sm text-slate-200 leading-relaxed">
                  {activeTopic.disasterScenario?.chaos}
                </p>
              </div>
              <div className="mt-3 rounded-xl bg-mint/10 p-3.5 border border-mint/20">
                <p className="text-xs font-bold text-mint">🛡️ HOW THIS CONCEPT SAVES MILLIONS:</p>
                <p className="mt-1 text-sm text-slate-200 leading-relaxed">
                  {activeTopic.disasterScenario?.withIt}
                </p>
              </div>
              {step === 2 && (
                <button
                  onClick={() => advanceStep(3)}
                  className="mt-4 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                >
                  Clear ho gaya! Next: Feynman Hook ➔
                </button>
              )}
            </motion.div>
          )}

          {/* STEP 3: FEYNMAN EXPLANATION & GOLDEN MANTRA */}
          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-cyan-500/25 bg-gradient-to-r from-cyan-950/25 to-transparent p-5"
            >
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-400">
                <span>🧒 PHASE 3 · FEYNMAN TEST (10-YEAR-OLD EXPLANATION)</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">
                "{activeTopic.feynmanAnalogy}"
              </p>

              {/* Memory Trigger Box */}
              <div className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-gold">
                  ⚡ LIFE-TIME MEMORY TRIGGER MANTRA
                </p>
                <p className="mt-1 font-mono text-base font-black text-white sm:text-lg">
                  "{activeTopic.memoryTrigger}"
                </p>
              </div>

              {step === 3 && (
                <button
                  onClick={() => advanceStep(4)}
                  className="mt-4 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  Final Lock Test: Answer 1 Question ➔
                </button>
              )}
            </motion.div>
          )}

          {/* STEP 4: RETRIEVAL QUIZ & PERMANENT LOCK */}
          {step >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-gold/30 bg-black/40 p-5"
            >
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gold">
                <span>🔒 PHASE 4 · PERMANENT NEURAL RETRIEVAL TEST</span>
              </div>
              <h4 className="mt-2 text-base font-bold text-white">
                {activeTopic.quickCheck?.question}
              </h4>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {activeTopic.quickCheck?.options?.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuiz(i)}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left text-sm text-slate-300 transition hover:border-gold hover:bg-gold/10 hover:text-white"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 font-mono text-xs font-bold text-gold">
                      {['A', 'B', 'C', 'D'][i]}
                    </span>
                    <span className="flex-1 font-medium">{opt}</span>
                  </button>
                ))}
              </div>

              {quizAnswered && (
                <div
                  className={`mt-4 rounded-xl p-4 text-sm font-semibold ${
                    quizAnswered.correct
                      ? 'border border-mint/40 bg-mint/10 text-mint'
                      : 'border border-rose/40 bg-rose/10 text-rose'
                  }`}
                >
                  {quizAnswered.text}
                </div>
              )}

              {/* PERMANENT MEMORY CERTIFICATE */}
              {isLocked && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 rounded-2xl border border-gold bg-gradient-to-br from-gold/20 via-[#181204] to-black p-6 text-center shadow-[0_0_50px_rgba(232,200,114,0.35)]"
                >
                  <span className="text-5xl">🎖️</span>
                  <h4 className="mt-2 font-display text-2xl font-black text-gold">
                    NEURAL MEMORY LOCKED FOR LIFE!
                  </h4>
                  <p className="mt-1 text-sm text-slate-200">
                    Topic <b>"{activeTopic.topic}"</b> is now permanently etched in your brain's long-term neural memory.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-3 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-black text-gold">
                    <span>⚡ +100 XP AWARDED</span>
                    <span>💎 +30 CYBER GEMS</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
