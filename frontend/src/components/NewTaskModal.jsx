import { useState } from 'react';

const worlds = [
  ['career', 'Career World'],
  ['study', 'Study World'],
  ['project', 'Project World'],
  ['life', 'Personal Life'],
];

export default function NewTaskModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [worldId, setWorldId] = useState('project');
  const [priority, setPriority] = useState('high');
  const [due, setDue] = useState('');

  function submit(event) {
    event.preventDefault();
    if (!title.trim()) return;
    onCreate({ title: title.trim(), worldId, priority, due: due || 'No deadline' });
    onClose();
  }

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
    <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-panel p-6 shadow-2xl">
      <div className="flex justify-between"><h2 className="font-display text-xl font-semibold">Create a new mission</h2><button type="button" onClick={onClose} className="text-slate-400" aria-label="Close">×</button></div>
      <label className="mt-5 block text-xs text-slate-400">What needs to move?</label>
      <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Ship the landing page" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none focus:border-ice" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <select value={worldId} onChange={(event) => setWorldId(event.target.value)} aria-label="World" className="rounded-xl border border-white/10 bg-black/20 p-3">{worlds.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
        <select value={priority} onChange={(event) => setPriority(event.target.value)} aria-label="Priority" className="rounded-xl border border-white/10 bg-black/20 p-3"><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select>
      </div>
      <label className="mt-4 block text-xs text-slate-400">Deadline (optional)</label>
      <input type="date" value={due} onChange={(event) => setDue(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3" />
      <button className="mt-5 w-full rounded-xl bg-ice py-3 font-bold text-slate-950">Add task</button>
    </form>
  </div>;
}
