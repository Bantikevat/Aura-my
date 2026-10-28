import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuraStore, WORLDS } from '../store/useAuraStore';

// ── persistence ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'aura-projects-v2';

const SEED = [
  {
    id: 'p_aura',
    name: 'AURA — Personal AI OS',
    description: 'Full-stack MERN super-app with AI, virtual worlds, task management, and career tracker.',
    status: 'active',
    color: '#e8c872',
    tech: ['React', 'Node.js', 'MongoDB', 'Framer Motion'],
    milestones: [
      { id: 'ms1', name: 'Project scaffold + auth', status: 'done' },
      { id: 'ms2', name: 'Virtual Universe worlds', status: 'done' },
      { id: 'ms3', name: 'Task + AI assistant', status: 'progress' },
      { id: 'ms4', name: 'Knowledge & Project worlds', status: 'progress' },
      { id: 'ms5', name: 'Mobile responsive + PWA', status: 'pending' },
    ],
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'p_portfolio',
    name: 'Portfolio Website',
    description: 'Personal portfolio showcasing skills, projects, and achievements.',
    status: 'active',
    color: '#a78bfa',
    tech: ['Next.js', 'Tailwind', 'Vercel'],
    milestones: [
      { id: 'ms6', name: 'Design system + wireframes', status: 'done' },
      { id: 'ms7', name: 'Hero + About section', status: 'done' },
      { id: 'ms8', name: 'Projects section', status: 'progress' },
      { id: 'ms9', name: 'Deploy on Vercel', status: 'pending' },
    ],
    createdAt: Date.now() - 86400000 * 15,
  },
];

function load() {
  try { const d = localStorage.getItem(STORAGE_KEY); return d ? JSON.parse(d) : SEED; }
  catch { return SEED; }
}
function persist(projects) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)); } catch { /* */ }
}

// ── constants ─────────────────────────────────────────────────────────────────
const COLORS = ['#e8c872','#a78bfa','#34d399','#60a5fa','#f472b6','#fbbf24','#f87171','#22d3ee','#fb923c'];

const CYCLE  = { pending: 'progress', progress: 'done', done: 'pending' };

const MSTYLE = {
  done:     { color: '#34d399', icon: '✓', bg: 'rgba(52,211,153,0.12)',  label: 'Done' },
  progress: { color: '#fbbf24', icon: '⟳', bg: 'rgba(251,191,36,0.12)', label: 'In Progress' },
  pending:  { color: '#64748b', icon: '○', bg: 'rgba(100,116,139,0.10)', label: 'Pending' },
};

const SSTYLE = {
  active:    { color: '#34d399', label: 'Active' },
  paused:    { color: '#fbbf24', label: 'Paused' },
  completed: { color: '#a78bfa', label: 'Completed' },
};

const STATUS_ORDER = ['active', 'paused', 'completed'];

function calcProgress(milestones) {
  if (!milestones.length) return 0;
  const done = milestones.filter((m) => m.status === 'done').length;
  const half = milestones.filter((m) => m.status === 'progress').length;
  return Math.round(((done + half * 0.5) / milestones.length) * 100);
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// ── input shared style ────────────────────────────────────────────────────────
const inputCls = 'w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-white/20 transition';

// ── Project Modal ─────────────────────────────────────────────────────────────
function ProjectModal({ project, onSave, onClose }) {
  const [name,      setName]      = useState(project?.name        || '');
  const [desc,      setDesc]      = useState(project?.description || '');
  const [color,     setColor]     = useState(project?.color       || COLORS[0]);
  const [techInput, setTechInput] = useState('');
  const [techs,     setTechs]     = useState(project?.tech        || []);

  function addTech() {
    const t = techInput.trim();
    if (t && !techs.includes(t)) { setTechs([...techs, t]); setTechInput(''); }
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}>
      <motion.div className="w-full max-w-md rounded-2xl p-6"
        style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.09)' }}
        initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold text-white mb-5">
          {project ? '✏️ Edit Project' : '🚀 New Project'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Project Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus
              className={inputCls} placeholder="e.g. E-Commerce App" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
              className={inputCls + ' resize-none'} placeholder="What are you building?" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width: 28, height: 28, borderRadius: '50%', background: c, flexShrink: 0,
                  border: color === c ? '2.5px solid white' : '2.5px solid transparent',
                  boxShadow: color === c ? `0 0 10px ${c}90` : 'none', transition: 'all .15s',
                }} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Tech Stack</label>
            <div className="flex gap-2">
              <input value={techInput} onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTech()}
                className={inputCls} placeholder="React, Node.js… (Enter to add)" />
              <button onClick={addTech}
                className="rounded-xl bg-white/[0.07] px-4 text-white hover:bg-white/[0.12] transition">+</button>
            </div>
            {techs.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {techs.map((t) => (
                  <span key={t} className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] text-slate-300"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
                    {t}
                    <button onClick={() => setTechs(techs.filter((x) => x !== t))}
                      className="text-slate-500 hover:text-white ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-slate-400 hover:text-white transition">
            Cancel
          </button>
          <button onClick={() => name.trim() && onSave({ name: name.trim(), description: desc.trim(), color, tech: techs })}
            disabled={!name.trim()}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold text-slate-950 disabled:opacity-40 transition"
            style={{ background: color }}>
            {project ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Milestone Modal ───────────────────────────────────────────────────────────
function MilestoneModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}>
      <motion.div className="w-full max-w-sm rounded-2xl p-5"
        style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.09)' }}
        initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-white mb-4">Add Milestone</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && onSave(name.trim())}
          className={inputCls} placeholder="e.g. Setup authentication" />
        <div className="mt-4 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
          <button onClick={() => name.trim() && onSave(name.trim())} disabled={!name.trim()}
            className="flex-1 rounded-xl bg-white/10 py-2 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-40 transition">
            Add
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Confirm Delete Modal ──────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onClose }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}>
      <motion.div className="w-full max-w-xs rounded-2xl p-5 text-center"
        style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.09)' }}
        initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-slate-300 mb-4">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-500/80 py-2 text-sm font-semibold text-white hover:bg-red-500 transition">Delete</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, onEdit, onDelete, onAddMilestone, onToggleMilestone, onDeleteMilestone, onCycleStatus }) {
  const [expanded, setExpanded] = useState(true);
  const progress = calcProgress(project.milestones);
  const st = SSTYLE[project.status] || SSTYLE.active;

  return (
    <motion.div layout className="rounded-2xl overflow-hidden"
      style={{ background: '#090e1a', border: `1px solid ${project.color}22` }}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

      {/* header */}
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: project.color, marginTop: 6,
            flexShrink: 0, boxShadow: `0 0 10px ${project.color}70` }} />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display font-bold text-white text-base leading-tight">{project.name}</h3>
              {/* status — click to cycle */}
              <button onClick={() => onCycleStatus(project.id)}
                title="Click to change status"
                className="rounded-full px-2 py-0.5 text-[10px] font-bold cursor-pointer transition hover:opacity-80"
                style={{ background: `${st.color}18`, color: st.color, border: `1px solid ${st.color}40` }}>
                {st.label}
              </button>
            </div>
            {project.description && (
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">{project.description}</p>
            )}
            {project.tech.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {project.tech.map((t) => (
                  <span key={t} className="rounded-full px-2 py-0.5 text-[10px] text-slate-400"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onEdit(project)} title="Edit"
              className="rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] transition">✏️</button>
            <button onClick={() => onDelete(project.id)} title="Delete"
              className="rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition">🗑️</button>
            <button onClick={() => setExpanded(!expanded)}
              className="rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:text-white hover:bg-white/[0.06] transition"
              style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)', display: 'inline-block', transition: 'transform .2s' }}>
              ▾
            </button>
          </div>
        </div>

        {/* progress */}
        <div className="mt-4">
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-slate-500">
              {project.milestones.filter((m) => m.status === 'done').length}/{project.milestones.length} milestones
            </span>
            <span className="font-mono font-bold" style={{ color: project.color }}>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.05]">
            <motion.div className="h-full rounded-full" style={{ background: project.color }}
              initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.7 }} />
          </div>
        </div>
      </div>

      {/* milestones */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="px-5 pt-3 pb-4 space-y-2">
              {project.milestones.length === 0 && (
                <p className="text-xs text-slate-600 py-1">No milestones yet — add one below.</p>
              )}
              {project.milestones.map((ms) => {
                const sty = MSTYLE[ms.status];
                return (
                  <div key={ms.id} className="flex items-center gap-3 group">
                    {/* click to cycle status */}
                    <button onClick={() => onToggleMilestone(project.id, ms.id)} title="Click to update status"
                      className="flex-shrink-0 w-6 h-6 rounded-lg text-xs font-bold transition hover:scale-110"
                      style={{ background: sty.bg, color: sty.color, border: `1px solid ${sty.color}40` }}>
                      {sty.icon}
                    </button>
                    <span className="flex-1 text-xs leading-snug" style={{
                      color: ms.status === 'done' ? '#475569' : '#cbd5e1',
                      textDecoration: ms.status === 'done' ? 'line-through' : 'none',
                    }}>
                      {ms.name}
                    </span>
                    <span className="text-[10px] opacity-0 group-hover:opacity-100 transition" style={{ color: sty.color }}>
                      {sty.label}
                    </span>
                    <button onClick={() => onDeleteMilestone(project.id, ms.id)}
                      className="opacity-0 group-hover:opacity-100 text-[11px] text-slate-600 hover:text-red-400 transition">×</button>
                  </div>
                );
              })}

              <button onClick={() => onAddMilestone(project.id)}
                className="mt-1 flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition">
                <span className="w-6 h-6 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-base leading-none">+</span>
                Add milestone
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProjectWorld() {
  const world = WORLDS.find((w) => w.id === 'project');
  const [projects, setProjects] = useState(load);

  const [modal,  setModal]  = useState(null);  // null | 'add' | 'edit' | 'milestone' | 'delete'
  const [target, setTarget] = useState(null);  // project obj (edit) | id string (milestone/delete)
  const [filter, setFilter] = useState('all');

  const update = useCallback((updated) => { setProjects(updated); persist(updated); }, []);

  // ── mutations ──
  function addProject(data) {
    const p = { id: uid(), ...data, status: 'active', milestones: [], createdAt: Date.now() };
    update([p, ...projects]);
    setModal(null);
  }

  function editProject(data) {
    update(projects.map((p) => p.id === target.id ? { ...p, ...data } : p));
    setModal(null);
  }

  function deleteProject(id) {
    update(projects.filter((p) => p.id !== id));
    setModal(null);
  }

  function cycleStatus(id) {
    update(projects.map((p) => {
      if (p.id !== id) return p;
      const next = STATUS_ORDER[(STATUS_ORDER.indexOf(p.status) + 1) % STATUS_ORDER.length];
      return { ...p, status: next };
    }));
  }

  function addMilestone(projectId, name) {
    update(projects.map((p) =>
      p.id === projectId
        ? { ...p, milestones: [...p.milestones, { id: uid(), name, status: 'pending' }] }
        : p
    ));
    setModal(null);
  }

  function toggleMilestone(projectId, msId) {
    update(projects.map((p) =>
      p.id === projectId
        ? { ...p, milestones: p.milestones.map((m) => m.id === msId ? { ...m, status: CYCLE[m.status] } : m) }
        : p
    ));
  }

  function deleteMilestone(projectId, msId) {
    update(projects.map((p) =>
      p.id === projectId ? { ...p, milestones: p.milestones.filter((m) => m.id !== msId) } : p
    ));
  }

  // ── derived stats ──
  const totalMs = projects.reduce((n, p) => n + p.milestones.length, 0);
  const doneMs  = projects.reduce((n, p) => n + p.milestones.filter((m) => m.status === 'done').length, 0);

  const filtered = filter === 'all' ? projects : projects.filter((p) => p.status === filter);

  return (
    <>
      <AnimatePresence>
        {modal === 'add' && (
          <ProjectModal onSave={addProject} onClose={() => setModal(null)} />
        )}
        {modal === 'edit' && target && (
          <ProjectModal project={target} onSave={editProject} onClose={() => setModal(null)} />
        )}
        {modal === 'milestone' && target && (
          <MilestoneModal onSave={(name) => addMilestone(target, name)} onClose={() => setModal(null)} />
        )}
        {modal === 'delete' && target && (
          <ConfirmModal
            message="Delete this project and all its milestones? This cannot be undone."
            onConfirm={() => deleteProject(target)}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="pb-16 space-y-6">

        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
              style={{ backgroundColor: (world?.color || '#34d399') + '22', color: world?.color || '#34d399' }}>
              {world?.icon || '🔨'}
            </div>
            <div>
              <h1 className="font-display text-2xl font-black text-white">Project World</h1>
              <p className="text-xs text-slate-400">Build. Track. Ship. — Real projects, real progress.</p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => setModal('add')}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-950"
            style={{ background: '#34d399' }}>
            + New Project
          </motion.button>
        </div>

        {/* stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Projects', value: projects.length,                                      color: '#60a5fa' },
            { label: 'Active',         value: projects.filter((p) => p.status === 'active').length, color: '#34d399' },
            { label: 'Completed',      value: projects.filter((p) => p.status === 'completed').length, color: '#a78bfa' },
            { label: 'Milestones Done', value: `${doneMs}/${totalMs}`,                              color: '#fbbf24' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4"
              style={{ background: '#090e1a', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className="font-display text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'active', 'paused', 'completed'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition"
              style={{
                background: filter === f ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: filter === f ? 'white' : '#64748b',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
              {f}
            </button>
          ))}
        </div>

        {/* cards */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl p-12 text-center"
            style={{ background: '#090e1a', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <p className="text-slate-500 text-sm">No projects here.</p>
            <button onClick={() => setModal('add')} className="mt-3 text-xs text-slate-400 underline hover:text-white">
              Create your first project →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={(p) => { setTarget(p); setModal('edit'); }}
                onDelete={(id) => { setTarget(id); setModal('delete'); }}
                onAddMilestone={(id) => { setTarget(id); setModal('milestone'); }}
                onToggleMilestone={toggleMilestone}
                onDeleteMilestone={deleteMilestone}
                onCycleStatus={cycleStatus}
              />
            ))}
          </div>
        )}
      </motion.div>
    </>
  );
}
