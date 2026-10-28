import { useState } from 'react';
import { useAuraStore, WORLDS } from '../store/useAuraStore';

const toolOptions = ['Task manager', 'Knowledge search', 'Career profile', 'Notifications'];

export default function AgentFactory() {
  const { agents, createAgent, setAgentStatus } = useAuraStore();
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [worldId, setWorldId] = useState('project');
  const [tools, setTools] = useState(['Task manager']);

  function toggleTool(tool) { setTools((current) => current.includes(tool) ? current.filter((item) => item !== tool) : [...current, tool]); }
  function submit(event) { event.preventDefault(); if (!name.trim() || !objective.trim() || !tools.length) return; createAgent({ name: name.trim(), objective: objective.trim(), worldId, tools }); setName(''); setObjective(''); setTools(['Task manager']); }

  return <div>
    <header className="mb-8"><p className="section-label">AURA Core</p><h1 className="mt-2 font-display text-2xl font-bold">Agent Factory</h1><p className="mt-1 text-sm text-slate-400">Create bounded specialist agents. New agents remain paused until you activate them.</p></header>
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <form onSubmit={submit} className="glass-strong rounded-2xl p-5"><h2 className="font-display text-lg font-semibold">New specialist</h2><label className="mt-5 block text-xs text-slate-400">Agent name</label><input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Revision Planner" className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 outline-none focus:border-ice/50" /><label className="mt-4 block text-xs text-slate-400">Objective</label><textarea value={objective} onChange={(event) => setObjective(event.target.value)} required rows="4" placeholder="Prepare a weekly study revision plan from my open tasks." className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 outline-none focus:border-ice/50" /><label className="mt-4 block text-xs text-slate-400">Workspace</label><select value={worldId} onChange={(event) => setWorldId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">{WORLDS.filter((world) => world.id !== 'hub' && world.id !== 'knowledge').map((world) => <option value={world.id} key={world.id}>{world.name}</option>)}</select><fieldset className="mt-4"><legend className="text-xs text-slate-400">Allowed tools</legend><div className="mt-2 grid grid-cols-2 gap-2">{toolOptions.map((tool) => <label key={tool} className="flex items-center gap-2 rounded-lg bg-white/[0.03] p-2 text-xs text-slate-300"><input type="checkbox" checked={tools.includes(tool)} onChange={() => toggleTool(tool)} />{tool}</label>)}</div></fieldset><button className="mt-5 w-full rounded-xl bg-ice py-3 font-semibold text-slate-950">Create paused agent</button></form>
      <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Registered agents</h2><span className="text-xs text-slate-500">{agents.length} total</span></div>{agents.map((agent) => <article key={agent.id} className="glass-card rounded-2xl p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-display text-base font-semibold">{agent.name}</h3><p className="mt-1 max-w-xl text-sm text-slate-400">{agent.objective || agent.description}</p><div className="mt-3 flex flex-wrap gap-2">{(agent.tools || []).map((tool) => <span key={tool} className="rounded-full bg-white/[0.05] px-2 py-1 text-[10px] text-slate-400">{tool}</span>)}</div></div><div className="text-right"><span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${agent.status === 'active' ? 'bg-mint/10 text-mint' : 'bg-solar/10 text-solar'}`}>{agent.status}</span><button onClick={() => setAgentStatus(agent.id, agent.status === 'active' ? 'paused' : 'active')} className="mt-3 block text-xs text-ice">{agent.status === 'active' ? 'Pause agent' : 'Activate agent'}</button></div></div></article>)}</section>
    </div>
  </div>;
}
