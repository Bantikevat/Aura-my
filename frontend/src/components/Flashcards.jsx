import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuraStore } from '../store/useAuraStore';
import { ASSISTANT_URL } from '../lib/assistant';
import { dueCards } from '../lib/srs';

const GRADES = [
  { label: 'Again', quality: 1, color: '#ff6e7a', hint: 'bhool gaya' },
  { label: 'Hard', quality: 3, color: '#fbbf24', hint: 'mushkil tha' },
  { label: 'Good', quality: 4, color: '#60a5fa', hint: 'yaad tha' },
  { label: 'Easy', quality: 5, color: '#34d399', hint: 'aasaan' },
];

export default function Flashcards({ onGainXp }) {
  const cards = useAuraStore((s) => s.flashcards);
  const addFlashcards = useAuraStore((s) => s.addFlashcards);
  const reviewFlashcard = useAuraStore((s) => s.reviewFlashcard);
  const removeFlashcard = useAuraStore((s) => s.removeFlashcard);
  const clearFlashcards = useAuraStore((s) => s.clearFlashcards);

  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [queue, setQueue] = useState([]); // snapshot of card ids to review this session
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);

  const due = useMemo(() => dueCards(cards), [cards]);

  async function generate() {
    const t = topic.trim();
    if (!t || busy) return;
    setBusy(true); setError('');
    try {
      const res = await fetch(`${ASSISTANT_URL}/flashcards`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: t, count: 8 }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || `Failed (${res.status})`);
      if (!body.cards?.length) throw new Error('No cards came back. Try another topic.');
      addFlashcards(body.cards, t);
      setTopic('');
    } catch (err) {
      setError(err.message.includes('fetch') ? 'Assistant server band hai. "npm run dev:ai" chalao.' : err.message);
    } finally {
      setBusy(false);
    }
  }

  function startReview() {
    const ids = dueCards(cards).map((c) => c.id);
    if (!ids.length) return;
    setQueue(ids); setDone(0); setFlipped(false); setReviewing(true);
  }

  function grade(quality) {
    const id = queue[0];
    reviewFlashcard(id, quality);
    onGainXp?.(quality >= 4 ? 10 : 4);
    const rest = queue.slice(1);
    setDone((d) => d + 1);
    setFlipped(false);
    if (rest.length === 0) { setReviewing(false); setQueue([]); }
    else setQueue(rest);
  }

  const current = reviewing ? cards.find((c) => c.id === queue[0]) : null;

  return (
    <div className="space-y-6">
      {/* Generator */}
      <div className="glass-strong rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label">Spaced Repetition</p>
            <h2 className="mt-1 font-display text-lg font-semibold text-white">Flashcards — kabhi bhoologe nahi</h2>
          </div>
          <span className="rounded-full bg-aurora/10 px-3 py-1 text-xs text-aurora">{cards.length} cards · {due.length} due</span>
        </div>
        <p className="mt-2 text-xs text-slate-400">Koi bhi topic likho, AI cards banata hai. Phir SM-2 tumhe sahi time par revise karata hai — bhoolne se theek pehle.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && generate()}
            placeholder='e.g. "DBMS Normalization" ya "React useEffect"' className="field flex-1" />
          <button onClick={generate} disabled={busy || !topic.trim()}
            className="rounded-xl bg-aurora px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">
            {busy ? 'Ban rahe…' : 'Generate cards'}
          </button>
        </div>
        {error && <p className="mt-2 text-[11px] text-rose">✕ {error}</p>}
      </div>

      {/* Review session */}
      {reviewing && current ? (
        <div className="glass-strong rounded-2xl p-5">
          <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
            <span>Reviewing · {done + 1} / {done + queue.length}</span>
            <button onClick={() => { setReviewing(false); setQueue([]); }} className="text-slate-500 hover:text-white">End session ✕</button>
          </div>
          <AnimatePresence mode="wait">
            <motion.button
              key={current.id + String(flipped)}
              initial={{ opacity: 0, rotateX: -8, y: 8 }} animate={{ opacity: 1, rotateX: 0, y: 0 }} exit={{ opacity: 0, y: -8 }}
              onClick={() => setFlipped(true)}
              className="flex min-h-[180px] w-full flex-col items-center justify-center rounded-2xl border border-white/[0.1] bg-gradient-to-br from-violet-950/40 to-[#0d1222] p-6 text-center"
            >
              <span className="text-[10px] uppercase tracking-widest text-slate-500">{flipped ? 'Answer' : 'Question'}{current.topic ? ` · ${current.topic}` : ''}</span>
              <p className="mt-3 text-lg font-medium text-white">{flipped ? current.back : current.front}</p>
              {!flipped && <span className="mt-4 text-[11px] text-slate-500">Tap to reveal</span>}
            </motion.button>
          </AnimatePresence>

          {flipped && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {GRADES.map((g) => (
                <button key={g.quality} onClick={() => grade(g.quality)}
                  className="flex flex-col items-center rounded-xl border px-2 py-2.5 text-xs font-bold transition active:scale-95"
                  style={{ borderColor: g.color + '55', color: g.color, backgroundColor: g.color + '12' }}>
                  <span>{g.label}</span>
                  <span className="mt-0.5 text-[9px] font-normal opacity-70">{g.hint}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="glass-strong rounded-2xl p-5">
          {cards.length === 0 ? (
            <p className="text-sm text-slate-500">Abhi koi card nahi. Upar topic likh ke cards banao.</p>
          ) : due.length > 0 ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <p className="text-sm text-slate-300"><b className="text-aurora">{due.length}</b> cards revise karne ka time ho gaya.</p>
              <button onClick={startReview} className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2.5 text-sm font-bold text-white">Start review →</button>
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-mint">✓ Aaj ke saare cards ho gaye! Agli revision scheduled hai.</p>
          )}

          {cards.length > 0 && (
            <div className="mt-4 max-h-56 space-y-1.5 overflow-y-auto border-t border-white/[0.08] pt-3">
              {cards.slice(0, 40).map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-2 text-xs text-slate-400">
                  <span className="flex-1 truncate">{c.front}</span>
                  <span className="text-[10px] text-slate-600">{c.reps ? `×${c.reps}` : 'new'}</span>
                  <button onClick={() => removeFlashcard(c.id)} className="text-slate-600 hover:text-rose" aria-label="Delete">✕</button>
                </div>
              ))}
              <button onClick={clearFlashcards} className="mt-2 text-[11px] text-slate-500 hover:text-rose">Clear all cards</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
