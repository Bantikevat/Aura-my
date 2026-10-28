import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuraStore } from '../store/useAuraStore';

const DAILY_GOAL = 10;
const MINUTES_SAVED_PER_APPLICATION = 50; // ~60 min by hand vs ~10 min with FormPilot

export const STATUS_OPTIONS = [
  ['awaiting-review', 'Queued'], ['form-opened', 'Form opened'], ['reviewed', 'Reviewed'],
  ['applied', 'Applied'], ['interview', 'Interview'], ['offer', 'Offer'], ['rejected', 'Rejected'],
];
const STATUS_COLOR = {
  'awaiting-review': '#94a3b8', 'form-opened': '#e8c872', reviewed: '#a78bfa',
  applied: '#f472b6', interview: '#fbbf24', offer: '#34d399', rejected: '#ff6e7a',
};
export const QUEUED = ['awaiting-review', 'form-opened', 'reviewed'];

const isToday = (iso) => !!iso && new Date(iso).toDateString() === new Date().toDateString();

function useExtensionConnected() {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const check = () => setConnected(document.documentElement.dataset.auraExtension === '1');
    check();
    const timer = setInterval(check, 1500);
    return () => clearInterval(timer);
  }, []);
  return connected;
}

function GoalRing({ value, goal }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / goal, 1);
  return <div className="relative h-36 w-36 shrink-0">
    <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
      <defs><linearGradient id="goldRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f6e3a1" /><stop offset="100%" stopColor="#b8923a" /></linearGradient></defs>
      <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
      <motion.circle cx="64" cy="64" r={radius} fill="none" stroke="url(#goldRing)" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: circumference * (1 - progress) }} transition={{ duration: 1, ease: 'easeOut' }} />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <span className="font-luxe text-gold text-4xl font-semibold">{value}<span className="text-xl text-slate-500">/{goal}</span></span>
      <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">applied today</span>
    </div>
  </div>;
}

function Check({ ok, label, hint }) {
  return <div className="flex items-start gap-2.5 text-sm">
    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${ok ? 'bg-mint/20 text-mint' : 'bg-solar/15 text-solar'}`}>{ok ? '✓' : '!'}</span>
    <div><p className={ok ? 'text-slate-300' : 'text-white'}>{label}</p>{!ok && <p className="text-[11px] text-slate-500">{hint}</p>}</div>
  </div>;
}

export default function ApplicationCockpit() {
  const profile = useAuraStore((s) => s.careerProfile);
  const drafts = useAuraStore((s) => s.applicationDrafts);
  const setStatus = useAuraStore((s) => s.setApplicationStatus);
  const removeDraft = useAuraStore((s) => s.removeApplicationDraft);
  const extensionConnected = useExtensionConnected();

  const appliedDrafts = drafts.filter((d) => d.appliedAt || ['applied', 'interview', 'offer', 'rejected'].includes(d.status));
  const appliedToday = drafts.filter((d) => isToday(d.appliedAt)).length;
  const queue = drafts.filter((d) => QUEUED.includes(d.status));
  const minutesSaved = appliedDrafts.length * MINUTES_SAVED_PER_APPLICATION;

  const profileReady = !!(profile.fullName && profile.email && profile.phone && profile.skills && profile.resumeName);
  const vaultFields = ['currentCompany', 'experienceYears', 'currentCtc', 'expectedCtc', 'noticePeriod', 'degree', 'university', 'graduationYear', 'dob', 'city', 'state', 'pincode'];
  const vaultFilled = vaultFields.filter((k) => String(profile[k] || '').trim()).length;
  const stages = [['Queued', queue.length, '#94a3b8'], ['Applied', drafts.filter((d) => d.status === 'applied').length, '#f472b6'], ['Interview', drafts.filter((d) => d.status === 'interview').length, '#fbbf24'], ['Offer', drafts.filter((d) => d.status === 'offer').length, '#34d399']];

  return <section className="mb-8 grid gap-5 xl:grid-cols-[1.1fr_1fr]">
    <div className="glass-strong relative overflow-hidden rounded-3xl p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(232,200,114,0.18),transparent_70%)]" />
      <p className="section-label">Application cockpit</p>
      <h2 className="font-luxe mt-1 text-3xl font-semibold text-white">Ten jobs a day, ten minutes each</h2>
      <div className="mt-5 flex flex-wrap items-center gap-6">
        <GoalRing value={appliedToday} goal={DAILY_GOAL} />
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
          {stages.map(([label, count, color]) => <div key={label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <p className="font-display text-2xl font-bold" style={{ color }}>{count}</p>
            <p className="text-[11px] text-slate-400">{label}</p>
          </div>)}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between rounded-2xl border border-[rgba(232,200,114,0.18)] bg-[rgba(232,200,114,0.05)] px-4 py-3">
        <span className="text-sm text-slate-300">Time saved so far</span>
        <span className="font-luxe text-gold text-2xl font-semibold">{Math.floor(minutesSaved / 60)}h {minutesSaved % 60}m</span>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">Estimate: {MINUTES_SAVED_PER_APPLICATION} minutes saved per application (about 60 by hand vs 10 with FormPilot). Change it in ApplicationCockpit.jsx if your numbers differ.</p>
    </div>

    <div className="glass-strong rounded-3xl p-6">
      <p className="section-label">Readiness</p>
      <h2 className="mt-1 font-display text-lg font-semibold">Before you start the day</h2>
      <div className="mt-4 space-y-3">
        <Check ok={profileReady} label="Core profile saved" hint="Name, email, phone, skills and resume name are required." />
        <Check ok={vaultFilled >= 8} label={`Form vault filled (${vaultFilled}/${vaultFields.length})`} hint="CTC, notice period, education and address save the most typing." />
        <Check ok={extensionConnected} label="FormPilot extension connected" hint="Load the extension (extension/README.md), then keep this tab open once so it syncs." />
      </div>
      <div className="mt-5 rounded-2xl border border-white/[0.06] bg-black/20 p-4 text-xs text-slate-400">
        <p className="font-medium text-slate-200">Your 10-minute routine</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Open the job from the queue below.</li>
          <li>Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-ice">Alt+Shift+F</kbd> on that tab.</li>
          <li>Answer the red fields, review, submit yourself.</li>
          <li>Come back and tap <span className="text-mint">Mark applied</span>.</li>
        </ol>
      </div>
    </div>

    <div className="glass-strong rounded-3xl p-6 xl:col-span-2">
      <div className="flex items-center justify-between">
        <div><p className="section-label">Up next</p><h2 className="mt-1 font-display text-lg font-semibold">Today's queue</h2></div>
        <span className="text-xs text-slate-500">{queue.length} waiting</span>
      </div>
      <div className="mt-4 space-y-2.5">
        {queue.length === 0 && <p className="rounded-xl bg-white/[0.03] p-4 text-sm text-slate-500">Queue is empty. Add official job links below under "Prepare a job application".</p>}
        {queue.map((draft, index) => <motion.article key={draft.id} layout className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:flex-row sm:items-center">
          <span className="font-luxe text-gold w-7 text-2xl font-semibold">{index + 1}</span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-white">{draft.title}</h3>
            <p className="truncate text-xs text-slate-400">{draft.company}</p>
          </div>
          <select value={draft.status} onChange={(event) => setStatus(draft.id, event.target.value)} className="rounded-lg border border-white/[0.1] bg-black/30 px-2 py-1.5 text-xs" style={{ color: STATUS_COLOR[draft.status] }}>
            {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <div className="flex gap-2">
            <a href={draft.jobUrl} target="_blank" rel="noreferrer" onClick={() => draft.status === 'awaiting-review' && setStatus(draft.id, 'form-opened')} className="rounded-xl bg-ice px-3.5 py-2 text-xs font-bold text-slate-950">Open &amp; fill</a>
            <button onClick={() => setStatus(draft.id, 'applied')} className="rounded-xl border border-mint/40 px-3.5 py-2 text-xs font-semibold text-mint hover:bg-mint/10">Mark applied</button>
            <button onClick={() => window.confirm(`Remove "${draft.title}" from your list?`) && removeDraft(draft.id)} title="Remove" className="rounded-xl px-2.5 py-2 text-xs text-slate-500 hover:text-rose">✕</button>
          </div>
        </motion.article>)}
      </div>
    </div>
  </section>;
}
