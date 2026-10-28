import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuraStore } from '../store/useAuraStore';
import { ASSISTANT_URL } from '../lib/assistant';
import { buildPlan, dayKey, parseDay } from '../lib/examPlanner';

const LEVELS = ['Kuch nahi aata', 'Bas naam suna', 'Thoda aata hai', 'Theek-thaak', 'Accha aata hai', 'Pakka'];
const newTopic = (name, weight = 5, why = '') => ({ id: crypto.randomUUID(), name, weight, level: 1, why });
const fmtDate = (key) => parseDay(key).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

function Editor({ draft, setDraft, onSave, onCancel, hasPlan }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [manual, setManual] = useState('');

  async function fromAi() {
    setBusy(true); setError('');
    try {
      const res = await fetch(`${ASSISTANT_URL}/exam-topics`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exam: draft.exam, syllabus: draft.syllabus }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || `Error ${res.status}`);
      setDraft((d) => ({ ...d, topics: body.topics.map((t) => newTopic(t.name, t.weight, t.why)) }));
    } catch (e) {
      setError(e instanceof TypeError ? 'Assistant server is not running. Start it with "npm run dev:ai", or type your topics below.' : e.message);
    } finally { setBusy(false); }
  }

  function fromList() {
    const names = manual.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 60);
    if (names.length) setDraft((d) => ({ ...d, topics: [...d.topics, ...names.map((n) => newTopic(n))] }));
    setManual('');
  }

  const patch = (id, change) => setDraft((d) => ({ ...d, topics: d.topics.map((t) => (t.id === id ? { ...t, ...change } : t)) }));
  const ready = draft.exam.trim() && draft.date && draft.hours > 0 && draft.topics.length >= 1 && daysLeftOf(draft.date) >= 1;

  return <div className="mt-5 space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">
      <input value={draft.exam} onChange={(e) => setDraft({ ...draft, exam: e.target.value })} placeholder="Exam ka naam (GATE CS, M.Tech entrance…)" className="field" />
      <input type="date" value={draft.date} min={dayKey(new Date())} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="field" aria-label="Exam date" />
      <input type="number" min="1" max="16" step="0.5" value={draft.hours} onChange={(e) => setDraft({ ...draft, hours: Number(e.target.value) })} placeholder="Roz ke ghante" className="field" aria-label="Hours per day" />
    </div>
    <textarea value={draft.syllabus} onChange={(e) => setDraft({ ...draft, syllabus: e.target.value })} rows="3" placeholder="Syllabus yahan paste karo (optional). AI isse topics aur unke marks ka andaza nikalega." className="field" />
    <div className="flex flex-wrap items-center gap-3">
      <button onClick={fromAi} disabled={busy || (!draft.exam.trim() && !draft.syllabus.trim())} className="rounded-xl bg-ice px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-40">{busy ? 'Padh raha hoon…' : 'AI se topics nikalo'}</button>
      <span className="text-xs text-slate-500">ya neeche apni list likho</span>
    </div>
    <div className="flex gap-2">
      <textarea value={manual} onChange={(e) => setManual(e.target.value)} rows="2" placeholder="Ek line = ek topic" className="field" />
      <button onClick={fromList} disabled={!manual.trim()} className="rounded-xl border border-white/[0.12] px-4 text-sm text-slate-300 disabled:opacity-40">Jodo</button>
    </div>
    {error && <p className="rounded-lg bg-rose/10 p-3 text-xs text-rose">{error}</p>}

    {draft.topics.length > 0 && <div>
      <p className="text-xs text-slate-500">Marks ka weight AI ka <b>andaza</b> hai. Apne exam ke hisaab se badlo. "Kitna aata hai" sahi bharo, plan isi par chalta hai.</p>
      <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
        {draft.topics.map((t) => <div key={t.id} className="grid items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:grid-cols-[1fr_130px_150px_28px]">
          <div><p className="text-sm text-white">{t.name}</p>{t.why && <p className="text-[11px] text-slate-500">{t.why}</p>}</div>
          <label className="text-[11px] text-slate-400">Marks weight: <b className="text-gold">{t.weight}</b><input type="range" min="1" max="10" value={t.weight} onChange={(e) => patch(t.id, { weight: Number(e.target.value) })} className="w-full accent-[#e8c872]" /></label>
          <select value={t.level} onChange={(e) => patch(t.id, { level: Number(e.target.value) })} className="rounded-lg border border-white/[0.1] bg-black/30 px-2 py-1.5 text-xs">{LEVELS.map((l, i) => <option key={l} value={i}>{l}</option>)}</select>
          <button onClick={() => setDraft((d) => ({ ...d, topics: d.topics.filter((x) => x.id !== t.id) }))} aria-label="Remove" className="text-slate-500 hover:text-rose">✕</button>
        </div>)}
      </div>
    </div>}

    <div className="flex gap-3">
      <button onClick={onSave} disabled={!ready} className="rounded-xl bg-ice px-5 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-40">Plan banao</button>
      {hasPlan && <button onClick={onCancel} className="rounded-xl border border-white/[0.12] px-4 py-2.5 text-sm text-slate-300">Wapas</button>}
      {!ready && draft.date && daysLeftOf(draft.date) < 1 && <span className="self-center text-xs text-solar">Exam ki tareekh kal ya uske baad ki rakho.</span>}
    </div>
  </div>;
}

const daysLeftOf = (date) => Math.round((parseDay(date) - parseDay(dayKey(new Date()))) / 86400000);

export default function ExamCompressor() {
  const plan = useAuraStore((s) => s.examPlan);
  const savePlan = useAuraStore((s) => s.saveExamPlan);
  const updateTopic = useAuraStore((s) => s.updateExamTopic);
  const clearPlan = useAuraStore((s) => s.clearExamPlan);
  const requestImagine = useAuraStore((s) => s.requestImagine);
  const addFlashcards = useAuraStore((s) => s.addFlashcards);
  const blank = { exam: '', date: '', hours: 4, syllabus: '', topics: [] };
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(blank);
  const [showAll, setShowAll] = useState(false);
  const [cardBusyId, setCardBusyId] = useState(null);
  const [cardMsg, setCardMsg] = useState('');

  // Turn one syllabus topic into spaced-repetition flashcards (free).
  async function makeCards(name, id) {
    setCardBusyId(id); setCardMsg('');
    try {
      const res = await fetch(`${ASSISTANT_URL}/flashcards`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: name, count: 6 }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || `Error ${res.status}`);
      if (!body.cards?.length) throw new Error('Cards nahi bane.');
      addFlashcards(body.cards, name);
      setCardMsg(`✓ "${name}" ke ${body.cards.length} flashcards add ho gaye — Study → Flashcards me revise karo.`);
    } catch (e) {
      setCardMsg(`✕ ${e instanceof TypeError ? 'Assistant server band hai.' : e.message}`);
    } finally { setCardBusyId(null); }
  }

  const result = useMemo(() => (plan ? buildPlan(plan) : null), [plan]);
  const todayKey = dayKey(new Date());

  function save() {
    const topics = draft.topics.map((t) => {
      const old = plan?.topics.find((o) => o.id === t.id);
      return { id: t.id, name: t.name, weight: t.weight, level: t.level, why: t.why, ...(old?.doneOn ? { doneOn: old.doneOn, revDone: old.revDone } : {}) };
    });
    savePlan({ exam: draft.exam.trim(), date: draft.date, hours: draft.hours, topics });
    setEditing(false);
  }

  function markDone(id) { updateTopic(id, { doneOn: todayKey, revDone: [] }); }
  function markRevision(topic, gap) { updateTopic(topic.id, { revDone: [...(topic.revDone || []), gap] }); }

  const header = <>
    <p className="section-label">Exam Compressor</p>
    <h2 className="font-luxe mt-1 text-3xl font-semibold text-white">Kam waqt, <span className="text-gold">sahi jagah</span></h2>
    <p className="mt-1 text-sm text-slate-400">Pehle wo topics jinse sabse zyada marks aate hain aur jo aapko kam aate hain. Har din ka kaam tay, aur ek din chhoot jaye to plan khud badal jata hai.</p>
  </>;

  const shell = (children) => <section className="glass-strong relative mb-8 overflow-hidden rounded-3xl p-6">
    <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(232,200,114,0.14),transparent_70%)]" />
    {header}{children}
  </section>;

  if (!plan || editing) return shell(<Editor draft={draft} setDraft={setDraft} onSave={save} hasPlan={!!plan} onCancel={() => setEditing(false)} />);

  const { daysLeft, days, skipped, revisionsDue, coverage, phase, reserve } = result;
  const doneShare = Math.round((coverage.doneWeight / coverage.totalWeight) * 100);
  const plannedShare = Math.round(((coverage.doneWeight + coverage.plannedWeight) / coverage.totalWeight) * 100);
  const today = days[0];

  return shell(<div className="mt-5 space-y-5">
    <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
      <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
        <div><p className="font-luxe text-gold text-5xl font-semibold leading-none">{Math.max(daysLeft, 0)}</p><p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">din bache</p></div>
        <div className="text-xs text-slate-400"><p className="text-sm font-medium text-white">{plan.exam}</p><p>{fmtDate(plan.date)} · roz {plan.hours}h</p></div>
      </div>
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
        <div className="flex justify-between text-xs text-slate-400"><span>Marks ka hissa jo pakka ho chuka</span><span className="text-white">{doneShare}%</span></div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/[0.07]"><motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#b8923a,#f6e3a1)' }} initial={{ width: 0 }} animate={{ width: `${doneShare}%` }} /></div>
        <p className="mt-2 text-[11px] text-slate-500">Plan poora karne par ~{plannedShare}% weight cover hoga. Ye aapke diye weights par based andaza hai, exam ke marks ki guarantee nahi.</p>
      </div>
    </div>

    {phase === 'over' && <p className="rounded-xl bg-rose/10 p-4 text-sm text-rose">Exam ki tareekh nikal gayi. "Topics badlo" se nayi tareekh daalo.</p>}
    {phase === 'exam-day' && <p className="rounded-xl bg-[rgba(232,200,114,0.1)] p-4 text-sm text-slate-200">Aaj exam hai. Naya mat padho. Pehle ke notes ek baar dekho, aur aaram se jao.</p>}
    {phase === 'final-revision' && <p className="rounded-xl bg-[rgba(232,200,114,0.1)] p-4 text-sm text-slate-200">Ab sirf revision aur mock test ke din hain. Naya topic mat shuru karo, neeche ki revision list khatam karo.</p>}

    {phase === 'study' && today && <div className="rounded-2xl border border-[rgba(232,200,114,0.25)] bg-[rgba(232,200,114,0.04)] p-4">
      <p className="section-label">Aaj ka kaam · {today.hours}h</p>
      {today.items.length === 0 ? <p className="mt-2 text-sm text-slate-400">Aaj ke liye naya topic nahi hai. Revision dekho.</p> : <div className="mt-3 space-y-2">
        {today.items.map((item) => {
          const base = plan.topics.find((t) => t.id === item.id);
          const lastPart = !/\(part (\d+)\/(\d+)\)/.test(item.name) || (() => { const m = item.name.match(/part (\d+)\/(\d+)/); return m[1] === m[2]; })();
          return <div key={item.name} className="flex flex-wrap items-center gap-3 rounded-xl bg-black/20 px-4 py-3">
            <div className="min-w-0 flex-1"><p className="text-sm text-white">{item.name}</p><p className="text-[11px] text-slate-500">{item.hours}h · weight {base?.weight}</p></div>
            <button onClick={() => requestImagine(base.name)} className="rounded-lg border border-[rgba(232,200,114,0.35)] px-3 py-1.5 text-xs text-gold" title="Is topic ki virtual duniya me jao">✦ Duniya me jao</button>
            <button onClick={() => makeCards(base.name, item.id)} disabled={cardBusyId === item.id} className="rounded-lg border border-purple-400/40 px-3 py-1.5 text-xs text-purple-300 disabled:opacity-50" title="Is topic ke flashcards banao">{cardBusyId === item.id ? '…' : '🃏 Cards'}</button>
            {lastPart ? <button onClick={() => markDone(item.id)} className="rounded-lg border border-mint/40 px-3 py-1.5 text-xs font-semibold text-mint hover:bg-mint/10">Ho gaya</button> : <span className="text-[11px] text-slate-500">aaj ka hissa, baaki kal</span>}
          </div>;
        })}
      </div>}
      {cardMsg && <p className={`mt-3 text-[11px] ${cardMsg.startsWith('✕') ? 'text-rose' : 'text-mint'}`}>{cardMsg}</p>}
    </div>}

    {revisionsDue.length > 0 && <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="section-label">Revision due ({revisionsDue.length})</p>
      <p className="mt-1 text-[11px] text-slate-500">Bina dekhe yaad karne ki koshish karo, phir check karo. Yaad hone par hi "Yaad tha" dabao.</p>
      <div className="mt-3 flex flex-wrap gap-2">{revisionsDue.map((r) => {
        const topic = plan.topics.find((t) => t.id === r.id);
        return <button key={`${r.id}-${r.gap}`} onClick={() => markRevision(topic, r.gap)} className="rounded-full border border-white/[0.12] px-3 py-1.5 text-xs text-slate-200 hover:border-mint/50 hover:text-mint" title={`Din ${r.gap} ki revision`}>{r.name} · din {r.gap} ✓</button>;
      })}</div>
    </div>}

    {days.length > 1 && <div>
      <button onClick={() => setShowAll((v) => !v)} className="text-xs text-slate-400 underline hover:text-slate-200">{showAll ? 'Aane wale din chhupao' : `Aane wale din dekho (${days.length - 1})`}</button>
      {showAll && <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{days.slice(1).map((d) => <div key={d.date} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"><p className="text-xs font-medium text-gold">{fmtDate(d.date)}</p><ul className="mt-1.5 space-y-0.5">{d.items.map((i) => <li key={i.name} className="text-[11px] text-slate-400">{i.name} · {i.hours}h</li>)}{d.items.length === 0 && <li className="text-[11px] text-slate-500">Revision + practice sawal</li>}</ul></div>)}</div>}
      {reserve > 0 && <p className="mt-2 text-[11px] text-slate-500">Aakhri {reserve} din naye topics nahi: sirf mock test aur revision ke liye rakhe hain.</p>}
    </div>}

    {skipped.length > 0 && <div className="rounded-2xl border border-solar/30 bg-solar/[0.05] p-4">
      <p className="text-sm font-medium text-solar">Itne din mein {skipped.length} topic nahi aa paayenge</p>
      <p className="mt-1 text-xs text-slate-400">Ye sabse kam fayde wale chhode gaye hain: {skipped.map((t) => t.name).join(', ')}. Roz ke ghante badhao ya inhe jaan-boojhkar chhodo. Ye aapka faisla hai.</p>
    </div>}

    <div className="flex gap-4 text-xs text-slate-500">
      <button onClick={() => { setDraft({ exam: plan.exam, date: plan.date, hours: plan.hours, syllabus: '', topics: plan.topics.map((t) => ({ ...t })) }); setEditing(true); }} className="underline hover:text-slate-300">Topics badlo</button>
      <button onClick={() => window.confirm('Poora plan hata dein? Ye wapas nahi aayega.') && clearPlan()} className="underline hover:text-rose">Plan hatao</button>
    </div>
  </div>);
}
