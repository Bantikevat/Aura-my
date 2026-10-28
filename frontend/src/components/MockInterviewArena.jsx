import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sfx } from '../lib/audioFx';
import { ASSISTANT_URL } from '../lib/assistant';

const INTERVIEW_PRESETS = [
  {
    role: 'Frontend Engineer',
    question: 'React me Virtual DOM kaise kaam karta hai aur Reconciliation kya hota hai? Real DOM se fast kyu hai?',
    context: 'React & Web Performance Round',
  },
  {
    role: 'Full Stack MERN Developer',
    question: 'Aap user authentication ke liye JWT (JSON Web Tokens) kaise secure karte hain? XSS aur CSRF attacks se token kaise bachate hain?',
    context: 'System Architecture & Security Round',
  },
  {
    role: 'Backend & Database Engineer',
    question: 'Database me 50 Lakh records hain aur query slow ho rahi hai. Aap performance analyze aur optimize karne ke liye kya steps lenge?',
    context: 'Scalability & Database Internals Round',
  },
  {
    role: 'Behavioral & Leadership',
    question: 'Describe a situation jab production me critical bug aa gaya tha ya deadline miss hone wali thi. Aapne situation ko kaise handle kiya?',
    context: 'Tech Lead / Managerial Behavioral Round',
  },
];

export default function MockInterviewArena({ onGainXp }) {
  const [selectedPreset, setSelectedPreset] = useState(INTERVIEW_PRESETS[0]);
  const [customRole, setCustomRole] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState('');

  const currentRole = customRole.trim() || selectedPreset.role;
  const currentQuestion = customQuestion.trim() || selectedPreset.question;

  async function evaluateAnswer() {
    if (!userAnswer.trim()) return;
    setIsEvaluating(true);
    setError('');
    setEvaluation(null);
    sfx.playLaser();

    try {
      const res = await fetch(`${ASSISTANT_URL}/mock-interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: currentRole,
          question: currentQuestion,
          answer: userAnswer.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Evaluation error');
      setEvaluation(data);

      if (data.score >= 70) {
        sfx.playLevelUp();
        onGainXp?.(data.score * 2);
      } else {
        sfx.playSuccess();
        onGainXp?.(50);
      }
    } catch (e) {
      setError(e.message || 'Could not evaluate. Make sure assistant server is active.');
      sfx.playFail();
    } finally {
      setIsEvaluating(false);
    }
  }

  function pickPreset(preset) {
    setSelectedPreset(preset);
    setCustomQuestion('');
    setUserAnswer('');
    setEvaluation(null);
    setError('');
    sfx.playBleep();
  }

  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-950/20 via-[#120810] to-black p-5 sm:p-7 shadow-[0_0_40px_rgba(244,63,94,0.12)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-black text-rose-400">
            <span>🎙️</span> AI MOCK INTERVIEW SIMULATOR · FAANG & STARTUP RADAR
          </div>
          <h2 className="mt-2 font-display text-2xl font-black text-white sm:text-3xl">
            Tech Lead AI Interview Chamber
          </h2>
          <p className="text-xs text-slate-400">
            Real tech interview questions ka answer do — Gemini Tech Lead aapka score, missing keywords aur model answer batayega!
          </p>
        </div>

        {/* Live Status */}
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 px-4 py-2.5 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Interviewer Status</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-mono text-xs font-bold text-white">AI TECH LEAD ONLINE</span>
          </div>
        </div>
      </div>

      {/* ROLE & QUESTION SELECTOR */}
      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Interview Rounds:</span>
          {INTERVIEW_PRESETS.map((p) => (
            <button
              key={p.role}
              onClick={() => pickPreset(p)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                selectedPreset.role === p.role && !customQuestion
                  ? 'border-rose-400 bg-rose-500/20 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
              }`}
            >
              💼 {p.role}
            </button>
          ))}
        </div>

        {/* ACTIVE QUESTION DISPLAY */}
        <div className="mt-4 rounded-2xl border border-white/[0.08] bg-black/40 p-5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-bold uppercase tracking-widest text-rose-400">
              {selectedPreset.context}
            </span>
            <span className="text-[11px] text-slate-500">Target Role: {currentRole}</span>
          </div>

          <h3 className="mt-2 text-base font-bold text-white sm:text-lg">
            "{currentQuestion}"
          </h3>

          {/* User Answer Textarea */}
          <div className="mt-4">
            <textarea
              rows={4}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Apna answer Hinglish ya English me detail me likho (Jaise actual interview me bolte ho)..."
              className="field w-full text-xs sm:text-sm bg-black/60 border-white/10 text-white placeholder-slate-500 focus:border-rose-400 resize-y"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400">
                💡 <b>Tip:</b> Examples aur real technical keywords (e.g. diffing algorithm, indexes, state) mention karein!
              </span>

              <button
                onClick={evaluateAnswer}
                disabled={isEvaluating || !userAnswer.trim()}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-5 py-2.5 text-xs font-black text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] disabled:opacity-40 transition hover:scale-105 active:scale-95"
              >
                {isEvaluating ? 'AI Lead Evaluating…' : '⚡ Submit Answer to AI Tech Lead'}
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
          </div>
        </div>
      </div>

      {/* EVALUATION FEEDBACK REPORT */}
      <AnimatePresence>
        {evaluation && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 rounded-2xl border border-rose-500/30 bg-black/60 p-6 shadow-2xl"
          >
            {/* Verdict Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl font-mono text-2xl font-black ${
                    evaluation.score >= 80
                      ? 'bg-mint/20 text-mint border border-mint/40 shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                      : evaluation.score >= 60
                      ? 'bg-solar/20 text-solar border border-solar/40 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                      : 'bg-rose/20 text-rose border border-rose/40 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                  }`}
                >
                  {evaluation.score}
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                    INTERVIEW SCORE
                  </span>
                  <h4 className="text-xl font-black text-white flex items-center gap-2">
                    Verdict:{' '}
                    <span
                      className={
                        evaluation.verdict === 'STRONG HIRE' || evaluation.verdict === 'HIRE'
                          ? 'text-mint'
                          : 'text-solar'
                      }
                    >
                      {evaluation.verdict}
                    </span>
                  </h4>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400">Awarded:</span>
                <p className="font-mono text-sm font-black text-gold">+150 XP & Cyber Gems</p>
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-mint/20 bg-mint/[0.05] p-4">
                <p className="text-xs font-black uppercase tracking-wider text-mint">
                  🟢 WHAT YOU DID WELL (STRENGTHS):
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-200">
                  {evaluation.strengths?.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-mint font-bold">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-solar/20 bg-solar/[0.05] p-4">
                <p className="text-xs font-black uppercase tracking-wider text-solar">
                  🟡 KEY CONCEPTS TO ADD (MISSING POINTS):
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-200">
                  {evaluation.improvements?.map((imp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-solar font-bold">➔</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Golden Model Answer */}
            <div className="mt-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-400">
                <span>💎 GOLDEN MODEL ANSWER (TOP-TIER ENGINEER):</span>
              </div>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-200">
                "{evaluation.goldenAnswer}"
              </p>
            </div>

            {/* Final Encouraging Punchline */}
            {evaluation.punchline && (
              <p className="mt-4 text-center font-display text-xs font-bold text-slate-400 italic">
                "{evaluation.punchline}"
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
