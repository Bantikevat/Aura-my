import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuraStore } from '../store/useAuraStore';
import { loadAuth } from '../lib/auth';
import { buildPlan, dayKey } from '../lib/examPlanner';

const BRIEF_KEY = 'aura-brief-day';
const DAILY_GOAL = 10;
const QUEUED = ['awaiting-review', 'form-opened', 'reviewed'];
const todayKey = () => dayKey(new Date());

const seenToday = () => { try { return localStorage.getItem(BRIEF_KEY) === todayKey(); } catch { return false; } };

// Built only from data the user already saved. Nothing here is guessed.
function useMission() {
  const tasks = useAuraStore((s) => s.tasks);
  const drafts = useAuraStore((s) => s.applicationDrafts);
  const exam = useAuraStore((s) => s.examPlan);
  const profile = useAuraStore((s) => s.careerProfile);

  return useMemo(() => {
    const items = [];
    const hints = [];

    if (exam) {
      const plan = buildPlan(exam);
      const study = plan.days[0]?.items ?? [];
      if (plan.phase === 'exam-day') items.push({ icon: '🎯', text: `Aaj ${exam.exam} hai. Naya mat padho, shaant raho.`, to: '/study' });
      else if (plan.phase === 'over') hints.push({ text: `${exam.exam} ki tareekh nikal gayi. Nayi tareekh daalo.`, to: '/study' });
      else {
        if (study.length) items.push({ icon: '📘', text: `${exam.exam}: ${plan.daysLeft} din bache. Aaj padhna hai: ${study.map((i) => i.name).join(', ')}`, to: '/study' });
        else items.push({ icon: '📘', text: `${exam.exam}: ${plan.daysLeft} din bache. Aaj revision aur practice sawal.`, to: '/study' });
        if (plan.revisionsDue.length) items.push({ icon: '🔁', text: `${plan.revisionsDue.length} revision baaki: ${plan.revisionsDue.slice(0, 3).map((r) => r.name).join(', ')}`, to: '/study' });
      }
    } else hints.push({ text: 'Exam Compressor mein exam ki tareekh daalo, plan khud ban jayega.', to: '/study' });

    const queued = drafts.filter((d) => QUEUED.includes(d.status)).length;
    const appliedToday = drafts.filter((d) => d.appliedAt && new Date(d.appliedAt).toDateString() === new Date().toDateString()).length;
    if (queued > 0) items.push({ icon: '💼', text: `${queued} job queue mein, aaj ${appliedToday}/${DAILY_GOAL} apply hui.`, to: '/career' });
    else if (!profile.fullName) hints.push({ text: 'Career profile bharo, tabhi job form 10 minute mein bharenge.', to: '/career' });
    else hints.push({ text: 'Job queue khali hai. Koi official job link daalo.', to: '/career' });

    const urgent = tasks.filter((t) => t.status !== 'done' && t.priority === 'high').slice(0, 2);
    urgent.forEach((t) => items.push({ icon: '⚡', text: `${t.title} (${t.due})`, to: '/universe' }));

    return { items: items.slice(0, 5), hints };
  }, [tasks, drafts, exam, profile]);
}

export default function DailyBriefing() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => !seenToday());
  const { items, hints } = useMission();
  const name = loadAuth()?.name || 'dost';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Suprabhat' : hour < 17 ? 'Namaste' : 'Shubh sandhya';

  function close(to) {
    try { localStorage.setItem(BRIEF_KEY, todayKey()); } catch { /* ignore */ }
    setOpen(false);
    if (to) navigate(to);
  }

  return <AnimatePresence>
    {open && <motion.div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.15, duration: 0.6 }}
        className="glass-strong relative w-full max-w-lg overflow-hidden rounded-3xl p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(232,200,114,0.2),transparent_70%)]" />
        <p className="section-label">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h2 className="font-luxe mt-2 text-4xl font-semibold text-white">{greeting}, <span className="text-gold">{name}</span></h2>
        <p className="mt-1 text-sm text-slate-400">Aaj ka mission:</p>

        <div className="mt-4 space-y-2.5">
          {items.map((item, i) => <motion.button key={i} onClick={() => close(item.to)} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.12 }}
            className="flex w-full items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left transition hover:border-[rgba(232,200,114,0.4)]">
            <span className="text-lg">{item.icon}</span><span className="text-sm text-slate-200">{item.text}</span>
          </motion.button>)}
          {items.length === 0 && <p className="rounded-2xl bg-white/[0.03] p-4 text-sm text-slate-400">Abhi koi mission nahi. Neeche se shuru karo.</p>}
        </div>

        {hints.length > 0 && <div className="mt-4 space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Setup baaki</p>
          {hints.map((h, i) => <button key={i} onClick={() => close(h.to)} className="block text-left text-xs text-solar underline-offset-2 hover:underline">→ {h.text}</button>)}
        </div>}

        <button onClick={() => close()} className="mt-6 w-full rounded-2xl py-3 text-sm font-bold text-[#1a1405]" style={{ background: 'linear-gradient(135deg,#f6e3a1,#e8c872 50%,#b8923a)' }}>Shuru karte hain</button>
      </motion.div>
    </motion.div>}
  </AnimatePresence>;
}
