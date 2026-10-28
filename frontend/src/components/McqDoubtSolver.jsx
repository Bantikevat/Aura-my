import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuraStore } from '../store/useAuraStore';

const ASSISTANT_URL = import.meta.env.VITE_ASSISTANT_URL || 'http://localhost:5002/api/assistant';

const SSC_JE_TOPICS = {
  'Reasoning': [
    'Number Series', 'Analogy', 'Coding-Decoding', 'Blood Relation',
    'Direction Sense', 'Classification', 'Syllogism', 'Ranking & Order',
    'Arithmetical Reasoning', 'Visual Memory',
  ],
  'General Awareness': [
    'Indian History', 'Indian Geography', 'Indian Polity', 'Economics',
    'Science Facts', 'Current Affairs 2026', 'India & Neighbours',
  ],
  'Engg. Mathematics': [
    'Matrix Algebra', 'Eigenvalues & Eigenvectors', 'Linear Dependence',
    'Calculus & Derivatives', 'Definite Integrals', 'Differential Equations',
    'Vector Analysis (Gradient, Divergence, Curl)', 'Complex Analysis',
    'Probability & Statistics', 'Fourier Series',
  ],
  'Network Analysis': [
    'KVL & KCL', 'Thevenin Theorem', 'Norton Theorem', 'Superposition',
    'Maximum Power Transfer', 'RL RC RLC Circuits', 'Laplace Transform',
    'Two-Port Networks', 'Phasors & Complex Power',
  ],
  'Signals & Systems': [
    'Fourier Transform', 'Laplace Transform', 'Z-Transform', 'Sampling Theorem',
    'Convolution', 'LTI Systems', 'DTFT & DFT', 'Frequency Response',
  ],
  'Electronic Devices': [
    'P-N Junction Diode', 'Zener Diode', 'BJT', 'MOSFET', 'LED & Photodiode',
    'Semiconductor Basics', 'Drift & Diffusion',
  ],
  'Analog Circuits': [
    'Op-Amp Circuits', 'Diode Clipping & Clamping', 'Rectifiers',
    'Active Filters', 'Oscillators', 'Schmitt Trigger', 'Differential Amplifier',
  ],
  'Digital Circuits': [
    'Boolean Algebra', 'Karnaugh Map', 'Logic Gates', 'Flip-Flops',
    'Counters', 'ADC & DAC', 'Multiplexer & Demultiplexer', 'Number Systems',
  ],
  'Control Systems': [
    'Transfer Function', 'Block Diagram Reduction', 'Bode Plot',
    'Root Locus', 'Routh-Hurwitz Criterion', 'Nyquist Criterion',
    'PID Controller', 'State-Space Analysis',
  ],
  'Analog Communications': [
    'AM Modulation', 'FM Modulation', 'DSB-SC & SSB-SC',
    'Superheterodyne Receiver', 'Noise in Communication', 'PLL',
  ],
  'Digital Communications': [
    'PCM & DPCM', 'ASK PSK FSK QAM', 'Huffman Coding',
    'Shannon Theorem', 'BER & SNR', 'Eye Diagram', 'Matched Filter',
  ],
  'Electromagnetics': [
    'Maxwell Equations', 'Plane Waves', 'Transmission Lines',
    'Smith Chart & VSWR', 'Waveguides', 'Antenna Basics',
    'Optical Fibre', 'Boundary Conditions',
  ],
};

const STATUS_COLORS = {
  '🔴': 'rgba(239,68,68,0.15)',
  '🟡': 'rgba(251,191,36,0.15)',
  '🟢': 'rgba(52,211,153,0.15)',
};
const STATUS_LABELS = { '🔴': 'Not Started', '🟡': 'Learning', '🟢': 'Mastered' };

function useTopicStatus() {
  const [statuses, setStatuses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sscje-topic-status') || '{}'); } catch { return {}; }
  });
  function cycle(topic) {
    setStatuses((prev) => {
      const order = ['🔴', '🟡', '🟢'];
      const cur = prev[topic] || '🔴';
      const next = order[(order.indexOf(cur) + 1) % order.length];
      const updated = { ...prev, [topic]: next };
      try { localStorage.setItem('sscje-topic-status', JSON.stringify(updated)); } catch { /**/ }
      return updated;
    });
  }
  return [statuses, cycle];
}

export default function McqDoubtSolver({ onGainXp }) {
  const requestImagine = useAuraStore((s) => s.requestImagine);
  const addFlashcards = useAuraStore((s) => s.addFlashcards);

  const [mcqText, setMcqText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [openSection, setOpenSection] = useState('Reasoning');
  const [topicStatuses, cycleStatus] = useTopicStatus();
  const [activeView, setActiveView] = useState('tracker'); // 'tracker' | 'mcq'

  async function solveMcq() {
    if (!mcqText.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await fetch(`${ASSISTANT_URL}/explain-mcq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mcq: mcqText, exam: 'SSC JE 2026 Telecom' }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Could not explain MCQ');
      setResult(data);
      onGainXp?.(30);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function enterConceptWorld(topic) {
    requestImagine(topic);
  }

  const totalTopics = Object.values(SSC_JE_TOPICS).flat().length;
  const masteredCount = Object.values(topicStatuses).filter((s) => s === '🟢').length;
  const learningCount = Object.values(topicStatuses).filter((s) => s === '🟡').length;
  const progress = Math.round((masteredCount / totalTopics) * 100);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-aurora">{progress}%</p>
          <p className="text-[11px] text-slate-400 mt-1">Overall Progress</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-mint">{masteredCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Mastered</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-solar">{learningCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Learning</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-rose-400">{totalTopics - masteredCount - learningCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Remaining</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        {[['tracker', '📋', 'Topic Tracker'], ['mcq', '🤔', 'MCQ Doubt Solver']].map(([id, icon, label]) => (
          <button
            key={id}
            onClick={() => setActiveView(id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              activeView === id
                ? 'bg-aurora/20 border border-aurora text-aurora'
                : 'border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* TOPIC TRACKER */}
      {activeView === 'tracker' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Status par click karo: 🔴 Not Started → 🟡 Learning → 🟢 Mastered. "🌍" click karo concept ki duniya mein jaane ke liye.
          </p>
          {Object.entries(SSC_JE_TOPICS).map(([section, topics]) => {
            const sectionMastered = topics.filter((t) => topicStatuses[t] === '🟢').length;
            const isOpen = openSection === section;
            return (
              <div key={section} className="glass-card rounded-2xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left"
                  onClick={() => setOpenSection(isOpen ? null : section)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">{section}</span>
                    <span className="text-[10px] text-slate-500">{sectionMastered}/{topics.length} mastered</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-aurora to-mint"
                        style={{ width: `${(sectionMastered / topics.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-slate-400">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 grid gap-2 sm:grid-cols-2">
                    {topics.map((topic) => {
                      const status = topicStatuses[topic] || '🔴';
                      return (
                        <div
                          key={topic}
                          className="flex items-center gap-2 rounded-xl p-2.5"
                          style={{ backgroundColor: STATUS_COLORS[status] || STATUS_COLORS['🔴'] }}
                        >
                          <button
                            onClick={() => cycleStatus(topic)}
                            className="text-lg flex-shrink-0"
                            title={STATUS_LABELS[status]}
                          >
                            {status}
                          </button>
                          <span className="flex-1 text-sm text-white">{topic}</span>
                          <button
                            onClick={() => enterConceptWorld(topic)}
                            className="text-base rounded-lg px-2 py-0.5 bg-white/10 hover:bg-aurora/30 transition-colors"
                            title="Is concept ki duniya mein jao"
                          >
                            🌍
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MCQ DOUBT SOLVER */}
      {activeView === 'mcq' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="font-bold text-white mb-1">MCQ Paste Karo 👇</h3>
              <p className="text-xs text-slate-500">Koi bhi MCQ jo samajh nahi aayi — poora question + options paste karo</p>
            </div>
            <textarea
              value={mcqText}
              onChange={(e) => setMcqText(e.target.value)}
              rows={6}
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 p-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-aurora/50"
              placeholder={`Example:\nQ. AM signal ki bandwidth kya hoti hai?\n(a) fm\n(b) 2fm\n(c) fc\n(d) fc+fm`}
            />
            <button
              onClick={solveMcq}
              disabled={loading || !mcqText.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-aurora/80 to-mint/80 py-3 font-bold text-white disabled:opacity-40 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? '🔄 Samjha raha hoon...' : '🌍 Is concept ki duniya mein jao'}
            </button>
            {error && <p className="text-rose-400 text-sm">{error}</p>}
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Concept Header */}
                <div className="glass-card rounded-2xl p-5 border border-aurora/30">
                  <p className="text-[10px] uppercase tracking-wider text-aurora mb-1">Concept Identified</p>
                  <h2 className="font-display text-xl font-black text-white">{result.concept_name}</h2>
                </div>

                {/* Real World Story */}
                <div className="glass-card rounded-2xl p-5 border border-solar/20">
                  <p className="text-[10px] uppercase tracking-wider text-solar mb-2">🎬 Real World Story</p>
                  <p className="text-sm text-slate-200 leading-relaxed">{result.real_story}</p>
                </div>

                {/* Simple Explanation */}
                <div className="glass-card rounded-2xl p-5">
                  <p className="text-[10px] uppercase tracking-wider text-mint mb-2">💡 Concept Explained</p>
                  <p className="text-sm text-slate-200 leading-relaxed">{result.simple_explanation}</p>
                </div>

                {/* Options Explained */}
                {result.options_explained?.length > 0 && (
                  <div className="glass-card rounded-2xl p-5">
                    <p className="text-[10px] uppercase tracking-wider text-white/60 mb-3">✅ Har Option Kyon?</p>
                    <div className="space-y-2">
                      {result.options_explained.map((opt) => (
                        <div
                          key={opt.option}
                          className={`rounded-xl p-3 text-sm ${
                            opt.verdict?.toLowerCase().includes('correct')
                              ? 'bg-mint/10 border border-mint/30'
                              : 'bg-white/[0.03] border border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-bold uppercase ${opt.verdict?.toLowerCase().includes('correct') ? 'text-mint' : 'text-rose-400'}`}>
                              ({opt.option}) {opt.verdict?.toLowerCase().includes('correct') ? '✅' : '❌'}
                            </span>
                            <span className="text-white text-xs">{opt.text}</span>
                          </div>
                          <p className="text-slate-400 text-xs">{opt.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Memory Trick */}
                {result.memory_trick && (
                  <div className="glass-card rounded-2xl p-4 border border-gold/30 bg-gold/5">
                    <p className="text-[10px] uppercase tracking-wider text-gold mb-1">🧠 Memory Trick</p>
                    <p className="text-sm font-bold text-white">{result.memory_trick}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {result.imagine_topic && (
                    <button
                      onClick={() => enterConceptWorld(result.imagine_topic)}
                      className="flex-1 rounded-xl bg-aurora/20 border border-aurora/40 py-3 text-sm font-bold text-aurora hover:bg-aurora/30 transition-colors"
                    >
                      🌍 3D Duniya mein jao
                    </button>
                  )}
                  <button
                    onClick={() => { setResult(null); setMcqText(''); }}
                    className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    ↩ Naya MCQ
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
