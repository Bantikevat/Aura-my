import { useState } from 'react';
import { useAuraStore, WORLDS } from '../store/useAuraStore';

const examples = [
  'Kal DBMS revise karna hai aur resume update karna hai',
  'Aaj AURA project ka bug fix karo',
  'Morning exercise aur bank call yaad dilana',
];

function taskDetails(text) {
  const value = text.toLowerCase();
  const worldId = /job|resume|cv|apply|interview|linkedin/.test(value) ? 'career'
    : /study|padh|dbms|exam|revision|sql|assignment|college/.test(value) ? 'study'
      : /exercise|health|bank|call|grocery|personal|routine/.test(value) ? 'life' : 'project';
  const priority = /urgent|important|aaj|today|deadline/.test(value) ? 'high' : 'medium';
  const due = /kal|tomorrow/.test(value) ? 'Tomorrow' : /aaj|today/.test(value) ? 'Today' : 'No deadline';
  return { worldId, priority, due };
}

export default function DailyCommand() {
  const addTask = useAuraStore((state) => state.addTask);
  const [command, setCommand] = useState('');
  const [result, setResult] = useState(null);

  function createPlan(event) {
    event.preventDefault();
    const pieces = command.split(/\n|,|\s+aur\s+|\s+and\s+/i).map((item) => item.trim()).filter(Boolean);
    if (!pieces.length) return;
    const created = pieces.slice(0, 5).map((title) => {
      const details = taskDetails(title);
      addTask({ title, ...details });
      return { title, ...details };
    });
    setResult(created);
    setCommand('');
  }

  return <section className="mb-8 overflow-hidden rounded-2xl border border-ice/15 bg-gradient-to-br from-ice/[0.10] via-aurora/[0.06] to-transparent p-5 shadow-[0_0_50px_rgba(232,200,114,0.05)]">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="section-label text-ice">Daily Command</p><h2 className="mt-1 font-display text-xl font-semibold text-white">Aaj kya karna hai?</h2><p className="mt-1 text-sm text-slate-400">Normal language me likho. AURA tasks ko sahi workspace me plan karega.</p></div><span className="rounded-full border border-mint/20 bg-mint/10 px-3 py-1 text-[11px] font-medium text-mint">Local & private</span></div>
    <form onSubmit={createPlan} className="mt-4"><div className="flex flex-col gap-3 sm:flex-row"><input value={command} onChange={(event) => setCommand(event.target.value)} placeholder="Example: Kal DBMS revise karna hai aur resume update karna hai" className="min-w-0 flex-1 rounded-xl border border-white/[0.10] bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-ice/50" /><button className="rounded-xl bg-ice px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-white">Plan my day</button></div></form>
    <div className="mt-3 flex flex-wrap gap-2">{examples.map((example) => <button key={example} onClick={() => setCommand(example)} className="rounded-full bg-white/[0.05] px-3 py-1.5 text-[11px] text-slate-400 transition hover:bg-white/[0.10] hover:text-white">{example}</button>)}</div>
    {result && <div className="mt-4 rounded-xl border border-mint/15 bg-mint/[0.06] p-3"><p className="text-xs font-medium text-mint">Plan created: {result.length} task{result.length === 1 ? '' : 's'}</p><div className="mt-2 flex flex-wrap gap-2">{result.map((item) => <span key={item.title} className="rounded-full bg-black/20 px-2.5 py-1 text-[11px] text-slate-300">{item.title} → {WORLDS.find((world) => world.id === item.worldId)?.name}</span>)}</div></div>}
  </section>;
}
